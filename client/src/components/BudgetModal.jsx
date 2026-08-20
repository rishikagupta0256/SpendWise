import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Shopping', 'Education', 'Entertainment', 'Bills', 'Health', 'Travel', 'Other'];

const now = new Date();

const emptyForm = {
  category: '',
  monthlyLimit: '',
  month: now.getMonth() + 1,
  year: now.getFullYear(),
};

export default function BudgetModal({ open, onClose, onSubmit, initialData }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setErrors({});
      if (initialData) {
        setForm({
          category: initialData.category,
          monthlyLimit: String(initialData.monthlyLimit),
          month: initialData.month,
          year: initialData.year,
        });
      } else {
        setForm(emptyForm);
      }
    }
  }, [open, initialData]);

  if (!open) return null;

  function validate() {
    const next = {};
    if (!form.category) next.category = 'Category is required';
    if (!form.monthlyLimit || Number(form.monthlyLimit) <= 0) next.monthlyLimit = 'Limit must be greater than 0';
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
        monthlyLimit: Number(form.monthlyLimit),
        month: Number(form.month),
        year: Number(form.year),
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm px-0 sm:px-4">
      <div className="card w-full sm:max-w-md rounded-b-none sm:rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-slate-900">{initialData ? 'Edit budget' : 'Create budget'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Category</label>
            <select
              className="input"
              value={form.category}
              disabled={!!initialData}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            >
              <option value="">Select a category</option>
              {EXPENSE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
          </div>

          <div>
            <label className="label">Monthly limit</label>
            <input
              type="number"
              step="1"
              min="0"
              className="input"
              value={form.monthlyLimit}
              onChange={(e) => setForm((f) => ({ ...f, monthlyLimit: e.target.value }))}
              placeholder="e.g. 5000"
            />
            {errors.monthlyLimit && <p className="text-xs text-red-500 mt-1">{errors.monthlyLimit}</p>}
          </div>

          {!initialData && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Month</label>
                <select
                  className="input"
                  value={form.month}
                  onChange={(e) => setForm((f) => ({ ...f, month: e.target.value }))}
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      {new Date(2000, m - 1, 1).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Year</label>
                <input
                  type="number"
                  className="input"
                  value={form.year}
                  onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
                />
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="btn-primary flex-1">
              {submitting ? 'Saving...' : initialData ? 'Save changes' : 'Create budget'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
