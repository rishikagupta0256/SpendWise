const Transaction = require('../models/Transaction');

function monthRange(year, month) {
  // month is 1-12
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return { start, end };
}

async function sumByType(userId, start, end, type) {
  const agg = await Transaction.aggregate([
    { $match: { userId, type, date: { $gte: start, $lt: end } } },
    { $group: { _id: null, total: { $sum: '$amount' } } },
  ]);
  return agg.length ? agg[0].total : 0;
}

function percentChange(current, previous) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

// @route GET /api/dashboard/summary
async function getSummary(req, res, next) {
  try {
    const userId = req.user._id;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const { start: curStart, end: curEnd } = monthRange(year, month);
    const prevMonthDate = new Date(year, month - 2, 1);
    const { start: prevStart, end: prevEnd } = monthRange(prevMonthDate.getFullYear(), prevMonthDate.getMonth() + 1);

    const [curIncome, curExpense, prevIncome, prevExpense, allIncome, allExpense] = await Promise.all([
      sumByType(userId, curStart, curEnd, 'income'),
      sumByType(userId, curStart, curEnd, 'expense'),
      sumByType(userId, prevStart, prevEnd, 'income'),
      sumByType(userId, prevStart, prevEnd, 'expense'),
      sumByType(userId, new Date(0), new Date(8640000000000000), 'income'),
      sumByType(userId, new Date(0), new Date(8640000000000000), 'expense'),
    ]);

    const balance = allIncome - allExpense;
    const savings = curIncome - curExpense;
    const prevSavings = prevIncome - prevExpense;

    // Spending by category (current month, expenses only)
    const byCategory = await Transaction.aggregate([
      { $match: { userId, type: 'expense', date: { $gte: curStart, $lt: curEnd } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
    ]);

    // Monthly trend - last 6 months, income vs expense
    const trend = [];
    for (let i = 5; i >= 0; i -= 1) {
      const d = new Date(year, month - 1 - i, 1);
      const { start, end } = monthRange(d.getFullYear(), d.getMonth() + 1);
      const [inc, exp] = await Promise.all([
        sumByType(userId, start, end, 'income'),
        sumByType(userId, start, end, 'expense'),
      ]);
      trend.push({
        label: d.toLocaleString('default', { month: 'short', year: '2-digit' }),
        month: d.getMonth() + 1,
        year: d.getFullYear(),
        income: inc,
        expense: exp,
      });
    }

    const recentTransactions = await Transaction.find({ userId }).sort({ date: -1 }).limit(5);

    res.json({
      success: true,
      data: {
        balance,
        currentMonth: {
          income: curIncome,
          expense: curExpense,
          savings,
          incomeChangePercent: percentChange(curIncome, prevIncome),
          expenseChangePercent: percentChange(curExpense, prevExpense),
          savingsChangePercent: percentChange(savings, prevSavings),
        },
        spendingByCategory: byCategory.map((c) => ({ category: c._id, total: c.total })),
        monthlyTrend: trend,
        recentTransactions,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getSummary, monthRange, sumByType, percentChange };
