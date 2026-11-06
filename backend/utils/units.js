// Every quantity is converted to a base unit (g, ml or pcs) before comparing.
// Units from different dimensions (e.g. kg vs pcs) can never be compared.
const UNITS = {
  g: { dim: 'mass', f: 1 },
  kg: { dim: 'mass', f: 1000 },
  ml: { dim: 'volume', f: 1 },
  l: { dim: 'volume', f: 1000 },
  tbsp: { dim: 'volume', f: 15 },
  tsp: { dim: 'volume', f: 5 },
  pcs: { dim: 'count', f: 1 },
};
const UNIT_LIST = Object.keys(UNITS);
const round2 = (n) => Math.round(n * 100) / 100;

const dimOf = (unit) => UNITS[unit].dim;
const toBase = (qty, unit) => qty * UNITS[unit].f;
const factor = (unit) => UNITS[unit].f;

// Convert a base quantity into a friendly display quantity/unit
function friendly(base, dim) {
  if (dim === 'mass') return base >= 1000 ? { quantity: round2(base / 1000), unit: 'kg' } : { quantity: round2(base), unit: 'g' };
  if (dim === 'volume') return base >= 1000 ? { quantity: round2(base / 1000), unit: 'l' } : { quantity: round2(base), unit: 'ml' };
  return { quantity: round2(base), unit: 'pcs' };
}
const baseUnit = (dim) => (dim === 'mass' ? 'g' : dim === 'volume' ? 'ml' : 'pcs');
const nameKey = (name) => String(name || '').trim().toLowerCase().replace(/\s+/g, ' ');

module.exports = { UNITS, UNIT_LIST, dimOf, toBase, factor, friendly, baseUnit, nameKey, round2 };
