const Ingredient = require('../models/Ingredient');
const Recipe = require('../models/Recipe');
const MealPlan = require('../models/MealPlan');
const Expense = require('../models/Expense');
const Budget = require('../models/Budget');
const { getWeekSummary } = require('./weekService');
const { rankRecipes, analyzeRecipe, buildPantryMap } = require('./engine');
const { mondayOf, addDays, dayIndex, isDateStr } = require('../utils/week');
const { nameKey } = require('../utils/units');

const recipeFilter = (userId) => ({ $or: [{ owner: null }, { owner: userId }] });

async function recommend(userId, weekStart, { mealCategory, q } = {}) {
  const filter = recipeFilter(userId);
  if (mealCategory) filter.mealCategory = mealCategory;
  if (q) filter.name = new RegExp(String(q).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const [recipes, pantryItems, summary] = await Promise.all([
    Recipe.find(filter).lean(), Ingredient.find({ user: userId }).lean(), getWeekSummary(userId, weekStart),
  ]);
  return { remaining: summary.totals.remaining, results: rankRecipes(recipes, pantryItems, summary.totals.remaining) };
}

async function dashboard(userId, dateStr) {
  const today = isDateStr(dateStr) ? dateStr : new Date().toISOString().slice(0, 10);
  const weekStart = mondayOf(today);
  const todayIdx = dayIndex(weekStart, today);
  const [summary, pantryItems, rec, lastExp, lastPantry, lastPlan] = await Promise.all([
    getWeekSummary(userId, weekStart),
    Ingredient.find({ user: userId }).lean(),
    recommend(userId, weekStart),
    Expense.find({ user: userId }).sort({ createdAt: -1 }).limit(5).lean(),
    Ingredient.find({ user: userId }).sort({ updatedAt: -1 }).limit(5).lean(),
    MealPlan.findOne({ user: userId }).sort({ updatedAt: -1 }).lean(),
  ]);
  const t = summary.totals;
  const activity = [
    ...lastExp.map((e) => ({ type: 'expense', text: `${e.description}`, amount: e.amount, at: e.createdAt })),
    ...lastPantry.map((i) => ({ type: 'pantry', text: `Pantry updated: ${i.name}`, at: i.updatedAt })),
    ...(lastPlan ? [{ type: 'plan', text: `Meal plan updated for week of ${lastPlan.weekStart}`, at: lastPlan.updatedAt }] : []),
  ].sort((a, b) => new Date(b.at) - new Date(a.at)).slice(0, 6);

  const soon = Date.now() + 3 * 86400000;
  return {
    weekStart, today: todayIdx,
    budget: summary.budget, totals: t,
    pantryCount: pantryItems.length,
    lowStock: pantryItems.filter((i) => i.lowStockThreshold > 0 && i.quantity <= i.lowStockThreshold).length,
    expiringSoon: pantryItems.filter((i) => i.expiryDate && new Date(i.expiryDate).getTime() <= soon).length,
    recommended: rec.results.slice(0, 3),
    upcoming: summary.entries.filter((e) => e.day >= todayIdx).slice(0, 5),
    daily: summary.days,
    distribution: { spent: t.spent, toBuy: t.toBuy, remaining: Math.max(0, t.remaining ?? 0) },
    activity,
  };
}

async function analytics(userId, dateStr) {
  const weekStart = mondayOf(isDateStr(dateStr) ? dateStr : undefined);
  const weeks = Array.from({ length: 8 }, (_, i) => addDays(weekStart, (i - 7) * 7));
  const [summary, plans, expenses, budgets, pantryItems] = await Promise.all([
    getWeekSummary(userId, weekStart),
    MealPlan.find({ user: userId }).populate('entries.recipe').lean(),
    Expense.find({ user: userId, weekStart: { $in: weeks } }).lean(),
    Budget.find({ user: userId, weekStart: { $in: weeks } }).lean(),
    Ingredient.find({ user: userId }).lean(),
  ]);

  const empty = new Map(); // pantry-agnostic cost = the recipe's full value
  const trend = weeks.map((w) => {
    const plan = plans.find((p) => p.weekStart === w);
    const planned = (plan?.entries || []).filter((e) => e.recipe).reduce((s, e) => s + analyzeRecipe(e.recipe, empty).totalCost, 0);
    return {
      weekStart: w,
      spent: expenses.filter((e) => e.weekStart === w).reduce((s, e) => s + e.amount, 0),
      planned,
      budget: budgets.find((b) => b.weekStart === w)?.amount ?? 0,
    };
  });

  const counts = new Map();
  for (const p of plans) for (const e of p.entries) {
    if (!e.recipe) continue;
    for (const ing of e.recipe.ingredients) {
      const k = nameKey(ing.name);
      counts.set(k, { name: ing.name, count: (counts.get(k)?.count || 0) + 1 });
    }
  }
  const topIngredients = [...counts.values()].sort((a, b) => b.count - a.count).slice(0, 8);

  const used = pantryItems.filter((i) => summary.usedKeys.includes(i.nameKey)).length;
  return {
    weekStart, trend, daily: summary.days, totals: summary.totals, budget: summary.budget, topIngredients,
    pantry: { total: pantryItems.length, used, unused: pantryItems.length - used, utilization: pantryItems.length ? Math.round((used / pantryItems.length) * 100) : 0 },
    savings: summary.totals.savings,
  };
}

module.exports = { recommend, dashboard, analytics, recipeFilter };
