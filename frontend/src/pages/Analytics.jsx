import { PiggyBank } from 'lucide-react';
import { ErrorState, PageHeader, Spinner, StatCard } from '../components/ui';
import { DailyBars, Donut, HBars, TrendLine } from '../components/Charts';
import useFetch from '../hooks/useFetch';
import { insightsApi } from '../services/api';
import { formatINR, localDate } from '../utils/format';

export default function Analytics() {
  const { data: a, loading, error, reload } = useFetch(() => insightsApi.analytics(localDate()), []);
  if (loading && !a) return <Spinner />;
  if (error) return <ErrorState message={error} onRetry={reload} />;
  const t = a.totals;

  return (
    <>
      <PageHeader title="Analytics" subtitle="Calculated from your own pantry, meal plans, budgets and recorded expenses." />
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Spent this week" value={formatINR(t.spent)} sub="Recorded expenses" />
        <StatCard label="Budget utilisation" value={t.utilization === null ? '—' : `${t.utilization}%`} sub={a.budget.isSet ? `of ${formatINR(a.budget.amount)}` : 'No budget set'} tone={t.exceeds ? 'danger' : 'default'} />
        <StatCard icon={PiggyBank} label="Savings from pantry" value={formatINR(a.savings)} sub="This week's planned meals" />
        <StatCard label="Pantry utilisation" value={`${a.pantry.utilization}%`} sub={`${a.pantry.used} of ${a.pantry.total} ingredients used`} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-5 lg:col-span-2"><h2 className="mb-1 text-lg font-semibold">Spending trend, last 8 weeks</h2><p className="mb-3 text-xs text-slate-500">Meal plan value is the full cost of planned recipes. Spent is what you recorded.</p><TrendLine trend={a.trend} /></section>
        <section className="card p-5"><h2 className="mb-2 text-lg font-semibold">Daily meal costs this week</h2><DailyBars days={a.daily} /></section>
        <section className="card p-5"><h2 className="mb-2 text-lg font-semibold">Pantry utilisation</h2><Donut format={(v) => `${v} items`} data={[{ name: 'Used in plan', value: a.pantry.used, color: '#10B981' }, { name: 'Not used', value: a.pantry.unused, color: '#E2E8F0' }]} /></section>
        <section className="card p-5 lg:col-span-2"><h2 className="mb-2 text-lg font-semibold">Most frequently used ingredients</h2><HBars data={a.topIngredients} /></section>
      </div>
    </>
  );
}
