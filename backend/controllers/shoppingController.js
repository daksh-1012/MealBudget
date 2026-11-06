const svc = require('../services/shoppingService');
const { getWeekSummary } = require('../services/weekService');
const { mondayOf } = require('../utils/week');
const { asyncHandler, ok } = require('../utils/ApiError');

const view = async (userId, weekStart, list) => {
  const items = list.items.map((i) => i.toObject());
  return {
    weekStart, items,
    totals: {
      estimated: items.filter((i) => !i.purchased).reduce((s, i) => s + i.estCost, 0),
      purchased: items.filter((i) => i.purchased).reduce((s, i) => s + i.estCost, 0),
      remainingCount: items.filter((i) => !i.purchased).length,
    },
    budget: (await getWeekSummary(userId, weekStart)).totals,
  };
};

exports.get = asyncHandler(async (req, res) => { const w = mondayOf(req.query.weekStart); ok(res, await view(req.user._id, w, await svc.getList(req.user._id, w))); });
exports.sync = asyncHandler(async (req, res) => { const w = mondayOf(req.body.weekStart); ok(res, await view(req.user._id, w, await svc.syncList(req.user._id, w))); });
exports.purchase = asyncHandler(async (req, res) => {
  const w = mondayOf(req.body.weekStart);
  ok(res, await view(req.user._id, w, await svc.setPurchased(req.user._id, w, req.params.itemId, req.body.purchased)));
});
exports.remove = asyncHandler(async (req, res) => { const w = mondayOf(req.query.weekStart); ok(res, await view(req.user._id, w, await svc.removeItem(req.user._id, w, req.params.itemId))); });
