import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { BarChart3, BookOpen, CalendarDays, ChevronsLeft, ChevronsRight, LayoutDashboard, LogOut, Menu, Package, ShoppingCart, Sparkles, Wallet, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/pantry', label: 'Pantry', icon: Package },
  { to: '/recipes', label: 'Recipes', icon: BookOpen },
  { to: '/recommendations', label: 'Recommendations', icon: Sparkles },
  { to: '/planner', label: 'Meal planner', icon: CalendarDays },
  { to: '/budget', label: 'Budget', icon: Wallet },
  { to: '/shopping', label: 'Shopping list', icon: ShoppingCart },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
];

function NavItems({ collapsed, onNavigate }) {
  return (
    <nav className="flex-1 space-y-1 px-3" aria-label="Main">
      {NAV.map(({ to, label, icon: Icon, end }) => (
        <NavLink key={to} to={to} end={end} onClick={onNavigate} title={collapsed ? label : undefined}
          className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${isActive ? 'bg-forest-700 text-white' : 'text-slate-600 hover:bg-forest-50 hover:text-forest-700'} ${collapsed ? 'justify-center' : ''}`}>
          <Icon size={18} className="shrink-0" />
          {!collapsed && <span>{label}</span>}
        </NavLink>
      ))}
    </nav>
  );
}

const Brand = ({ collapsed }) => (
  <div className={`flex items-center gap-2 px-5 py-5 ${collapsed ? 'justify-center px-0' : ''}`}>
    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-forest-700 text-lg" aria-hidden="true">🥗</span>
    {!collapsed && <span className="font-display text-xl font-bold text-forest-800">MealBudget</span>}
  </div>
);

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen lg:flex">
      {/* Desktop sidebar */}
      <aside className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-slate-200 bg-white transition-[width] lg:flex ${collapsed ? 'w-[4.5rem]' : 'w-64'}`}>
        <Brand collapsed={collapsed} />
        <NavItems collapsed={collapsed} />
        <button className="m-3 flex items-center justify-center gap-2 rounded-xl p-2 text-sm text-slate-500 hover:bg-slate-100" onClick={() => setCollapsed((c) => !c)} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {collapsed ? <ChevronsRight size={18} /> : <><ChevronsLeft size={18} />Collapse</>}
        </button>
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}>
          <div className="absolute inset-0 bg-slate-900/40" />
          <aside className="relative flex h-full w-72 flex-col bg-white shadow-xl">
            <button className="absolute right-3 top-4 rounded-lg p-1 text-slate-500 hover:bg-slate-100" onClick={() => setOpen(false)} aria-label="Close menu"><X size={20} /></button>
            <Brand />
            <NavItems onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-8">
          <button className="rounded-lg p-2 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest-100 text-sm font-bold text-forest-700">{user.name[0].toUpperCase()}</span>
              <span className="hidden text-sm font-medium sm:block">{user.name}</span>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => { logout(); navigate('/login'); }}><LogOut size={14} />Log out</button>
          </div>
        </header>
        <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-8 sm:py-8"><Outlet /></main>
      </div>
    </div>
  );
}
