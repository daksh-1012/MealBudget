import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Modal } from './ui';
import { planApi } from '../services/api';
import { useToast } from '../context/ToastContext';
import { DAYS, SLOTS, localDate, mondayOf, weekLabel } from '../utils/format';

// Modal used from the Recommendations page to place a recipe in the current week's plan
export default function AddToPlan({ recipe, weekStart, onClose, onAdded }) {
  const toast = useToast();
  const [day, setDay] = useState(0);
  const [slot, setSlot] = useState('lunch');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!recipe) return;
    setSlot((SLOTS.find((s) => s.category === recipe.mealCategory) || SLOTS[1]).key);
    const idx = weekStart === mondayOf(localDate()) ? Math.max(0, (new Date().getDay() + 6) % 7) : 0;
    setDay(idx);
  }, [recipe, weekStart]);

  const add = async () => {
    setBusy(true);
    try { await planApi.setEntry({ weekStart, day, slot, recipeId: recipe._id }); toast.success(`${recipe.name} added to ${DAYS[day]} ${slot}`); onAdded(); }
    catch (e) { toast.error(e.message); } finally { setBusy(false); }
  };

  return (
    <Modal open={!!recipe} onClose={onClose} title={`Add ${recipe?.name || ''} to plan`}>
      <p className="mb-3 text-sm text-slate-500">Week of {weekLabel(weekStart)}. Choosing an occupied slot replaces the meal there.</p>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="label" htmlFor="apd">Day</label><select id="apd" className="input" value={day} onChange={(e) => setDay(Number(e.target.value))}>{DAYS.map((d, i) => <option key={d} value={i}>{d}</option>)}</select></div>
        <div><label className="label" htmlFor="aps">Meal</label><select id="aps" className="input" value={slot} onChange={(e) => setSlot(e.target.value)}>{SLOTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}</select></div>
      </div>
      <div className="mt-5 flex justify-end gap-2">
        <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={add} disabled={busy}>{busy && <Loader2 size={14} className="animate-spin" />}Add to plan</button>
      </div>
    </Modal>
  );
}
