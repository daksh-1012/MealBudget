import { useState } from 'react';
import { Clock, Users } from 'lucide-react';
import { formatINR } from '../utils/format';

const TINT = { Breakfast: 'bg-amber-100', Lunch: 'bg-forest-100', Dinner: 'bg-slate-200', Snacks: 'bg-orange-100' };

export function FoodImage({ recipe, className = 'h-36' }) {
  const [failed, setFailed] = useState(false);
  if (recipe.image && !failed) return <img src={recipe.image} alt={recipe.name} loading="lazy" onError={() => setFailed(true)} className={`w-full object-cover ${className}`} />;
  return <div className={`flex w-full items-center justify-center text-5xl ${TINT[recipe.mealCategory] || 'bg-forest-50'} ${className}`} aria-hidden="true">{recipe.emoji || '🍽️'}</div>;
}

// Default cost estimate: sum of quantity x default unit price (ignores what's in the pantry)
export const recipeCost = (r) => (r.ingredients || []).reduce((s, i) => s + Math.round(i.quantity * (i.unitPrice || 0)), 0);

export default function RecipeCard({ recipe, onClick, footer }) {
  return (
    <article className="card overflow-hidden transition-shadow hover:shadow-md">
      <button className="block w-full text-left" onClick={onClick}>
        <FoodImage recipe={recipe} />
        <div className="p-4 pb-2">
          <span className="chip bg-forest-50 text-forest-700">{recipe.mealCategory}</span>
          <h3 className="mt-2 text-lg font-semibold leading-snug">{recipe.name}</h3>
          <p className="mt-1 line-clamp-2 text-sm text-slate-500">{recipe.description}</p>
          <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Clock size={13} />{recipe.prepTime} min</span>
            <span className="flex items-center gap-1"><Users size={13} />Serves {recipe.servings}</span>
            {recipe.ingredients && <span className="ml-auto font-semibold text-ink">≈ {formatINR(recipeCost(recipe))}</span>}
          </div>
        </div>
      </button>
      {footer && <div className="px-4 pb-4 pt-2">{footer}</div>}
    </article>
  );
}
