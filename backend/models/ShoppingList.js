const mongoose = require('mongoose');
const { UNIT_LIST } = require('../utils/units');

const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    weekStart: { type: String, required: true },
    items: [
      {
        name: { type: String, required: true },
        quantity: { type: Number, required: true, min: 0 },
        unit: { type: String, enum: UNIT_LIST, required: true },
        unitPrice: { type: Number, default: 0 }, // paise per `unit`
        estCost: { type: Number, default: 0 }, // paise
        category: { type: String, default: 'Other' },
        purchased: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);
schema.index({ user: 1, weekStart: 1 }, { unique: true });

module.exports = mongoose.model('ShoppingList', schema);
