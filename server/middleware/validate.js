// Lightweight validation helpers (no external dependency needed).

function isNonEmptyString(val) {
  return typeof val === 'string' && val.trim().length > 0;
}

function isValidEmail(val) {
  return typeof val === 'string' && /^\S+@\S+\.\S+$/.test(val);
}

function isPositiveNumber(val) {
  return typeof val === 'number' && !Number.isNaN(val) && val > 0;
}

function isValidDate(val) {
  const d = new Date(val);
  return !Number.isNaN(d.getTime());
}

function validateRegister(req, res, next) {
  const { name, email, password } = req.body;
  const errors = [];

  if (!isNonEmptyString(name)) errors.push('Name is required');
  if (!isValidEmail(email)) errors.push('A valid email is required');
  if (!isNonEmptyString(password) || password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  if (errors.length) {
    return res.status(400).json({ success: false, message: errors.join(', ') });
  }
  next();
}

function validateLogin(req, res, next) {
  const { email, password } = req.body;
  const errors = [];

  if (!isValidEmail(email)) errors.push('A valid email is required');
  if (!isNonEmptyString(password)) errors.push('Password is required');

  if (errors.length) {
    return res.status(400).json({ success: false, message: errors.join(', ') });
  }
  next();
}

function validateTransaction(req, res, next) {
  const { type, amount, category, date } = req.body;
  const errors = [];

  if (!['income', 'expense'].includes(type)) errors.push('Type must be income or expense');
  if (!isPositiveNumber(Number(amount))) errors.push('Amount must be a number greater than 0');
  if (!isNonEmptyString(category)) errors.push('Category is required');
  if (!isValidDate(date)) errors.push('A valid date is required');

  if (req.body.description && req.body.description.length > 200) {
    errors.push('Description must be under 200 characters');
  }

  if (errors.length) {
    return res.status(400).json({ success: false, message: errors.join(', ') });
  }
  next();
}

function validateBudget(req, res, next) {
  const { category, monthlyLimit, month, year } = req.body;
  const errors = [];

  if (!isNonEmptyString(category)) errors.push('Category is required');
  if (!isPositiveNumber(Number(monthlyLimit))) errors.push('Monthly limit must be a number greater than 0');
  if (!Number.isInteger(Number(month)) || month < 1 || month > 12) errors.push('Month must be between 1 and 12');
  if (!Number.isInteger(Number(year)) || year < 2000) errors.push('A valid year is required');

  if (errors.length) {
    return res.status(400).json({ success: false, message: errors.join(', ') });
  }
  next();
}

module.exports = {
  validateRegister,
  validateLogin,
  validateTransaction,
  validateBudget,
};
