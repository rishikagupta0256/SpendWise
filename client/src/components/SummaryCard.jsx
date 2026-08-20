import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function SummaryCard({ label, value, changePercent, icon: Icon, tone = 'default' }) {
  const toneStyles = {
    default: 'bg-slate-100 text-slate-600',
    positive: 'bg-emerald-50 text-emerald-600',
    negative: 'bg-red-50 text-red-600',
    brand: 'bg-brand-50 text-brand-600',
  };

  const showChange = typeof changePercent === 'number' && Number.isFinite(changePercent);
  const isUp = changePercent > 0;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-slate-500">{label}</p>
        {Icon && (
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${toneStyles[tone]}`}>
            <Icon size={18} />
          </div>
        )}
      </div>
      <p className="text-2xl font-semibold text-slate-900 tracking-tight">{value}</p>
      {showChange && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${isUp ? 'text-emerald-600' : 'text-red-500'}`}>
          {isUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          <span>{Math.abs(changePercent)}% vs last month</span>
        </div>
      )}
    </div>
  );
}
