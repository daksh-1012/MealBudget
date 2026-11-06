const { factor } = require('../units');

// name (lowercase) -> [category, base unit, price in paise per base unit]
const CATALOG = {
  'poha': ['Grains', 'g', 6], 'rice': ['Grains', 'g', 6], 'atta': ['Grains', 'g', 5], 'rava': ['Grains', 'g', 6],
  'toor dal': ['Protein', 'g', 14], 'moong dal': ['Protein', 'g', 12], 'chickpeas': ['Protein', 'g', 11], 'eggs': ['Protein', 'pcs', 700],
  'onion': ['Vegetables', 'g', 4], 'tomato': ['Vegetables', 'g', 4], 'potato': ['Vegetables', 'g', 4], 'carrot': ['Vegetables', 'g', 5],
  'green peas': ['Vegetables', 'g', 10], 'beans': ['Vegetables', 'g', 8], 'capsicum': ['Vegetables', 'g', 8], 'green chilli': ['Vegetables', 'g', 10],
  'ginger': ['Vegetables', 'g', 15], 'garlic': ['Vegetables', 'g', 20], 'coriander leaves': ['Vegetables', 'g', 20],
  'lemon': ['Fruits', 'pcs', 500], 'bananas': ['Fruits', 'pcs', 500],
  'milk': ['Dairy', 'ml', 6], 'curd': ['Dairy', 'g', 8], 'butter': ['Dairy', 'g', 55], 'ghee': ['Dairy', 'g', 60],
  'cooking oil': ['Oils', 'ml', 14],
  'salt': ['Spices', 'g', 2], 'turmeric powder': ['Spices', 'g', 20], 'red chilli powder': ['Spices', 'g', 30], 'cumin seeds': ['Spices', 'g', 40],
  'mustard seeds': ['Spices', 'g', 15], 'garam masala': ['Spices', 'g', 60],
  'peanuts': ['Other', 'g', 13], 'soy sauce': ['Other', 'ml', 12], 'sugar': ['Other', 'g', 5],
};

const priceFor = (name, unit) => Math.round(CATALOG[name.toLowerCase()][2] * factor(unit)); // paise per `unit`
const ing = (name, quantity, unit) => ({ name, quantity, unit, unitPrice: priceFor(name, unit), category: CATALOG[name.toLowerCase()][0] });

const r = (name, emoji, mealCategory, prepTime, servings, description, ingredients, instructions) => ({
  owner: null, name, emoji, mealCategory, prepTime, servings, description, image: '',
  ingredients: ingredients.map(([n, q, u]) => ing(n, q, u)), instructions,
});

const RECIPES = [
  r('Poha', '🍚', 'Breakfast', 20, 2, 'Light flattened-rice breakfast with peanuts, onion and lemon.',
    [['Poha', 150, 'g'], ['Onion', 80, 'g'], ['Potato', 100, 'g'], ['Peanuts', 30, 'g'], ['Green Chilli', 10, 'g'], ['Mustard Seeds', 3, 'g'], ['Turmeric Powder', 2, 'g'], ['Cooking Oil', 15, 'ml'], ['Salt', 4, 'g'], ['Lemon', 1, 'pcs'], ['Coriander Leaves', 10, 'g']],
    ['Rinse the poha in a colander and let it soften for 5 minutes.', 'Heat oil, crackle mustard seeds, fry peanuts until golden.', 'Add chopped onion, chilli and diced potato; cook until soft.', 'Stir in turmeric, salt and the poha. Warm through for 2 minutes.', 'Finish with lemon juice and coriander.']),
  r('Upma', '🥣', 'Breakfast', 20, 2, 'Savoury semolina porridge with vegetables.',
    [['Rava', 150, 'g'], ['Onion', 80, 'g'], ['Carrot', 50, 'g'], ['Green Chilli', 8, 'g'], ['Mustard Seeds', 3, 'g'], ['Ginger', 10, 'g'], ['Cooking Oil', 15, 'ml'], ['Salt', 4, 'g'], ['Coriander Leaves', 10, 'g']],
    ['Dry roast the rava until fragrant and set aside.', 'Temper mustard seeds in oil, then fry onion, ginger, chilli and carrot.', 'Add 450 ml hot water and salt, bring to a boil.', 'Pour in the rava slowly while stirring. Cover and cook 3 minutes.', 'Garnish with coriander.']),
  r('Aloo Paratha', '🫓', 'Breakfast', 35, 2, 'Whole-wheat flatbread stuffed with spiced potato.',
    [['Atta', 250, 'g'], ['Potato', 250, 'g'], ['Green Chilli', 10, 'g'], ['Cumin Seeds', 3, 'g'], ['Garam Masala', 3, 'g'], ['Salt', 5, 'g'], ['Cooking Oil', 20, 'ml'], ['Butter', 20, 'g'], ['Coriander Leaves', 10, 'g'], ['Curd', 100, 'g']],
    ['Knead atta with water and a pinch of salt into a soft dough.', 'Boil and mash potatoes; mix with chilli, cumin, garam masala, salt and coriander.', 'Stuff the dough balls with the filling and roll out gently.', 'Cook on a hot tawa with oil until golden on both sides.', 'Serve with butter and curd.']),
  r('Vegetable Pulao', '🍛', 'Lunch', 40, 3, 'Fragrant one-pot rice with seasonal vegetables.',
    [['Rice', 250, 'g'], ['Onion', 100, 'g'], ['Carrot', 80, 'g'], ['Green Peas', 80, 'g'], ['Beans', 60, 'g'], ['Potato', 100, 'g'], ['Ginger', 10, 'g'], ['Garlic', 10, 'g'], ['Cumin Seeds', 3, 'g'], ['Garam Masala', 4, 'g'], ['Cooking Oil', 30, 'ml'], ['Salt', 6, 'g'], ['Green Chilli', 8, 'g']],
    ['Wash the rice and soak for 20 minutes.', 'Fry cumin, then onion, ginger, garlic and chilli.', 'Add chopped vegetables and garam masala; saute for 3 minutes.', 'Add rice, salt and 500 ml water. Cover and cook on low heat for 15 minutes.', 'Rest for 5 minutes and fluff with a fork.']),
  r('Dal Rice', '🍲', 'Lunch', 35, 3, 'Everyday toor dal tadka with steamed rice.',
    [['Toor Dal', 150, 'g'], ['Rice', 250, 'g'], ['Onion', 80, 'g'], ['Tomato', 100, 'g'], ['Garlic', 10, 'g'], ['Turmeric Powder', 3, 'g'], ['Cumin Seeds', 3, 'g'], ['Red Chilli Powder', 3, 'g'], ['Ghee', 15, 'g'], ['Salt', 6, 'g'], ['Coriander Leaves', 10, 'g']],
    ['Pressure cook the dal with turmeric and 500 ml water until soft.', 'Cook the rice separately.', 'Heat ghee, add cumin, garlic, onion and tomato; cook down.', 'Stir in chilli powder, then pour the tadka over the dal.', 'Garnish with coriander and serve over rice.']),
  r('Chickpea Curry', '🥘', 'Lunch', 50, 3, 'Hearty chana masala, best with roti or rice.',
    [['Chickpeas', 250, 'g'], ['Onion', 150, 'g'], ['Tomato', 200, 'g'], ['Ginger', 15, 'g'], ['Garlic', 15, 'g'], ['Cumin Seeds', 3, 'g'], ['Turmeric Powder', 3, 'g'], ['Red Chilli Powder', 4, 'g'], ['Garam Masala', 4, 'g'], ['Cooking Oil', 30, 'ml'], ['Salt', 6, 'g'], ['Coriander Leaves', 10, 'g']],
    ['Soak chickpeas overnight, then pressure cook until tender.', 'Fry cumin, onion, ginger and garlic until golden.', 'Add tomato and the spice powders; cook until oil separates.', 'Add chickpeas with some cooking water and simmer for 15 minutes.', 'Finish with garam masala and coriander.']),
  r('Egg Fried Rice', '🍳', 'Dinner', 25, 2, 'Quick wok-style rice with scrambled egg and vegetables.',
    [['Rice', 200, 'g'], ['Eggs', 3, 'pcs'], ['Onion', 60, 'g'], ['Carrot', 50, 'g'], ['Beans', 50, 'g'], ['Capsicum', 60, 'g'], ['Garlic', 10, 'g'], ['Soy Sauce', 15, 'ml'], ['Cooking Oil', 20, 'ml'], ['Salt', 3, 'g'], ['Green Chilli', 5, 'g']],
    ['Cook the rice, spread out and cool completely.', 'Scramble the eggs in a little oil and set aside.', 'Stir-fry garlic, chilli and chopped vegetables on high heat.', 'Add rice, soy sauce and salt; toss for 2 minutes.', 'Fold the egg back in and serve hot.']),
  r('Vegetable Khichdi', '🍲', 'Dinner', 35, 3, 'Comforting rice and moong dal cooked with vegetables.',
    [['Rice', 150, 'g'], ['Moong Dal', 100, 'g'], ['Carrot', 60, 'g'], ['Green Peas', 60, 'g'], ['Potato', 80, 'g'], ['Tomato', 60, 'g'], ['Ginger', 8, 'g'], ['Cumin Seeds', 3, 'g'], ['Turmeric Powder', 3, 'g'], ['Ghee', 15, 'g'], ['Salt', 6, 'g']],
    ['Wash rice and dal together.', 'Heat ghee, splutter cumin, add ginger and tomato.', 'Add vegetables, turmeric, rice, dal, salt and 750 ml water.', 'Pressure cook for 3 whistles.', 'Mash lightly and serve with a spoon of ghee.']),
  r('Egg Curry', '🥚', 'Dinner', 40, 3, 'Boiled eggs simmered in an onion-tomato gravy.',
    [['Eggs', 6, 'pcs'], ['Onion', 150, 'g'], ['Tomato', 200, 'g'], ['Ginger', 10, 'g'], ['Garlic', 10, 'g'], ['Turmeric Powder', 3, 'g'], ['Red Chilli Powder', 4, 'g'], ['Garam Masala', 3, 'g'], ['Cooking Oil', 30, 'ml'], ['Salt', 5, 'g'], ['Coriander Leaves', 10, 'g']],
    ['Boil the eggs, peel and lightly prick them.', 'Brown onions with ginger and garlic in oil.', 'Add tomato and spices; cook into a thick masala.', 'Add 250 ml water and the eggs; simmer for 10 minutes.', 'Top with garam masala and coriander.']),
  r('Peanut Chaat', '🥜', 'Snacks', 10, 2, 'Crunchy roasted peanut salad with onion, tomato and lemon.',
    [['Peanuts', 100, 'g'], ['Onion', 50, 'g'], ['Tomato', 60, 'g'], ['Green Chilli', 5, 'g'], ['Lemon', 1, 'pcs'], ['Salt', 2, 'g'], ['Red Chilli Powder', 2, 'g'], ['Coriander Leaves', 10, 'g']],
    ['Dry roast the peanuts until crisp and let them cool.', 'Chop the onion, tomato and chilli finely.', 'Toss everything with salt, chilli powder and lemon juice.', 'Serve straight away.']),
  r('Banana Milkshake', '🥛', 'Snacks', 5, 2, 'Cold, creamy banana shake.',
    [['Bananas', 2, 'pcs'], ['Milk', 400, 'ml'], ['Sugar', 20, 'g']],
    ['Peel and slice the bananas.', 'Blend with chilled milk and sugar until smooth.', 'Serve cold.']),
];

// [name, quantity, unit, expires in N days (or null), low-stock threshold]
const STARTER_PANTRY = [
  ['Rice', 2, 'kg', null, 0.5], ['Toor Dal', 500, 'g', null, 100], ['Atta', 1, 'kg', null, 0.25], ['Onion', 1, 'kg', 14, 0.25],
  ['Potato', 1, 'kg', 14, 0.25], ['Tomato', 400, 'g', 5, 100], ['Green Chilli', 50, 'g', 6, 10], ['Cooking Oil', 500, 'ml', null, 100],
  ['Salt', 500, 'g', null, 100], ['Turmeric Powder', 100, 'g', null, 20], ['Red Chilli Powder', 100, 'g', null, 20], ['Cumin Seeds', 50, 'g', null, 10],
  ['Eggs', 6, 'pcs', 10, 2], ['Milk', 1, 'l', 3, 0.25],
].map(([name, quantity, unit, days, lowStockThreshold]) => ({
  name, quantity, unit, lowStockThreshold, category: CATALOG[name.toLowerCase()][0], unitPrice: priceFor(name, unit),
  expiryDate: days ? new Date(Date.now() + days * 86400000) : null,
}));

module.exports = { RECIPES, STARTER_PANTRY };
