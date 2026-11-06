const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { ApiError, asyncHandler, ok } = require('../utils/ApiError');

const sign = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });
const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email });

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (await User.findOne({ email })) throw new ApiError(409, 'An account with this email already exists');
  const user = await User.create({ name, email, password });
  ok(res, { user: publicUser(user), token: sign(user) }, 201);
});

exports.login = asyncHandler(async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select('+password');
  if (!user || !(await user.matches(req.body.password))) throw new ApiError(401, 'Invalid email or password');
  ok(res, { user: publicUser(user), token: sign(user) });
});

exports.me = asyncHandler(async (req, res) => ok(res, { user: publicUser(req.user) }));
