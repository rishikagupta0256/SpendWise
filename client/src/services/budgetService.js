import api from './api';

export async function getBudgets(params) {
  const res = await api.get('/budgets', { params });
  return res.data.data;
}

export async function createBudget(payload) {
  const res = await api.post('/budgets', payload);
  return res.data.data;
}

export async function updateBudget(id, payload) {
  const res = await api.put(`/budgets/${id}`, payload);
  return res.data.data;
}

export async function deleteBudget(id) {
  const res = await api.delete(`/budgets/${id}`);
  return res.data.data;
}
