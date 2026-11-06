import { useEffect, useState } from 'react';
import { BookOpen, Plus, Search } from 'lucide-react';
import { ConfirmModal, EmptyState, ErrorState, PageHeader, Spinner } from '../components/ui';
import RecipeCard from '../components/RecipeCard';
import RecipeDetail from '../components/RecipeDetail';
import RecipeForm from '../components/RecipeForm';
import useFetch from '../hooks/useFetch';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { recipeApi } from '../services/api';
import { MEALS } from '../utils/format';

export default function Recipes() {
  const { user } = useAuth();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [meal, setMeal] = useState('');
  const [viewId, setViewId] = useState(null);
  const [editing, setEditing] = useState(undefined);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => { const t = setTimeout(() => setDebounced(q), 250); return () => clearTimeout(t); }, [q]);
  const { data: recipes, loading, error, reload } = useFetch(() => recipeApi.list({ q: debounced || undefined, mealCategory: meal || undefined }), [debounced, meal]);

  const remove = async () => {
    try { await recipeApi.remove(deleting._id); toast.success('Recipe deleted'); setDeleting(null); setViewId(null); reload(); } catch (e) { toast.error(e.message); setDeleting(null); }
  };

  return (
    <>
      <PageHeader title="Recipes" subtitle="Built-in Indian recipes plus your own. Costs are estimates from default ingredient prices.">
        <button className="btn btn-primary" onClick={() => setEditing(null)}><Plus size={16} />Add recipe</button>
      </PageHeader>

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[12rem] flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search recipes" aria-label="Search recipes" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1" role="tablist" aria-label="Meal category">
          {['', ...MEALS].map((m) => (
            <button key={m} role="tab" aria-selected={meal === m} onClick={() => setMeal(m)} className={`rounded-lg px-3 py-1.5 text-sm font-medium ${meal === m ? 'bg-forest-700 text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{m || 'All'}</button>
          ))}
        </div>
      </div>

      {loading && !recipes ? <Spinner /> : error ? <ErrorState message={error} onRetry={reload} /> : recipes.length === 0 ? (
        <EmptyState icon={BookOpen} title="No recipes found" text="Try another search, or add your own recipe."><button className="btn btn-primary" onClick={() => setEditing(null)}>Add recipe</button></EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {recipes.map((r) => <RecipeCard key={r._id} recipe={r} onClick={() => setViewId(r._id)} />)}
        </div>
      )}

      <RecipeDetail recipeId={viewId} userId={user.id} onClose={() => setViewId(null)} onEdit={(r) => { setViewId(null); setEditing(r); }} onDelete={(r) => setDeleting(r)} />
      <RecipeForm open={editing !== undefined} recipe={editing} onClose={() => setEditing(undefined)} onSaved={() => { setEditing(undefined); reload(); }} />
      <ConfirmModal open={!!deleting} title="Delete recipe?" message={`${deleting?.name} will be deleted. Meals already planned with it will disappear from your weekly plan.`} onConfirm={remove} onCancel={() => setDeleting(null)} />
    </>
  );
}
