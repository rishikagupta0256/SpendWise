import React from 'react';
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';

const styles = {
  danger: { bg: 'bg-red-50', border: 'border-red-100', icon: XCircle, iconColor: 'text-red-500' },
  warning: { bg: 'bg-amber-50', border: 'border-amber-100', icon: AlertTriangle, iconColor: 'text-amber-500' },
  success: { bg: 'bg-emerald-50', border: 'border-emerald-100', icon: CheckCircle2, iconColor: 'text-emerald-500' },
  info: { bg: 'bg-brand-50', border: 'border-brand-100', icon: Info, iconColor: 'text-brand-500' },
};

export default function InsightCard({ type = 'info', title, message }) {
  const style = styles[type] || styles.info;
  const Icon = style.icon;

  return (
    <div className={`rounded-2xl border ${style.border} ${style.bg} p-4 flex gap-3`}>
      <Icon size={18} className={`${style.iconColor} shrink-0 mt-0.5`} />
      <div>
        <h4 className="text-sm font-semibold text-slate-800">{title}</h4>
        <p className="text-sm text-slate-600 mt-0.5">{message}</p>
      </div>
    </div>
  );
}
