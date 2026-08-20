import api from './api';

export async function getTransactions(params) {
  const res = await api.get('/transactions', { params });
  return res.data.data;
}

export async function getCategories() {
  const res = await api.get('/transactions/meta/categories');
  return res.data.data;
}

export async function createTransaction(payload) {
  const res = await api.post('/transactions', payload);
  return res.data.data;
}

export async function updateTransaction(id, payload) {
  const res = await api.put(`/transactions/${id}`, payload);
  return res.data.data;
}

export async function deleteTransaction(id) {
  const res = await api.delete(`/transactions/${id}`);
  return res.data.data;
}
