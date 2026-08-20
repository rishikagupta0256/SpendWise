const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');

function getStatus(percentUsed) {
  if (percentUsed > 100) return 'exceeded';
  if (percentUsed >= 90) return 'danger';
  if (percentUsed >= 70) return 'warning';
  return 'normal';
}

// Attaches spent / remaining / percentUsed / status to each budget,
// calculated live from actual transactions rather than stored redundantly.
async function attachSpending(budgets, userId) {
  const results = await Promise.all(
    budgets.map(async (budget) => {
      const start = new Date(budget.year, budget.month - 1, 1);
      const end = new Date(budget.year, budget.month, 1);

      const agg = await Transaction.aggregate([
        {
          $match: {
            userId,
            type: 'expense',
            category: budget.category,
            date: { $gte: start, $lt: end },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);

      const spent = agg.length ? agg[0].total : 0;
      const percentUsed = budget.monthlyLimit > 0 ? Math.round((spent / budget.monthlyLimit) * 1000) / 10 : 0;

      return {
        _id: budget._id,
        userId: budget.userId,
        category: budget.category,
        monthlyLimit: budget.monthlyLimit,
        month: budget.month,
        year: budget.year,
        createdAt: budget.createdAt,
        updatedAt: budget.updatedAt,
        spent,
        remaining: Math.max(budget.monthlyLimit - spent, budget.monthlyLimit - spent), // can go negative if exceeded
        percentUsed,
        status: getStatus(percentUsed),
      };
    })
  );
  return results;
}

// @route GET /api/budgets?month=&year=
async function getBudgets(req, res, next) {
  try {
    const now = new Date();
    const month = parseInt(req.query.month, 10) || now.getMonth() + 1;
    const year = parseInt(req.query.year, 10) || now.getFullYear();

    const budgets = await Budget.find({ userId: req.user._id, month, year }).sort({ category: 1 });
    const withSpending = await attachSpending(budgets, req.user._id);

    const totals = withSpending.reduce(
      (acc, b) => {
        acc.totalBudget += b.monthlyLimit;
        acc.totalSpent += b.spent;
        return acc;
      },
      { totalBudget: 0, totalSpent: 0 }
    );
    totals.totalRemaining = totals.totalBudget - totals.totalSpent;

    res.json({ success: true, data: { budgets: withSpending, totals, month, year } });
  } catch (err) {
    next(err);
  }
}

// @route POST /api/budgets
async function createBudget(req, res, next) {
  try {
    const { category, monthlyLimit, month, year } = req.body;

    const existing = await Budget.findOne({
      userId: req.user._id,
      category,
      month: Number(month),
      year: Number(year),
    });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A budget for ${category} already exists for that month`,
      });
    }

    const budget = await Budget.create({
      userId: req.user._id,
      category,
      monthlyLimit: Number(monthlyLimit),
      month: Number(month),
      year: Number(year),
    });

    const [withSpending] = await attachSpending([budget], req.user._id);

    res.status(201).json({ success: true, data: { budget: withSpending } });
  } catch (err) {
    next(err);
  }
}

// @route PUT /api/budgets/:id
async function updateBudget(req, res, next) {
  try {
    const { monthlyLimit, category } = req.body;

    const budget = await Budget.findOne({ _id: req.params.id, userId: req.user._id });
    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }

    if (monthlyLimit !== undefined) budget.monthlyLimit = Number(monthlyLimit);
    if (category !== undefined) budget.category = category;

    await budget.save();

    const [withSpending] = await attachSpending([budget], req.user._id);

    res.json({ success: true, data: { budget: withSpending } });
  } catch (err) {
    next(err);
  }
}

// @route DELETE /api/budgets/:id
async function deleteBudget(req, res, next) {
  try {
    const budget = await Budget.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget not found' });
    }
    res.json({ success: true, data: { id: req.params.id } });
  } catch (err) {
    next(err);
  }
}

module.exports = { getBudgets, createBudget, updateBudget, deleteBudget };
