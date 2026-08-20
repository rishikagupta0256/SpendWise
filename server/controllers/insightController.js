const { generateInsights } = require('../utils/insightsEngine');

// @route GET /api/insights
async function getInsights(req, res, next) {
  try {
    const insights = await generateInsights(req.user._id);
    res.json({ success: true, data: { insights } });
  } catch (err) {
    next(err);
  }
}

module.exports = { getInsights };
