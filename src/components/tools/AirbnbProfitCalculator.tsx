"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
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

export function AirbnbProfitCalculator({
  title = "Airbnb Profitability Calculator",
  description = "Calculate your potential short-term rental profits with our advanced algorithm.",
  category = "Booking",
  toolName = "Airbnb Profitability Calculator",
  seoContent,
  calculatorUi,
}: CalculatorCopyProps) {
  const [adr, setAdr] = useState([180]);
  const [occupancy, setOccupancy] = useState([65]);
  const [rent, setRent] = useState(2000);
  const [cleaning, setCleaning] = useState(120);
  const [management, setManagement] = useState(0);

  const daysInMonth = 30;
  const bookingsPerMonth = Math.max(1, Math.round((daysInMonth * (occupancy[0] / 100)) / 3));
  const monthlyRevenue = adr[0] * daysInMonth * (occupancy[0] / 100);
  const cleaningFeesCollected = cleaning * bookingsPerMonth;
  const totalRevenue = monthlyRevenue + cleaningFeesCollected;
  const managementCost = totalRevenue * (management / 100);
  const cleaningCost = cleaningFeesCollected;
  const totalExpenses = rent + managementCost + cleaningCost;
  const netProfit = totalRevenue - totalExpenses;
  const annualProfit = netProfit * 12;
  const margin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

  const adrCopy = getFieldCopy(calculatorUi, "adr", "Average Daily Rate (ADR)");
  const occupancyCopy = getFieldCopy(calculatorUi, "occupancy", "Occupancy Rate");
  const rentCopy = getFieldCopy(calculatorUi, "rent", "Monthly Rent / Mortgage ($)");
  const cleaningCopy = getFieldCopy(calculatorUi, "cleaning", "Cleaning Fee per Stay ($)");
  const managementCopy = getFieldCopy(calculatorUi, "management", "Management Fee (%)");
  const monthlyProfitCopy = getResultCopy(calculatorUi, "monthlyProfit", "Estimated Monthly Profit");
  const annualProfitCopy = getResultCopy(calculatorUi, "annualProfit", "Annual Profit");
  const profitMarginCopy = getResultCopy(calculatorUi, "profitMargin", "Profit Margin");

  const inputs = (
    <div className="space-y-8">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label className="text-lg font-bold">{adrCopy.label}</Label>
          <span className="text-2xl font-display font-bold text-primary">${adr[0]}</span>
        </div>
        <Slider value={adr} onValueChange={setAdr} min={50} max={1000} step={5} className="py-2" />
        <div className="flex justify-between text-xs text-muted-foreground"><span>$50</span><span>$1000</span></div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <Label className="text-lg font-bold">{occupancyCopy.label}</Label>
          <span className="text-2xl font-display font-bold text-primary">{occupancy[0]}%</span>
        </div>
        <Slider value={occupancy} onValueChange={setOccupancy} min={0} max={100} step={1} className="py-2" />
        <div className="flex justify-between text-xs text-muted-foreground"><span>0%</span><span>100%</span></div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 pt-4">
        <div className="space-y-2"><Label>{rentCopy.label}</Label><Input type="number" value={rent} onChange={(e) => setRent(Number(e.target.value))} /></div>
        <div className="space-y-2"><Label>{cleaningCopy.label}</Label><Input type="number" value={cleaning} onChange={(e) => setCleaning(Number(e.target.value))} /></div>
        <div className="space-y-2"><Label>{managementCopy.label}</Label><Input type="number" value={management} onChange={(e) => setManagement(Number(e.target.value))} placeholder="e.g. 20" /></div>
      </div>
    </div>
  );

  const results = (
    <div className="space-y-6 text-center">
      <div>
        <div className="text-sm font-bold uppercase tracking-wider opacity-80 mb-1">{monthlyProfitCopy.label}</div>
        <div className="text-5xl md:text-6xl font-display font-black tracking-tight">${Math.round(netProfit).toLocaleString()}</div>
      </div>
      <div className="grid grid-cols-2 gap-4 pt-2">
        <div className="bg-white/10 rounded-lg p-3"><div className="text-xs opacity-70 mb-1">{annualProfitCopy.label}</div><div className="font-bold text-xl">${Math.round(annualProfit).toLocaleString()}</div></div>
        <div className="bg-white/10 rounded-lg p-3"><div className="text-xs opacity-70 mb-1">{profitMarginCopy.label}</div><div className="font-bold text-xl">{margin.toFixed(1)}%</div></div>
      </div>
    </div>
  );

  return <CalculatorLayout title={title} description={description} category={category} toolName={toolName} inputs={inputs} results={results} seoContent={seoContent} calculatorUi={calculatorUi} />;
}
