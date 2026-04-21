"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CalculatorLayout } from "./CalculatorLayout";
import { CalculatorUiCopy, getFieldCopy, getResultCopy } from "./calculatorCopy";

interface CalculatorCopyProps {
  title?: string;
  description?: string;
  category?: string;
  toolName?: string;
  seoContent?: React.ReactNode;
  calculatorUi?: CalculatorUiCopy;
}

/**
 * Airbnb Expense Calculator — Phase A hand-patch (2026-04-21).
 *
 * Real math, replacing the GenericCalculator dummy-sum fallback that was
 * producing nonsensical output on the published page (revenue + expenses +
 * platform_fee_pct added together as dollars, then multiplied by 12, etc).
 *
 * Business logic:
 *   platformFeeDollars  = monthlyRevenue × (platformFeePct / 100)
 *   netRevenue          = monthlyRevenue − platformFeeDollars
 *   netProfitMonthly    = netRevenue − operatingExpenses − fixedCosts
 *   netRevenuePerNight  = (bookedNights > 0) ? netRevenue / bookedNights : 0
 *
 * Field keys match the LLM-generated structured_data.calculatorUi on the
 * live piece (monthlyRevenue / operatingExpenses / fixedCosts / platformFee /
 * bookedNights). getFieldCopy / getResultCopy fall back to the labels below
 * if the structured_data is later edited.
 *
 * This component will be superseded in Phase B by a recipe-driven
 * GenericCalculator running `expense_summary` from calculator-recipes.ts.
 */
export function AirbnbExpenseCalculator({
  title = "Airbnb Expense Calculator",
  description = "Track every hosting cost and see your true net revenue in seconds.",
  category = "Booking",
  toolName = "Airbnb Expense Calculator",
  seoContent,
  calculatorUi,
}: CalculatorCopyProps) {
  const [monthlyRevenue, setMonthlyRevenue] = useState(5000);
  const [operatingExpenses, setOperatingExpenses] = useState(800);
  const [fixedCosts, setFixedCosts] = useState(1800);
  const [platformFee, setPlatformFee] = useState(3);
  const [bookedNights, setBookedNights] = useState(20);

  const revenueCopy = getFieldCopy(
    calculatorUi,
    "monthlyRevenue",
    "Monthly Revenue ($)",
    "Total rental income your property generates before any deductions.",
  );
  const opexCopy = getFieldCopy(
    calculatorUi,
    "operatingExpenses",
    "Operating Expenses ($)",
    "Recurring costs tied directly to running the listing: cleaning fees, platform commissions, supplies, and maintenance.",
  );
  const fixedCopy = getFieldCopy(
    calculatorUi,
    "fixedCosts",
    "Fixed Costs ($)",
    "Obligations that don't move with occupancy: mortgage or rent, insurance premiums, HOA dues, and property taxes.",
  );
  const platformFeeCopy = getFieldCopy(
    calculatorUi,
    "platformFee",
    "Platform Fee (%)",
    "Airbnb host service fee as a percentage of booking subtotal (typically 3%).",
  );
  const nightsCopy = getFieldCopy(
    calculatorUi,
    "bookedNights",
    "Booked Nights Per Month",
    "Number of nights your property is booked each month.",
  );

  const netRevenueCopy = getResultCopy(
    calculatorUi,
    "netRevenue",
    "Net Revenue",
    "Gross booking income minus platform fees.",
  );
  const netProfitCopy = getResultCopy(
    calculatorUi,
    "netProfit",
    "Net Profit",
    "Net revenue minus operating expenses and fixed costs.",
  );
  const perNightCopy = getResultCopy(
    calculatorUi,
    "netRevenuePerNight",
    "Net Revenue Per Booked Night",
    "Net revenue divided by booked nights — what each night actually earns after fees.",
  );

  // Real math
  const platformFeeDollars = monthlyRevenue * (platformFee / 100);
  const netRevenue = Math.max(0, monthlyRevenue - platformFeeDollars);
  const netProfit = netRevenue - operatingExpenses - fixedCosts;
  const netRevenuePerNight = bookedNights > 0 ? netRevenue / bookedNights : 0;

  const fmt = (n: number) => `$${Math.round(n).toLocaleString()}`;

  const inputs = (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-base font-bold">{revenueCopy.label}</Label>
        {revenueCopy.helpText && <p className="text-xs text-muted-foreground">{revenueCopy.helpText}</p>}
        <Input
          type="number"
          value={monthlyRevenue}
          onChange={(e) => setMonthlyRevenue(Number(e.target.value) || 0)}
          className="h-12 text-lg"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-base font-bold">{opexCopy.label}</Label>
        {opexCopy.helpText && <p className="text-xs text-muted-foreground">{opexCopy.helpText}</p>}
        <Input
          type="number"
          value={operatingExpenses}
          onChange={(e) => setOperatingExpenses(Number(e.target.value) || 0)}
          className="h-12 text-lg"
        />
      </div>

      <div className="space-y-2">
        <Label className="text-base font-bold">{fixedCopy.label}</Label>
        {fixedCopy.helpText && <p className="text-xs text-muted-foreground">{fixedCopy.helpText}</p>}
        <Input
          type="number"
          value={fixedCosts}
          onChange={(e) => setFixedCosts(Number(e.target.value) || 0)}
          className="h-12 text-lg"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-base font-bold">{platformFeeCopy.label}</Label>
          {platformFeeCopy.helpText && <p className="text-xs text-muted-foreground">{platformFeeCopy.helpText}</p>}
          <Input
            type="number"
            value={platformFee}
            onChange={(e) => setPlatformFee(Number(e.target.value) || 0)}
            min={0}
            max={100}
            step={0.1}
            className="h-12 text-lg"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-base font-bold">{nightsCopy.label}</Label>
          {nightsCopy.helpText && <p className="text-xs text-muted-foreground">{nightsCopy.helpText}</p>}
          <Input
            type="number"
            value={bookedNights}
            onChange={(e) => setBookedNights(Number(e.target.value) || 0)}
            min={0}
            max={31}
            className="h-12 text-lg"
          />
        </div>
      </div>
    </div>
  );

  const results = (
    <div className="space-y-6 text-center">
      <div>
        <div className="text-sm font-bold uppercase tracking-wider opacity-80 mb-1">{netRevenueCopy.label}</div>
        <div className="text-5xl md:text-6xl font-display font-black tracking-tight">{fmt(netRevenue)}</div>
        {netRevenueCopy.helpText && <p className="text-xs opacity-70 mt-2">{netRevenueCopy.helpText}</p>}
      </div>
      <div className="grid grid-cols-2 gap-4 pt-2">
        <div className="bg-white/10 rounded-lg p-3">
          <div className="text-xs opacity-70 mb-1">{netProfitCopy.label}</div>
          <div className="font-bold text-xl">{fmt(netProfit)}</div>
        </div>
        <div className="bg-white/10 rounded-lg p-3">
          <div className="text-xs opacity-70 mb-1">{perNightCopy.label}</div>
          <div className="font-bold text-xl">{fmt(netRevenuePerNight)}</div>
        </div>
      </div>
    </div>
  );

  return (
    <CalculatorLayout
      title={title}
      description={description}
      category={category}
      toolName={toolName}
      inputs={inputs}
      results={results}
      seoContent={seoContent}
      calculatorUi={calculatorUi}
    />
  );
}
