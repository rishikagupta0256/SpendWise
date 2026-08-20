const express = require('express');
const { getBudgets, createBudget, updateBudget, deleteBudget } = require('../controllers/budgetController');
const protect = require('../middleware/auth');
const { validateBudget } = require('../middleware/validate');

const router = express.Router();

router.use(protect);

router.get('/', getBudgets);
router.post('/', validateBudget, createBudget);
router.put('/:id', updateBudget);
router.delete('/:id', deleteBudget);

module.exports = router;
