import { useEffect, useState } from 'react';
import { Check, Clock, Plus, ShoppingBasket, Sparkles } from 'lucide-react';
import { Alert, BADGES, EmptyState, ErrorState, MatchRing, PageHeader, Spinner } from '../components/ui';
import { FoodImage } from '../components/RecipeCard';
import RecipeDetail from '../components/RecipeDetail';
import AddToPlan from '../components/AddToPlan';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { planApi } from '../services/api';
import { MEALS, fmtQty, formatINR, localDate, mondayOf } from '../utils/format';

export function RecommendationCard({ rec, onAdd, onView }) {
  const b = BADGES[rec.badge];
  return (
    <article className={`card overflow-hidden ${rec.affordable ? '' : 'opacity-80'}`}>
      <div className="flex flex-col sm:flex-row">
        <button className="sm:w-48 sm:shrink-0" onClick={onView} aria-label={`View ${rec.recipe.name}`}><FoodImage recipe={rec.recipe} className="h-32 sm:h-full" /></button>
        <div className="flex-1 p-4">
          <div className="flex items-start gap-3">
            <MatchRing percent={rec.matchPercent} badge={rec.badge} />
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-semibold leading-snug">{rec.recipe.name}</h3>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className={`chip ${b.chip}`}>{b.label}</span>
                <span>{rec.recipe.mealCategory}</span>
                <span className="flex items-center gap-1"><Clock size={12} />{rec.recipe.prepTime} min</span>
              </div>
            </div>
            <div className="text-right text-sm">
              <div className="text-xs text-slate-500">To buy</div>
              <div className={`font-display text-xl font-bold ${rec.additionalCost === 0 ? 'text-emerald-600' : ''}`}>{formatINR(rec.additionalCost)}</div>
            </div>
          </div>

          {rec.available.length > 0 && (
            <p className="mt-3 flex flex-wrap items-center gap-1.5 text-xs">
              <Check size={13} className="text-emerald-600" />
              {rec.available.map((a) => <span key={a.name} className="chip bg-emerald-50 text-emerald-700">{a.name}</span>)}
            </p>
          )}
          {rec.missing.length > 0 && (
            <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
              <ShoppingBasket size={13} className="text-amber-600" />
              {rec.missing.map((m) => (
                <span key={m.name} className="chip bg-amber-50 text-amber-800" title={`Need ${fmtQty(m.needed)}, have ${fmtQty(m.have)}`}>{m.name}: need {fmtQty(m.short)} · {formatINR(m.cost)}</span>
              ))}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 border-t border-slate-100 pt-3 text-xs text-slate-500">
            <span>Already owned: <b className="text-ink">{formatINR(rec.ownedCost)}</b></span>
            <span>Additional: <b className="text-ink">{formatINR(rec.additionalCost)}</b></span>
            <span>Total meal cost: <b className="text-ink">{formatINR(rec.totalCost)}</b></span>
            {!rec.affordable && <span className="chip bg-red-50 text-red-700">Over remaining budget</span>}
            {onAdd && <button className="btn btn-soft btn-sm ml-auto" onClick={onAdd}><Plus size={14} />Add to plan</button>}
          </div>
        </div>
      </div>
    </article>
  );
}

export default function Recommendations() {
  const { user } = useAuth();
  const weekStart = mondayOf(localDate());
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [meal, setMeal] = useState('');
  const [adding, setAdding] = useState(null);
  const [viewId, setViewId] = useState(null);

  useEffect(() => { const t = setTimeout(() => setDebounced(q), 250); return () => clearTimeout(t); }, [q]);
  const { data, loading, error, reload } = useFetch(() => planApi.recommend({ weekStart, mealCategory: meal || undefined, q: debounced || undefined }), [meal, debounced]);

  return (
    <>
      <PageHeader title="Recommendations" subtitle="Recipes ranked by how much of them your pantry already covers, then by what you would still need to buy." />
      <div className="mb-3"><Alert tone="info">
        How it works: this is a transparent rule-based ranking, not AI. Match % is the share of ingredients you have in a sufficient quantity. Ties are broken by lowest extra purchase cost, then lowest total cost. Costs are estimates.
      </Alert></div>
      {data && data.remaining !== null && <p className="mb-4 text-sm text-slate-600">Budget remaining this week: <b>{formatINR(data.remaining)}</b>. Recipes costing more than this to buy are marked and ranked lower.</p>}

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <input className="input max-w-xs" placeholder="Search recipes" aria-label="Search recipes" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1">
          {['', ...MEALS].map((m) => <button key={m} onClick={() => setMeal(m)} aria-pressed={meal === m} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${meal === m ? 'bg-forest-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{m || 'All'}</button>)}
        </div>
      </div>

      {loading && !data ? <Spinner label="Ranking recipes" /> : error ? <ErrorState message={error} onRetry={reload} /> : data.results.length === 0 ? (
        <EmptyState icon={Sparkles} title="No recipes to recommend" text="Try another category or search." />
      ) : (
        <div className="space-y-4">{data.results.map((r) => <RecommendationCard key={r.recipe._id} rec={r} onView={() => setViewId(r.recipe._id)} onAdd={() => setAdding(r.recipe)} />)}</div>
      )}

      <AddToPlan recipe={adding} weekStart={weekStart} onClose={() => setAdding(null)} onAdded={() => { setAdding(null); reload(); }} />
      <RecipeDetail recipeId={viewId} userId={user.id} onClose={() => setViewId(null)} />
    </>
  );
}
