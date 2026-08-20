const Transaction = require('../models/Transaction');

// @route GET /api/transactions
// Supports: search, type, category, startDate, endDate, sort, page, limit
async function getTransactions(req, res, next) {
  try {
    const {
      search,
      type,
      category,
      startDate,
      endDate,
      sort = '-date',
      page = 1,
      limit = 20,
    } = req.query;

    const query = { userId: req.user._id };

    if (type && ['income', 'expense'].includes(type)) {
      query.type = type;
    }

    if (category) {
      query.category = category;
    }

    if (search) {
      query.description = { $regex: search, $options: 'i' };
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const sortMap = {
      '-date': { date: -1 },
      date: { date: 1 },
      '-amount': { amount: -1 },
      amount: { amount: 1 },
    };
    const sortOption = sortMap[sort] || { date: -1 };

    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const skip = (pageNum - 1) * limitNum;

    const [transactions, total] = await Promise.all([
      Transaction.find(query).sort(sortOption).skip(skip).limit(limitNum),
      Transaction.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum) || 1,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

// @route GET /api/transactions/:id
async function getTransaction(req, res, next) {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, userId: req.user._id });
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    res.json({ success: true, data: { transaction } });
  } catch (err) {
    next(err);
  }
}

// @route POST /api/transactions
async function createTransaction(req, res, next) {
  try {
    const { type, amount, category, description, date } = req.body;

    const transaction = await Transaction.create({
      userId: req.user._id,
      type,
      amount: Number(amount),
      category,
      description: description || '',
      date: new Date(date),
    });

    res.status(201).json({ success: true, data: { transaction } });
  } catch (err) {
    next(err);
  }
}

// @route PUT /api/transactions/:id
async function updateTransaction(req, res, next) {
  try {
    const { type, amount, category, description, date } = req.body;

    const transaction = await Transaction.findOne({ _id: req.params.id, userId: req.user._id });
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    if (type !== undefined) transaction.type = type;
    if (amount !== undefined) transaction.amount = Number(amount);
    if (category !== undefined) transaction.category = category;
    if (description !== undefined) transaction.description = description;
    if (date !== undefined) transaction.date = new Date(date);

    await transaction.save();

    res.json({ success: true, data: { transaction } });
  } catch (err) {
    next(err);
  }
}

// @route DELETE /api/transactions/:id
async function deleteTransaction(req, res, next) {
  try {
    const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    res.json({ success: true, data: { id: req.params.id } });
  } catch (err) {
    next(err);
  }
}

// @route GET /api/transactions/meta/categories
async function getCategories(req, res, next) {
  try {
    res.json({
      success: true,
      data: {
        expense: Transaction.EXPENSE_CATEGORIES,
        income: Transaction.INCOME_CATEGORIES,
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getCategories,
};
