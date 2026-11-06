const express = require('express');
const rateLimit = require('express-rate-limit');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const Ingredient = require('../models/Ingredient');
const Recipe = require('../models/Recipe');
const MealPlan = require('../models/MealPlan');
const { UNIT_LIST } = require('../utils/units');
const { isDateStr } = require('../utils/week');

const authC = require('../controllers/authController');
const pantryC = require('../controllers/pantryController');
const recipeC = require('../controllers/recipeController');
const planC = require('../controllers/planController');
const budgetC = require('../controllers/budgetController');
const shopC = require('../controllers/shoppingController');
const insightC = require('../controllers/insightsController');

const router = express.Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 50, standardHeaders: true, legacyHeaders: false, message: { success: false, message: 'Too many attempts. Please try again in a few minutes.' } });

const id = (name = 'id') => param(name).isMongoId().withMessage('Invalid identifier');
const week = body('weekStart').optional().custom(isDateStr).withMessage('weekStart must be YYYY-MM-DD');
const paise = (field, min = 0) => body(field).isInt({ min }).withMessage(`${field} must be a whole number of paise`).toInt();

// ---- Auth ----
router.post('/auth/register', authLimiter, [
  body('name').isString().trim().isLength({ min: 1, max: 60 }).withMessage('Name is required (max 60 characters)'),
  body('email').isString().trim().isEmail().withMessage('Enter a valid email address').customSanitizer((v) => v.toLowerCase()),
  body('password').isString().isLength({ min: 8, max: 72 }).withMessage('Password must be 8-72 characters'),
], validate, authC.register);
router.post('/auth/login', authLimiter, [
  body('email').isString().trim().isEmail().withMessage('Enter a valid email address').customSanitizer((v) => v.toLowerCase()),
  body('password').isString().notEmpty().withMessage('Password is required'),
], validate, authC.login);
router.get('/auth/me', auth, authC.me);

// Everything below requires a valid JWT
router.use(auth);

// ---- Pantry ----
const pantryRules = [
  body('name').isString().trim().isLength({ min: 1, max: 60 }).withMessage('Ingredient name is required (max 60 characters)'),
  body('quantity').isFloat({ min: 0 }).withMessage('Quantity must be 0 or more').toFloat(),
  body('unit').isIn(UNIT_LIST).withMessage(`Unit must be one of ${UNIT_LIST.join(', ')}`),
  body('category').optional().isIn(Ingredient.CATEGORIES).withMessage('Invalid category'),
  body('unitPrice').optional().isInt({ min: 0 }).withMessage('Price must be 0 or more').toInt(),
  body('expiryDate').optional({ nullable: true, checkFalsy: true }).isISO8601().withMessage('Invalid expiry date'),
  body('lowStockThreshold').optional().isFloat({ min: 0 }).withMessage('Low-stock level must be 0 or more').toFloat(),
];
router.get('/pantry', pantryC.list);
router.post('/pantry/starter', pantryC.starter);
router.post('/pantry', pantryRules, validate, pantryC.create);
router.put('/pantry/:id', id(), pantryRules, validate, pantryC.update);
router.delete('/pantry/:id', id(), validate, pantryC.remove);

// ---- Recipes ----
const recipeRules = [
  body('name').isString().trim().isLength({ min: 1, max: 80 }).withMessage('Recipe name is required (max 80 characters)'),
  body('mealCategory').isIn(Recipe.MEALS).withMessage('Choose a meal category'),
  body('prepTime').isInt({ min: 1, max: 1440 }).withMessage('Preparation time must be at least 1 minute').toInt(),
  body('servings').isInt({ min: 1, max: 100 }).withMessage('Servings must be at least 1').toInt(),
  body('description').optional().isString().isLength({ max: 400 }).withMessage('Description is too long'),
  body('emoji').optional().isString().isLength({ max: 8 }),
  body('image').optional({ checkFalsy: true }).isURL({ protocols: ['http', 'https'], require_protocol: true }).withMessage('Image must be a valid http(s) URL'),
  body('instructions').optional().isArray({ max: 40 }).withMessage('Instructions must be a list'),
  body('instructions.*').isString().isLength({ max: 400 }),
  body('ingredients').isArray({ min: 1, max: 40 }).withMessage('Add at least one ingredient'),
  body('ingredients.*.name').isString().trim().notEmpty().withMessage('Every ingredient needs a name'),
  body('ingredients.*.quantity').isFloat({ min: 0.01 }).withMessage('Ingredient quantities must be greater than 0').toFloat(),
  body('ingredients.*.unit').isIn(UNIT_LIST).withMessage('Invalid ingredient unit'),
  body('ingredients.*.unitPrice').optional().isInt({ min: 0 }).withMessage('Ingredient price must be 0 or more').toInt(),
];
router.get('/recipes', recipeC.list);
router.get('/recipes/:id', id(), validate, recipeC.get);
router.post('/recipes', recipeRules, validate, recipeC.create);
router.put('/recipes/:id', id(), recipeRules, validate, recipeC.update);
router.delete('/recipes/:id', id(), validate, recipeC.remove);

// ---- Recommendations & meal plan ----
router.get('/recommendations', planC.recommendations);
router.get('/mealplan', planC.get);
router.put('/mealplan/entry', [
  week,
  body('day').isInt({ min: 0, max: 6 }).withMessage('Day must be 0-6').toInt(),
  body('slot').isIn(MealPlan.SLOTS).withMessage('Invalid meal slot'),
  body('recipeId').isMongoId().withMessage('Choose a recipe'),
], validate, planC.setEntry);
router.delete('/mealplan/entry', planC.removeEntry);
router.delete('/mealplan', planC.clear);

// ---- Budget & expenses ----
router.get('/budget', budgetC.get);
router.put('/budget', [week, paise('amount')], validate, budgetC.set);
router.post('/budget/expenses', [
  week, paise('amount', 1),
  body('description').isString().trim().isLength({ min: 1, max: 120 }).withMessage('Describe the expense (max 120 characters)'),
  body('date').optional({ checkFalsy: true }).isISO8601().withMessage('Invalid date'),
], validate, budgetC.addExpense);
router.delete('/budget/expenses/:id', id(), validate, budgetC.removeExpense);

// ---- Shopping list ----
router.get('/shopping', shopC.get);
router.post('/shopping/sync', [week], validate, shopC.sync);
router.patch('/shopping/items/:itemId', [id('itemId'), week, body('purchased').isBoolean().withMessage('purchased must be true or false').toBoolean()], validate, shopC.purchase);
router.delete('/shopping/items/:itemId', id('itemId'), validate, shopC.remove);

// ---- Dashboard & analytics ----
router.get('/dashboard', insightC.dashboard);
router.get('/analytics', insightC.analytics);

module.exports = router;
