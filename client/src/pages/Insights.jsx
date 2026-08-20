import React, { useEffect, useState } from 'react';
import { Lightbulb } from 'lucide-react';
import * as insightService from '../services/insightService';
import InsightCard from '../components/InsightCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';

export default function Insights() {
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await insightService.getInsights();
      setInsights(res.insights);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load insights.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Smart Insights</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Automatically generated from your real transaction and budget data.
        </p>
      </div>

      {loading ? (
        <LoadingSpinner label="Analyzing your spending..." />
      ) : error ? (
        <ErrorState message={error} onRetry={load} />
      ) : insights.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Lightbulb}
            title="No insights yet"
            description="Add some transactions and check back — insights update automatically."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight, idx) => (
            <InsightCard key={idx} type={insight.type} title={insight.title} message={insight.message} />
          ))}
        </div>
      )}
    </div>
  );
}
