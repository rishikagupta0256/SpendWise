const express = require('express');
const { getInsights } = require('../controllers/insightController');
const protect = require('../middleware/auth');

const router = express.Router();

router.get('/', protect, getInsights);

module.exports = router;
