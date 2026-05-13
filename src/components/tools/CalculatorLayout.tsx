"use client";

import { type ReactNode, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Download, ArrowRight, Home, ChevronRight, CheckCircle2, Zap, ShieldCheck,
  TrendingUp, TrendingDown, BarChart2, BarChart3, DollarSign, Calculator,
  Receipt, Target, Sliders, SlidersHorizontal, RefreshCw, FileText,
  AlertTriangle, MapPin, PieChart, PoundSterling, GitCompare, Filter,
  Percent, ClipboardCheck, CalendarDays, SplitSquareHorizontal,
  BadgePoundSterling, CalendarCheck, Clock, CheckCircle, Award, Compass,
  Eye, HelpCircle, Lightbulb, Map, Search, Settings,
  type LucideIcon,
} from "lucide-react";
import { LeadGenModal } from "./LeadGenModal";
import Link from "next/link";


import type { CalculatorUiCopy } from "./calculatorCopy";

/** Single benefit card — title + description + icon (Lucide name from CC). */
export interface BenefitItem {
  icon?: string;        // Lucide icon name (e.g. "TrendingUp"), kebab or PascalCase OK
  title: string;
  description: string;
}

interface CalculatorLayoutProps {
  title: string;
  description: string;
  inputs: ReactNode;
  results: ReactNode;
  seoContent?: ReactNode;
  category?: string;
  toolName?: string;
  calculatorUi?: CalculatorUiCopy;
  /**
   * 2026-05-09 (CC↔Live True Parity v3, Phase 1): benefits + benefitsIntro
   * are now passed directly from CC's `sd.benefits[]` and `sd.benefitsIntro`
   * via GenericCalculator → CalculatorLayout. When present, the "How is X
   * helpful?" section renders these verbatim. When absent, the entire
   * section is suppressed (no hardcoded Accuracy/Speed/Confidence fallback).
   * Replaces the prior `calculatorUi.layout.benefitStripItems` lookup which
   * was always empty for DB-driven calcs and silently fired the fallback.
   */
  benefits?: BenefitItem[];
  benefitsIntro?: string;
  /**
   * 2026-05-13 (CC↔Live True Parity v4): body-derived H2 verbatim for the
   * "How is X helpful?" section. Passed from CC's sd.benefitsTitle through
   * GenericCalculator. PRIORITY ORDER: prop `benefitsTitle` (body H2) >
   * legacy `calculatorUi.layout.helpfulHeading` (template) > hardcoded
   * "How is {toolName} helpful?" fallback. This makes the live page track
   * the body verbatim instead of normalizing case/wording.
   */
  benefitsTitle?: string;
}

/**
 * Resolve a Lucide icon name (PascalCase OR kebab-case) to a component.
 * Returns CheckCircle2 if unknown — keeps render alive on unrecognized icon.
 * The set covers every name observed in DB sd.benefits[].icon as of 2026-05-08.
 */
function resolveLucideIcon(name?: string): LucideIcon {
  if (!name) return CheckCircle2;
  const pascal = name
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join("");
  const map: Record<string, LucideIcon> = {
    TrendingUp, TrendingDown, BarChart2, BarChart3, DollarSign, Calculator,
    Receipt, Target, Sliders, SlidersHorizontal, ShieldCheck, RefreshCw,
    FileText, Zap, AlertTriangle, MapPin, PieChart, PoundSterling, GitCompare,
    Filter, Percent, ClipboardCheck, CalendarDays, SplitSquareHorizontal,
    BadgePoundSterling, CalendarCheck, Clock, CheckCircle, CheckCircle2,
    Award, Compass, Eye, HelpCircle, Lightbulb, Map, Search, Settings,
  };
  return map[pascal] || map[name] || CheckCircle2;
}

function interpolateTemplate(template: string | undefined, replacements: Record<string, string>) {
  if (!template) return "";
  return Object.entries(replacements).reduce(
    (value, [key, replacement]) => value.replaceAll(`{${key}}`, replacement),
    template,
  );
}

export function CalculatorLayout({
  title, description, inputs, results, seoContent, category = "General",
  toolName, calculatorUi, benefits, benefitsIntro, benefitsTitle,
}: CalculatorLayoutProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const reportButtonLabel = calculatorUi?.layout?.reportButtonLabel || "Email me this detailed report";
  const primaryCtaLabel = calculatorUi?.layout?.primaryCtaLabel || "Start Free Trial";
  const primaryCtaHref = calculatorUi?.layout?.primaryCtaHref || "https://app.mrprops.io/register";
  const trustBadgeText = calculatorUi?.layout?.trustBadgeText || "Based on 2026 Market Data";
  // 2026-05-13 (CC↔Live True Parity v4): prefer body-derived H2 verbatim
  // (sd.benefitsTitle from BSD's extractBenefitsBlock) before falling back
  // to the legacy template / hardcoded heading. Body H2 wins absolutely so
  // case/wording changes in CC flow to the live page without code edits.
  const helpfulHeading = benefitsTitle && benefitsTitle.trim()
    ? benefitsTitle.trim()
    : interpolateTemplate(
        calculatorUi?.layout?.helpfulHeading || "How is {toolName} helpful?",
        { title, toolName: toolName || "this calculator" },
      );
  // 2026-05-09 (CC↔Live True Parity v3, Phase 1):
  // helpfulText is the lead paragraph between H2 "How is X helpful?" and the
  // 3 benefit cards. PRIORITY: prop `benefitsIntro` (from sd.benefitsIntro,
  // extracted from body) > legacy `calculatorUi.layout.helpfulText`. If
  // neither is set, the paragraph is suppressed (no hardcoded "Most hosts
  // guess their numbers..." fallback).
  const helpfulText = benefitsIntro
    || interpolateTemplate(calculatorUi?.layout?.helpfulText || "", { title, toolName: toolName || "this calculator" });
  const reportModalTitle = interpolateTemplate(
    calculatorUi?.layout?.reportModalTitle || "Get Your {title} Report",
    { title, toolName: toolName || title },
  );
  // 2026-05-09 (CC↔Live True Parity v3, Phase 1):
  // benefits are now passed directly from CC's sd.benefits[]. The hardcoded
  // Accuracy/Speed/Confidence fallback is GONE — when CC has no benefits,
  // the entire "How is X helpful?" section is suppressed (see render below).
  // This closes the schema mismatch where CC wrote sd.benefits[] but the
  // renderer read calculatorUi.layout.benefitStripItems (always empty).
  const benefitItems: BenefitItem[] = benefits?.length
    ? benefits
    : (calculatorUi?.layout?.benefitStripItems || []).map((b) => ({
        icon: b.icon, title: b.title, description: b.description,
      }));
  const showBenefitsSection = benefitItems.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="py-12 md:py-20">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="space-y-16 md:space-y-24">
            <div className="space-y-12">
              <div className="text-center space-y-4 max-w-3xl mx-auto">
                <div className="flex items-center justify-center text-sm text-muted-foreground gap-2 overflow-x-auto whitespace-nowrap mb-4">
                  <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1"><Home className="h-3 w-3" /> Home</Link>
                  <ChevronRight className="h-4 w-4 flex-shrink-0" />
                  <Link href="/tools" className="hover:text-primary transition-colors">Free Tools</Link>
                  <ChevronRight className="h-4 w-4 flex-shrink-0" />
                  <Link href={`/tools/${category.toLowerCase()}`} className="hover:text-primary transition-colors">{category}</Link>
                  {toolName && (
                    <>
                      <ChevronRight className="h-4 w-4 flex-shrink-0" />
                      <span className="text-foreground font-medium truncate max-w-[200px]">{toolName}</span>
                    </>
                  )}
                </div>

                <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">{title}</h1>
                <p className="text-xl text-muted-foreground">{description}</p>
              </div>

              <div className="grid lg:grid-cols-12 gap-8 items-start max-w-7xl mx-auto">
                <div className="lg:col-span-7 space-y-6">
                  <div className="bg-card shadow-xl rounded-2xl border border-border overflow-hidden">
                    <div className="p-6 md:p-8">{inputs}</div>
                  </div>
                </div>

                <div className="lg:col-span-5 relative">
                  <div className="sticky top-24 space-y-6">
                    <div className="bg-card shadow-xl rounded-2xl border border-border overflow-hidden relative">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
                      <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -ml-5 -mb-5 pointer-events-none" />

                      <div className="p-8 relative z-10">
                        <div className="space-y-8">
                          {results}

                          <div className="pt-8 space-y-3">
                            <Button
                              onClick={() => setIsModalOpen(true)}
                              variant="secondary"
                              className="w-full font-bold rounded-xl gap-2 h-12 shadow-sm border border-border/50"
                            >
                              <Download className="h-4 w-4" /> {reportButtonLabel}
                            </Button>
                            <Button
                              variant="default"
                              className="w-full font-bold rounded-xl gap-2 h-12 shadow-lg shadow-primary/20"
                              asChild
                            >
                              <a href={primaryCtaHref}>
                                {primaryCtaLabel} <ArrowRight className="h-4 w-4" />
                              </a>
                            </Button>
                          </div>

                          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="opacity-70">
                              {trustBadgeText}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="max-w-4xl mx-auto space-y-20 text-center">
              {showBenefitsSection && (
                <>
                  <div>
                    <h2 className="font-display text-3xl md:text-4xl font-extrabold mb-8 tracking-tight">
                      {helpfulHeading.includes(toolName || "") ? (
                        <>
                          {helpfulHeading.split(toolName || "this calculator")[0]}
                          <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">{toolName || "this calculator"}</span>
                          {helpfulHeading.split(toolName || "this calculator").slice(1).join(toolName || "this calculator")}
                        </>
                      ) : (
                        helpfulHeading
                      )}
                    </h2>
                    {helpfulText && (
                      <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
                        {helpfulText}
                      </p>
                    )}
                  </div>

                  <div className="grid md:grid-cols-3 gap-8 text-center">
                    {benefitItems.map((item, i) => {
                      const Icon = resolveLucideIcon(item.icon);
                      return (
                        <div key={`${item.icon || 'b'}-${i}`} className="flex flex-col items-center p-6 bg-secondary/20 rounded-2xl">
                          <div className="h-14 w-14 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
                            <Icon className="h-7 w-7" />
                          </div>
                          <h3 className="font-bold text-lg mb-3">{item.title}</h3>
                          <p className="text-muted-foreground text-sm">{item.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              {seoContent && (
                <div className="prose prose-lg dark:prose-invert max-w-none mx-auto text-left">
                  {seoContent}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      
      

      <LeadGenModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={reportModalTitle} />
    </div>
  );
}
