import axios from 'axios';

const http = axios.create({ baseURL: import.meta.env.VITE_API_URL || '/api', timeout: 20000 });

http.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('mb_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

http.interceptors.response.use(
  (res) => res.data.data,
  (err) => {
    const status = err.response?.status;
    const isAuthCall = err.config?.url?.startsWith('/auth/login') || err.config?.url?.startsWith('/auth/register');
    if (status === 401 && !isAuthCall) window.dispatchEvent(new Event('mb:unauthorized'));
    const message = err.response?.data?.message || (err.code === 'ECONNABORTED' ? 'The server took too long to respond' : err.response ? 'Something went wrong' : 'Cannot reach the server. Check that the backend is running.');
    return Promise.reject(Object.assign(new Error(message), { status }));
  }
);

const w = (weekStart) => ({ weekStart });

export const authApi = {
  register: (b) => http.post('/auth/register', b),
  login: (b) => http.post('/auth/login', b),
  me: () => http.get('/auth/me'),
};
export const pantryApi = {
  list: (params) => http.get('/pantry', { params }),
  create: (b) => http.post('/pantry', b),
  update: (id, b) => http.put(`/pantry/${id}`, b),
  remove: (id) => http.delete(`/pantry/${id}`),
  starter: () => http.post('/pantry/starter'),
};
export const recipeApi = {
  list: (params) => http.get('/recipes', { params }),
  get: (id) => http.get(`/recipes/${id}`),
  create: (b) => http.post('/recipes', b),
  update: (id, b) => http.put(`/recipes/${id}`, b),
  remove: (id) => http.delete(`/recipes/${id}`),
};
export const planApi = {
  get: (weekStart) => http.get('/mealplan', { params: w(weekStart) }),
  setEntry: (b) => http.put('/mealplan/entry', b),
  removeEntry: (weekStart, day, slot) => http.delete('/mealplan/entry', { params: { weekStart, day, slot } }),
  clear: (weekStart) => http.delete('/mealplan', { params: w(weekStart) }),
  recommend: (params) => http.get('/recommendations', { params }),
};
export const budgetApi = {
  get: (weekStart) => http.get('/budget', { params: w(weekStart) }),
  set: (weekStart, amount) => http.put('/budget', { weekStart, amount }),
  addExpense: (b) => http.post('/budget/expenses', b),
  removeExpense: (id) => http.delete(`/budget/expenses/${id}`),
};
export const shoppingApi = {
  get: (weekStart) => http.get('/shopping', { params: w(weekStart) }),
  sync: (weekStart) => http.post('/shopping/sync', { weekStart }),
  purchase: (weekStart, itemId, purchased) => http.patch(`/shopping/items/${itemId}`, { weekStart, purchased }),
  remove: (weekStart, itemId) => http.delete(`/shopping/items/${itemId}`, { params: w(weekStart) }),
};
export const insightsApi = {
  dashboard: (date) => http.get('/dashboard', { params: { date } }),
  analytics: (date) => http.get('/analytics', { params: { date } }),
};
