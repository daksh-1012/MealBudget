import { useEffect, useState } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react';
import { addDays, mondayOf, weekLabel, localDate } from '../utils/format';

export const Spinner = ({ label = 'Loading' }) => (
  <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500" role="status">
    <Loader2 className="animate-spin" size={18} /> {label}…
  </div>
);

export const ErrorState = ({ message, onRetry }) => (
  <div className="card flex flex-col items-center gap-3 p-10 text-center">
    <AlertTriangle className="text-amber-500" />
    <p className="text-sm text-slate-600">{message}</p>
    {onRetry && <button className="btn btn-soft" onClick={onRetry}>Try again</button>}
  </div>
);

export const EmptyState = ({ icon: Icon, title, text, children }) => (
  <div className="card flex flex-col items-center gap-2 px-6 py-12 text-center">
    {Icon && <div className="mb-1 rounded-2xl bg-forest-50 p-3 text-forest-700"><Icon size={24} /></div>}
    <h3 className="text-lg font-semibold">{title}</h3>
    {text && <p className="max-w-md text-sm text-slate-500">{text}</p>}
    {children && <div className="mt-3 flex flex-wrap justify-center gap-2">{children}</div>}
  </div>
);

export const PageHeader = ({ title, subtitle, children }) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
      {subtitle && <p className="mt-1 max-w-2xl text-sm text-slate-500">{subtitle}</p>}
    </div>
    {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
  </div>
);

export function Modal({ open, onClose, title, children, wide }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-900/40 p-0 sm:items-center sm:p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div role="dialog" aria-modal="true" aria-label={title} className={`flex max-h-[92vh] w-full flex-col rounded-t-3xl bg-white shadow-xl sm:rounded-2xl ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`}>
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button className="rounded-lg p-1 text-slate-500 hover:bg-slate-100" onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

export function ConfirmModal({ open, title, message, confirmLabel = 'Delete', onConfirm, onCancel }) {
  const [busy, setBusy] = useState(false);
  const go = async () => { setBusy(true); try { await onConfirm(); } finally { setBusy(false); } };
  return (
    <Modal open={open} onClose={onCancel} title={title}>
      <p className="text-sm text-slate-600">{message}</p>
      <div className="mt-5 flex justify-end gap-2">
        <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
        <button className="btn btn-danger" onClick={go} disabled={busy}>{busy && <Loader2 size={14} className="animate-spin" />}{confirmLabel}</button>
      </div>
    </Modal>
  );
}

export const Field = ({ label, hint, error, children }) => (
  <div>
    <label className="label">{label}{children}</label>
    {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
  </div>
);

export const StatCard = ({ icon: Icon, label, value, sub, tone = 'default' }) => (
  <div className="card p-4">
    <div className="flex items-center justify-between text-sm text-slate-500">
      <span>{label}</span>
      {Icon && <Icon size={16} className={tone === 'warn' ? 'text-amber-500' : tone === 'danger' ? 'text-red-500' : 'text-forest-700'} />}
    </div>
    <div className={`mt-1 font-display text-2xl font-bold ${tone === 'danger' ? 'text-red-600' : ''}`}>{value}</div>
    {sub && <div className="mt-0.5 text-xs text-slate-500">{sub}</div>}
  </div>
);

export const ProgressBar = ({ percent }) => {
  const p = Math.max(0, Math.min(100, percent ?? 0));
  const color = percent > 100 ? 'bg-red-500' : percent >= 85 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100" role="progressbar" aria-valuenow={p} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${p}%` }} />
    </div>
  );
};

export const BADGES = {
  high: { label: 'High pantry match', ring: '#10B981', chip: 'bg-emerald-50 text-emerald-700' },
  partial: { label: 'Partial pantry match', ring: '#F59E0B', chip: 'bg-amber-50 text-amber-700' },
  low: { label: 'More ingredients required', ring: '#EF4444', chip: 'bg-red-50 text-red-700' },
};

// The signature element: a ring showing how much of a recipe the pantry already covers
export function MatchRing({ percent, badge, size = 64 }) {
  const r = (size - 8) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} title={`${percent}% of ingredients available`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E2E8F0" strokeWidth="6" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={BADGES[badge].ring} strokeWidth="6" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - percent / 100)} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-display text-sm font-bold">{percent}%</span>
    </div>
  );
}

export function WeekPicker({ weekStart, onChange }) {
  const current = mondayOf(localDate());
  return (
    <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1">
      <button className="rounded-lg p-2 hover:bg-slate-100" onClick={() => onChange(addDays(weekStart, -7))} aria-label="Previous week"><ChevronLeft size={16} /></button>
      <span className="min-w-[8.5rem] text-center text-sm font-medium">{weekLabel(weekStart)}</span>
      <button className="rounded-lg p-2 hover:bg-slate-100" onClick={() => onChange(addDays(weekStart, 7))} aria-label="Next week"><ChevronRight size={16} /></button>
      {weekStart !== current && <button className="btn btn-soft btn-sm ml-1" onClick={() => onChange(current)}>This week</button>}
    </div>
  );
}

export const Alert = ({ tone = 'warn', children }) => (
  <div className={`flex items-start gap-2 rounded-xl border px-4 py-3 text-sm ${tone === 'danger' ? 'border-red-200 bg-red-50 text-red-800' : tone === 'info' ? 'border-forest-200 bg-forest-50 text-forest-800' : 'border-amber-200 bg-amber-50 text-amber-900'}`}>
    <AlertTriangle size={16} className="mt-0.5 shrink-0" /><div>{children}</div>
  </div>
);
