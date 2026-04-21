// MIRRORED FROM market-me-good — do not edit here. Canonical source at
// https://github.com/hello760/market-me-good/blob/main/src/lib/calculator-recipes.ts
// Parity is enforced by scripts/check-recipe-parity.sh on every lint run.

/**
 * Calculator Recipe Library — CANONICAL source.
 *
 * Pure-math functions that power every calculator on every client site.
 * Zero side-effects, zero I/O, deterministic output. Safe to bundle into
 * the client-side embed runtime and safe to run server-side for validation.
 *
 * This file is the CANONICAL source. It is mirrored into
 *   mrprops-content/src/lib/calculator-recipes.ts
 * The mirror has an identical body with a "MIRRORED FROM" header comment.
 * `scripts/check-recipe-parity.sh` in mrprops-content diffs the two files
 * on lint and fails CI if they drift.
 *
 * Adding a recipe:
 *   1. Add the entry to `recipes` below with compute() returning
 *      Record<key, RecipeResult>.
 *   2. Add 3 test cases in calculator-recipes.test.ts (happy / zero / large).
 *   3. Copy this file to mrprops-content/src/lib/ (keep the MIRRORED header).
 *   4. Commit to both repos. CI parity check must pass.
 *
 * Adding a new output format:
 *   Extend `fmt` below; update RecipeResultSpec['format'] union.
 *
 * Removing a recipe:
 *   Do NOT remove in-place. Mark `deprecated: true` in the entry; the
 *   renderer will continue to resolve it but the LLM prompt + Editor
 *   dropdown will hide it. Remove after one full release + backfill pass.
 */

export interface RecipeFieldSpec {
  key: string;
  label: string;
  helpText?: string;
  unit?: 'dollar' | 'percent' | 'number' | 'nights' | 'days' | 'months' | 'years';
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
}

export interface RecipeResultSpec {
  key: string;
  label: string;
  helpText?: string;
  format: 'dollar' | 'percent' | 'number' | 'months' | 'years' | 'nights';
}

export interface RecipeResult {
  value: string; // display-ready string — "$900", "45.2%", "12 months"
  raw: number; // raw number for downstream math
}

export interface Recipe {
  name: string;
  description: string; // one line for LLM enum + Editor dropdown
  inputs: RecipeFieldSpec[];
  outputs: RecipeResultSpec[];
  defaultConstants: Record<string, number>;
  compute: (
    inputs: Record<string, number>,
    constants?: Record<string, number>,
  ) => Record<string, RecipeResult>;
  deprecated?: boolean;
}

// ────────────────────────────────────────────────────────────────
// Formula payload — the JSONB shape stored in
// content_pieces.structured_data.calculatorUi.formula.
// This is the contract between the LLM extractor, the DB, the
// renderer, and the embed runtime. All four must agree on it.
// ────────────────────────────────────────────────────────────────

export interface CalculatorFormula {
  /** Recipe name — must match a key in `recipes` and pass recipeExists(). */
  recipe: string;

  /**
   * Maps recipe-input keys (the keys the recipe.compute() function expects)
   * to calculatorUi.fields[].key values (the keys the user-facing inputs use).
   * Example for net_revenue_basic:
   *   { monthlyRevenue: "monthlyRevenue", operatingExpenses: "opex", ... }
   * inputMap lets the same recipe power multiple UI layouts with different
   * field-key naming conventions without the renderer caring.
   */
  inputMap: Record<string, string>;

  /**
   * Maps recipe-output keys (the keys recipe.compute() returns) to
   * calculatorUi.results[].key values (the keys the result panel displays).
   */
  outputMap: Record<string, string>;

  /**
   * Optional overrides for the recipe's defaultConstants. Example for
   * cleaning_fee_per_turnover: { markupPct: 30 } overrides the default 25.
   */
  constants?: Record<string, number>;
}

// ────────────────────────────────────────────────────────────────
// Formatting helpers (shared across all recipes)
// ────────────────────────────────────────────────────────────────

const fmt = {
  dollar: (n: number): RecipeResult => ({
    value: `$${Math.round(n).toLocaleString('en-US')}`,
    raw: Number.isFinite(n) ? n : 0,
  }),
  dollar2: (n: number): RecipeResult => ({
    value: `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    raw: Number.isFinite(n) ? n : 0,
  }),
  percent: (n: number, digits = 1): RecipeResult => ({
    value: `${n.toFixed(digits)}%`,
    raw: Number.isFinite(n) ? n : 0,
  }),
  months: (n: number): RecipeResult => ({
    value: n >= 1 ? `${Math.round(n)} month${Math.round(n) === 1 ? '' : 's'}` : '< 1 month',
    raw: Number.isFinite(n) ? n : 0,
  }),
  years: (n: number): RecipeResult => ({
    value: `${n.toFixed(1)} years`,
    raw: Number.isFinite(n) ? n : 0,
  }),
  nights: (n: number): RecipeResult => ({
    value: `${Math.round(n).toLocaleString('en-US')} night${Math.round(n) === 1 ? '' : 's'}`,
    raw: Number.isFinite(n) ? n : 0,
  }),
  number: (n: number): RecipeResult => ({
    value: Math.round(n).toLocaleString('en-US'),
    raw: Number.isFinite(n) ? n : 0,
  }),
};

// Safe divide — returns 0 rather than NaN/Infinity
const safeDiv = (a: number, b: number): number => (b === 0 || !Number.isFinite(b) ? 0 : a / b);
const nonNeg = (n: number): number => (Number.isFinite(n) && n > 0 ? n : 0);

// ────────────────────────────────────────────────────────────────
// Recipe definitions
// ────────────────────────────────────────────────────────────────

const net_revenue_basic: Recipe = {
  name: 'net_revenue_basic',
  description:
    'Net revenue + net profit for a short-term rental, after platform fees, operating expenses, and fixed costs. Use for airbnb-expense-calculator and similar "track hosting costs" tools.',
  inputs: [
    { key: 'monthlyRevenue', label: 'Monthly Revenue', unit: 'dollar', defaultValue: 5000, min: 0 },
    { key: 'operatingExpenses', label: 'Operating Expenses', unit: 'dollar', defaultValue: 800, min: 0 },
    { key: 'fixedCosts', label: 'Fixed Costs', unit: 'dollar', defaultValue: 1800, min: 0 },
    { key: 'platformFeePct', label: 'Platform Fee (%)', unit: 'percent', defaultValue: 3, min: 0, max: 100, step: 0.1 },
    { key: 'bookedNights', label: 'Booked Nights Per Month', unit: 'nights', defaultValue: 20, min: 0, max: 31 },
  ],
  outputs: [
    { key: 'netRevenue', label: 'Net Revenue', format: 'dollar' },
    { key: 'netProfit', label: 'Net Profit', format: 'dollar' },
    { key: 'netRevenuePerNight', label: 'Net Revenue Per Booked Night', format: 'dollar' },
  ],
  defaultConstants: {},
  compute: (i) => {
    const revenue = nonNeg(i.monthlyRevenue);
    const platformFee = revenue * (nonNeg(i.platformFeePct) / 100);
    const netRev = revenue - platformFee;
    const netProfit = netRev - nonNeg(i.operatingExpenses) - nonNeg(i.fixedCosts);
    return {
      netRevenue: fmt.dollar(netRev),
      netProfit: fmt.dollar(netProfit),
      netRevenuePerNight: fmt.dollar(safeDiv(netRev, nonNeg(i.bookedNights))),
    };
  },
};

const profit_margin: Recipe = {
  name: 'profit_margin',
  description:
    'Gross profit and profit margin percentage from revenue and total costs. Use for any "what is my margin" calculator.',
  inputs: [
    { key: 'revenue', label: 'Total Revenue', unit: 'dollar', defaultValue: 10000, min: 0 },
    { key: 'totalCosts', label: 'Total Costs', unit: 'dollar', defaultValue: 6500, min: 0 },
  ],
  outputs: [
    { key: 'grossProfit', label: 'Gross Profit', format: 'dollar' },
    { key: 'profitMarginPct', label: 'Profit Margin', format: 'percent' },
  ],
  defaultConstants: {},
  compute: (i) => {
    const revenue = nonNeg(i.revenue);
    const costs = nonNeg(i.totalCosts);
    const profit = revenue - costs;
    return {
      grossProfit: fmt.dollar(profit),
      profitMarginPct: fmt.percent(safeDiv(profit, revenue) * 100),
    };
  },
};

const occupancy_rate: Recipe = {
  name: 'occupancy_rate',
  description:
    'Occupancy rate percent + vacant nights, given nights booked and total nights available in the period.',
  inputs: [
    { key: 'nightsBooked', label: 'Nights Booked', unit: 'nights', defaultValue: 20, min: 0 },
    { key: 'totalNights', label: 'Total Available Nights', unit: 'nights', defaultValue: 30, min: 1 },
  ],
  outputs: [
    { key: 'occupancyRate', label: 'Occupancy Rate', format: 'percent' },
    { key: 'vacantNights', label: 'Vacant Nights', format: 'nights' },
  ],
  defaultConstants: {},
  compute: (i) => {
    const booked = nonNeg(i.nightsBooked);
    const total = nonNeg(i.totalNights);
    return {
      occupancyRate: fmt.percent(Math.min(100, safeDiv(booked, total) * 100)),
      vacantNights: fmt.nights(Math.max(0, total - booked)),
    };
  },
};

const revpar: Recipe = {
  name: 'revpar',
  description:
    'RevPAR — revenue per available rental night, from ADR and occupancy percent.',
  inputs: [
    { key: 'adr', label: 'Average Daily Rate (ADR)', unit: 'dollar', defaultValue: 180, min: 0 },
    { key: 'occupancyPct', label: 'Occupancy Rate', unit: 'percent', defaultValue: 65, min: 0, max: 100 },
  ],
  outputs: [
    { key: 'revpar', label: 'RevPAR', format: 'dollar', helpText: 'Revenue per available rental night' },
    { key: 'monthlyRevenue', label: 'Est. Monthly Revenue', format: 'dollar' },
  ],
  defaultConstants: { daysInMonth: 30 },
  compute: (i, c) => {
    const adr = nonNeg(i.adr);
    const occupancy = Math.max(0, Math.min(100, nonNeg(i.occupancyPct))) / 100;
    const days = c?.daysInMonth ?? 30;
    const rpNight = adr * occupancy;
    return {
      revpar: fmt.dollar2(rpNight),
      monthlyRevenue: fmt.dollar(rpNight * days),
    };
  },
};

const adr_recipe: Recipe = {
  name: 'adr',
  description:
    'ADR — average daily rate, from total booking revenue divided by nights booked.',
  inputs: [
    { key: 'totalRevenue', label: 'Total Revenue', unit: 'dollar', defaultValue: 3600, min: 0 },
    { key: 'nightsBooked', label: 'Nights Booked', unit: 'nights', defaultValue: 20, min: 0 },
  ],
  outputs: [{ key: 'adr', label: 'Average Daily Rate', format: 'dollar' }],
  defaultConstants: {},
  compute: (i) => ({
    adr: fmt.dollar2(safeDiv(nonNeg(i.totalRevenue), nonNeg(i.nightsBooked))),
  }),
};

const break_even_months: Recipe = {
  name: 'break_even_months',
  description:
    'How many months until an investment pays for itself given a monthly profit.',
  inputs: [
    { key: 'investment', label: 'Total Investment', unit: 'dollar', defaultValue: 12000, min: 0 },
    { key: 'monthlyProfit', label: 'Monthly Profit', unit: 'dollar', defaultValue: 500, min: 0 },
  ],
  outputs: [
    { key: 'breakEvenMonths', label: 'Break-Even Time', format: 'months' },
    { key: 'breakEvenYears', label: 'In Years', format: 'years' },
  ],
  defaultConstants: {},
  compute: (i) => {
    const months = safeDiv(nonNeg(i.investment), nonNeg(i.monthlyProfit));
    return {
      breakEvenMonths: fmt.months(months),
      breakEvenYears: fmt.years(months / 12),
    };
  },
};

const roi_annual: Recipe = {
  name: 'roi_annual',
  description:
    'Annual ROI percent + payback years, given annual profit and total investment.',
  inputs: [
    { key: 'annualProfit', label: 'Annual Profit', unit: 'dollar', defaultValue: 6000, min: 0 },
    { key: 'totalInvestment', label: 'Total Investment', unit: 'dollar', defaultValue: 30000, min: 0 },
  ],
  outputs: [
    { key: 'roiPct', label: 'Annual ROI', format: 'percent' },
    { key: 'paybackYears', label: 'Payback Period', format: 'years' },
  ],
  defaultConstants: {},
  compute: (i) => {
    const roi = safeDiv(nonNeg(i.annualProfit), nonNeg(i.totalInvestment)) * 100;
    return {
      roiPct: fmt.percent(roi),
      paybackYears: fmt.years(safeDiv(nonNeg(i.totalInvestment), nonNeg(i.annualProfit))),
    };
  },
};

const cap_rate: Recipe = {
  name: 'cap_rate',
  description:
    'Capitalization rate — annual net operating income divided by property value.',
  inputs: [
    { key: 'annualNoi', label: 'Annual Net Operating Income', unit: 'dollar', defaultValue: 24000, min: 0 },
    { key: 'propertyValue', label: 'Property Value', unit: 'dollar', defaultValue: 400000, min: 0 },
  ],
  outputs: [{ key: 'capRatePct', label: 'Cap Rate', format: 'percent' }],
  defaultConstants: {},
  compute: (i) => ({
    capRatePct: fmt.percent(safeDiv(nonNeg(i.annualNoi), nonNeg(i.propertyValue)) * 100, 2),
  }),
};

const cash_on_cash: Recipe = {
  name: 'cash_on_cash',
  description:
    'Cash-on-cash return — annual cash flow divided by cash invested.',
  inputs: [
    { key: 'annualCashFlow', label: 'Annual Cash Flow', unit: 'dollar', defaultValue: 8000, min: 0 },
    { key: 'cashInvested', label: 'Cash Invested', unit: 'dollar', defaultValue: 80000, min: 0 },
  ],
  outputs: [{ key: 'cashOnCashPct', label: 'Cash-on-Cash Return', format: 'percent' }],
  defaultConstants: {},
  compute: (i) => ({
    cashOnCashPct: fmt.percent(
      safeDiv(nonNeg(i.annualCashFlow), nonNeg(i.cashInvested)) * 100,
      2,
    ),
  }),
};

const noi_recipe: Recipe = {
  name: 'noi',
  description:
    'Net Operating Income — annual revenue minus annual operating expenses (excluding debt service).',
  inputs: [
    { key: 'annualRevenue', label: 'Annual Revenue', unit: 'dollar', defaultValue: 60000, min: 0 },
    { key: 'annualOperatingExpenses', label: 'Annual Operating Expenses', unit: 'dollar', defaultValue: 22000, min: 0 },
  ],
  outputs: [
    { key: 'noi', label: 'Net Operating Income', format: 'dollar' },
    { key: 'monthlyNoi', label: 'Monthly NOI', format: 'dollar' },
  ],
  defaultConstants: {},
  compute: (i) => {
    const noi = nonNeg(i.annualRevenue) - nonNeg(i.annualOperatingExpenses);
    return {
      noi: fmt.dollar(noi),
      monthlyNoi: fmt.dollar(noi / 12),
    };
  },
};

const gross_yield: Recipe = {
  name: 'gross_yield',
  description:
    'Gross rental yield — annual rent as a percentage of property value (ignores expenses).',
  inputs: [
    { key: 'monthlyRent', label: 'Monthly Rent', unit: 'dollar', defaultValue: 2000, min: 0 },
    { key: 'propertyValue', label: 'Property Value', unit: 'dollar', defaultValue: 400000, min: 0 },
  ],
  outputs: [
    { key: 'grossYieldPct', label: 'Gross Yield', format: 'percent' },
    { key: 'annualRent', label: 'Annual Rent', format: 'dollar' },
  ],
  defaultConstants: {},
  compute: (i) => {
    const annualRent = nonNeg(i.monthlyRent) * 12;
    return {
      grossYieldPct: fmt.percent(safeDiv(annualRent, nonNeg(i.propertyValue)) * 100, 2),
      annualRent: fmt.dollar(annualRent),
    };
  },
};

const net_yield: Recipe = {
  name: 'net_yield',
  description:
    'Net rental yield — annual rent minus annual expenses, as a percentage of property value.',
  inputs: [
    { key: 'monthlyRent', label: 'Monthly Rent', unit: 'dollar', defaultValue: 2000, min: 0 },
    { key: 'monthlyExpenses', label: 'Monthly Expenses', unit: 'dollar', defaultValue: 700, min: 0 },
    { key: 'propertyValue', label: 'Property Value', unit: 'dollar', defaultValue: 400000, min: 0 },
  ],
  outputs: [
    { key: 'netYieldPct', label: 'Net Yield', format: 'percent' },
    { key: 'annualNetIncome', label: 'Annual Net Income', format: 'dollar' },
  ],
  defaultConstants: {},
  compute: (i) => {
    const annualNet = (nonNeg(i.monthlyRent) - nonNeg(i.monthlyExpenses)) * 12;
    return {
      netYieldPct: fmt.percent(safeDiv(annualNet, nonNeg(i.propertyValue)) * 100, 2),
      annualNetIncome: fmt.dollar(annualNet),
    };
  },
};

const expense_ratio: Recipe = {
  name: 'expense_ratio',
  description:
    'Expense ratio — total expenses as a percentage of total revenue (with profit ratio as complement).',
  inputs: [
    { key: 'totalExpenses', label: 'Total Expenses', unit: 'dollar', defaultValue: 3200, min: 0 },
    { key: 'totalRevenue', label: 'Total Revenue', unit: 'dollar', defaultValue: 8000, min: 0 },
  ],
  outputs: [
    { key: 'expenseRatioPct', label: 'Expense Ratio', format: 'percent' },
    { key: 'profitRatioPct', label: 'Profit Ratio', format: 'percent' },
  ],
  defaultConstants: {},
  compute: (i) => {
    const ratio = safeDiv(nonNeg(i.totalExpenses), nonNeg(i.totalRevenue)) * 100;
    return {
      expenseRatioPct: fmt.percent(Math.min(100, ratio)),
      profitRatioPct: fmt.percent(Math.max(0, 100 - ratio)),
    };
  },
};

const gross_profit: Recipe = {
  name: 'gross_profit',
  description:
    'Gross profit and gross margin — revenue minus cost of goods sold (COGS).',
  inputs: [
    { key: 'revenue', label: 'Revenue', unit: 'dollar', defaultValue: 10000, min: 0 },
    { key: 'cogs', label: 'Cost of Goods Sold (COGS)', unit: 'dollar', defaultValue: 4000, min: 0 },
  ],
  outputs: [
    { key: 'grossProfit', label: 'Gross Profit', format: 'dollar' },
    { key: 'grossMarginPct', label: 'Gross Margin', format: 'percent' },
  ],
  defaultConstants: {},
  compute: (i) => {
    const revenue = nonNeg(i.revenue);
    const cogs = nonNeg(i.cogs);
    const profit = revenue - cogs;
    return {
      grossProfit: fmt.dollar(profit),
      grossMarginPct: fmt.percent(safeDiv(profit, revenue) * 100),
    };
  },
};

const cleaning_fee_per_turnover: Recipe = {
  name: 'cleaning_fee_per_turnover',
  description:
    'True cost per turnover + recommended guest-facing cleaning fee, from labor + supplies + number of turnovers per period.',
  inputs: [
    { key: 'cleaningLaborCost', label: 'Total Cleaning Labor Cost', unit: 'dollar', defaultValue: 600, min: 0 },
    { key: 'suppliesCost', label: 'Total Supplies Cost', unit: 'dollar', defaultValue: 120, min: 0 },
    { key: 'numTurnovers', label: 'Number of Turnovers', unit: 'number', defaultValue: 8, min: 1 },
  ],
  outputs: [
    { key: 'costPerTurnover', label: 'Cost Per Turnover', format: 'dollar' },
    { key: 'recommendedFee', label: 'Recommended Guest Fee', format: 'dollar' },
  ],
  defaultConstants: { markupPct: 25 },
  compute: (i, c) => {
    const totalCost = nonNeg(i.cleaningLaborCost) + nonNeg(i.suppliesCost);
    const perTurnover = safeDiv(totalCost, nonNeg(i.numTurnovers));
    const markup = (c?.markupPct ?? 25) / 100;
    return {
      costPerTurnover: fmt.dollar2(perTurnover),
      recommendedFee: fmt.dollar(Math.round(perTurnover * (1 + markup))),
    };
  },
};

// ────────────────────────────────────────────────────────────────
// Registry + lookup API
// ────────────────────────────────────────────────────────────────

export const recipes: Record<string, Recipe> = {
  net_revenue_basic,
  profit_margin,
  occupancy_rate,
  revpar,
  adr: adr_recipe,
  break_even_months,
  roi_annual,
  cap_rate,
  cash_on_cash,
  noi: noi_recipe,
  gross_yield,
  net_yield,
  expense_ratio,
  gross_profit,
  cleaning_fee_per_turnover,
};

export function getRecipe(name: string): Recipe | null {
  return recipes[name] ?? null;
}

export function listRecipes(): Array<{ name: string; description: string; deprecated?: boolean }> {
  return Object.entries(recipes)
    .filter(([, r]) => !r.deprecated)
    .map(([name, r]) => ({ name, description: r.description }));
}

export function recipeExists(name: string): boolean {
  return name in recipes && !recipes[name].deprecated;
}

// ────────────────────────────────────────────────────────────────
// Formula validation — used by pre-publish gate AND by renderer's
// "show banner on missing config" guard. Single source of truth
// for what counts as a correctly-wired calculator formula.
// ────────────────────────────────────────────────────────────────

export interface FormulaValidation {
  valid: boolean;
  errors: string[]; // human-readable list; empty when valid=true
}

export function validateFormula(
  formula: CalculatorFormula | null | undefined,
  availableFieldKeys: string[],
  availableResultKeys: string[],
): FormulaValidation {
  const errors: string[] = [];
  if (!formula || typeof formula !== 'object') {
    return { valid: false, errors: ['formula missing'] };
  }
  if (!formula.recipe || typeof formula.recipe !== 'string') {
    errors.push('formula.recipe not set');
    return { valid: false, errors };
  }
  const recipe = getRecipe(formula.recipe);
  if (!recipe) {
    errors.push(`recipe "${formula.recipe}" not found in library`);
    return { valid: false, errors };
  }
  if (recipe.deprecated) {
    errors.push(`recipe "${formula.recipe}" is deprecated`);
  }
  // inputMap must map every recipe input key to an existing field key
  for (const input of recipe.inputs) {
    const mapped = formula.inputMap?.[input.key];
    if (!mapped) {
      errors.push(`inputMap missing for recipe input "${input.key}"`);
    } else if (!availableFieldKeys.includes(mapped)) {
      errors.push(
        `inputMap["${input.key}"] points to "${mapped}" but no field with that key exists`,
      );
    }
  }
  // outputMap must map every recipe output key to an existing result key
  for (const output of recipe.outputs) {
    const mapped = formula.outputMap?.[output.key];
    if (!mapped) {
      errors.push(`outputMap missing for recipe output "${output.key}"`);
    } else if (!availableResultKeys.includes(mapped)) {
      errors.push(
        `outputMap["${output.key}"] points to "${mapped}" but no result with that key exists`,
      );
    }
  }
  return { valid: errors.length === 0, errors };
}

/**
 * Runs a recipe's compute() with field values mapped through inputMap,
 * and returns results keyed by the result.key values in outputMap.
 * The renderer calls this. Returns null if validateFormula fails — caller
 * should show the "not configured" banner in that case.
 */
export function runFormula(
  formula: CalculatorFormula,
  fieldValues: Record<string, number>,
  availableFieldKeys: string[],
  availableResultKeys: string[],
): Record<string, RecipeResult> | null {
  const validation = validateFormula(formula, availableFieldKeys, availableResultKeys);
  if (!validation.valid) return null;
  const recipe = getRecipe(formula.recipe)!;
  // Build recipe-input object by pulling from fieldValues via inputMap
  const recipeInputs: Record<string, number> = {};
  for (const input of recipe.inputs) {
    const fieldKey = formula.inputMap[input.key];
    recipeInputs[input.key] = fieldValues[fieldKey] ?? 0;
  }
  const recipeResults = recipe.compute(recipeInputs, formula.constants);
  // Remap result keys through outputMap
  const output: Record<string, RecipeResult> = {};
  for (const recipeOutKey of Object.keys(recipeResults)) {
    const uiKey = formula.outputMap[recipeOutKey] ?? recipeOutKey;
    output[uiKey] = recipeResults[recipeOutKey];
  }
  return output;
}
