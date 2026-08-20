# SpendWise

A full-stack personal finance and expense intelligence dashboard. Track income and expenses, set category budgets, and get automatically generated spending insights — all backed by a real MongoDB database.

## Overview

SpendWise is a MERN-stack app (MongoDB, Express, React, Node) built as a portfolio/hackathon-ready project. Every number on screen — balances, charts, budget progress, insights — comes from the database through a real REST API. Nothing is hard-coded on the frontend.

## Features

- Email/password authentication with JWT, password hashing (bcrypt), and persistent login
- Full transaction CRUD with search, type/category filters, date range, sorting, and pagination
- Budgets per category per month, with live spend/remaining/percentage calculated from transactions (not stored redundantly)
- Dashboard with balance, monthly income/expense/savings (with % change vs last month), category breakdown (pie chart), 6-month income vs. expense trend (bar chart), and recent transactions
- Deterministic "Smart Insights" engine (no external AI API) that analyzes real transactions/budgets and generates statements like "Food spending increased 18% vs last month" or "You've used 92% of your Shopping budget"
- Responsive design: collapsible mobile sidebar, card-based mobile transaction list, resizing charts
- Loading, empty, and error states throughout; toast notifications; confirm-before-delete dialogs
- Seed script that creates a demo user with 6 months of realistic transactions and budgets

## Tech Stack

**Frontend:** React 18, Vite, React Router, Tailwind CSS, Axios, Recharts, Lucide icons
**Backend:** Node.js, Express, JWT, bcryptjs
**Database:** MongoDB with Mongoose

## Architecture

```
React (client) → REST API (Express) → Mongoose → MongoDB
```

The frontend never talks to MongoDB directly. All authenticated routes go through JWT middleware, and every database query is scoped to `req.user._id` so users can only ever see their own data.

```
spendwise/
├── client/                 # React frontend (Vite)
│   └── src/
│       ├── components/     # Reusable UI (modals, cards, states)
│       ├── pages/          # Route-level pages
│       ├── layouts/        # DashboardLayout (sidebar + mobile nav)
│       ├── context/        # AuthContext, ToastContext
│       ├── services/       # Axios API wrappers
│       └── utils/          # Formatters
│
├── server/                 # Express backend
│   ├── config/db.js        # Mongoose connection
│   ├── models/             # User, Transaction, Budget
│   ├── controllers/        # Route handlers / business logic
│   ├── routes/              # Express routers
│   ├── middleware/         # auth (JWT), validation, error handling
│   ├── utils/               # insightsEngine.js, generateToken.js
│   └── seed/seed.js        # Demo data generator
│
└── README.md
```

## Database Models

**User**: `name, email (unique), password (hashed, never returned), currency, timestamps`

**Transaction**: `userId (ref User), type (income|expense), amount, category, description, date, timestamps`

**Budget**: `userId (ref User), category, monthlyLimit, month, year, timestamps` — unique per `(userId, category, month, year)`. Spent/remaining/percentUsed/status are computed live from transactions, not stored.

## API Endpoints

**Auth**
```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me            (protected)
```

**Users**
```
PUT    /api/users/profile      (protected)
```

**Transactions** (all protected, scoped to the logged-in user)
```
GET    /api/transactions               ?search=&type=&category=&startDate=&endDate=&sort=&page=&limit=
GET    /api/transactions/meta/categories
GET    /api/transactions/:id
POST   /api/transactions
PUT    /api/transactions/:id
DELETE /api/transactions/:id
```

**Budgets** (protected)
```
GET    /api/budgets            ?month=&year=
POST   /api/budgets
PUT    /api/budgets/:id
DELETE /api/budgets/:id
```

**Dashboard** (protected)
```
GET    /api/dashboard/summary
```

**Insights** (protected)
```
GET    /api/insights
```

All responses follow `{ success: true, data: {...} }` or `{ success: false, message: "..." }`.

## Installation

You'll need Node.js 18+ and a MongoDB instance (local, or a free MongoDB Atlas cluster).

```bash
git clone <your-repo-url> spendwise
cd spendwise

# Backend
cd server
npm install
cp .env.example .env
# edit .env and set MONGO_URI / JWT_SECRET

# Frontend
cd ../client
npm install
cp .env.example .env
# edit .env if your backend isn't on localhost:5000
```

## Environment Variables

**server/.env**
```
MONGO_URI=mongodb://127.0.0.1:27017/spendwise
JWT_SECRET=replace_this_with_a_long_random_secret
JWT_EXPIRES_IN=7d
PORT=5000
CLIENT_ORIGIN=http://localhost:5173
```

**client/.env**
```
VITE_API_URL=http://localhost:5000/api
```

## Running Locally

1. Start MongoDB (`mongod`, or use an Atlas connection string in `MONGO_URI`).
2. Start the backend:
   ```bash
   cd server
   npm run dev      # or: npm start
   ```
   API runs at `http://localhost:5000`.
3. (Optional but recommended) Seed demo data:
   ```bash
   cd server
   npm run seed
   ```
4. Start the frontend:
   ```bash
   cd client
   npm run dev
   ```
   App runs at `http://localhost:5173`.
5. Open `http://localhost:5173`, click **Use demo account** on the login screen (or register your own account).

## Demo Credentials

After running `npm run seed` in `server/`:

```
Email:    demo@spendwise.app
Password: Demo@1234
```

## Screenshots

_Add screenshots here after running the app locally — Dashboard, Transactions, Budgets, and Insights pages are good ones to capture._

## Future Improvements

- Recurring transactions
- CSV import/export
- Multi-currency conversion instead of a single display currency
- Shared/household budgets
- Push/email notifications when a budget crosses a threshold
