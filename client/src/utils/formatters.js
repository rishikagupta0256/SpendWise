const currencySymbols = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
};

export function formatCurrency(amount, currency = 'INR') {
  const symbol = currencySymbols[currency] || currency + ' ';
  const value = Number(amount) || 0;
  return `${symbol}${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function toInputDate(date) {
  const d = new Date(date);
  const offset = d.getTimezoneOffset();
  const local = new Date(d.getTime() - offset * 60 * 1000);
  return local.toISOString().split('T')[0];
}
