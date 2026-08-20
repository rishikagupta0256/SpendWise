import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { toInputDate } from '../utils/formatters';

const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Shopping', 'Education', 'Entertainment', 'Bills', 'Health', 'Travel', 'Other'];
const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Scholarship', 'Gift', 'Other'];

const emptyForm = {
  type: 'expense',
  amount: '',
  category: '',
  description: '',
  date: toInputDate(new Date()),
};

export default function TransactionModal({ open, onClose, onSubmit, initialData }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setErrors({});
      if (initialData) {
        setForm({
          type: initialData.type,
          amount: String(initialData.amount),
          category: initialData.category,
          description: initialData.description || '',
          date: toInputDate(initialData.date),
        });
      } else {
        setForm(emptyForm);
      }
    }
  }, [open, initialData]);

  if (!open) return null;

  const categories = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  function validate() {
    const next = {};
    if (!form.amount || Number(form.amount) <= 0) next.amount = 'Amount must be greater than 0';
    if (!form.category) next.category = 'Category is required';
    if (!form.date) next.date = 'Date is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      await onSubmit({
        ...form,
        amount: Number(form.amount),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm px-0 sm:px-4">
      <div className="card w-full sm:max-w-md rounded-b-none sm:rounded-2xl p-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-slate-900">
            {initialData ? 'Edit transaction' : 'Add transaction'}
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {['expense', 'income'].map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setForm((f) => ({ ...f, type: t, category: '' }))}
                className={`py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                  form.type === t
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {t === 'expense' ? 'Expense' : 'Income'}
              </button>
            ))}
          </div>

          <div>
            <label className="label">Amount</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="input"
              value={form.amount}
              onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
              placeholder="0.00"
            />
            {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
          </div>

          <div>
            <label className="label">Category</label>
            <select
              className="input"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            >
              <option value="">Select a category</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
          </div>

          <div>
            <label className="label">Description (optional)</label>
            <input
              type="text"
              className="input"
              maxLength={200}
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="e.g. Dinner with friends"
            />
          </div>

          <div>
            <label className="label">Date</label>
            <input
              type="date"
              className="input"
              value={form.date}
              onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            />
            {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
          </div>

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1">
              {submitting ? 'Saving...' : initialData ? 'Save changes' : 'Add transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
