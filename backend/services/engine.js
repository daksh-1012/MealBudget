/**
 * Pure business logic (no database access) so it can be unit tested.
 *
 * Rule-based and fully explainable - this is NOT machine learning:
 *  1. Normalise every quantity to a base unit (g / ml / pcs).
 *  2. For each recipe ingredient, find the pantry item with the same name and unit dimension.
 *  3. available = min(pantry stock, required). shortfall = required - available.
 *  4. Pantry match % = (ingredients fully covered by the pantry / total ingredients) x 100.
 *  5. Costs: owned = available x price, additional = shortfall x price. Prices use the pantry
 *     price when the user set one, otherwise the recipe's default estimate.
 */
const { toBase, dimOf, factor, friendly, nameKey } = require('../utils/units');
const { SLOTS } = require('../models/MealPlan');

const EPS = 1e-9;

function buildPantryMap(items) {
  const map = new Map();
  for (const it of items) {
    map.set(it.nameKey || nameKey(it.name), {
      base: toBase(it.quantity, it.unit),
      dim: dimOf(it.unit),
      ppb: it.unitPrice > 0 ? it.unitPrice / factor(it.unit) : 0,
    });
  }
  return map;
}

const badgeFor = (pct) => (pct >= 75 ? 'high' : pct >= 40 ? 'partial' : 'low');

function analyzeRecipe(recipe, pantry, { consume = false } = {}) {
  const available = [];
  const missing = [];
  const shortItems = [];
  const usedKeys = [];
  let ownedCost = 0;
  let additionalCost = 0;

  for (const ing of recipe.ingredients) {
    const key = nameKey(ing.name);
    const dim = dimOf(ing.unit);
    const need = toBase(ing.quantity, ing.unit);
    const p = pantry.get(key);
    const usable = p && p.dim === dim ? p : null; // a kg item can never satisfy a "pcs" requirement
    const ppb = usable && usable.ppb > 0 ? usable.ppb : ing.unitPrice / factor(ing.unit);
    const used = usable ? Math.min(Math.max(usable.base, 0), need) : 0;
    const short = need - used > EPS ? need - used : 0;
    const owned = Math.round(used * ppb);
    const extra = Math.round(short * ppb);

    ownedCost += owned;
    additionalCost += extra;
    if (used > 0) usedKeys.push(key);
    if (consume && usable) usable.base -= used;

    if (short === 0) {
      available.push({ name: ing.name, needed: friendly(need, dim) });
    } else {
      missing.push({ name: ing.name, needed: friendly(need, dim), have: friendly(used, dim), short: friendly(short, dim), cost: extra });
      shortItems.push({ key, name: ing.name, dim, shortBase: short, cost: extra, ppb, category: ing.category || 'Other' });
    }
  }
  const total = recipe.ingredients.length || 1;
  const matchPercent = Math.round((available.length / total) * 100);
  return {
    available, missing, shortItems, usedKeys, matchPercent,
    badge: badgeFor(matchPercent),
    ownedCost, additionalCost, totalCost: ownedCost + additionalCost,
  };
}

const recipeBrief = (r) => ({
  _id: r._id, name: r.name, emoji: r.emoji, image: r.image, description: r.description,
  mealCategory: r.mealCategory, prepTime: r.prepTime, servings: r.servings,
});

/**
 * Walks the weekly plan chronologically, consuming a virtual copy of the pantry, so an
 * ingredient already owned is never charged twice and the shortfall is aggregated correctly.
 */
function computeWeekSummary({ weekStart, pantryItems, plan, budget, expenses }) {
  const pantry = buildPantryMap(pantryItems);
  const raw = (plan?.entries || []).filter((e) => e.recipe && e.recipe.ingredients);
  raw.sort((a, b) => a.day - b.day || SLOTS.indexOf(a.slot) - SLOTS.indexOf(b.slot));

  const spent = (expenses || []).reduce((s, e) => s + e.amount, 0);
  const isSet = !!budget;
  const amount = budget ? budget.amount : 0;

  const days = Array.from({ length: 7 }, (_, day) => ({ day, totalCost: 0, additionalCost: 0, count: 0 }));
  const shortMap = new Map();
  const usedKeys = new Set();
  let plannedValue = 0, toBuy = 0, savings = 0, running = spent;

  const entries = raw.map((e) => {
    const a = analyzeRecipe(e.recipe, pantry, { consume: true });
    plannedValue += a.totalCost;
    toBuy += a.additionalCost;
    savings += a.ownedCost;
    running += a.additionalCost;
    a.usedKeys.forEach((k) => usedKeys.add(k));
    for (const s of a.shortItems) {
      const cur = shortMap.get(s.key);
      if (cur) { cur.shortBase += s.shortBase; cur.cost += s.cost; } else shortMap.set(s.key, { ...s });
    }
    const d = days[e.day];
    d.totalCost += a.totalCost; d.additionalCost += a.additionalCost; d.count += 1;
    return {
      entryId: e._id, day: e.day, slot: e.slot, recipe: recipeBrief(e.recipe),
      totalCost: a.totalCost, ownedCost: a.ownedCost, additionalCost: a.additionalCost,
      matchPercent: a.matchPercent, exceedsBudget: isSet && running > amount,
    };
  });

  const committed = spent + toBuy; // already spent + still to buy
  return {
    weekStart,
    budget: { amount, isSet },
    entries, days,
    shortfall: [...shortMap.values()],
    usedKeys: [...usedKeys],
    totals: {
      mealCount: entries.length, plannedValue, toBuy, savings, spent, committed,
      remaining: isSet ? amount - committed : null,
      utilization: isSet ? (amount > 0 ? Math.round((committed / amount) * 100) : committed > 0 ? 100 : 0) : null,
      exceeds: isSet && committed > amount,
    },
  };
}

// Rank recipes: affordable first, then best pantry match, then smallest purchase, then cheapest.
function rankRecipes(recipes, pantryItems, remaining) {
  const pantry = buildPantryMap(pantryItems);
  return recipes
    .map((r) => {
      const a = analyzeRecipe(r, pantry);
      return { recipe: recipeBrief(r), ...a, shortItems: undefined, usedKeys: undefined, affordable: remaining === null || a.additionalCost <= remaining };
    })
    .sort((x, y) => Number(y.affordable) - Number(x.affordable) || y.matchPercent - x.matchPercent || x.additionalCost - y.additionalCost || x.totalCost - y.totalCost);
}

module.exports = { buildPantryMap, analyzeRecipe, computeWeekSummary, rankRecipes, recipeBrief, badgeFor };
