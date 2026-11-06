import { Link } from 'react-router-dom';
import { Activity, CalendarCheck, Package, PiggyBank, ShoppingBasket, Sparkles, Wallet } from 'lucide-react';
import { Alert, EmptyState, ErrorState, PageHeader, ProgressBar, Spinner, StatCard } from '../components/ui';
import { DailyBars, Donut } from '../components/Charts';
import { RecommendationCard } from './Recommendations';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { insightsApi } from '../services/api';
import { DAYS, SLOTS, formatINR, localDate, weekLabel } from '../utils/format';

export default function Dashboard() {
  const { user } = useAuth();
  const { data: d, loading, error, reload } = useFetch(() => insightsApi.dashboard(localDate()), []);
  if (loading && !d) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const t = d.totals;

  return (
    <>
      <PageHeader title={`Hello, ${user.name.split(' ')[0]}`} subtitle={`Your week: ${weekLabel(d.weekStart)}`}>
        <Link to="/planner" className="btn btn-primary">Open planner</Link>
      </PageHeader>

      {!d.budget.isSet && <div className="mb-4"><Alert tone="warn">You have not set a budget for this week. <Link className="font-semibold underline" to="/budget">Set your weekly budget</Link> to track remaining spend.</Alert></div>}
      {t.exceeds && <div className="mb-4"><Alert tone="danger">You are {formatINR(-t.remaining)} over this week’s budget. Review the <Link className="font-semibold underline" to="/planner">meal plan</Link> for cheaper options.</Alert></div>}

      <section className="card mb-4 p-5">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm text-slate-500">Remaining this week</p>
            <p className={`font-display text-4xl font-bold ${t.exceeds ? 'text-red-600' : 'text-forest-700'}`}>{t.remaining === null ? '—' : formatINR(t.remaining)}</p>
          </div>
          <div className="flex gap-8 text-sm">
            <div><p className="text-slate-500">Weekly budget</p><b>{d.budget.isSet ? formatINR(d.budget.amount) : 'Not set'}</b></div>
            <div><p className="text-slate-500">Estimated expenditure</p><b>{formatINR(t.committed)}</b></div>
          </div>
        </div>
        {d.budget.isSet && <div className="mt-4"><ProgressBar percent={t.utilization} /><p className="mt-1 text-xs text-slate-500">{t.utilization}% of budget utilised · spent {formatINR(t.spent)} + still to buy {formatINR(t.toBuy)}</p></div>}
      </section>

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={CalendarCheck} label="Planned meals" value={t.mealCount} sub="This week" />
        <StatCard icon={Package} label="Pantry ingredients" value={d.pantryCount} sub={`${d.lowStock} low · ${d.expiringSoon} expiring soon`} tone={d.lowStock + d.expiringSoon > 0 ? 'warn' : 'default'} />
        <StatCard icon={PiggyBank} label="Saved by using pantry" value={formatINR(t.savings)} sub="Value of ingredients you already own" />
        <StatCard icon={ShoppingBasket} label="Still to buy" value={formatINR(t.toBuy)} sub="Estimate for planned meals" />
      </div>

      {d.pantryCount === 0 && <div className="mb-6"><EmptyState icon={Package} title="Start with your pantry" text="Add the ingredients you have at home so MealBudget can recommend meals you can cook with little or no shopping."><Link to="/pantry" className="btn btn-primary">Go to pantry</Link></EmptyState></div>}

      <div className="mb-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <section className="card p-5"><h2 className="mb-2 text-lg font-semibold">Meal cost by day</h2><DailyBars days={d.daily} /></section>
        <section className="card p-5">
          <h2 className="mb-2 text-lg font-semibold">Budget distribution</h2>
          {d.budget.isSet ? <Donut data={[{ name: 'Spent', value: d.distribution.spent, color: '#166534' }, { name: 'Still to buy', value: d.distribution.toBuy, color: '#F59E0B' }, { name: 'Remaining', value: d.distribution.remaining, color: '#BBF7D0' }]} /> : <p className="py-16 text-center text-sm text-slate-500">Set a weekly budget to see how it is split.</p>}
        </section>
      </div>

      <section className="mb-6">
        <div className="mb-3 flex items-center justify-between"><h2 className="flex items-center gap-2 text-lg font-semibold"><Sparkles size={18} className="text-emerald-600" />Cook with what you have</h2><Link to="/recommendations" className="text-sm font-semibold text-forest-700 hover:underline">See all</Link></div>
        <div className="space-y-3">{d.recommended.map((r) => <RecommendationCard key={r.recipe._id} rec={r} />)}</div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-3 text-lg font-semibold">Upcoming meals</h2>
          {d.upcoming.length === 0 ? <p className="text-sm text-slate-500">No meals planned for the rest of this week. <Link to="/planner" className="font-semibold text-forest-700 underline">Plan a meal</Link></p> : (
            <ul className="divide-y divide-slate-100">
              {d.upcoming.map((e) => (
                <li key={e.entryId} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="text-xl" aria-hidden="true">{e.recipe.emoji}</span>
                  <span className="flex-1"><b className="font-medium">{e.recipe.name}</b><span className="block text-xs text-slate-500">{e.day === d.today ? 'Today' : DAYS[e.day]} · {SLOTS.find((s) => s.key === e.slot).label.replace(' (optional)', '')}</span></span>
                  <span className="text-xs text-slate-500">{formatINR(e.additionalCost)} to buy</span>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section className="card p-5">
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold"><Activity size={18} className="text-slate-400" />Recent activity</h2>
          {d.activity.length === 0 ? <p className="text-sm text-slate-500">Activity from your pantry, plan and spending will show up here.</p> : (
            <ul className="divide-y divide-slate-100">
              {d.activity.map((a, i) => (
                <li key={i} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="flex items-center gap-2">{a.type === 'expense' ? <Wallet size={14} className="text-forest-700" /> : a.type === 'pantry' ? <Package size={14} className="text-emerald-600" /> : <CalendarCheck size={14} className="text-amber-600" />}{a.text}{a.amount ? <b className="ml-1">{formatINR(a.amount)}</b> : null}</span>
                  <span className="shrink-0 text-xs text-slate-500">{new Date(a.at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
