const ShoppingList = require('../models/ShoppingList');
const Ingredient = require('../models/Ingredient');
const Expense = require('../models/Expense');
const { getWeekSummary } = require('./weekService');
const { friendly, factor, toBase, dimOf, nameKey } = require('../utils/units');
const { ApiError } = require('../utils/ApiError');

// Turn aggregated shortfall (base units) into list items
function itemsFromShortfall(shortfall) {
  return shortfall.map((s) => {
    const f = friendly(s.shortBase, s.dim);
    return {
      name: s.name, quantity: Math.ceil(f.quantity * 100) / 100, unit: f.unit,
      unitPrice: Math.round(s.ppb * factor(f.unit)), estCost: s.cost, category: s.category, purchased: false,
    };
  });
}

// Keeps purchased items, replaces the unpurchased ones with a fresh calculation from the plan
async function syncList(userId, weekStart) {
  const summary = await getWeekSummary(userId, weekStart);
  const existing = await ShoppingList.findOne({ user: userId, weekStart });
  const kept = existing ? existing.items.filter((i) => i.purchased).map((i) => i.toObject()) : [];
  const items = [...kept, ...itemsFromShortfall(summary.shortfall)];
  return ShoppingList.findOneAndUpdate({ user: userId, weekStart }, { $set: { items } }, { upsert: true, new: true, setDefaultsOnInsert: true });
}

async function getList(userId, weekStart) {
  return (await ShoppingList.findOne({ user: userId, weekStart })) || syncList(userId, weekStart);
}

// Marking an item purchased records an expense and adds the stock to the pantry (reversible).
async function setPurchased(userId, weekStart, itemId, purchased) {
  const list = await ShoppingList.findOne({ user: userId, weekStart });
  const item = list?.items.id(itemId);
  if (!item) throw new ApiError(404, 'Shopping item not found');
  if (item.purchased === purchased) return list;

  const key = nameKey(item.name);
  const base = toBase(item.quantity, item.unit);
  const pantryItem = await Ingredient.findOne({ user: userId, nameKey: key });
  const sameDim = pantryItem && dimOf(pantryItem.unit) === dimOf(item.unit);

  if (purchased) {
    if (sameDim) {
      pantryItem.quantity = Math.round((pantryItem.quantity + base / factor(pantryItem.unit)) * 1000) / 1000;
      if (!pantryItem.unitPrice) pantryItem.unitPrice = item.unitPrice * (factor(pantryItem.unit) / factor(item.unit)) | 0;
      await pantryItem.save();
    } else if (!pantryItem) {
      await Ingredient.create({ user: userId, name: item.name, quantity: item.quantity, unit: item.unit, category: item.category, unitPrice: item.unitPrice });
    } // else: pantry has the name in an incompatible unit - leave it untouched
    if (item.estCost > 0) await Expense.create({ user: userId, weekStart, amount: item.estCost, description: `Bought ${item.name}`, shoppingItemId: item._id });
  } else {
    if (sameDim) {
      pantryItem.quantity = Math.max(0, Math.round((pantryItem.quantity - base / factor(pantryItem.unit)) * 1000) / 1000);
      await pantryItem.save();
    }
    await Expense.deleteMany({ user: userId, shoppingItemId: item._id });
  }
  item.purchased = purchased;
  await list.save();
  return list;
}

async function removeItem(userId, weekStart, itemId) {
  const list = await ShoppingList.findOne({ user: userId, weekStart });
  const item = list?.items.id(itemId);
  if (!item) throw new ApiError(404, 'Shopping item not found');
  if (item.purchased) throw new ApiError(400, 'Mark the item as not purchased before removing it');
  item.deleteOne();
  await list.save();
  return list;
}

module.exports = { getList, syncList, setPurchased, removeItem };
