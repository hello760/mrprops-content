"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Check, ShieldCheck, Zap, Database, Minus } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

export function PricingPageClient() {
  const [unitCount, setUnitCount] = useState(25);
  const [pricePerUnit, setPricePerUnit] = useState(10);
  const [tier, setTier] = useState<"starter" | "growth" | "scale">("growth");

  useEffect(() => {
    if (unitCount <= 9) {
      setPricePerUnit(9);
      setTier("starter");
    } else if (unitCount <= 19) {
      setPricePerUnit(8);
      setTier("growth");
    } else if (unitCount <= 29) {
      setPricePerUnit(7);
      setTier("growth");
    } else if (unitCount <= 39) {
      setPricePerUnit(6);
      setTier("growth");
    } else if (unitCount <= 49) {
      setPricePerUnit(5);
      setTier("growth");
    } else if (unitCount <= 59) {
      setPricePerUnit(4);
      setTier("scale");
    } else if (unitCount <= 69) {
      setPricePerUnit(3);
      setTier("scale");
    } else {
      setPricePerUnit(2);
      setTier("scale");
    }
  }, [unitCount]);

  const totalMonthlyCost = unitCount * pricePerUnit;

  return (
    <div className="min-h-screen bg-background pb-20 pt-20">
      <section className="container mx-auto px-4 max-w-5xl text-center mb-24">
        <div className="inline-block bg-primary/10 text-primary px-4 py-1.5 rounded-full font-bold text-sm mb-6 animate-in fade-in zoom-in duration-500">
          Simple, Transparent Pricing
        </div>
        <h1 className="font-display text-4xl md:text-6xl font-bold mb-6 tracking-tight">Pricing that scales with you.</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-16 leading-relaxed">
          The more you grow, the less you pay. No hidden setup fees, commission charges, or long-term contracts.
        </p>

        <div className="bg-card border border-border rounded-[2.5rem] p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto">
            <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-8">
              <div className="text-left w-full md:w-auto">
                <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">How many units?</div>
                <div className="font-display font-bold text-5xl flex items-baseline gap-2">
                  {unitCount === 150 ? "150+" : unitCount} <span className="text-xl text-muted-foreground font-medium">Units</span>
                </div>
              </div>

              <div className="text-right w-full md:w-auto">
                <div className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Total Monthly Cost</div>
                <div className="font-display font-bold text-6xl text-primary flex items-baseline justify-end gap-1">
                  {unitCount === 150 ? (
                    <span className="text-4xl">Contact Sales</span>
                  ) : (
                    <>
                      ${totalMonthlyCost.toLocaleString()}
                      <span className="text-xl text-muted-foreground font-medium">/mo</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="mb-12 relative px-4">
              <input type="range" min={1} max={150} step={1} value={unitCount} onChange={(e) => setUnitCount(Number(e.target.value))} className="py-4" />
              <div className="flex justify-between text-xs font-bold text-muted-foreground mt-2 px-1">
                <span>1 Unit</span>
                <span>75 Units</span>
                <span>150+ Units</span>
              </div>
            </div>

            <div className="bg-background/50 border border-border rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-sm">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <div className="text-left">
                  <div className="font-bold text-lg">Volume Discount Applied</div>
                  <div className="text-sm text-muted-foreground">You&apos;re saving based on scale.</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="text-right mr-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Your Rate</div>
                </div>
                <div className={cn("text-3xl font-black px-4 py-2 rounded-lg transition-all duration-300", tier === "scale" ? "bg-green-100 text-green-700" : tier === "growth" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700")}>
                  ${pricePerUnit}<span className="text-sm font-bold opacity-70">/unit</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-screen-xl mb-24">
        <div className="grid md:grid-cols-3 gap-8 items-stretch">
          {[
            ["starter", "Starter", "$9", "Perfect for new hosts managing a few properties.", ["Unified Inbox", "Channel Manager", "Basic Reporting", "AI Auto-Responses"]],
            ["growth", "Growth", "$5 - $8", "For professional managers scaling up operations.", ["Everything in Starter", "AI Auto-Responses"]],
            ["scale", "Scale", "$2 - $4", "Maximum automation for large portfolios.", ["Everything in Growth", "Dedicated Account Mgr", "API Access", "AI Auto-Responses"]],
          ].map(([key, title, price, desc, items]) => (
            <div key={String(key)} className={cn("rounded-3xl p-8 border-2 transition-all duration-300 relative flex flex-col", tier === key ? "border-primary bg-primary/5 shadow-xl scale-105 z-10" : "border-border bg-card opacity-80 hover:opacity-100")}>
              {tier === key && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">Best for You</div>}
              <div className="mb-6">
                <h3 className="font-display font-bold text-2xl mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm">{desc}</p>
              </div>
              <div className="mb-8">
                <span className="text-4xl font-bold">{price}</span>
                <span className="text-muted-foreground font-medium">/unit</span>
              </div>
              <ul className="space-y-4 mb-8 flex-1">
                {(items as string[]).map((item) => <li key={item} className="flex gap-3 text-sm"><Check className="h-5 w-5 text-green-500 flex-shrink-0" /> {item}</li>)}
                {unitCount >= 5 && <li className="flex gap-3 text-sm font-bold text-green-600 animate-in fade-in"><Check className="h-5 w-5 text-green-600 flex-shrink-0" /> Free White Glove Migration</li>}
              </ul>
              <Button variant={tier === key ? "default" : "outline"} className="w-full font-bold rounded-xl" asChild>
                <a href="https://app.mrprops.io/register">Start Free Trial</a>
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="py-24 mb-24">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="bg-gradient-to-br from-primary via-purple-600 to-blue-600 rounded-[3rem] p-12 md:p-20 text-center text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-white rounded-full blur-[100px]" />
              <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-white rounded-full blur-[100px]" />
            </div>
            <div className="relative z-10">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md px-6 py-2 rounded-full font-bold text-sm mb-8 border border-white/20 shadow-lg animate-in zoom-in duration-700">
                <Zap className="h-4 w-4 text-yellow-300 fill-yellow-300" /> 10x Your Efficiency
              </div>
              <h2 className="font-display text-4xl md:text-6xl font-bold mb-8 leading-tight tracking-tight">
                With Mr. Props, managing <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">100 units</span> is as easy as <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">managing 10.</span>
              </h2>
              <p className="text-xl md:text-2xl text-white/90 leading-relaxed max-w-3xl mx-auto font-medium">
                Our AI chat and automation workflows handle the chaos. <br className="hidden md:block" />
                You will save more time with us than with any other rental platform.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-secondary/30 border-y border-border py-24 mb-24 overflow-hidden">
        <div className="container mx-auto px-4 max-w-screen-xl">
          <div className="text-center mb-16">
            <h2 className="font-display text-3xl md:text-5xl font-bold mb-6">Stop paying for a fragmented stack.</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">Why pay for 5 different tools when you can have one operating system?</p>
          </div>

          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="bg-card rounded-3xl p-8 shadow-xl border border-border">
              <div className="space-y-4 mb-8">
                {[ ["PriceLabs (Dynamic Pricing)", "$20/unit"], ["Breezeway (Operations)", "$15/unit"], ["Touch Stay (Guidebooks)", "$10/mo"], ["Guesty/Hostaway (PMS)", "$15/unit"] ].map(([n, v]) => (
                  <div key={String(n)} className="flex justify-between items-center text-muted-foreground line-through decoration-red-500 decoration-2 opacity-70">
                    <span className="flex items-center gap-2"><Minus className="h-4 w-4" /> {n}</span>
                    <span>{v}</span>
                  </div>
                ))}
              </div>

              <div className="border-t-2 border-dashed border-border my-6" />

              <div className="flex justify-between items-center">
                <div>
                  <div className="font-bold text-lg">Total Competitor Cost</div>
                  <div className="text-sm text-red-500 font-bold">~$60+ per unit</div>
                </div>
                <div className="text-right">
                  <div className="font-display font-bold text-3xl text-primary">Mr. Props</div>
                  <div className="text-green-600 font-bold text-xl">${pricePerUnit} <span className="text-sm text-muted-foreground font-medium text-foreground">/unit</span></div>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="flex gap-4"><div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0"><Zap className="h-6 w-6" /></div><div><h3 className="font-bold text-xl mb-2">AI-Native</h3><p className="text-muted-foreground">We don&apos;t just chat; we automate communication. Our AI handles 80% of guest inquiries without you.</p></div></div>
              <div className="flex gap-4"><div className="h-12 w-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 flex-shrink-0"><Database className="h-6 w-6" /></div><div><h3 className="font-bold text-xl mb-2">Built-in Operations</h3><p className="text-muted-foreground">Automated workflows for plumbers, cleaners, and inspectors. No need for external tools like Breezeway.</p></div></div>
              <div className="flex gap-4"><div className="h-12 w-12 rounded-2xl bg-green-100 flex items-center justify-center text-green-600 flex-shrink-0"><ShieldCheck className="h-6 w-6" /></div><div><h3 className="font-bold text-xl mb-2">Scale without Chaos</h3><p className="text-muted-foreground">Our systems are designed so that managing 100 units feels as easy as managing 10.</p></div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-screen-xl mb-24">
        <h2 className="font-display text-3xl font-bold mb-12 text-center">Compare Plans</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[800px]">
            <thead>
              <tr>
                <th className="text-left p-4 border-b border-border w-1/3">Features</th>
                <th className="text-center p-4 border-b border-border w-1/5 font-bold">Starter</th>
                <th className="text-center p-4 border-b border-border w-1/5 font-bold text-primary">Growth</th>
                <th className="text-center p-4 border-b border-border w-1/5 font-bold">Scale</th>
              </tr>
            </thead>
            <tbody>
              {[
                { cat: "Operations", items: [ { name: "Unified Inbox", s: true, g: true, sc: true }, { name: "Multi-Calendar", s: true, g: true, sc: true }, { name: "AI Auto-Responses", s: true, g: true, sc: true }, { name: "Task Automation", s: false, g: true, sc: true } ] },
                { cat: "Financials", items: [ { name: "Expense Tracking", s: true, g: true, sc: true }, { name: "Trust Accounting", s: false, g: false, sc: true } ] },
                { cat: "Support", items: [ { name: "Email Support", s: true, g: true, sc: true }, { name: "Live Chat", s: false, g: true, sc: true }, { name: "Dedicated Manager", s: false, g: false, sc: true } ] },
              ].map((category, i) => (
                <tbody key={`group-${i}`}>
                  <tr><td colSpan={4} className="bg-secondary/30 p-3 font-bold text-sm uppercase tracking-wider text-muted-foreground">{category.cat}</td></tr>
                  {category.items.map((item, j) => (
                    <tr key={`item-${i}-${j}`} className="border-b border-border last:border-0 hover:bg-muted/10">
                      <td className="p-4 font-medium">{item.name}</td>
                      <td className="p-4 text-center text-muted-foreground">{item.s ? <Check className="h-5 w-5 mx-auto text-green-500" /> : <Minus className="h-5 w-5 mx-auto opacity-20" />}</td>
                      <td className="p-4 text-center text-foreground font-medium bg-primary/5">{item.g ? <Check className="h-5 w-5 mx-auto text-green-500" /> : <Minus className="h-5 w-5 mx-auto opacity-20" />}</td>
                      <td className="p-4 text-center text-muted-foreground">{item.sc ? <Check className="h-5 w-5 mx-auto text-green-500" /> : <Minus className="h-5 w-5 mx-auto opacity-20" />}</td>
                    </tr>
                  ))}
                </tbody>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-screen-xl mb-24">
        <h2 className="font-display text-3xl font-bold mb-12 text-center">Loved by 1,000+ Property Managers</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { text: "I switched from Hostaway and saved 10 hours a week on messaging alone.", author: "Sarah J.", role: "Manages 15 Units" },
            { text: "The messaging automation is actually reliable. We grew from 20 to 50 units without hiring more staff.", author: "Mike T.", role: "Manages 50 Units" },
            { text: "Finally, pricing that makes sense. The per-unit model saved us $500/mo immediately.", author: "Elena R.", role: "Manages 8 Units" }
          ].map((review, i) => (
            <div key={i} className="bg-card border border-border p-8 rounded-2xl shadow-sm hover:shadow-lg transition-all">
              <div className="flex text-yellow-400 mb-4">⭐⭐⭐⭐⭐</div>
              <p className="text-foreground mb-6 font-medium leading-relaxed">&quot;{review.text}&quot;</p>
              <div><div className="font-bold">{review.author}</div><div className="text-sm text-muted-foreground">{review.role}</div></div>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-3xl mb-24">
        <h2 className="font-display text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
        <Accordion type="single" collapsible className="w-full space-y-4 mb-16">
          <AccordionItem value="faq-1" className="border border-border bg-card rounded-xl px-6"><AccordionTrigger className="font-bold text-lg py-4 hover:no-underline">Do you charge per booking?</AccordionTrigger><AccordionContent className="text-muted-foreground pb-4">No. We believe you should keep your revenue. We charge a flat monthly fee per unit.</AccordionContent></AccordionItem>
          <AccordionItem value="faq-2" className="border border-border bg-card rounded-xl px-6"><AccordionTrigger className="font-bold text-lg py-4 hover:no-underline">Is there a setup fee?</AccordionTrigger><AccordionContent className="text-muted-foreground pb-4">No setup fees for self-onboarding. For portfolios over 20 units, we offer free white-glove migration services.</AccordionContent></AccordionItem>
          <AccordionItem value="faq-3" className="border border-border bg-card rounded-xl px-6"><AccordionTrigger className="font-bold text-lg py-4 hover:no-underline">Can I cancel anytime?</AccordionTrigger><AccordionContent className="text-muted-foreground pb-4">Yes, plans are month-to-month. You can upgrade, downgrade, or cancel at any time with no penalty.</AccordionContent></AccordionItem>
        </Accordion>

        <div className="bg-primary text-primary-foreground rounded-3xl p-12 text-center shadow-2xl shadow-primary/30">
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-6">Ready to automate your portfolio?</h2>
          <p className="text-xl text-primary-foreground/80 mb-8 max-w-xl mx-auto">Join thousands of hosts who are scaling faster with less work.</p>
          <Button size="lg" variant="secondary" className="rounded-full px-8 h-14 text-lg font-bold shadow-lg w-full sm:w-auto">Start Your 14-Day Free Trial</Button>
          <div className="mt-6 text-sm opacity-70">No credit card required. Cancel anytime.</div>
        </div>
      </section>
    </div>
  );
}
