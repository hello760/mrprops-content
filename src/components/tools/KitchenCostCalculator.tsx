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

export function KitchenCostCalculator({
  title = "Kitchen Cost Calculator",
  description = "Full gut renovation estimates including cabinets, countertops, and appliances.",
  category = "Renovations",
  toolName = "Kitchen Cost Calculator",
  seoContent,
  calculatorUi,
}: CalculatorCopyProps) {
  const [kitchenSize, setKitchenSize] = useState([150]);
  const [applianceTier, setApplianceTier] = useState("mid");

  const kitchenSizeCopy = getFieldCopy(calculatorUi, "kitchenSize", "Kitchen Size (sq ft)");
  const applianceTierCopy = getFieldCopy(calculatorUi, "applianceTier", "Appliance Tier");
  const estimatedCostCopy = getResultCopy(calculatorUi, "estimatedCost", "Estimated Cost", "Includes cabinetry, countertops, labor, and {applianceTier} appliances.");
  const estimatedCost = kitchenSize[0] * (applianceTier === "economy" ? 150 : applianceTier === "mid" ? 250 : 450);
  const estimatedCostHelpText = estimatedCostCopy.helpText?.replace("{applianceTier}", applianceTier);

  const inputs = (
    <div className="space-y-8">
      <div className="space-y-4">
        <Label className="text-lg font-bold flex justify-between"><span>{kitchenSizeCopy.label}</span><span className="text-primary font-bold">{kitchenSize}</span></Label>
        <Slider value={kitchenSize} onValueChange={setKitchenSize} max={500} step={10} className="py-4" />
      </div>
      <div className="space-y-4">
        <Label className="text-lg font-bold mb-2 block">{applianceTierCopy.label}</Label>
        <div className="grid grid-cols-3 gap-4">
          {["economy", "mid", "luxury"].map((tier) => (
            <div key={tier} onClick={() => setApplianceTier(tier)} className={`cursor-pointer rounded-xl border p-4 text-center capitalize transition-all font-medium ${applianceTier === tier ? 'border-primary bg-primary/5 text-primary ring-2 ring-primary/20' : 'border-border hover:border-primary/50'}`}>
              {tier}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const results = (
    <div className="space-y-6 text-center">
      <div className="bg-secondary/30 rounded-2xl p-8 flex flex-col justify-center items-center text-center space-y-4 border border-primary/10">
        <div className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{estimatedCostCopy.label}</div>
        <div className="text-5xl font-display font-bold text-primary">${estimatedCost.toLocaleString()}</div>
        {estimatedCostHelpText && <p className="text-xs text-muted-foreground max-w-[200px]">{estimatedCostHelpText}</p>}
      </div>
    </div>
  );

  return <CalculatorLayout title={title} description={description} category={category} toolName={toolName} inputs={inputs} results={results} seoContent={seoContent} calculatorUi={calculatorUi} />;
}
