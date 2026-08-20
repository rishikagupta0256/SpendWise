import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Search, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import * as transactionService from '../services/transactionService';
import TransactionModal from '../components/TransactionModal';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { formatCurrency, formatDate } from '../utils/formatters';

export default function Transactions() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const currency = user?.currency || 'INR';

  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [categories, setCategories] = useState({ expense: [], income: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [category, setCategory] = useState('');
  const [sort, setSort] = useState('-date');
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await transactionService.getTransactions({
        search: search || undefined,
        type: type || undefined,
        category: category || undefined,
        sort,
        page,
        limit: 10,
      });
      setTransactions(res.transactions);
      setPagination(res.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load transactions.');
    } finally {
      setLoading(false);
    }
  }, [search, type, category, sort, page]);

  useEffect(() => {
    transactionService.getCategories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    setPage(1);
  }, [search, type, category, sort]);

  function openAdd() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(t) {
    setEditing(t);
    setModalOpen(true);
  }

  async function handleSubmit(payload) {
    try {
      if (editing) {
        await transactionService.updateTransaction(editing._id, payload);
        showToast('Transaction updated');
      } else {
        await transactionService.createTransaction(payload);
        showToast('Transaction added');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Something went wrong', 'error');
    }
  }

  async function handleDelete() {
    try {
      await transactionService.deleteTransaction(deleteTarget._id);
      showToast('Transaction deleted');
      setDeleteTarget(null);
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not delete transaction', 'error');
    }
  }

  const allCategories = [...categories.expense, ...categories.income].filter((c, i, arr) => arr.indexOf(c) === i);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Transactions</h1>
          <p className="text-sm text-slate-500 mt-0.5">{pagination.total} total transactions</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus size={16} /> Add transaction
        </button>
      </div>

      <div className="card p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by description..."
              className="input pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select className="input sm:w-40" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">All types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
          <select className="input sm:w-44" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">All categories</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select className="input sm:w-48" value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="-date">Newest first</option>
            <option value="date">Oldest first</option>
            <option value="-amount">Amount: high to low</option>
            <option value="amount">Amount: low to high</option>
          </select>
        </div>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <LoadingSpinner label="Loading transactions..." />
        ) : error ? (
          <ErrorState message={error} onRetry={load} />
        ) : transactions.length === 0 ? (
          <EmptyState
            title="No transactions found"
            description="Try adjusting your filters, or add a new transaction."
            action={
              <button onClick={openAdd} className="btn-primary">
                <Plus size={16} /> Add transaction
              </button>
            }
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-slate-100">
                    <th className="font-medium py-3 px-5">Category</th>
                    <th className="font-medium py-3 px-5">Description</th>
                    <th className="font-medium py-3 px-5">Date</th>
                    <th className="font-medium py-3 px-5">Type</th>
                    <th className="font-medium py-3 px-5 text-right">Amount</th>
                    <th className="font-medium py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t) => (
                    <tr key={t._id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                      <td className="py-3 px-5 font-medium text-slate-800">{t.category}</td>
                      <td className="py-3 px-5 text-slate-500">{t.description || '—'}</td>
                      <td className="py-3 px-5 text-slate-500">{formatDate(t.date)}</td>
                      <td className="py-3 px-5">
                        <span
                          className={`text-xs font-medium px-2 py-1 rounded-full ${
                            t.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {t.type}
                        </span>
                      </td>
                      <td
                        className={`py-3 px-5 text-right font-semibold ${
                          t.type === 'income' ? 'text-emerald-600' : 'text-slate-800'
                        }`}
                      >
                        {t.type === 'income' ? '+' : '-'}
                        {formatCurrency(t.amount, currency)}
                      </td>
                      <td className="py-3 px-5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(t)}
                            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(t)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-slate-100">
              {transactions.map((t) => (
                <div key={t._id} className="p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{t.category}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{t.description || '—'}</p>
                      <p className="text-xs text-slate-400">{formatDate(t.date)}</p>
                    </div>
                    <p className={`text-sm font-semibold ${t.type === 'income' ? 'text-emerald-600' : 'text-slate-800'}`}>
                      {t.type === 'income' ? '+' : '-'}
                      {formatCurrency(t.amount, currency)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    <button onClick={() => openEdit(t)} className="btn-secondary flex-1 py-1.5 text-xs">
                      <Pencil size={13} /> Edit
                    </button>
                    <button onClick={() => setDeleteTarget(t)} className="btn-danger flex-1 py-1.5 text-xs">
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-slate-100">
                <p className="text-xs text-slate-400">
                  Page {pagination.page} of {pagination.totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => setPage((p) => p - 1)}
                    className="btn-secondary py-1.5 px-2.5"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    disabled={page >= pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="btn-secondary py-1.5 px-2.5"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <TransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
        initialData={editing}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete transaction?"
        message="This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
