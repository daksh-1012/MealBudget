const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    weekStart: { type: String, required: true },
    amount: { type: Number, required: true, min: 0, validate: Number.isInteger }, // paise
  },
  { timestamps: true }
);
schema.index({ user: 1, weekStart: 1 }, { unique: true });

module.exports = mongoose.model('Budget', schema);
