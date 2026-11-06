import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem('mb_token'));

  useEffect(() => {
    if (!localStorage.getItem('mb_token')) return;
    authApi.me().then((d) => setUser(d.user)).catch(() => localStorage.removeItem('mb_token')).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onUnauthorized = () => { localStorage.removeItem('mb_token'); setUser(null); };
    window.addEventListener('mb:unauthorized', onUnauthorized);
    return () => window.removeEventListener('mb:unauthorized', onUnauthorized);
  }, []);

  const value = useMemo(() => {
    const finish = (d) => { localStorage.setItem('mb_token', d.token); setUser(d.user); };
    return {
      user, loading,
      login: async (email, password) => finish(await authApi.login({ email, password })),
      register: async (name, email, password) => finish(await authApi.register({ name, email, password })),
      logout: () => { localStorage.removeItem('mb_token'); setUser(null); },
    };
  }, [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
