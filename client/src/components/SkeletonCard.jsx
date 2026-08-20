import React from 'react';

export default function SkeletonCard({ className = '' }) {
  return <div className={`animate-pulse bg-slate-100 rounded-2xl ${className}`} />;
}
