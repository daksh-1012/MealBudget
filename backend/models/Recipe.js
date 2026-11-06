const mongoose = require('mongoose');
const { UNIT_LIST } = require('../utils/units');

const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];

const recipeIngredient = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    quantity: { type: Number, required: true, min: [0.01, 'Ingredient quantity must be greater than 0'] },
    unit: { type: String, enum: UNIT_LIST, required: true },
    unitPrice: { type: Number, default: 0, min: 0, validate: Number.isInteger }, // paise per `unit` (default estimate)
    category: { type: String, default: 'Other' },
  },
  { _id: false }
);

const schema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true }, // null = built-in recipe
    name: { type: String, required: [true, 'Recipe name is required'], trim: true, maxlength: 80 },
    emoji: { type: String, default: '🍽️' },
    image: { type: String, default: '' },
    description: { type: String, default: '', maxlength: 400 },
    mealCategory: { type: String, enum: MEALS, required: true },
    prepTime: { type: Number, required: true, min: 1 },
    servings: { type: Number, required: true, min: 1 },
    instructions: { type: [String], default: [] },
    ingredients: {
      type: [recipeIngredient],
      validate: [(v) => v.length > 0, 'Add at least one ingredient'],
    },
  },
  { timestamps: true }
);
schema.index({ name: 'text' });
schema.statics.MEALS = MEALS;

module.exports = mongoose.model('Recipe', schema);
