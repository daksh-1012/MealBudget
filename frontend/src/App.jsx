import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { Spinner } from './components/ui';
import AppLayout from './layouts/AppLayout';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Pantry from './pages/Pantry';
import Recipes from './pages/Recipes';
import Recommendations from './pages/Recommendations';
import Planner from './pages/Planner';
import Budget from './pages/Budget';
import Shopping from './pages/Shopping';
import Analytics from './pages/Analytics';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user ? children : <Navigate to="/login" replace />;
}
function Guest({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  return user ? <Navigate to="/" replace /> : children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Guest><Auth mode="login" /></Guest>} />
      <Route path="/register" element={<Guest><Auth mode="register" /></Guest>} />
      <Route element={<Protected><AppLayout /></Protected>}>
        <Route index element={<Dashboard />} />
        <Route path="pantry" element={<Pantry />} />
        <Route path="recipes" element={<Recipes />} />
        <Route path="recommendations" element={<Recommendations />} />
        <Route path="planner" element={<Planner />} />
        <Route path="budget" element={<Budget />} />
        <Route path="shopping" element={<Shopping />} />
        <Route path="analytics" element={<Analytics />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
