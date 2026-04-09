"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
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

export function RenovationROICalculator({
  title = "Renovation ROI Calculator",
  description = "Should you upgrade that kitchen? Find out if the investment pays off.",
  category = "Renovations",
  toolName = "Renovation ROI Calculator",
  seoContent,
  calculatorUi,
}: CalculatorCopyProps) {
  const [cost, setCost] = useState(15000);
  const [rateIncrease, setRateIncrease] = useState(50);

  const occupancyRate = 0.65;
  const daysBooked = 30 * occupancyRate;
  const monthlyRevenueIncrease = rateIncrease * daysBooked;
  const annualRevenueIncrease = monthlyRevenueIncrease * 12;
  const monthsToBreakEven = cost / monthlyRevenueIncrease;
  const roiFirstYear = (annualRevenueIncrease / cost) * 100;

  const costCopy = getFieldCopy(calculatorUi, "cost", "Total Renovation Cost ($)", "Include materials and labor.");
  const rateIncreaseCopy = getFieldCopy(calculatorUi, "rateIncrease", "Expected Nightly Rate Increase", "How much more can you charge per night?");
  const monthsToBreakEvenCopy = getResultCopy(calculatorUi, "monthsToBreakEven", "Months to Break Even");
  const roiFirstYearCopy = getResultCopy(calculatorUi, "roiFirstYear", "1-Year ROI");
  const annualRevenueIncreaseCopy = getResultCopy(calculatorUi, "annualRevenueIncrease", "Annual Revenue Increase");

  const inputs = (
    <div className="space-y-8">
      <div className="space-y-4">
        <Label className="text-lg font-bold">{costCopy.label}</Label>
        <Input type="number" value={cost} onChange={(e) => setCost(Number(e.target.value))} className="text-lg p-6 font-display" />
        {costCopy.helpText && <p className="text-sm text-muted-foreground">{costCopy.helpText}</p>}
      </div>
      <div className="space-y-4">
        <div className="flex justify-between items-center"><Label className="text-lg font-bold">{rateIncreaseCopy.label}</Label><span className="text-2xl font-display font-bold text-primary">+${rateIncrease}</span></div>
        <Slider value={[rateIncrease]} onValueChange={(v) => setRateIncrease(v[0])} min={5} max={500} step={5} className="py-2" />
        {rateIncreaseCopy.helpText && <p className="text-sm text-muted-foreground">{rateIncreaseCopy.helpText}</p>}
      </div>
    </div>
  );

  const results = (
    <div className="space-y-6 text-center">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1"><div className="text-sm font-bold uppercase tracking-wider opacity-80">{monthsToBreakEvenCopy.label}</div><div className="text-4xl md:text-5xl font-display font-black tracking-tight">{monthsToBreakEven.toFixed(1)}</div></div>
        <div className="space-y-1"><div className="text-sm font-bold uppercase tracking-wider opacity-80">{roiFirstYearCopy.label}</div><div className="text-4xl md:text-5xl font-display font-black tracking-tight text-green-300">{roiFirstYear.toFixed(0)}%</div></div>
      </div>
      <div className="pt-4 border-t border-white/20"><div className="text-sm opacity-90 mb-1">{annualRevenueIncreaseCopy.label}</div><div className="text-3xl font-bold">+${Math.round(annualRevenueIncrease).toLocaleString()}</div></div>
    </div>
  );

  return <CalculatorLayout title={title} description={description} category={category} toolName={toolName} inputs={inputs} results={results} seoContent={seoContent} calculatorUi={calculatorUi} />;
}
