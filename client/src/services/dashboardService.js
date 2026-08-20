import api from './api';

export async function getSummary() {
  const res = await api.get('/dashboard/summary');
  return res.data.data;
}
