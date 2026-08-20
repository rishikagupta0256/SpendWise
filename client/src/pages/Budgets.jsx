import React, { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import * as budgetService from '../services/budgetService';
import BudgetModal from '../components/BudgetModal';
import BudgetProgress from '../components/BudgetProgress';
import ConfirmDialog from '../components/ConfirmDialog';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { formatCurrency } from '../utils/formatters';
import { PiggyBank } from 'lucide-react';

export default function Budgets() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const currency = user?.currency || 'INR';

  const [budgets, setBudgets] = useState([]);
  const [totals, setTotals] = useState({ totalBudget: 0, totalSpent: 0, totalRemaining: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await budgetService.getBudgets();
      setBudgets(res.budgets);
      setTotals(res.totals);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load budgets.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openAdd() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(b) {
    setEditing(b);
    setModalOpen(true);
  }

  async function handleSubmit(payload) {
    try {
      if (editing) {
        await budgetService.updateBudget(editing._id, payload);
        showToast('Budget updated');
      } else {
        await budgetService.createBudget(payload);
        showToast('Budget created');
      }
      setModalOpen(false);
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Something went wrong', 'error');
    }
  }

  async function handleDelete() {
    try {
      await budgetService.deleteBudget(deleteTarget._id);
      showToast('Budget deleted');
      setDeleteTarget(null);
      load();
    } catch (err) {
      showToast(err.response?.data?.message || 'Could not delete budget', 'error');
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Budgets</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track spending against your monthly limits.</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <Plus size={16} /> New budget
        </button>
      </div>

      {!loading && !error && budgets.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card p-4">
            <p className="text-sm text-slate-500">Total budget</p>
            <p className="text-xl font-semibold text-slate-900 mt-1">{formatCurrency(totals.totalBudget, currency)}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-slate-500">Total spent</p>
            <p className="text-xl font-semibold text-slate-900 mt-1">{formatCurrency(totals.totalSpent, currency)}</p>
          </div>
          <div className="card p-4">
            <p className="text-sm text-slate-500">Remaining</p>
            <p
              className={`text-xl font-semibold mt-1 ${totals.totalRemaining < 0 ? 'text-red-600' : 'text-slate-900'}`}
            >
              {formatCurrency(totals.totalRemaining, currency)}
            </p>
          </div>
        </div>
      )}

      {loading ? (
        <LoadingSpinner label="Loading budgets..." />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : budgets.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={PiggyBank}
            title="No budgets yet"
            description="Create a budget for a category to start tracking your spending against it."
            action={
              <button onClick={openAdd} className="btn-primary">
                <Plus size={16} /> New budget
              </button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.map((b) => (
            <BudgetProgress
              key={b._id}
              budget={b}
              currency={currency}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <BudgetModal open={modalOpen} onClose={() => setModalOpen(false)} onSubmit={handleSubmit} initialData={editing} />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete budget?"
        message="This will remove the budget. Your transactions won't be affected."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
