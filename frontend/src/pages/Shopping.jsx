import { useState } from 'react';
import { RefreshCw, ShoppingCart, Trash2 } from 'lucide-react';
import { EmptyState, ErrorState, PageHeader, Spinner, StatCard, WeekPicker } from '../components/ui';
import useFetch from '../hooks/useFetch';
import { useToast } from '../context/ToastContext';
import { shoppingApi } from '../services/api';
import { formatINR, localDate, mondayOf } from '../utils/format';

export default function Shopping() {
  const toast = useToast();
  const [weekStart, setWeekStart] = useState(mondayOf(localDate()));
  const [syncing, setSyncing] = useState(false);
  const { data, setData, loading, error, reload } = useFetch(() => shoppingApi.get(weekStart), [weekStart]);

  const act = async (fn, ok) => { try { setData(await fn()); if (ok) toast.success(ok); } catch (e) { toast.error(e.message); } };
  const sync = async () => { setSyncing(true); await act(() => shoppingApi.sync(weekStart), 'List updated from your meal plan'); setSyncing(false); };
  const toggle = (i) => act(() => shoppingApi.purchase(weekStart, i._id, !i.purchased), i.purchased ? `${i.name} marked as not purchased` : `${i.name} bought and added to your pantry`);

  const open = data?.items.filter((i) => !i.purchased) || [];
  const bought = data?.items.filter((i) => i.purchased) || [];

  const Row = ({ i }) => (
    <li className="flex items-center gap-3 py-3">
      <input type="checkbox" className="h-5 w-5 accent-emerald-600" checked={i.purchased} onChange={() => toggle(i)} aria-label={`Mark ${i.name} as purchased`} />
      <div className={`min-w-0 flex-1 ${i.purchased ? 'text-slate-400 line-through' : ''}`}>
        <div className="font-medium">{i.name}</div>
        <div className="text-xs">{i.quantity} {i.unit} · {i.category}</div>
      </div>
      <b className="text-sm">{formatINR(i.estCost)}</b>
      {!i.purchased && <button className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" onClick={() => act(() => shoppingApi.remove(weekStart, i._id), `${i.name} removed`)} aria-label={`Remove ${i.name}`}><Trash2 size={15} /></button>}
    </li>
  );

  return (
    <>
      <PageHeader title="Shopping list" subtitle="Only the ingredients your weekly plan needs beyond what is already in your pantry, with quantities added up across meals.">
        <WeekPicker weekStart={weekStart} onChange={setWeekStart} />
        <button className="btn btn-soft" onClick={sync} disabled={syncing}><RefreshCw size={14} className={syncing ? 'animate-spin' : ''} />Sync with plan</button>
      </PageHeader>

      {loading && !data ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : (
        <>
          <div className="mb-5 grid gap-3 sm:grid-cols-3">
            <StatCard label="Still to buy (estimate)" value={formatINR(data.totals.estimated)} sub={`${data.totals.remainingCount} item${data.totals.remainingCount === 1 ? '' : 's'}`} />
            <StatCard label="Marked purchased" value={formatINR(data.totals.purchased)} sub="Added to pantry and expenses" />
            <StatCard label="Budget remaining" value={data.budget.remaining === null ? 'No budget' : formatINR(data.budget.remaining)} tone={data.budget.exceeds ? 'danger' : 'default'} />
          </div>

          {data.items.length === 0 ? (
            <EmptyState icon={ShoppingCart} title="Nothing to buy" text={data.budget.mealCount ? 'Your pantry already covers every planned meal this week.' : 'Plan some meals first. Missing ingredients will appear here automatically.'} />
          ) : (
            <div className="card divide-y divide-slate-100 px-4">
              {open.length > 0 && <ul className="divide-y divide-slate-100">{open.map((i) => <Row key={i._id} i={i} />)}</ul>}
              {bought.length > 0 && (
                <div className="py-2">
                  <h2 className="py-2 text-sm font-semibold text-slate-500">Purchased</h2>
                  <ul className="divide-y divide-slate-100">{bought.map((i) => <Row key={i._id} i={i} />)}</ul>
                </div>
              )}
            </div>
          )}
          <p className="mt-3 text-xs text-slate-500">Changed your plan or pantry? Use “Sync with plan” to recalculate. Prices are estimates, not live market prices.</p>
        </>
      )}
    </>
  );
}
