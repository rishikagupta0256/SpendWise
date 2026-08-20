import React from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

const statusStyles = {
  normal: { bar: 'bg-emerald-500', label: 'On track', labelColor: 'text-emerald-600' },
  warning: { bar: 'bg-amber-500', label: 'Getting close', labelColor: 'text-amber-600' },
  danger: { bar: 'bg-red-500', label: 'Almost exhausted', labelColor: 'text-red-600' },
  exceeded: { bar: 'bg-red-600', label: 'Exceeded', labelColor: 'text-red-700' },
};

export default function BudgetProgress({ budget, currency, onEdit, onDelete }) {
  const style = statusStyles[budget.status] || statusStyles.normal;
  const width = Math.min(budget.percentUsed, 100);

  return (
    <div className="card p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-800">{budget.category}</p>
          <p className="text-xs text-slate-400 mt-0.5">
            {formatCurrency(budget.spent, currency)} / {formatCurrency(budget.monthlyLimit, currency)}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => onEdit(budget)} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100">
            <Pencil size={14} />
          </button>
          <button onClick={() => onDelete(budget)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50">
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      <div className="mt-3 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full ${style.bar} transition-all`} style={{ width: `${width}%` }} />
      </div>

      <div className="flex items-center justify-between mt-2">
        <span className={`text-xs font-medium ${style.labelColor}`}>{style.label}</span>
        <span className="text-xs text-slate-400">{budget.percentUsed}%</span>
      </div>
    </div>
  );
}
