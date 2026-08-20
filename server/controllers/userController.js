const User = require('../models/User');

// @route PUT /api/users/profile
async function updateProfile(req, res, next) {
  try {
    const { name, currency } = req.body;
    const updates = {};

    if (typeof name === 'string' && name.trim().length > 0) {
      updates.name = name.trim();
    }
    if (typeof currency === 'string' && currency.trim().length > 0) {
      updates.currency = currency.trim();
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ success: false, message: 'No valid fields provided to update' });
    }

    const user = await User.findByIdAndUpdate(req.user._id, updates, {
      new: true,
      runValidators: true,
    });

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          currency: user.currency,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { updateProfile };
