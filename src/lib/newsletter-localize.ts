/**
 * newsletter-localize.ts
 *
 * Currency localization for newsletter emails.
 * Source-of-truth currency is EUR (matches Helvis's portfolio numbers).
 * At send time, all monetary values get converted to subscriber's currency
 * using rates from the fx_rates table, and formatted with the appropriate symbol.
 *
 * Country → currency mapping is a small lookup. Falls back to EUR if unknown.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// ─── Country → Currency map ─────────────────────────────────────────────────
// Best-effort mapping of common ISO-2 country codes to currencies.
// Falls back to EUR for any country not listed.
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  // Eurozone (EUR)
  AT: 'EUR', BE: 'EUR', CY: 'EUR', DE: 'EUR', EE: 'EUR', ES: 'EUR', FI: 'EUR',
  FR: 'EUR', GR: 'EUR', IE: 'EUR', IT: 'EUR', LT: 'EUR', LU: 'EUR', LV: 'EUR',
  MT: 'EUR', NL: 'EUR', PT: 'EUR', SI: 'EUR', SK: 'EUR', HR: 'EUR',
  // Major non-Euro
  US: 'USD', PR: 'USD', VI: 'USD', GU: 'USD',
  GB: 'GBP', IM: 'GBP', JE: 'GBP', GG: 'GBP',
  AU: 'AUD',
  CA: 'CAD',
  CH: 'CHF', LI: 'CHF',
  SE: 'SEK',
  NO: 'NOK',
  DK: 'DKK',
  PL: 'PLN',
  CZ: 'CZK',
  HU: 'HUF',
  RO: 'RON',
  BG: 'BGN',
  JP: 'JPY',
  // Default for everything else: EUR
};

export function countryToCurrency(country: string | null | undefined): string {
  if (!country) return 'EUR';
  return COUNTRY_TO_CURRENCY[country.toUpperCase()] ?? 'EUR';
}

// ─── Currency formatting ────────────────────────────────────────────────────

const CURRENCY_SYMBOL: Record<string, string> = {
  EUR: '€', USD: '$', GBP: '£', AUD: 'A$', CAD: 'C$', CHF: 'CHF ',
  SEK: 'kr ', NOK: 'kr ', DKK: 'kr ', PLN: 'zł ', CZK: 'Kč ',
  HUF: 'Ft ', RON: 'lei ', BGN: 'лв ', JPY: '¥',
};

/**
 * Format a number in the given currency. Whole units only (no decimals)
 * unless < 10, in which case one decimal place is shown.
 */
export function formatMoney(amount: number, currency: string): string {
  const sym = CURRENCY_SYMBOL[currency] ?? `${currency} `;
  const rounded = Math.abs(amount) < 10 ? Math.round(amount * 10) / 10 : Math.round(amount);
  // Symbol prefix for everything (consistent reading even for currencies that conventionally suffix)
  // Thousands separator with comma
  const formatted = rounded.toLocaleString('en-US', {
    maximumFractionDigits: rounded === Math.floor(rounded) ? 0 : 1,
  });
  return `${sym}${formatted}`;
}

// ─── FX conversion ──────────────────────────────────────────────────────────

interface FxRate {
  currency: string;
  rate_to_eur: number;
}

/**
 * Convert an amount in EUR to the target currency.
 * rate_to_eur means: 1 unit of `currency` = rate_to_eur units of EUR.
 * So to convert EUR → currency: amountInCurrency = amountEUR / rate_to_eur.
 */
export function convertFromEur(amountEur: number, targetCurrency: string, rates: Record<string, number>): number {
  if (targetCurrency === 'EUR') return amountEur;
  const rate = rates[targetCurrency];
  if (!rate || rate === 0) return amountEur; // fallback: keep EUR amount
  return amountEur / rate;
}

/**
 * Fetch FX rates from Supabase fx_rates table. Returns a map of currency→rate_to_eur.
 */
export async function fetchFxRates(sb: SupabaseClient): Promise<Record<string, number>> {
  const { data, error } = await sb.from('fx_rates').select('currency, rate_to_eur');
  if (error || !data) return { EUR: 1.0 };
  const map: Record<string, number> = { EUR: 1.0 };
  for (const r of data as FxRate[]) {
    map[r.currency] = r.rate_to_eur;
  }
  return map;
}

// ─── Helvis's portfolio numbers (EUR source-of-truth) ──────────────────────
// These are the canonical values referenced across email templates.
// Update here if Helvis revises.
export const PORTFOLIO_NUMBERS_EUR = {
  utility_burn_low: 300,                // €300/mo per empty unit
  utility_burn_high: 400,               // €400/mo per empty unit
  utility_burn_typical: 350,            // single representative number
  exchange_student_rent_low: 600,       // €600/mo
  exchange_student_rent_high: 700,      // €700/mo
  exchange_student_rent_typical: 650,
  ltr_rent_low: 450,                    // €450/mo open-market LTR
  ltr_rent_typical: 475,
  str_summer_rate_low: 60,              // €60/night summer peak
  str_summer_rate_high: 80,
  str_summer_rate_typical: 70,
  str_winter_rate_low: 30,              // €30/night winter floor
  str_winter_rate_high: 40,
  str_winter_rate_typical: 35,
  total_loss_last_winter: 17400,        // €17,400 across 3 units
  loss_per_unit_per_season: 6000,       // €6k per unit per off-season
} as const;

/**
 * Build the Postmark TemplateModel for a given email template + subscriber currency.
 * All monetary values pre-converted to subscriber's currency + formatted with symbol.
 */
export function buildLocalizedModel(
  currency: string,
  rates: Record<string, number>,
  extras?: Record<string, unknown>
): Record<string, unknown> {
  const conv = (eurAmount: number) => formatMoney(convertFromEur(eurAmount, currency, rates), currency);
  return {
    currency,
    utility_burn_low: conv(PORTFOLIO_NUMBERS_EUR.utility_burn_low),
    utility_burn_high: conv(PORTFOLIO_NUMBERS_EUR.utility_burn_high),
    utility_burn_typical: conv(PORTFOLIO_NUMBERS_EUR.utility_burn_typical),
    exchange_student_rent_low: conv(PORTFOLIO_NUMBERS_EUR.exchange_student_rent_low),
    exchange_student_rent_high: conv(PORTFOLIO_NUMBERS_EUR.exchange_student_rent_high),
    exchange_student_rent_typical: conv(PORTFOLIO_NUMBERS_EUR.exchange_student_rent_typical),
    ltr_rent_low: conv(PORTFOLIO_NUMBERS_EUR.ltr_rent_low),
    ltr_rent_typical: conv(PORTFOLIO_NUMBERS_EUR.ltr_rent_typical),
    str_summer_rate_low: conv(PORTFOLIO_NUMBERS_EUR.str_summer_rate_low),
    str_summer_rate_high: conv(PORTFOLIO_NUMBERS_EUR.str_summer_rate_high),
    str_summer_rate_typical: conv(PORTFOLIO_NUMBERS_EUR.str_summer_rate_typical),
    str_winter_rate_low: conv(PORTFOLIO_NUMBERS_EUR.str_winter_rate_low),
    str_winter_rate_high: conv(PORTFOLIO_NUMBERS_EUR.str_winter_rate_high),
    str_winter_rate_typical: conv(PORTFOLIO_NUMBERS_EUR.str_winter_rate_typical),
    total_loss_last_winter: conv(PORTFOLIO_NUMBERS_EUR.total_loss_last_winter),
    loss_per_unit_per_season: conv(PORTFOLIO_NUMBERS_EUR.loss_per_unit_per_season),
    ...extras,
  };
}
