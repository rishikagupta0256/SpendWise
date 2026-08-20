const mongoose = require('mongoose');

const EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Education',
  'Entertainment',
  'Bills',
  'Health',
  'Travel',
  'Other',
];

const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Scholarship', 'Gift', 'Other'];

const transactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: true,
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0.01, 'Amount must be greater than 0'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 200,
      default: '',
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
  },
  { timestamps: true }
);

transactionSchema.index({ userId: 1, date: -1 });
transactionSchema.index({ userId: 1, type: 1 });
transactionSchema.index({ userId: 1, category: 1 });

transactionSchema.statics.EXPENSE_CATEGORIES = EXPENSE_CATEGORIES;
transactionSchema.statics.INCOME_CATEGORIES = INCOME_CATEGORIES;

module.exports = mongoose.model('Transaction', transactionSchema);
