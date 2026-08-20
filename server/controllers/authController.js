const bcrypt = require('bcryptjs');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');

function sanitizeUser(user) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    currency: user.currency,
    createdAt: user.createdAt,
  };
}

// @route POST /api/auth/register
async function register(req, res, next) {
  try {
    const { name, email, password, currency } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      currency: currency || 'INR',
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: { user: sanitizeUser(user), token },
    });
  } catch (err) {
    next(err);
  }
}

// @route POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      data: { user: sanitizeUser(user), token },
    });
  } catch (err) {
    next(err);
  }
}

// @route GET /api/auth/me
async function getMe(req, res, next) {
  try {
    res.json({ success: true, data: { user: sanitizeUser(req.user) } });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, getMe };
