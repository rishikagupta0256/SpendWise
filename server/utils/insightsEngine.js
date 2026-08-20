const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');

function monthRange(year, month) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);
  return { start, end };
}

function round(n) {
  return Math.round(n * 100) / 100;
}

// Deterministic insight generator - no external AI, purely calculated
// from the user's own transactions and budgets.
async function generateInsights(userId) {
  const insights = [];
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  const { start: curStart, end: curEnd } = monthRange(year, month);
  const prevDate = new Date(year, month - 2, 1);
  const { start: prevStart, end: prevEnd } = monthRange(prevDate.getFullYear(), prevDate.getMonth() + 1);

  const [curExpenses, prevExpenses, curIncomeAgg] = await Promise.all([
    Transaction.find({ userId, type: 'expense', date: { $gte: curStart, $lt: curEnd } }),
    Transaction.find({ userId, type: 'expense', date: { $gte: prevStart, $lt: prevEnd } }),
    Transaction.aggregate([
      { $match: { userId, type: 'income', date: { $gte: curStart, $lt: curEnd } } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
  ]);

  if (curExpenses.length === 0 && prevExpenses.length === 0) {
    insights.push({
      type: 'info',
      title: 'Not enough data yet',
      message: 'Add a few transactions and SpendWise will start surfacing insights about your spending.',
    });
    return insights;
  }

  const curTotal = curExpenses.reduce((s, t) => s + t.amount, 0);
  const prevTotal = prevExpenses.reduce((s, t) => s + t.amount, 0);
  const curIncome = curIncomeAgg.length ? curIncomeAgg[0].total : 0;

  // 1. Overall spending change vs last month
  if (prevTotal > 0) {
    const change = round(((curTotal - prevTotal) / prevTotal) * 100);
    if (Math.abs(change) >= 5) {
      insights.push({
        type: change > 0 ? 'warning' : 'success',
        title: change > 0 ? 'Spending increased' : 'Spending decreased',
        message: `Your overall spending ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change)}% compared with last month.`,
      });
    }
  }

  // 2. Category breakdown, current month
  const categoryTotals = {};
  curExpenses.forEach((t) => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
  });
  const sortedCategories = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);

  if (sortedCategories.length > 0 && curTotal > 0) {
    const [topCategory, topAmount] = sortedCategories[0];
    const share = round((topAmount / curTotal) * 100);
    insights.push({
      type: 'info',
      title: `${topCategory} is your top category`,
      message: `${topCategory} accounts for ${share}% of your spending this month.`,
    });
  }

  // 3. Category change vs last month, for top few categories
  const prevCategoryTotals = {};
  prevExpenses.forEach((t) => {
    prevCategoryTotals[t.category] = (prevCategoryTotals[t.category] || 0) + t.amount;
  });

  sortedCategories.slice(0, 3).forEach(([category, amount]) => {
    const prevAmount = prevCategoryTotals[category] || 0;
    if (prevAmount > 0) {
      const change = round(((amount - prevAmount) / prevAmount) * 100);
      if (Math.abs(change) >= 15) {
        insights.push({
          type: change > 0 ? 'warning' : 'success',
          title: `${category} spending ${change > 0 ? 'up' : 'down'}`,
          message: `Your ${category.toLowerCase()} spending ${change > 0 ? 'increased' : 'decreased'} by ${Math.abs(change)}% compared with last month.`,
        });
      }
    }
  });

  // 4. Budget status
  const budgets = await Budget.find({ userId, month, year });
  for (const budget of budgets) {
    const spent = categoryTotals[budget.category] || 0;
    const percentUsed = budget.monthlyLimit > 0 ? round((spent / budget.monthlyLimit) * 100) : 0;

    if (percentUsed > 100) {
      insights.push({
        type: 'danger',
        title: `${budget.category} budget exceeded`,
        message: `You have exceeded your ${budget.category} budget by ${round(percentUsed - 100)}%.`,
      });
    } else if (percentUsed >= 90) {
      insights.push({
        type: 'danger',
        title: `${budget.category} budget almost exhausted`,
        message: `You have used ${percentUsed}% of your ${budget.category} budget.`,
      });
    } else if (percentUsed >= 70) {
      insights.push({
        type: 'warning',
        title: `${budget.category} budget getting close`,
        message: `You have used ${percentUsed}% of your ${budget.category} budget.`,
      });
    }
  }

  // 5. Expenses exceed income
  if (curIncome > 0 && curTotal > curIncome) {
    insights.push({
      type: 'danger',
      title: 'Expenses exceed income',
      message: `Your expenses this month (₹${round(curTotal)}) are higher than your income (₹${round(curIncome)}).`,
    });
  }

  // 6. Average daily spending
  if (curExpenses.length > 0) {
    const dayOfMonth = now.getDate();
    const avgDaily = round(curTotal / dayOfMonth);
    insights.push({
      type: 'info',
      title: 'Average daily spending',
      message: `You are spending an average of ₹${avgDaily} per day so far this month.`,
    });
  }

  // 7. Largest transaction this month
  if (curExpenses.length > 0) {
    const largest = curExpenses.reduce((max, t) => (t.amount > max.amount ? t : max), curExpenses[0]);
    insights.push({
      type: 'info',
      title: 'Largest transaction',
      message: `Your largest expense this month was ₹${round(largest.amount)} on ${largest.category}${
        largest.description ? ` (${largest.description})` : ''
      }.`,
    });
  }

  // 8. Weekend vs weekday spending
  if (curExpenses.length >= 4) {
    let weekend = 0;
    let weekday = 0;
    let weekendDays = 0;
    let weekdayDays = 0;
    const seenWeekendDates = new Set();
    const seenWeekdayDates = new Set();

    curExpenses.forEach((t) => {
      const day = new Date(t.date).getDay();
      const dateKey = new Date(t.date).toDateString();
      if (day === 0 || day === 6) {
        weekend += t.amount;
        if (!seenWeekendDates.has(dateKey)) {
          seenWeekendDates.add(dateKey);
          weekendDays += 1;
        }
      } else {
        weekday += t.amount;
        if (!seenWeekdayDates.has(dateKey)) {
          seenWeekdayDates.add(dateKey);
          weekdayDays += 1;
        }
      }
    });

    const avgWeekend = weekendDays > 0 ? weekend / weekendDays : 0;
    const avgWeekday = weekdayDays > 0 ? weekday / weekdayDays : 0;

    if (avgWeekend > 0 && avgWeekday > 0) {
      if (avgWeekend > avgWeekday * 1.2) {
        insights.push({
          type: 'info',
          title: 'Weekend spending is higher',
          message: 'You tend to spend more per day on weekends than on weekdays.',
        });
      } else if (avgWeekday > avgWeekend * 1.2) {
        insights.push({
          type: 'info',
          title: 'Weekday spending is higher',
          message: 'You tend to spend more per day on weekdays than on weekends.',
        });
      }
    }
  }

  return insights;
}

module.exports = { generateInsights };
