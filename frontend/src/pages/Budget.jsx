import { useEffect, useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { Alert, ConfirmModal, ErrorState, PageHeader, ProgressBar, Spinner, StatCard, WeekPicker } from '../components/ui';
import useFetch from '../hooks/useFetch';
import { useToast } from '../context/ToastContext';
import { budgetApi } from '../services/api';
import { DAYS, SLOTS, formatINR, localDate, mondayOf, toPaise, toRupees } from '../utils/format';

export default function Budget() {
  const toast = useToast();
  const [weekStart, setWeekStart] = useState(mondayOf(localDate()));
  const { data, setData, loading, error, reload } = useFetch(() => budgetApi.get(weekStart), [weekStart]);
  const [amount, setAmount] = useState('');
  const [exp, setExp] = useState({ description: '', amount: '', date: localDate() });
  const [busy, setBusy] = useState(false);
  const [removing, setRemoving] = useState(null);

  useEffect(() => { if (data) setAmount(data.summary.budget.isSet ? toRupees(data.summary.budget.amount) : ''); }, [data?.summary.budget.amount, data?.summary.budget.isSet, weekStart]); // eslint-disable-line

  const saveBudget = async (e) => {
    e.preventDefault();
    if (amount === '' || Number(amount) < 0) return toast.error('Enter a weekly budget of 0 or more');
    setBusy(true);
    try { setData(await budgetApi.set(weekStart, toPaise(amount))); toast.success('Weekly budget saved'); } catch (er) { toast.error(er.message); } finally { setBusy(false); }
  };
  const addExpense = async (e) => {
    e.preventDefault();
    if (!exp.description.trim()) return toast.error('Describe what you bought');
    if (!(Number(exp.amount) > 0)) return toast.error('Enter an amount above ₹0');
    try { setData(await budgetApi.addExpense({ weekStart, description: exp.description.trim(), amount: toPaise(exp.amount), date: exp.date })); setExp({ description: '', amount: '', date: localDate() }); toast.success('Expense recorded'); } catch (er) { toast.error(er.message); }
  };
  const removeExpense = async () => {
    try { setData(await budgetApi.removeExpense(removing._id)); toast.success('Expense deleted'); } catch (er) { toast.error(er.message); }
    setRemoving(null);
  };

  const s = data?.summary;
  const t = s?.totals;
  const over = s?.entries.filter((e) => e.exceedsBudget) || [];

  return (
    <>
      <PageHeader title="Budget" subtitle="Set a weekly food budget and track what you have spent against what your plan still needs.">
        <WeekPicker weekStart={weekStart} onChange={setWeekStart} />
      </PageHeader>

      {loading && !data ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : (
        <div className="space-y-5">
          <form onSubmit={saveBudget} className="card flex flex-wrap items-end gap-3 p-4">
            <div className="min-w-[12rem] flex-1">
              <label className="label" htmlFor="b">Weekly food budget (₹)</label>
              <input id="b" type="number" min="0" step="any" className="input" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 1500" />
            </div>
            <button className="btn btn-primary" disabled={busy}>{busy && <Loader2 size={14} className="animate-spin" />}{s.budget.isSet ? 'Update budget' : 'Set budget'}</button>
          </form>

          {!s.budget.isSet && <Alert tone="warn">No budget is set for this week yet. Set one above to see remaining budget and warnings.</Alert>}
          {t.exceeds && <Alert tone="danger">You are {formatINR(-t.remaining)} over budget. {over.length > 0 && <>Meals that push you over: {over.map((e) => `${e.recipe.name} (${DAYS[e.day]} ${SLOTS.find((x) => x.key === e.slot).label.split(' ')[0].toLowerCase()})`).join(', ')}.</>}</Alert>}
          {s.budget.isSet && !t.exceeds && t.utilization >= 85 && <Alert tone="warn">You have committed {t.utilization}% of this week’s budget.</Alert>}

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Weekly budget" value={s.budget.isSet ? formatINR(s.budget.amount) : '—'} />
            <StatCard label="Spent so far" value={formatINR(t.spent)} sub="Recorded expenses" />
            <StatCard label="Still to buy" value={formatINR(t.toBuy)} sub="Estimate for planned meals" />
            <StatCard label="Remaining" value={t.remaining === null ? '—' : formatINR(t.remaining)} tone={t.exceeds ? 'danger' : 'default'} sub={t.utilization === null ? undefined : `${t.utilization}% utilised`} />
          </div>
          {s.budget.isSet && <div className="card p-4"><ProgressBar percent={t.utilization} /><p className="mt-2 text-xs text-slate-500">Utilisation = (spent + still to buy) ÷ budget. Meal costs are estimates from ingredient prices, not live market prices.</p></div>}

          <section className="card p-4">
            <h2 className="mb-3 text-lg font-semibold">Track an expense</h2>
            <form onSubmit={addExpense} className="grid gap-3 sm:grid-cols-[1fr_8rem_9rem_auto] sm:items-end">
              <div><label className="label" htmlFor="ed">What did you buy?</label><input id="ed" className="input" value={exp.description} onChange={(e) => setExp({ ...exp, description: e.target.value })} maxLength={120} placeholder="Vegetables from market" /></div>
              <div><label className="label" htmlFor="ea">Amount (₹)</label><input id="ea" type="number" min="0" step="any" className="input" value={exp.amount} onChange={(e) => setExp({ ...exp, amount: e.target.value })} /></div>
              <div><label className="label" htmlFor="edt">Date</label><input id="edt" type="date" className="input" value={exp.date} onChange={(e) => setExp({ ...exp, date: e.target.value })} /></div>
              <button className="btn btn-primary"><Plus size={14} />Add expense</button>
            </form>
            {data.expenses.length === 0 ? <p className="mt-4 text-sm text-slate-500">No expenses recorded this week. Items you mark as purchased on the shopping list appear here automatically.</p> : (
              <ul className="mt-4 divide-y divide-slate-100">
                {data.expenses.map((e) => (
                  <li key={e._id} className="flex items-center gap-3 py-2.5 text-sm">
                    <span className="min-w-0 flex-1 truncate">{e.description}</span>
                    <span className="text-xs text-slate-500">{new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    <b>{formatINR(e.amount)}</b>
                    <button className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600" onClick={() => setRemoving(e)} aria-label={`Delete expense ${e.description}`}><Trash2 size={15} /></button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
      <ConfirmModal open={!!removing} title="Delete expense?" message={`${removing?.description} (${formatINR(removing?.amount || 0)}) will be removed from this week’s spending.`} onConfirm={removeExpense} onCancel={() => setRemoving(null)} />
    </>
  );
}
