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

export function CleaningFeeEstimator({
  title = "Cleaning Fee Calculator",
  description = "Set a profitable cleaning fee without hurting conversion.",
  category = "Operations",
  toolName = "Cleaning Fee Calculator",
  seoContent,
  calculatorUi,
}: CalculatorCopyProps) {
  const [cleanerRate, setCleanerRate] = useState(35);
  const [hours, setHours] = useState([3]);
  const [supplies, setSupplies] = useState(18);
  const [buffer, setBuffer] = useState([15]);

  const baseCost = cleanerRate * hours[0] + supplies;
  const recommendedFee = baseCost * (1 + buffer[0] / 100);

  const cleanerRateCopy = getFieldCopy(calculatorUi, "cleanerRate", "Cleaner hourly rate ($)");
  const suppliesCopy = getFieldCopy(calculatorUi, "supplies", "Supplies & linen per turn ($)");
  const hoursCopy = getFieldCopy(calculatorUi, "hours", "Cleaning hours");
  const bufferCopy = getFieldCopy(calculatorUi, "buffer", "Operator buffer", "Use a small buffer to cover coordination, consumables, and surprise resets.");
  const recommendedFeeCopy = getResultCopy(calculatorUi, "recommendedFee", "Recommended Guest Cleaning Fee");
  const baseTurnCostCopy = getResultCopy(calculatorUi, "baseTurnCost", "Base Turn Cost");
  const bufferAddedCopy = getResultCopy(calculatorUi, "bufferAdded", "Buffer Added");

  const inputs = (
    <div className="space-y-8">
      <div className="grid md:grid-cols-2 gap-6">
        <div className="space-y-2"><Label>{cleanerRateCopy.label}</Label><Input type="number" value={cleanerRate} onChange={(e) => setCleanerRate(Number(e.target.value))} /></div>
        <div className="space-y-2"><Label>{suppliesCopy.label}</Label><Input type="number" value={supplies} onChange={(e) => setSupplies(Number(e.target.value))} /></div>
      </div>
      <div className="space-y-4">
        <div className="flex justify-between items-center"><Label className="text-lg font-bold">{hoursCopy.label}</Label><span className="text-2xl font-display font-bold text-primary">{hours[0]}h</span></div>
        <Slider value={hours} onValueChange={setHours} min={1} max={8} step={0.5} className="py-2" />
      </div>
      <div className="space-y-4">
        <div className="flex justify-between items-center"><Label className="text-lg font-bold">{bufferCopy.label}</Label><span className="text-2xl font-display font-bold text-primary">{buffer[0]}%</span></div>
        <Slider value={buffer} onValueChange={setBuffer} min={0} max={40} step={1} className="py-2" />
        {bufferCopy.helpText && <p className="text-sm text-muted-foreground">{bufferCopy.helpText}</p>}
      </div>
    </div>
  );

  const results = (
    <div className="space-y-6 text-center">
      <div>
        <div className="text-sm font-bold uppercase tracking-wider opacity-80 mb-1">{recommendedFeeCopy.label}</div>
        <div className="text-5xl md:text-6xl font-display font-black tracking-tight">${Math.round(recommendedFee).toLocaleString()}</div>
      </div>
      <div className="grid grid-cols-2 gap-4 pt-2">
        <div className="bg-white/10 rounded-lg p-3"><div className="text-xs opacity-70 mb-1">{baseTurnCostCopy.label}</div><div className="font-bold text-xl">${Math.round(baseCost).toLocaleString()}</div></div>
        <div className="bg-white/10 rounded-lg p-3"><div className="text-xs opacity-70 mb-1">{bufferAddedCopy.label}</div><div className="font-bold text-xl">${Math.round(recommendedFee - baseCost).toLocaleString()}</div></div>
      </div>
    </div>
  );

  return <CalculatorLayout title={title} description={description} category={category} toolName={toolName} inputs={inputs} results={results} seoContent={seoContent} calculatorUi={calculatorUi} />;
}
