import React, { useEffect, useState } from 'react';
import { Wallet, TrendingUp, TrendingDown, PiggyBank } from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import * as dashboardService from '../services/dashboardService';
import SummaryCard from '../components/SummaryCard';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { formatCurrency, formatDate } from '../utils/formatters';

const COLORS = ['#3d68f5', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899', '#84cc16', '#64748b'];

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const res = await dashboardService.getSummary();
      setData(res);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load dashboard data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <LoadingSpinner label="Loading your dashboard..." fullHeight />;
  if (error) return <ErrorState message={error} onRetry={load} />;
  if (!data) return null;

  const currency = user?.currency || 'INR';
  const hasCategoryData = data.spendingByCategory.length > 0;
  const hasTrendData = data.monthlyTrend.some((m) => m.income > 0 || m.expense > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
        <p className="text-sm text-slate-500 mt-0.5">Here's what's happening with your money this month.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard label="Total balance" value={formatCurrency(data.balance, currency)} icon={Wallet} tone="brand" />
        <SummaryCard
          label="Income this month"
          value={formatCurrency(data.currentMonth.income, currency)}
          changePercent={data.currentMonth.incomeChangePercent}
          icon={TrendingUp}
          tone="positive"
        />
        <SummaryCard
          label="Expenses this month"
          value={formatCurrency(data.currentMonth.expense, currency)}
          changePercent={data.currentMonth.expenseChangePercent}
          icon={TrendingDown}
          tone="negative"
        />
        <SummaryCard
          label="Savings this month"
          value={formatCurrency(data.currentMonth.savings, currency)}
          changePercent={data.currentMonth.savingsChangePercent}
          icon={PiggyBank}
          tone="brand"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Spending by category</h3>
          {hasCategoryData ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={data.spendingByCategory}
                  dataKey="total"
                  nameKey="category"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={2}
                >
                  {data.spendingByCategory.map((entry, index) => (
                    <Cell key={entry.category} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value, currency)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="No expenses yet" description="Add a transaction to see your spending breakdown." />
          )}
        </div>

        <div className="card p-5 lg:col-span-3">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">Income vs expenses (last 6 months)</h3>
          {hasTrendData ? (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(value) => formatCurrency(value, currency)} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="income" name="Income" fill="#22c55e" radius={[6, 6, 0, 0]} />
                <Bar dataKey="expense" name="Expense" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState title="Not enough data yet" description="Your trends will appear here once you add transactions." />
          )}
        </div>
      </div>

      <div className="card p-5">
        <h3 className="text-sm font-semibold text-slate-800 mb-4">Recent transactions</h3>
        {data.recentTransactions.length === 0 ? (
          <EmptyState title="No transactions yet" description="Add your first transaction to get started." />
        ) : (
          <div className="divide-y divide-slate-100">
            {data.recentTransactions.map((t) => (
              <div key={t._id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">{t.category}</p>
                  <p className="text-xs text-slate-400">
                    {t.description ? `${t.description} · ` : ''}
                    {formatDate(t.date)}
                  </p>
                </div>
                <p className={`text-sm font-semibold ${t.type === 'income' ? 'text-emerald-600' : 'text-slate-800'}`}>
                  {t.type === 'income' ? '+' : '-'}
                  {formatCurrency(t.amount, currency)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
