import { useState } from 'react';
import { AlertTriangle, CalendarDays, Eye, Plus, Repeat, Trash2, X } from 'lucide-react';
import { Alert, ConfirmModal, ErrorState, Modal, PageHeader, ProgressBar, Spinner, WeekPicker } from '../components/ui';
import RecipeDetail from '../components/RecipeDetail';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { planApi } from '../services/api';
import { DAYS, SLOTS, addDays, formatINR, localDate, mondayOf, shortDate } from '../utils/format';

function Picker({ target, weekStart, onClose, onPick }) {
  const [all, setAll] = useState(false);
  const slot = target && SLOTS.find((s) => s.key === target.slot);
  const { data, loading, error } = useFetch(() => (target ? planApi.recommend({ weekStart, mealCategory: all ? undefined : slot.category }) : Promise.resolve(null)), [target?.day, target?.slot, all, weekStart]);
  return (
    <Modal open={!!target} onClose={onClose} title={target ? `${DAYS[target.day]} · ${slot.label}` : ''} wide>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm text-slate-500">Best pantry matches first.</p>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} />Show all categories</label>
      </div>
      {loading && <Spinner />}
      {error && <ErrorState message={error} />}
      {data && !loading && (data.results.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">No recipes in this category yet.</p> : (
        <ul className="divide-y divide-slate-100">
          {data.results.map((r) => (
            <li key={r.recipe._id}>
              <button className="flex w-full items-center gap-3 py-3 text-left hover:bg-forest-50/60" onClick={() => onPick(r.recipe)}>
                <span className="text-2xl" aria-hidden="true">{r.recipe.emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{r.recipe.name}</span>
                  <span className="block text-xs text-slate-500">{r.matchPercent}% in pantry · {r.missing.length ? `missing ${r.missing.map((m) => m.name).slice(0, 3).join(', ')}${r.missing.length > 3 ? '…' : ''}` : 'nothing to buy'}</span>
                </span>
                <span className="text-right text-xs text-slate-500">to buy<b className="block text-sm text-ink">{formatINR(r.additionalCost)}</b></span>
              </button>
            </li>
          ))}
        </ul>
      ))}
    </Modal>
  );
}

export default function Planner() {
  const { user } = useAuth();
  const toast = useToast();
  const [weekStart, setWeekStart] = useState(mondayOf(localDate()));
  const [target, setTarget] = useState(null);
  const [viewId, setViewId] = useState(null);
  const [clearing, setClearing] = useState(false);
  const { data: plan, setData, loading, error, reload } = useFetch(() => planApi.get(weekStart), [weekStart]);

  const pick = async (recipe) => {
    try { setData(await planApi.setEntry({ weekStart, day: target.day, slot: target.slot, recipeId: recipe._id })); toast.success(`${recipe.name} planned`); setTarget(null); }
    catch (e) { toast.error(e.message); }
  };
  const remove = async (e) => {
    try { setData(await planApi.removeEntry(weekStart, e.day, e.slot)); toast.success('Meal removed'); } catch (er) { toast.error(er.message); }
  };
  const clear = async () => {
    try { setData(await planApi.clear(weekStart)); toast.success('Week cleared'); } catch (e) { toast.error(e.message); }
    setClearing(false);
  };

  const t = plan?.totals;
  const cell = (day, slot) => plan.entries.find((e) => e.day === day && e.slot === slot.key);

  return (
    <>
      <PageHeader title="Meal planner" subtitle="Plan each day. Costs only count what you still need to buy, using your pantry in order from Monday.">
        <WeekPicker weekStart={weekStart} onChange={setWeekStart} />
        {plan?.entries.length > 0 && <button className="btn btn-ghost" onClick={() => setClearing(true)}><Trash2 size={14} />Clear week</button>}
      </PageHeader>

      {loading && !plan ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : (
        <>
          <div className="card mb-5 p-4">
            <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
              <div><span className="text-slate-500">Planned meals</span><b className="ml-2 font-display text-lg">{t.mealCount}</b></div>
              <div><span className="text-slate-500">Weekly meal value</span><b className="ml-2 font-display text-lg">{formatINR(t.plannedValue)}</b></div>
              <div><span className="text-slate-500">Still to buy</span><b className="ml-2 font-display text-lg">{formatINR(t.toBuy)}</b></div>
              {plan.budget.isSet ? <div className="ml-auto"><span className="text-slate-500">Budget</span><b className="ml-2 font-display text-lg">{formatINR(plan.budget.amount)}</b></div> : <span className="ml-auto text-slate-500">No budget set for this week</span>}
            </div>
            {plan.budget.isSet && <div className="mt-3"><ProgressBar percent={t.utilization} /><p className="mt-1 text-xs text-slate-500">{t.utilization}% of budget committed (spent {formatINR(t.spent)} + to buy {formatINR(t.toBuy)})</p></div>}
          </div>
          {t.exceeds && <div className="mb-5"><Alert tone="danger">This plan is {formatINR(-t.remaining)} over your weekly budget. Meals marked “Over budget” push it past the limit. Replace them with cheaper options or ones that use your pantry.</Alert></div>}

          <div className="space-y-3">
            {DAYS.map((name, day) => {
              const d = plan.days[day];
              const isToday = weekStart === mondayOf(localDate()) && addDays(weekStart, day) === localDate();
              return (
                <section key={name} className={`card p-4 ${isToday ? 'ring-2 ring-emerald-500/40' : ''}`}>
                  <div className="mb-3 flex items-baseline justify-between">
                    <h2 className="text-base font-semibold">{name} <span className="ml-1 text-sm font-normal text-slate-500">{shortDate(addDays(weekStart, day))}{isToday && ' · today'}</span></h2>
                    <span className="text-sm text-slate-500">{d.count ? <>Day cost <b className="text-ink">{formatINR(d.additionalCost)}</b> to buy · {formatINR(d.totalCost)} value</> : 'Nothing planned'}</span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    {SLOTS.map((slot) => {
                      const e = cell(day, slot);
                      if (!e) return (
                        <button key={slot.key} onClick={() => setTarget({ day, slot: slot.key })} className="flex min-h-[5.5rem] flex-col items-start justify-center gap-1 rounded-xl border border-dashed border-slate-300 px-3 py-2 text-left text-sm text-slate-500 hover:border-emerald-500 hover:bg-forest-50">
                          <span className="text-xs">{slot.label}</span><span className="flex items-center gap-1 font-medium text-forest-700"><Plus size={14} />Add meal</span>
                        </button>
                      );
                      return (
                        <div key={slot.key} className={`flex min-h-[5.5rem] flex-col justify-between rounded-xl border px-3 py-2 ${e.exceedsBudget ? 'border-amber-300 bg-amber-50' : 'border-slate-200 bg-forest-50/50'}`}>
                          <div>
                            <div className="flex items-center justify-between text-xs text-slate-500"><span>{slot.label}</span>{e.exceedsBudget && <span className="flex items-center gap-1 font-medium text-amber-700"><AlertTriangle size={12} />Over budget</span>}</div>
                            <div className="mt-0.5 font-medium leading-snug"><span aria-hidden="true">{e.recipe.emoji}</span> {e.recipe.name}</div>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs text-slate-600">{formatINR(e.additionalCost)} to buy</span>
                            <span className="flex">
                              <button className="rounded p-1 text-slate-500 hover:bg-white" onClick={() => setViewId(e.recipe._id)} aria-label={`View ${e.recipe.name}`}><Eye size={14} /></button>
                              <button className="rounded p-1 text-slate-500 hover:bg-white" onClick={() => setTarget({ day, slot: slot.key })} aria-label={`Replace ${e.recipe.name}`}><Repeat size={14} /></button>
                              <button className="rounded p-1 text-slate-500 hover:bg-white hover:text-red-600" onClick={() => remove(e)} aria-label={`Remove ${e.recipe.name}`}><X size={14} /></button>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
          {t.mealCount === 0 && <p className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500"><CalendarDays size={16} />Pick “Add meal” on any day to start your plan.</p>}
        </>
      )}

      <Picker target={target} weekStart={weekStart} onClose={() => setTarget(null)} onPick={pick} />
      <RecipeDetail recipeId={viewId} userId={user.id} onClose={() => setViewId(null)} />
      <ConfirmModal open={clearing} title="Clear this week?" message="All meals planned for this week will be removed. Your pantry, budget and expenses are not affected." confirmLabel="Clear week" onConfirm={clear} onCancel={() => setClearing(false)} />
    </>
  );
}
