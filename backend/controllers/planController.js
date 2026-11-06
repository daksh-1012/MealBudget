const MealPlan = require('../models/MealPlan');
const Recipe = require('../models/Recipe');
const { getWeekSummary } = require('../services/weekService');
const { recommend, recipeFilter } = require('../services/insightsService');
const { mondayOf } = require('../utils/week');
const { ApiError, asyncHandler, ok } = require('../utils/ApiError');

exports.get = asyncHandler(async (req, res) => ok(res, await getWeekSummary(req.user._id, mondayOf(req.query.weekStart))));

// Sets (adds or replaces) the recipe for one day + slot
exports.setEntry = asyncHandler(async (req, res) => {
  const { day, slot, recipeId } = req.body;
  const weekStart = mondayOf(req.body.weekStart);
  const recipe = await Recipe.findOne({ _id: recipeId, ...recipeFilter(req.user._id) }).select('_id name');
  if (!recipe) throw new ApiError(404, 'Recipe not found');

  const plan = (await MealPlan.findOne({ user: req.user._id, weekStart })) || new MealPlan({ user: req.user._id, weekStart, entries: [] });
  const clash = plan.entries.find((e) => e.day === day && e.slot !== slot && String(e.recipe) === String(recipe._id));
  if (clash) throw new ApiError(409, `${recipe.name} is already planned for ${clash.slot} on that day`);
  plan.entries = plan.entries.filter((e) => !(e.day === day && e.slot === slot));
  plan.entries.push({ day, slot, recipe: recipe._id });
  await plan.save();
  ok(res, await getWeekSummary(req.user._id, weekStart));
});

exports.removeEntry = asyncHandler(async (req, res) => {
  const weekStart = mondayOf(req.query.weekStart);
  await MealPlan.updateOne({ user: req.user._id, weekStart }, { $pull: { entries: { day: Number(req.query.day), slot: String(req.query.slot) } } });
  ok(res, await getWeekSummary(req.user._id, weekStart));
});

exports.clear = asyncHandler(async (req, res) => {
  const weekStart = mondayOf(req.query.weekStart);
  await MealPlan.deleteOne({ user: req.user._id, weekStart });
  ok(res, await getWeekSummary(req.user._id, weekStart));
});

exports.recommendations = asyncHandler(async (req, res) => {
  ok(res, await recommend(req.user._id, mondayOf(req.query.weekStart), { mealCategory: req.query.mealCategory, q: req.query.q }));
});
