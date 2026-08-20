import React from 'react';
import { Loader2 } from 'lucide-react';

export default function LoadingSpinner({ label = 'Loading...', fullHeight = false }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 text-slate-400 ${fullHeight ? 'h-64' : 'py-10'}`}>
      <Loader2 size={28} className="animate-spin text-brand-500" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
