// Seed script: creates a demo user with several months of realistic
// transactions and budgets so the dashboard looks good immediately.
//
// Run with: npm run seed  (from the server/ directory)

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');

const DEMO_EMAIL = 'demo@spendwise.app';
const DEMO_PASSWORD = 'Demo@1234';

const EXPENSE_CATEGORIES = Transaction.EXPENSE_CATEGORIES;
const INCOME_CATEGORIES = Transaction.INCOME_CATEGORIES;

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

function randomDateInMonth(year, month, maxDay) {
  const day = randomInt(1, maxDay);
  return new Date(year, month - 1, day, randomInt(8, 22), randomInt(0, 59));
}

const descriptionsByCategory = {
  Food: ['Groceries', 'Dinner out', 'Coffee shop', 'Lunch with friends', 'Snacks'],
  Transport: ['Cab ride', 'Fuel', 'Metro card recharge', 'Bike service'],
  Shopping: ['Clothes', 'Electronics accessory', 'Online order', 'Gift for friend'],
  Education: ['Course fee', 'Books', 'Online certification'],
  Entertainment: ['Movie tickets', 'Streaming subscription', 'Concert'],
  Bills: ['Electricity bill', 'Internet bill', 'Phone recharge'],
  Health: ['Pharmacy', 'Doctor visit', 'Gym membership'],
  Travel: ['Weekend trip', 'Train tickets', 'Hotel booking'],
  Other: ['Miscellaneous', 'Cash withdrawal'],
};

async function seed() {
  await connectDB();

  console.log('Clearing existing demo data...');
  const existingDemo = await User.findOne({ email: DEMO_EMAIL });
  if (existingDemo) {
    await Transaction.deleteMany({ userId: existingDemo._id });
    await Budget.deleteMany({ userId: existingDemo._id });
    await User.deleteOne({ _id: existingDemo._id });
  }

  console.log('Creating demo user...');
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(DEMO_PASSWORD, salt);

  const user = await User.create({
    name: 'Demo User',
    email: DEMO_EMAIL,
    password: hashedPassword,
    currency: 'INR',
  });

  console.log('Generating transactions for the last 6 months...');
  const now = new Date();
  const transactions = [];

  for (let m = 5; m >= 0; m -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const year = d.getFullYear();
    const month = d.getMonth() + 1;
    const maxDay = m === 0 ? now.getDate() : new Date(year, month, 0).getDate();

    // Salary income, once per month
    transactions.push({
      userId: user._id,
      type: 'income',
      amount: randomInt(38000, 45000),
      category: 'Salary',
      description: 'Monthly salary',
      date: new Date(year, month - 1, 1, 10, 0),
    });

    // Occasional freelance/gift income
    if (Math.random() > 0.5) {
      transactions.push({
        userId: user._id,
        type: 'income',
        amount: randomInt(2000, 8000),
        category: randomChoice(['Freelance', 'Gift', 'Scholarship']),
        description: 'Extra income',
        date: randomDateInMonth(year, month, maxDay),
      });
    }

    // 15-25 expense transactions per month across categories
    const numExpenses = randomInt(15, 25);
    for (let i = 0; i < numExpenses; i += 1) {
      const category = randomChoice(EXPENSE_CATEGORIES);
      const amountRanges = {
        Food: [100, 900],
        Transport: [50, 600],
        Shopping: [300, 4000],
        Education: [500, 5000],
        Entertainment: [150, 1500],
        Bills: [500, 3000],
        Health: [200, 2500],
        Travel: [800, 6000],
        Other: [100, 1000],
      };
      const [min, max] = amountRanges[category];

      transactions.push({
        userId: user._id,
        type: 'expense',
        amount: randomInt(min, max),
        category,
        description: randomChoice(descriptionsByCategory[category]),
        date: randomDateInMonth(year, month, maxDay),
      });
    }
  }

  await Transaction.insertMany(transactions);
  console.log(`Created ${transactions.length} transactions.`);

  console.log('Creating budgets for the current month...');
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  const budgetDefs = [
    { category: 'Food', monthlyLimit: 8000 },
    { category: 'Transport', monthlyLimit: 3000 },
    { category: 'Shopping', monthlyLimit: 5000 },
    { category: 'Entertainment', monthlyLimit: 2500 },
    { category: 'Bills', monthlyLimit: 4000 },
  ];

  await Budget.insertMany(
    budgetDefs.map((b) => ({
      userId: user._id,
      category: b.category,
      monthlyLimit: b.monthlyLimit,
      month: currentMonth,
      year: currentYear,
    }))
  );

  console.log('\nSeed complete!');
  console.log('----------------------------------------');
  console.log('Demo login credentials:');
  console.log(`  Email:    ${DEMO_EMAIL}`);
  console.log(`  Password: ${DEMO_PASSWORD}`);
  console.log('----------------------------------------');

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
