import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Modal } from './ui';
import { recipeApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { MEALS, UNITS, toPaise, toRupees } from '../utils/format';

const blankIng = () => ({ name: '', quantity: '', unit: 'g', price: '' });
const blank = { name: '', emoji: '🍽️', mealCategory: 'Lunch', prepTime: 30, servings: 2, image: '', description: '', instructions: '', ingredients: [blankIng()] };

export default function RecipeForm({ open, recipe, onClose, onSaved }) {
  const toast = useToast();
  const [f, setF] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    if (!open) return;
    setErr('');
    setF(recipe ? {
      ...recipe, instructions: (recipe.instructions || []).join('\n'),
      ingredients: recipe.ingredients.map((i) => ({ name: i.name, quantity: i.quantity, unit: i.unit, price: toRupees(i.unitPrice) })),
    } : blank);
  }, [open, recipe]);

  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const setIng = (idx, k, v) => setF((s) => ({ ...s, ingredients: s.ingredients.map((i, n) => (n === idx ? { ...i, [k]: v } : i)) }));

  const submit = async (e) => {
    e.preventDefault();
    const ingredients = f.ingredients.filter((i) => i.name.trim() || i.quantity !== '');
    if (!f.name.trim()) return setErr('Give the recipe a name');
    if (!ingredients.length || ingredients.some((i) => !i.name.trim() || !(Number(i.quantity) > 0))) return setErr('Every ingredient needs a name and a quantity above 0');
    const body = {
      name: f.name.trim(), emoji: f.emoji || '🍽️', mealCategory: f.mealCategory, prepTime: Number(f.prepTime), servings: Number(f.servings),
      image: f.image.trim(), description: f.description.trim(),
      instructions: f.instructions.split('\n').map((s) => s.trim()).filter(Boolean),
      ingredients: ingredients.map((i) => ({ name: i.name.trim(), quantity: Number(i.quantity), unit: i.unit, unitPrice: toPaise(i.price) })),
    };
    setBusy(true); setErr('');
    try {
      const saved = recipe ? await recipeApi.update(recipe._id, body) : await recipeApi.create(body);
      toast.success(recipe ? 'Recipe updated' : 'Recipe added');
      onSaved(saved);
    } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={recipe ? 'Edit recipe' : 'Add a recipe'} wide>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-[1fr_5rem]">
          <div><label className="label" htmlFor="rn">Recipe name</label><input id="rn" className="input" value={f.name} onChange={set('name')} maxLength={80} required /></div>
          <div><label className="label" htmlFor="re">Emoji</label><input id="re" className="input text-center" value={f.emoji} onChange={set('emoji')} maxLength={4} /></div>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div><label className="label" htmlFor="rc">Meal category</label><select id="rc" className="input" value={f.mealCategory} onChange={set('mealCategory')}>{MEALS.map((m) => <option key={m}>{m}</option>)}</select></div>
          <div><label className="label" htmlFor="rp">Prep time (min)</label><input id="rp" type="number" min="1" className="input" value={f.prepTime} onChange={set('prepTime')} required /></div>
          <div><label className="label" htmlFor="rs">Servings</label><input id="rs" type="number" min="1" className="input" value={f.servings} onChange={set('servings')} required /></div>
        </div>
        <div><label className="label" htmlFor="ri">Image URL (optional)</label><input id="ri" type="url" placeholder="https://…" className="input" value={f.image} onChange={set('image')} /></div>
        <div><label className="label" htmlFor="rd">Description</label><input id="rd" className="input" value={f.description} onChange={set('description')} maxLength={400} /></div>

        <fieldset>
          <legend className="label">Ingredients</legend>
          <div className="space-y-2">
            {f.ingredients.map((i, n) => (
              <div key={n} className="grid grid-cols-[1fr_4.5rem_4.5rem_5rem_2rem] items-center gap-2">
                <input aria-label="Ingredient name" placeholder="Name" className="input" value={i.name} onChange={(e) => setIng(n, 'name', e.target.value)} />
                <input aria-label="Quantity" type="number" min="0" step="any" placeholder="Qty" className="input" value={i.quantity} onChange={(e) => setIng(n, 'quantity', e.target.value)} />
                <select aria-label="Unit" className="input px-2" value={i.unit} onChange={(e) => setIng(n, 'unit', e.target.value)}>{UNITS.map((u) => <option key={u}>{u}</option>)}</select>
                <input aria-label="Price per unit in rupees" type="number" min="0" step="any" placeholder="₹/unit" className="input px-2" value={i.price} onChange={(e) => setIng(n, 'price', e.target.value)} />
                <button type="button" className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30" disabled={f.ingredients.length === 1} onClick={() => setF((s) => ({ ...s, ingredients: s.ingredients.filter((_, x) => x !== n) }))} aria-label="Remove ingredient"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
          <p className="mt-1 text-xs text-slate-500">Price is a default estimate per single unit chosen (e.g. ₹0.06 per g, or ₹60 per kg).</p>
          <button type="button" className="btn btn-soft btn-sm mt-2" onClick={() => setF((s) => ({ ...s, ingredients: [...s.ingredients, blankIng()] }))}><Plus size={14} />Add ingredient</button>
        </fieldset>

        <div><label className="label" htmlFor="rin">Instructions (one step per line)</label><textarea id="rin" rows={4} className="input" value={f.instructions} onChange={set('instructions')} /></div>
        {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{err}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy && <Loader2 size={14} className="animate-spin" />}{recipe ? 'Save changes' : 'Add recipe'}</button>
        </div>
      </form>
    </Modal>
  );
}
