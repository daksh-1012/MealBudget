const Budget = require('../models/Budget');
const Expense = require('../models/Expense');
const { getWeekSummary } = require('../services/weekService');
const { mondayOf } = require('../utils/week');
const { ApiError, asyncHandler, ok } = require('../utils/ApiError');

const payload = async (userId, weekStart) => ({
  summary: await getWeekSummary(userId, weekStart),
  expenses: await Expense.find({ user: userId, weekStart }).sort({ date: -1, createdAt: -1 }).lean(),
});

exports.get = asyncHandler(async (req, res) => ok(res, await payload(req.user._id, mondayOf(req.query.weekStart))));

exports.set = asyncHandler(async (req, res) => {
  const weekStart = mondayOf(req.body.weekStart);
  await Budget.findOneAndUpdate({ user: req.user._id, weekStart }, { amount: req.body.amount }, { upsert: true, runValidators: true, setDefaultsOnInsert: true });
  ok(res, await payload(req.user._id, weekStart));
});

exports.addExpense = asyncHandler(async (req, res) => {
  const weekStart = mondayOf(req.body.weekStart);
  await Expense.create({ user: req.user._id, weekStart, amount: req.body.amount, description: req.body.description, date: req.body.date || new Date() });
  ok(res, await payload(req.user._id, weekStart), 201);
});

exports.removeExpense = asyncHandler(async (req, res) => {
  const e = await Expense.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!e) throw new ApiError(404, 'Expense not found');
  ok(res, await payload(req.user._id, e.weekStart));
});
