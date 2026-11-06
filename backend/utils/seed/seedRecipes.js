const Recipe = require('../../models/Recipe');
const { RECIPES } = require('./data');

// Inserts the built-in recipe library once (safe to call on every start-up)
module.exports = async function seedRecipes() {
  if ((await Recipe.countDocuments({ owner: null })) > 0) return 0;
  await Recipe.insertMany(RECIPES);
  console.log(`Seeded ${RECIPES.length} built-in recipes`);
  return RECIPES.length;
};
