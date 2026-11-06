// Run with: npm test   (no database needed)
const assert = require('assert');
const { analyzeRecipe, buildPantryMap, computeWeekSummary, rankRecipes } = require('../services/engine');
const { RECIPES } = require('../utils/seed/data');

const pantry = (list) => list.map(([name, quantity, unit, unitPrice = 0]) => ({ name, nameKey: name.toLowerCase(), quantity, unit, unitPrice }));
const get = (n) => RECIPES.find((r) => r.name === n);

// 1. Quantity-aware: owning an ingredient is not enough
let a = analyzeRecipe(get('Banana Milkshake'), buildPantryMap(pantry([['Bananas', 2, 'pcs'], ['Milk', 100, 'ml'], ['Sugar', 1, 'kg']])));
assert.strictEqual(a.matchPercent, 67, 'milk shortfall must not count as available');
assert.strictEqual(a.missing[0].name, 'Milk');
assert.deepStrictEqual(a.missing[0].short, { quantity: 300, unit: 'ml' });
assert.strictEqual(a.additionalCost, 300 * 6, '300ml milk @ 6 paise/ml');
assert.strictEqual(a.totalCost, a.ownedCost + a.additionalCost);

// 2. Unit conversion (kg vs g) and pantry price override
a = analyzeRecipe(get('Banana Milkshake'), buildPantryMap(pantry([['Sugar', 0.5, 'kg', 8000]])));
assert.strictEqual(a.available.length, 1);
assert.strictEqual(a.ownedCost, 20 * 8, 'uses the pantry price (8000 paise/kg = 8 paise/g)');

// 3. Incompatible unit dimensions never match
a = analyzeRecipe(get('Banana Milkshake'), buildPantryMap(pantry([['Bananas', 5, 'kg']])));
assert.ok(a.missing.some((m) => m.name === 'Bananas'));

// 4. Sequential allocation: two meals share one pantry stock
const plan = { entries: [
  { _id: 1, day: 0, slot: 'breakfast', recipe: get('Banana Milkshake') },
  { _id: 2, day: 1, slot: 'breakfast', recipe: get('Banana Milkshake') },
] };
const s = computeWeekSummary({ weekStart: '2026-11-02', pantryItems: pantry([['Milk', 600, 'ml', 6000], ['Bananas', 4, 'pcs'], ['Sugar', 40, 'g']]), plan, budget: { amount: 100000 }, expenses: [{ amount: 5000 }] });
const milk = s.shortfall.find((x) => x.name === 'Milk');
assert.strictEqual(milk.shortBase, 200, 'needs 800ml, has 600ml');
assert.strictEqual(s.totals.toBuy, s.entries.reduce((t, e) => t + e.additionalCost, 0));
assert.strictEqual(s.totals.committed, 5000 + s.totals.toBuy);
assert.strictEqual(s.totals.remaining, 100000 - s.totals.committed);

// 5. Budget flagging
const tight = computeWeekSummary({ weekStart: '2026-11-02', pantryItems: [], plan, budget: { amount: 1000 }, expenses: [] });
assert.ok(tight.totals.exceeds && tight.entries.every((e) => e.exceedsBudget));

// 6. Ranking: best match first, unaffordable last
const ranked = rankRecipes(RECIPES, pantry([['Rice', 2, 'kg'], ['Toor Dal', 500, 'g'], ['Onion', 1, 'kg'], ['Tomato', 400, 'g'], ['Garlic', 100, 'g'], ['Turmeric Powder', 100, 'g'], ['Cumin Seeds', 50, 'g'], ['Red Chilli Powder', 100, 'g'], ['Ghee', 200, 'g'], ['Salt', 500, 'g'], ['Coriander Leaves', 50, 'g']]), 1000000);
assert.strictEqual(ranked[0].recipe.name, 'Dal Rice');
assert.strictEqual(ranked[0].matchPercent, 100);
assert.strictEqual(ranked[0].additionalCost, 0);
const broke = rankRecipes(RECIPES, [], 100);
assert.ok(broke.every((r) => !r.affordable));

console.log('All engine tests passed');
