const mongoose = require('mongoose');
const { UNIT_LIST, nameKey } = require('../utils/units');

const CATEGORIES = ['Grains', 'Vegetables', 'Fruits', 'Dairy', 'Protein', 'Spices', 'Oils', 'Other'];

const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: [true, 'Ingredient name is required'], trim: true, maxlength: 60 },
    nameKey: { type: String, index: true },
    quantity: { type: Number, required: true, min: [0, 'Quantity cannot be negative'] },
    unit: { type: String, enum: UNIT_LIST, required: true },
    category: { type: String, enum: CATEGORIES, default: 'Other' },
    unitPrice: { type: Number, default: 0, min: 0, validate: Number.isInteger }, // paise per `unit`
    expiryDate: { type: Date, default: null },
    lowStockThreshold: { type: Number, default: 0, min: 0 }, // in `unit`; 0 disables the alert
  },
  { timestamps: true }
);
schema.pre('validate', function setKey(next) {
  this.nameKey = nameKey(this.name);
  next();
});
schema.index({ user: 1, nameKey: 1 }, { unique: true });
schema.statics.CATEGORIES = CATEGORIES;

module.exports = mongoose.model('Ingredient', schema);
