import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-4">
      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-3">
        <AlertTriangle size={22} className="text-red-500" />
      </div>
      <h3 className="text-sm font-semibold text-slate-700">Unable to load data</h3>
      <p className="text-sm text-slate-400 mt-1 max-w-xs">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary mt-4">
          <RefreshCw size={15} /> Try again
        </button>
      )}
    </div>
  );
}
