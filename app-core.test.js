import test from 'node:test';
import assert from 'node:assert/strict';
import { monthKeyFor, totalForMonth, buildSummary } from './app-core.js';

test('monthKeyFor uses the confirmed purchase date, not today', () => {
  assert.equal(monthKeyFor('2026-08-01'), '2026-08');
  assert.equal(monthKeyFor('2026-12-31'), '2026-12');
});

test('totalForMonth only totals fuel checks in the requested month', () => {
  const checks = [
    { month: '2026-08', amount: 253.76 },
    { month: '2026-08', amount: 38.71 },
    { month: '2026-07', amount: 99.99 }
  ];
  assert.equal(totalForMonth(checks, '2026-08'), 292.47);
});

test('buildSummary returns a zero-safe total and sorted monthly rollup', () => {
  const summary = buildSummary([
    { month: '2026-07', amount: 10 },
    { month: '2026-08', amount: 12.5 },
    { month: '2026-08', amount: 2.5 }
  ]);
  assert.deepEqual(summary, {
    total: 25,
    count: 3,
    months: [
      { month: '2026-08', amount: 15, count: 2 },
      { month: '2026-07', amount: 10, count: 1 }
    ]
  });
});
