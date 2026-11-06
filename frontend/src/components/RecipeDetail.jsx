import { Clock, Pencil, Trash2, Users } from 'lucide-react';
import { Modal, ErrorState, Spinner } from './ui';
import { FoodImage, recipeCost } from './RecipeCard';
import useFetch from '../hooks/useFetch';
import { recipeApi } from '../services/api';
import { formatINR } from '../utils/format';

export default function RecipeDetail({ recipeId, userId, onClose, onEdit, onDelete }) {
  const { data: r, loading, error } = useFetch(() => (recipeId ? recipeApi.get(recipeId) : Promise.resolve(null)), [recipeId]);
  const mine = r && r.owner && r.owner === userId;
  return (
    <Modal open={!!recipeId} onClose={onClose} title={r?.name || 'Recipe'} wide>
      {loading && <Spinner />}
      {error && <ErrorState message={error} />}
      {r && !loading && (
        <div className="space-y-5">
          <div className="overflow-hidden rounded-xl"><FoodImage recipe={r} className="h-48" /></div>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600">
            <span className="chip bg-forest-50 text-forest-700">{r.mealCategory}</span>
            <span className="flex items-center gap-1"><Clock size={14} />{r.prepTime} min</span>
            <span className="flex items-center gap-1"><Users size={14} />Serves {r.servings}</span>
            <span className="ml-auto font-semibold text-ink">Estimated cost ≈ {formatINR(recipeCost(r))}</span>
          </div>
          {r.description && <p className="text-sm text-slate-600">{r.description}</p>}
          <div className="grid gap-5 sm:grid-cols-2">
            <section>
              <h3 className="mb-2 font-semibold">Ingredients</h3>
              <ul className="divide-y divide-slate-100 text-sm">
                {r.ingredients.map((i) => (
                  <li key={i.name} className="flex justify-between py-1.5"><span>{i.name}</span><span className="text-slate-500">{i.quantity} {i.unit}</span></li>
                ))}
              </ul>
            </section>
            <section>
              <h3 className="mb-2 font-semibold">Instructions</h3>
              {r.instructions.length ? <ol className="list-decimal space-y-1.5 pl-5 text-sm text-slate-700">{r.instructions.map((s, i) => <li key={i}>{s}</li>)}</ol> : <p className="text-sm text-slate-500">No instructions added.</p>}
            </section>
          </div>
          <p className="text-xs text-slate-500">Costs are estimates based on default prices. Your own pantry prices are used when you set them.</p>
          {mine && (onEdit || onDelete) && (
            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              {onEdit && <button className="btn btn-soft" onClick={() => onEdit(r)}><Pencil size={14} />Edit</button>}
              {onDelete && <button className="btn btn-ghost text-red-600" onClick={() => onDelete(r)}><Trash2 size={14} />Delete</button>}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
