const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    weekStart: { type: String, required: true },
    amount: { type: Number, required: true, min: [1, 'Amount must be greater than 0'], validate: Number.isInteger }, // paise
    description: { type: String, required: true, trim: true, maxlength: 120 },
    date: { type: Date, default: Date.now },
    shoppingItemId: { type: mongoose.Schema.Types.ObjectId, default: null }, // set when created from the shopping list
  },
  { timestamps: true }
);
schema.index({ user: 1, weekStart: 1 });

module.exports = mongoose.model('Expense', schema);
