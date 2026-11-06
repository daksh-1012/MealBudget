const Ingredient = require('../models/Ingredient');
const MealPlan = require('../models/MealPlan');
const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const { computeWeekSummary } = require('./engine');

async function getWeekSummary(userId, weekStart) {
  const [pantryItems, plan, budget, expenses] = await Promise.all([
    Ingredient.find({ user: userId }).lean(),
    MealPlan.findOne({ user: userId, weekStart }).populate('entries.recipe').lean(),
    Budget.findOne({ user: userId, weekStart }).lean(),
    Expense.find({ user: userId, weekStart }).lean(),
  ]);
  return computeWeekSummary({ weekStart, pantryItems, plan, budget, expenses });
}

module.exports = { getWeekSummary };
