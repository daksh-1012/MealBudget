// Weeks run Monday-Sunday and are identified by the Monday date as "YYYY-MM-DD".
const pad = (n) => String(n).padStart(2, '0');
const fmt = (d) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
const isDateStr = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(new Date(s + 'T00:00:00Z'));

function mondayOf(input) {
  const d = isDateStr(input) ? new Date(input + 'T00:00:00Z') : new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return fmt(d);
}
function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return fmt(d);
}
const dayIndex = (weekStart, dateStr) => Math.round((new Date(dateStr + 'T00:00:00Z') - new Date(weekStart + 'T00:00:00Z')) / 86400000);

module.exports = { mondayOf, addDays, dayIndex, isDateStr };
