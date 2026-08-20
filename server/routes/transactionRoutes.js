const express = require('express');
const {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getCategories,
} = require('../controllers/transactionController');
const protect = require('../middleware/auth');
const { validateTransaction } = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.get('/meta/categories', getCategories);
router.get('/', getTransactions);
router.post('/', validateTransaction, createTransaction);
router.get('/:id', getTransaction);
router.put('/:id', updateTransaction);
router.delete('/:id', deleteTransaction);

module.exports = router;
