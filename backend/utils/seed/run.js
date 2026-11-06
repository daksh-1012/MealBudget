// npm run seed  -> resets the built-in recipe library (user recipes are untouched)
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const connectDB = require('../../config/db');
const Recipe = require('../../models/Recipe');
const seedRecipes = require('./seedRecipes');

(async () => {
  await connectDB();
  await Recipe.deleteMany({ owner: null });
  await seedRecipes();
  await mongoose.disconnect();
})().catch((e) => { console.error(e.message); process.exit(1); });
