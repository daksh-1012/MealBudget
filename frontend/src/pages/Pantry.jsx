import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2, Minus, Package, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { ConfirmModal, EmptyState, ErrorState, Modal, PageHeader, Spinner } from '../components/ui';
import useFetch from '../hooks/useFetch';
import { useToast } from '../context/ToastContext';
import { pantryApi } from '../services/api';
import { CATEGORIES, UNITS, daysUntil, formatINR, toPaise, toRupees } from '../utils/format';

const STEP = { g: 50, ml: 50, kg: 0.25, l: 0.25, tbsp: 1, tsp: 1, pcs: 1 };
const blank = { name: '', quantity: '', unit: 'g', category: 'Other', price: '', expiryDate: '', lowStockThreshold: '' };

function IngredientForm({ open, item, onClose, onSaved }) {
  const toast = useToast();
  const [f, setF] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  useEffect(() => {
    if (!open) return;
    setErr('');
    setF(item ? { name: item.name, quantity: item.quantity, unit: item.unit, category: item.category, price: toRupees(item.unitPrice) || '', expiryDate: item.expiryDate ? item.expiryDate.slice(0, 10) : '', lowStockThreshold: item.lowStockThreshold || '' } : blank);
  }, [open, item]);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (!f.name.trim()) return setErr('Enter an ingredient name');
    if (f.quantity === '' || Number(f.quantity) < 0) return setErr('Enter a quantity of 0 or more');
    const body = { name: f.name.trim(), quantity: Number(f.quantity), unit: f.unit, category: f.category, unitPrice: toPaise(f.price), expiryDate: f.expiryDate || null, lowStockThreshold: Number(f.lowStockThreshold || 0) };
    setBusy(true); setErr('');
    try {
      await (item ? pantryApi.update(item._id, body) : pantryApi.create(body));
      toast.success(item ? 'Ingredient updated' : 'Ingredient added');
      onSaved();
    } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };

  return (
    <Modal open={open} onClose={onClose} title={item ? 'Edit ingredient' : 'Add ingredient'}>
      <form onSubmit={submit} className="space-y-3">
        <div><label className="label" htmlFor="in">Name</label><input id="in" className="input" value={f.name} onChange={set('name')} maxLength={60} required /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label" htmlFor="iq">Quantity</label><input id="iq" type="number" min="0" step="any" className="input" value={f.quantity} onChange={set('quantity')} required /></div>
          <div><label className="label" htmlFor="iu">Unit</label><select id="iu" className="input" value={f.unit} onChange={set('unit')}>{UNITS.map((u) => <option key={u}>{u}</option>)}</select></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label" htmlFor="ic">Category</label><select id="ic" className="input" value={f.category} onChange={set('category')}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select></div>
          <div><label className="label" htmlFor="ip">Price per {f.unit} (₹)</label><input id="ip" type="number" min="0" step="any" className="input" value={f.price} onChange={set('price')} placeholder="Estimate" /></div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label" htmlFor="ie">Expiry date</label><input id="ie" type="date" className="input" value={f.expiryDate} onChange={set('expiryDate')} /></div>
          <div><label className="label" htmlFor="il">Low-stock alert at ({f.unit})</label><input id="il" type="number" min="0" step="any" className="input" value={f.lowStockThreshold} onChange={set('lowStockThreshold')} placeholder="Off" /></div>
        </div>
        {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{err}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" disabled={busy}>{busy && <Loader2 size={14} className="animate-spin" />}{item ? 'Save changes' : 'Add ingredient'}</button>
        </div>
      </form>
    </Modal>
  );
}

export default function Pantry() {
  const toast = useToast();
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [debounced, setDebounced] = useState('');
  const [editing, setEditing] = useState(undefined); // undefined = closed, null = new, object = edit
  const [deleting, setDeleting] = useState(null);

  useEffect(() => { const t = setTimeout(() => setDebounced(q), 250); return () => clearTimeout(t); }, [q]);
  const { data: items, loading, error, reload } = useFetch(() => pantryApi.list({ q: debounced || undefined, category: category || undefined, lowStock: lowStock || undefined }), [debounced, category, lowStock]);

  const nudge = async (it, dir) => {
    const quantity = Math.max(0, Math.round((it.quantity + dir * STEP[it.unit]) * 1000) / 1000);
    try { await pantryApi.update(it._id, { ...it, quantity }); reload(); } catch (e) { toast.error(e.message); }
  };
  const loadStarter = async () => {
    try { const r = await pantryApi.starter(); toast.success(r.added ? `Added ${r.added} sample ingredients` : 'Sample ingredients are already in your pantry'); reload(); } catch (e) { toast.error(e.message); }
  };
  const confirmDelete = async () => {
    try { await pantryApi.remove(deleting._id); toast.success(`${deleting.name} removed`); setDeleting(null); reload(); } catch (e) { toast.error(e.message); setDeleting(null); }
  };
  const filtered = q || category || lowStock;

  return (
    <>
      <PageHeader title="Pantry" subtitle="Track what you have at home so recipes only charge you for what is missing.">
        <button className="btn btn-primary" onClick={() => setEditing(null)}><Plus size={16} />Add ingredient</button>
      </PageHeader>

      <div className="mb-5 flex flex-wrap gap-3">
        <div className="relative min-w-[12rem] flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search ingredients" aria-label="Search ingredients" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select className="input w-auto" aria-label="Filter by category" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">All categories</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <label className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm"><input type="checkbox" checked={lowStock} onChange={(e) => setLowStock(e.target.checked)} />Low stock only</label>
      </div>

      {loading && !items ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : items.length === 0 ? (
        filtered ? <EmptyState icon={Search} title="No matching ingredients" text="Try a different search or clear the filters." />
          : <EmptyState icon={Package} title="Your pantry is empty" text="Add what you have at home, or load a sample Indian pantry to try the recommendations right away.">
              <button className="btn btn-primary" onClick={() => setEditing(null)}><Plus size={16} />Add ingredient</button>
              <button className="btn btn-soft" onClick={loadStarter}>Load sample pantry</button>
            </EmptyState>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it) => {
            const low = it.lowStockThreshold > 0 && it.quantity <= it.lowStockThreshold;
            const d = it.expiryDate ? daysUntil(it.expiryDate) : null;
            return (
              <article key={it._id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold">{it.name}</h3>
                    <p className="text-xs text-slate-500">{it.category}{it.unitPrice > 0 && ` · ${formatINR(it.unitPrice)}/${it.unit}`}</p>
                  </div>
                  <div className="flex shrink-0">
                    <button className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" onClick={() => setEditing(it)} aria-label={`Edit ${it.name}`}><Pencil size={15} /></button>
                    <button className="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-600" onClick={() => setDeleting(it)} aria-label={`Delete ${it.name}`}><Trash2 size={15} /></button>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <button className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50" onClick={() => nudge(it, -1)} aria-label={`Decrease ${it.name}`}><Minus size={14} /></button>
                  <span className="min-w-[5rem] text-center font-display text-lg font-bold">{it.quantity} <span className="text-sm font-medium text-slate-500">{it.unit}</span></span>
                  <button className="rounded-lg border border-slate-200 p-1.5 hover:bg-slate-50" onClick={() => nudge(it, 1)} aria-label={`Increase ${it.name}`}><Plus size={14} /></button>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {low && <span className="chip bg-amber-50 text-amber-700"><AlertTriangle size={12} />Low stock</span>}
                  {d !== null && d < 0 && <span className="chip bg-red-50 text-red-700">Expired</span>}
                  {d !== null && d >= 0 && d <= 3 && <span className="chip bg-amber-50 text-amber-700">Expires in {d} day{d === 1 ? '' : 's'}</span>}
                  {d !== null && d > 3 && <span className="chip bg-slate-100 text-slate-600">Expires {new Date(it.expiryDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>}
                </div>
              </article>
            );
          })}
        </div>
      )}

      <IngredientForm open={editing !== undefined} item={editing} onClose={() => setEditing(undefined)} onSaved={() => { setEditing(undefined); reload(); }} />
      <ConfirmModal open={!!deleting} title="Delete ingredient?" message={`${deleting?.name} will be removed from your pantry. This cannot be undone.`} onConfirm={confirmDelete} onCancel={() => setDeleting(null)} />
    </>
  );
}
