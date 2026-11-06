const mongoose = require('mongoose');

const SLOTS = ['breakfast', 'lunch', 'dinner', 'snacks'];

const schema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    weekStart: { type: String, required: true },
    entries: [
      {
        day: { type: Number, min: 0, max: 6, required: true }, // 0 = Monday
        slot: { type: String, enum: SLOTS, required: true },
        recipe: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe', required: true },
      },
    ],
  },
  { timestamps: true }
);
schema.index({ user: 1, weekStart: 1 }, { unique: true });
schema.statics.SLOTS = SLOTS;

module.exports = mongoose.model('MealPlan', schema);
