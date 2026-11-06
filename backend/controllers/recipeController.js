const Recipe = require('../models/Recipe');
const { recipeFilter } = require('../services/insightsService');
const { ApiError, asyncHandler, ok } = require('../utils/ApiError');

const FIELDS = ['name', 'emoji', 'image', 'description', 'mealCategory', 'prepTime', 'servings', 'instructions', 'ingredients'];
const pick = (body) => Object.fromEntries(FIELDS.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));
const escapeRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

exports.list = asyncHandler(async (req, res) => {
  const filter = recipeFilter(req.user._id);
  if (req.query.mealCategory) filter.mealCategory = String(req.query.mealCategory);
  if (req.query.q) filter.name = new RegExp(escapeRe(req.query.q), 'i');
  ok(res, await Recipe.find(filter).sort({ mealCategory: 1, name: 1 }).lean());
});

exports.get = asyncHandler(async (req, res) => {
  const r = await Recipe.findOne({ _id: req.params.id, ...recipeFilter(req.user._id) }).lean();
  if (!r) throw new ApiError(404, 'Recipe not found');
  ok(res, r);
});

exports.create = asyncHandler(async (req, res) => ok(res, await Recipe.create({ ...pick(req.body), owner: req.user._id }), 201));

exports.update = asyncHandler(async (req, res) => {
  const r = await Recipe.findOne({ _id: req.params.id, owner: req.user._id }); // built-in recipes are read-only
  if (!r) throw new ApiError(404, 'Recipe not found or you do not have permission to edit it');
  r.set(pick(req.body));
  ok(res, await r.save());
});

exports.remove = asyncHandler(async (req, res) => {
  const r = await Recipe.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
  if (!r) throw new ApiError(404, 'Recipe not found or you do not have permission to delete it');
  ok(res, { id: r._id });
});
