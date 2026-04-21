/**
 * Calculator recipe tests — runs on Node's built-in test runner (no framework).
 *
 * Run:
 *   npm run test:recipes
 *
 * Or directly:
 *   npx tsx --test src/lib/calculator-recipes.test.ts
 *
 * Each recipe gets 3 cases: happy (typical inputs), zero (guards against
 * divide-by-zero), large (guards against formatting / overflow regressions).
 *
 * The `net_revenue_basic` happy case uses the exact numbers from Helvis's
 * 2026-04-21 screenshot of the broken airbnb-expense-calculator (1000 / 100 /
 * 100 / 10% / 100 nights) and asserts the correct real-math output that the
 * old GenericCalculator dummy formula failed to produce.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recipes, getRecipe, listRecipes, recipeExists } from './calculator-recipes.js';

// ─────────────── Registry-level sanity ───────────────

test('registry: exactly 15 active recipes', () => {
  const active = Object.values(recipes).filter((r) => !r.deprecated);
  assert.equal(active.length, 15, `expected 15 active recipes, got ${active.length}`);
});

test('registry: every recipe has name matching its key', () => {
  for (const [key, r] of Object.entries(recipes)) {
    assert.equal(r.name, key, `recipe at key "${key}" has mismatched name "${r.name}"`);
  }
});

test('registry: getRecipe + recipeExists work + unknown name returns null', () => {
  assert.ok(getRecipe('net_revenue_basic'));
  assert.ok(recipeExists('profit_margin'));
  assert.equal(getRecipe('does_not_exist'), null);
  assert.equal(recipeExists('does_not_exist'), false);
});

test('registry: listRecipes returns {name, description} for each active recipe', () => {
  const list = listRecipes();
  assert.equal(list.length, 15);
  for (const entry of list) {
    assert.ok(entry.name && typeof entry.name === 'string');
    assert.ok(entry.description && entry.description.length > 10);
  }
});

test('registry: every recipe has at least 2 inputs and 1 output (matches pre-publish gate)', () => {
  for (const r of Object.values(recipes)) {
    assert.ok(r.inputs.length >= 2, `recipe ${r.name} has only ${r.inputs.length} inputs`);
    assert.ok(r.outputs.length >= 1, `recipe ${r.name} has no outputs`);
  }
});

// ─────────────── net_revenue_basic ───────────────
// The canonical bug that started this work: airbnb-expense-calculator
// on 2026-04-21 with inputs 1000 / 100 / 100 / 10 / 100 was showing
// $1,310 / $15,720 / 57%. Real math must show $900 / $700 / $9.

test('net_revenue_basic — happy (reproduces Helvis screenshot, validates real math)', () => {
  const r = recipes.net_revenue_basic.compute({
    monthlyRevenue: 1000,
    operatingExpenses: 100,
    fixedCosts: 100,
    platformFeePct: 10,
    bookedNights: 100,
  });
  assert.equal(r.netRevenue.raw, 900);
  assert.equal(r.netRevenue.value, '$900');
  assert.equal(r.netProfit.raw, 700);
  assert.equal(r.netProfit.value, '$700');
  assert.equal(r.netRevenuePerNight.raw, 9);
  assert.equal(r.netRevenuePerNight.value, '$9');
});

test('net_revenue_basic — zero inputs (no NaN, no crash)', () => {
  const r = recipes.net_revenue_basic.compute({
    monthlyRevenue: 0,
    operatingExpenses: 0,
    fixedCosts: 0,
    platformFeePct: 0,
    bookedNights: 0,
  });
  assert.equal(r.netRevenue.raw, 0);
  assert.equal(r.netProfit.raw, 0);
  assert.equal(r.netRevenuePerNight.raw, 0); // safeDiv prevents NaN
});

test('net_revenue_basic — large inputs (comma formatting)', () => {
  const r = recipes.net_revenue_basic.compute({
    monthlyRevenue: 125000,
    operatingExpenses: 18000,
    fixedCosts: 32000,
    platformFeePct: 15,
    bookedNights: 28,
  });
  // 125000 - 18750 (15% fee) = 106250 net revenue
  // 106250 - 18000 - 32000 = 56250 net profit
  // 106250 / 28 ≈ 3794.64 per night
  assert.equal(r.netRevenue.raw, 106250);
  assert.equal(r.netRevenue.value, '$106,250');
  assert.equal(r.netProfit.raw, 56250);
  assert.equal(r.netProfit.value, '$56,250');
});

// ─────────────── profit_margin ───────────────

test('profit_margin — happy', () => {
  const r = recipes.profit_margin.compute({ revenue: 10000, totalCosts: 6500 });
  assert.equal(r.grossProfit.raw, 3500);
  assert.equal(r.profitMarginPct.raw, 35);
  assert.equal(r.profitMarginPct.value, '35.0%');
});

test('profit_margin — zero revenue does not crash', () => {
  const r = recipes.profit_margin.compute({ revenue: 0, totalCosts: 500 });
  assert.equal(r.grossProfit.raw, -500);
  assert.equal(r.profitMarginPct.raw, 0); // safeDiv returns 0, not NaN/Infinity
});

test('profit_margin — large', () => {
  const r = recipes.profit_margin.compute({ revenue: 5_000_000, totalCosts: 3_250_000 });
  assert.equal(r.grossProfit.raw, 1_750_000);
  assert.equal(r.grossProfit.value, '$1,750,000');
  assert.equal(r.profitMarginPct.value, '35.0%');
});

// ─────────────── occupancy_rate ───────────────

test('occupancy_rate — happy', () => {
  const r = recipes.occupancy_rate.compute({ nightsBooked: 20, totalNights: 30 });
  assert.equal(Math.round(r.occupancyRate.raw * 10) / 10, 66.7);
  assert.equal(r.vacantNights.raw, 10);
  assert.equal(r.vacantNights.value, '10 nights');
});

test('occupancy_rate — zero total nights does not crash', () => {
  const r = recipes.occupancy_rate.compute({ nightsBooked: 5, totalNights: 0 });
  assert.equal(r.occupancyRate.raw, 0);
  assert.equal(r.vacantNights.raw, 0);
});

test('occupancy_rate — booked exceeds total (clamped)', () => {
  const r = recipes.occupancy_rate.compute({ nightsBooked: 50, totalNights: 30 });
  assert.equal(r.occupancyRate.raw, 100); // clamped at 100%
  assert.equal(r.vacantNights.raw, 0); // clamped at 0
});

// ─────────────── revpar ───────────────

test('revpar — happy', () => {
  const r = recipes.revpar.compute({ adr: 180, occupancyPct: 65 });
  // 180 * 0.65 = 117 per night, * 30 = 3510 monthly
  assert.equal(r.revpar.raw, 117);
  assert.equal(r.monthlyRevenue.raw, 3510);
});

test('revpar — zero adr', () => {
  const r = recipes.revpar.compute({ adr: 0, occupancyPct: 80 });
  assert.equal(r.revpar.raw, 0);
});

test('revpar — custom days constant', () => {
  const r = recipes.revpar.compute({ adr: 100, occupancyPct: 50 }, { daysInMonth: 31 });
  assert.equal(r.revpar.raw, 50);
  assert.equal(r.monthlyRevenue.raw, 50 * 31);
});

// ─────────────── adr ───────────────

test('adr — happy', () => {
  const r = recipes.adr.compute({ totalRevenue: 3600, nightsBooked: 20 });
  assert.equal(r.adr.raw, 180);
  assert.equal(r.adr.value, '$180.00');
});

test('adr — zero nights does not crash', () => {
  const r = recipes.adr.compute({ totalRevenue: 500, nightsBooked: 0 });
  assert.equal(r.adr.raw, 0);
});

test('adr — large', () => {
  const r = recipes.adr.compute({ totalRevenue: 120000, nightsBooked: 240 });
  assert.equal(r.adr.raw, 500);
});

// ─────────────── break_even_months ───────────────

test('break_even_months — happy', () => {
  const r = recipes.break_even_months.compute({ investment: 12000, monthlyProfit: 500 });
  assert.equal(r.breakEvenMonths.raw, 24);
  assert.equal(r.breakEvenMonths.value, '24 months');
  assert.equal(r.breakEvenYears.raw, 2);
});

test('break_even_months — zero profit does not crash', () => {
  const r = recipes.break_even_months.compute({ investment: 10000, monthlyProfit: 0 });
  assert.equal(r.breakEvenMonths.raw, 0);
});

test('break_even_months — less than 1 month', () => {
  const r = recipes.break_even_months.compute({ investment: 50, monthlyProfit: 1000 });
  assert.equal(r.breakEvenMonths.value, '< 1 month');
});

// ─────────────── roi_annual ───────────────

test('roi_annual — happy', () => {
  const r = recipes.roi_annual.compute({ annualProfit: 6000, totalInvestment: 30000 });
  assert.equal(r.roiPct.raw, 20);
  assert.equal(r.paybackYears.raw, 5);
});

test('roi_annual — zero investment does not crash', () => {
  const r = recipes.roi_annual.compute({ annualProfit: 5000, totalInvestment: 0 });
  assert.equal(r.roiPct.raw, 0);
});

test('roi_annual — large', () => {
  const r = recipes.roi_annual.compute({ annualProfit: 250000, totalInvestment: 1000000 });
  assert.equal(r.roiPct.raw, 25);
  assert.equal(r.paybackYears.raw, 4);
});

// ─────────────── cap_rate ───────────────

test('cap_rate — happy', () => {
  const r = recipes.cap_rate.compute({ annualNoi: 24000, propertyValue: 400000 });
  assert.equal(r.capRatePct.raw, 6);
  assert.equal(r.capRatePct.value, '6.00%');
});

test('cap_rate — zero property value', () => {
  const r = recipes.cap_rate.compute({ annualNoi: 10000, propertyValue: 0 });
  assert.equal(r.capRatePct.raw, 0);
});

test('cap_rate — large property', () => {
  const r = recipes.cap_rate.compute({ annualNoi: 180000, propertyValue: 3000000 });
  assert.equal(r.capRatePct.raw, 6);
});

// ─────────────── cash_on_cash ───────────────

test('cash_on_cash — happy', () => {
  const r = recipes.cash_on_cash.compute({ annualCashFlow: 8000, cashInvested: 80000 });
  assert.equal(r.cashOnCashPct.raw, 10);
  assert.equal(r.cashOnCashPct.value, '10.00%');
});

test('cash_on_cash — zero cash invested', () => {
  const r = recipes.cash_on_cash.compute({ annualCashFlow: 5000, cashInvested: 0 });
  assert.equal(r.cashOnCashPct.raw, 0);
});

test('cash_on_cash — large', () => {
  const r = recipes.cash_on_cash.compute({ annualCashFlow: 45000, cashInvested: 300000 });
  assert.equal(r.cashOnCashPct.raw, 15);
});

// ─────────────── noi ───────────────

test('noi — happy', () => {
  const r = recipes.noi.compute({ annualRevenue: 60000, annualOperatingExpenses: 22000 });
  assert.equal(r.noi.raw, 38000);
  assert.equal(r.monthlyNoi.raw, 38000 / 12);
});

test('noi — zero', () => {
  const r = recipes.noi.compute({ annualRevenue: 0, annualOperatingExpenses: 0 });
  assert.equal(r.noi.raw, 0);
});

test('noi — negative NOI possible (expenses > revenue)', () => {
  const r = recipes.noi.compute({ annualRevenue: 20000, annualOperatingExpenses: 35000 });
  assert.equal(r.noi.raw, -15000);
  assert.equal(r.noi.value, '$-15,000');
});

// ─────────────── gross_yield ───────────────

test('gross_yield — happy', () => {
  const r = recipes.gross_yield.compute({ monthlyRent: 2000, propertyValue: 400000 });
  assert.equal(r.grossYieldPct.raw, 6);
  assert.equal(r.annualRent.raw, 24000);
});

test('gross_yield — zero property value', () => {
  const r = recipes.gross_yield.compute({ monthlyRent: 1500, propertyValue: 0 });
  assert.equal(r.grossYieldPct.raw, 0);
  assert.equal(r.annualRent.raw, 18000);
});

test('gross_yield — large', () => {
  const r = recipes.gross_yield.compute({ monthlyRent: 8000, propertyValue: 1200000 });
  assert.equal(r.grossYieldPct.raw, 8);
  assert.equal(r.annualRent.raw, 96000);
});

// ─────────────── net_yield ───────────────

test('net_yield — happy', () => {
  const r = recipes.net_yield.compute({ monthlyRent: 2000, monthlyExpenses: 700, propertyValue: 400000 });
  // (2000-700)*12 = 15600 / 400000 = 3.9%
  assert.equal(r.netYieldPct.raw, 3.9);
  assert.equal(r.annualNetIncome.raw, 15600);
});

test('net_yield — zero property value', () => {
  const r = recipes.net_yield.compute({ monthlyRent: 1500, monthlyExpenses: 500, propertyValue: 0 });
  assert.equal(r.netYieldPct.raw, 0);
});

test('net_yield — expenses exceed rent (negative yield)', () => {
  const r = recipes.net_yield.compute({ monthlyRent: 1000, monthlyExpenses: 1500, propertyValue: 200000 });
  assert.equal(r.annualNetIncome.raw, -6000);
  assert.equal(r.netYieldPct.raw, -3);
});

// ─────────────── expense_ratio ───────────────

test('expense_ratio — happy', () => {
  const r = recipes.expense_ratio.compute({ totalExpenses: 3200, totalRevenue: 8000 });
  assert.equal(r.expenseRatioPct.raw, 40);
  assert.equal(r.profitRatioPct.raw, 60);
});

test('expense_ratio — zero revenue', () => {
  const r = recipes.expense_ratio.compute({ totalExpenses: 500, totalRevenue: 0 });
  assert.equal(r.expenseRatioPct.raw, 0);
});

test('expense_ratio — expenses exceed revenue (clamped)', () => {
  const r = recipes.expense_ratio.compute({ totalExpenses: 15000, totalRevenue: 10000 });
  assert.equal(r.expenseRatioPct.raw, 100); // clamped
  assert.equal(r.profitRatioPct.raw, 0);
});

// ─────────────── gross_profit ───────────────

test('gross_profit — happy', () => {
  const r = recipes.gross_profit.compute({ revenue: 10000, cogs: 4000 });
  assert.equal(r.grossProfit.raw, 6000);
  assert.equal(r.grossMarginPct.raw, 60);
});

test('gross_profit — zero revenue', () => {
  const r = recipes.gross_profit.compute({ revenue: 0, cogs: 2000 });
  assert.equal(r.grossProfit.raw, -2000);
  assert.equal(r.grossMarginPct.raw, 0);
});

test('gross_profit — large', () => {
  const r = recipes.gross_profit.compute({ revenue: 2_500_000, cogs: 900_000 });
  assert.equal(r.grossProfit.raw, 1_600_000);
  assert.equal(r.grossMarginPct.raw, 64);
});

// ─────────────── cleaning_fee_per_turnover ───────────────

test('cleaning_fee_per_turnover — happy', () => {
  const r = recipes.cleaning_fee_per_turnover.compute({
    cleaningLaborCost: 600,
    suppliesCost: 120,
    numTurnovers: 8,
  });
  // (600+120)/8 = 90 per turnover, * 1.25 markup = 112.50 recommended fee
  assert.equal(r.costPerTurnover.raw, 90);
  assert.equal(r.recommendedFee.raw, 113); // Math.round of 112.5 = 113
});

test('cleaning_fee_per_turnover — zero turnovers', () => {
  const r = recipes.cleaning_fee_per_turnover.compute({
    cleaningLaborCost: 200,
    suppliesCost: 50,
    numTurnovers: 0,
  });
  assert.equal(r.costPerTurnover.raw, 0); // safeDiv
});

test('cleaning_fee_per_turnover — custom markup', () => {
  const r = recipes.cleaning_fee_per_turnover.compute(
    { cleaningLaborCost: 400, suppliesCost: 100, numTurnovers: 5 },
    { markupPct: 50 },
  );
  // 500/5 = 100 per turnover, * 1.50 = 150 recommended fee
  assert.equal(r.costPerTurnover.raw, 100);
  assert.equal(r.recommendedFee.raw, 150);
});
