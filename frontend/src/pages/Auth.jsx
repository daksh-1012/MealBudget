import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Auth({ mode }) {
  const isLogin = mode === 'login';
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setErr('');
    if (!isLogin && f.password.length < 8) return setErr('Password must be at least 8 characters');
    setBusy(true);
    try {
      if (isLogin) await login(f.email, f.password); else await register(f.name.trim(), f.email, f.password);
      navigate('/', { replace: true });
    } catch (e2) { setErr(e2.message); } finally { setBusy(false); }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="hidden flex-col justify-between bg-forest-700 p-12 text-white lg:flex">
        <div className="flex items-center gap-2 font-display text-2xl font-bold"><span aria-hidden="true">🥗</span> MealBudget</div>
        <div>
          <h2 className="max-w-md text-4xl font-bold leading-tight">Cook what you already have. Buy only what you need.</h2>
          <p className="mt-4 max-w-md text-forest-100">Plan a week of meals against a real budget. MealBudget checks your pantry quantities, shows what is missing and what it will cost in rupees.</p>
        </div>
        <div className="flex items-center gap-4 rounded-2xl bg-white/10 p-4 text-sm">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-emerald-400 font-display font-bold">73%</div>
          <p>Example: Dal Rice with 8 of 11 ingredients on hand. Missing garlic, ghee and coriander, about ₹13 to buy.</p>
        </div>
      </section>
      <section className="flex items-center justify-center p-6 sm:p-12">
        <form onSubmit={submit} className="w-full max-w-sm space-y-4" noValidate>
          <h1 className="text-3xl font-bold">{isLogin ? 'Welcome back' : 'Create your account'}</h1>
          <p className="text-sm text-slate-500">{isLogin ? 'Log in to see this week’s plan.' : 'Start planning meals within your budget.'}</p>
          {!isLogin && <div><label className="label" htmlFor="name">Name</label><input id="name" className="input" value={f.name} onChange={set('name')} required autoComplete="name" /></div>}
          <div><label className="label" htmlFor="email">Email</label><input id="email" type="email" className="input" value={f.email} onChange={set('email')} required autoComplete="email" /></div>
          <div><label className="label" htmlFor="password">Password</label><input id="password" type="password" className="input" value={f.password} onChange={set('password')} required autoComplete={isLogin ? 'current-password' : 'new-password'} />
            {!isLogin && <p className="mt-1 text-xs text-slate-500">At least 8 characters.</p>}</div>
          {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{err}</p>}
          <button className="btn btn-primary w-full" disabled={busy}>{busy && <Loader2 size={14} className="animate-spin" />}{isLogin ? 'Log in' : 'Create account'}</button>
          <p className="text-center text-sm text-slate-500">
            {isLogin ? 'New to MealBudget? ' : 'Already have an account? '}
            <Link className="font-semibold text-forest-700 hover:underline" to={isLogin ? '/register' : '/login'}>{isLogin ? 'Create an account' : 'Log in'}</Link>
          </p>
        </form>
      </section>
    </div>
  );
}
