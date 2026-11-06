// Money is always handled in paise (integers) and only converted for display/input.
export const formatINR = (paise = 0) => {
  const rupees = paise / 100;
  return '₹' + rupees.toLocaleString('en-IN', { minimumFractionDigits: Number.isInteger(rupees) ? 0 : 2, maximumFractionDigits: 2 });
};
export const toPaise = (rupees) => Math.round(Number(rupees || 0) * 100);
export const toRupees = (paise = 0) => paise / 100;

export const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
export const SLOTS = [
  { key: 'breakfast', label: 'Breakfast', category: 'Breakfast' },
  { key: 'lunch', label: 'Lunch', category: 'Lunch' },
  { key: 'dinner', label: 'Dinner', category: 'Dinner' },
  { key: 'snacks', label: 'Snacks (optional)', category: 'Snacks' },
];
export const UNITS = ['g', 'kg', 'ml', 'l', 'tbsp', 'tsp', 'pcs'];
export const CATEGORIES = ['Grains', 'Vegetables', 'Fruits', 'Dairy', 'Protein', 'Spices', 'Oils', 'Other'];
export const MEALS = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
export const UNIT_FACTOR = { g: 1, kg: 1000, ml: 1, l: 1000, tbsp: 15, tsp: 5, pcs: 1 };

export const fmtQty = (q) => `${Math.round(q.quantity * 100) / 100} ${q.unit}`;

// ----- dates (weeks are Monday-based "YYYY-MM-DD" strings) -----
const pad = (n) => String(n).padStart(2, '0');
const toStr = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
export const localDate = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const addDays = (s, n) => { const d = new Date(s + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return toStr(d); };
export const mondayOf = (s = localDate()) => { const d = new Date(s + 'T00:00:00Z'); return addDays(s, -((d.getUTCDay() + 6) % 7)); };
export const shortDate = (s) => new Date(s + 'T00:00:00Z').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'UTC' });
export const weekLabel = (ws) => `${shortDate(ws)} – ${shortDate(addDays(ws, 6))}`;

export const daysUntil = (iso) => Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
