const svc = require('../services/insightsService');
const { asyncHandler, ok } = require('../utils/ApiError');

exports.dashboard = asyncHandler(async (req, res) => ok(res, await svc.dashboard(req.user._id, req.query.date)));
exports.analytics = asyncHandler(async (req, res) => ok(res, await svc.analytics(req.user._id, req.query.date)));
