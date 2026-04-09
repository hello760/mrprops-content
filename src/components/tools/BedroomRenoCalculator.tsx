"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
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

export function BedroomRenoCalculator({
  title = "Bedroom Renovation Estimator",
  description = "Calculate flooring, paint, and furnishing costs based on square footage.",
  category = "Renovations",
  toolName = "Bedroom Reno Calculator",
  seoContent,
  calculatorUi,
}: CalculatorCopyProps) {
  const [roomSize, setRoomSize] = useState([200]);
  const [materialQuality, setMaterialQuality] = useState([50]);

  const roomSizeCopy = getFieldCopy(calculatorUi, "roomSize", "Room Size (sq ft)");
  const materialQualityCopy = getFieldCopy(calculatorUi, "materialQuality", "Finish Quality", "Economy to Luxury");
  const estimatedCostCopy = getResultCopy(calculatorUi, "estimatedCost", "Estimated Cost", "Includes flooring, paint, furnishings, and labor based on national averages.");
  const estimatedCost = roomSize[0] * (materialQuality[0] / 2 + 20);

  const inputs = (
    <div className="space-y-8">
      <div className="space-y-4">
        <Label className="text-lg font-bold flex justify-between"><span>{roomSizeCopy.label}</span><span className="text-primary font-bold">{roomSize}</span></Label>
        <Slider value={roomSize} onValueChange={setRoomSize} max={1000} step={10} className="py-4" />
      </div>
      <div className="space-y-4">
        <Label className="text-lg font-bold flex justify-between"><span>{materialQualityCopy.label}</span><span className="text-muted-foreground font-normal text-sm">{materialQualityCopy.helpText}</span></Label>
        <Slider value={materialQuality} onValueChange={setMaterialQuality} max={100} step={10} className="py-4" />
        <div className="flex justify-between text-xs text-muted-foreground font-medium uppercase tracking-wider"><span>Basic</span><span>Standard</span><span>Premium</span></div>
      </div>
    </div>
  );

  const results = (
    <div className="space-y-6 text-center">
      <div className="bg-secondary/30 rounded-2xl p-8 flex flex-col justify-center items-center text-center space-y-4 border border-primary/10">
        <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{estimatedCostCopy.label}</div>
        <div className="text-5xl font-display font-bold text-primary">${estimatedCost.toLocaleString()}</div>
        {estimatedCostCopy.helpText && <p className="text-xs text-muted-foreground max-w-[200px]">{estimatedCostCopy.helpText}</p>}
      </div>
    </div>
  );

  return <CalculatorLayout title={title} description={description} category={category} toolName={toolName} inputs={inputs} results={results} seoContent={seoContent} calculatorUi={calculatorUi} />;
}
