export function monthKeyFor(date) {
  return String(date || '').slice(0, 7);
}

export function totalForMonth(checks, month) {
  return Number(checks
    .filter((check) => check.month === month)
    .reduce((total, check) => total + (Number(check.amount) || 0), 0)
    .toFixed(2));
}

export function reportFileName(month) {
  return `benzin95-ledger-${month}.pdf`;
}

export function buildSummary(checks) {
  const groups = new Map();
  for (const check of checks) {
    const month = check.month;
    const current = groups.get(month) || { month, amount: 0, count: 0 };
    current.amount += Number(check.amount) || 0;
    current.count += 1;
    groups.set(month, current);
  }
  return {
    total: Number(checks.reduce((sum, check) => sum + (Number(check.amount) || 0), 0).toFixed(2)),
    count: checks.length,
    months: [...groups.values()]
      .map((entry) => ({ ...entry, amount: Number(entry.amount.toFixed(2)) }))
      .sort((a, b) => b.month.localeCompare(a.month))
  };
}
