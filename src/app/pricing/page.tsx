import type { Metadata } from "next";
import { CTA } from "@/components/sections/CTA";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata("Pricing", "Simple pricing for short-term rental operators and property managers.", "/pricing");

export default function PricingPage() {
  const plans = [{ name: "Starter", price: "$9", desc: "For solo hosts and first units." }, { name: "Growth", price: "$29", desc: "For growing portfolios with automations." }, { name: "Scale", price: "Custom", desc: "For multi-market teams and operators." }];
  return <div className="min-h-screen bg-background"><section className="container mx-auto px-4 py-20 text-center max-w-4xl"><h1 className="font-display text-5xl font-bold mb-6">Simple pricing that scales with you</h1><p className="text-xl text-muted-foreground mb-12">Start lean, automate fast, and upgrade only when your portfolio demands it.</p><div className="grid md:grid-cols-3 gap-6">{plans.map((plan) => <div key={plan.name} className="rounded-3xl border border-border bg-card p-8 shadow-sm"><div className="text-sm uppercase tracking-wider text-primary font-bold mb-4">{plan.name}</div><div className="font-display text-5xl font-bold mb-4">{plan.price}</div><p className="text-muted-foreground">{plan.desc}</p></div>)}</div></section><CTA title="See Mr. Props in action" text="Book a walkthrough or start free." /></div>;
}
