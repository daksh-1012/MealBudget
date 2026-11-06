const Ingredient = require('../models/Ingredient');
const { STARTER_PANTRY } = require('../utils/seed/data');
const { ApiError, asyncHandler, ok } = require('../utils/ApiError');
const { nameKey } = require('../utils/units');

const FIELDS = ['name', 'quantity', 'unit', 'category', 'unitPrice', 'expiryDate', 'lowStockThreshold'];
const pick = (body) => Object.fromEntries(FIELDS.filter((f) => body[f] !== undefined).map((f) => [f, body[f]]));
const escapeRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

exports.list = asyncHandler(async (req, res) => {
  const filter = { user: req.user._id };
  if (req.query.category) filter.category = String(req.query.category);
  if (req.query.q) filter.name = new RegExp(escapeRe(req.query.q), 'i');
  let items = await Ingredient.find(filter).sort({ name: 1 });
  if (req.query.lowStock === 'true') items = items.filter((i) => i.lowStockThreshold > 0 && i.quantity <= i.lowStockThreshold);
  ok(res, items);
});

exports.create = asyncHandler(async (req, res) => {
  ok(res, await Ingredient.create({ ...pick(req.body), user: req.user._id }), 201);
});

exports.update = asyncHandler(async (req, res) => {
  const item = await Ingredient.findOne({ _id: req.params.id, user: req.user._id });
  if (!item) throw new ApiError(404, 'Ingredient not found');
  item.set(pick(req.body));
  ok(res, await item.save());
});

exports.remove = asyncHandler(async (req, res) => {
  const item = await Ingredient.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!item) throw new ApiError(404, 'Ingredient not found');
  ok(res, { id: item._id });
});

// Loads a sample pantry so new users can try the recommendations immediately
exports.starter = asyncHandler(async (req, res) => {
  const have = new Set((await Ingredient.find({ user: req.user._id }).select('nameKey')).map((i) => i.nameKey));
  const fresh = STARTER_PANTRY.filter((i) => !have.has(nameKey(i.name))).map((i) => ({ ...i, user: req.user._id }));
  if (fresh.length) await Ingredient.insertMany(fresh);
  ok(res, { added: fresh.length }, 201);
});
