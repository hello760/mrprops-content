"use client";

import { useState } from "react";
import { Check, Loader2, Mail, Lock, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LeadGenModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export function LeadGenModal({ isOpen, onClose, title = "Get Your Report" }: LeadGenModalProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        setEmail("");
      }, 3000);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-[425px] overflow-hidden rounded-[2rem] bg-white shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] dark:bg-zinc-950">
        <div className="relative overflow-hidden bg-gradient-to-br from-violet-600 via-primary to-indigo-600 p-8 pt-12 text-center">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay" />
          <button onClick={onClose} className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white transition-colors backdrop-blur-sm hover:bg-white/20">
            <X className="h-4 w-4" />
          </button>
          <div className="relative mx-auto mb-6 flex h-20 w-20 rotate-3 transform items-center justify-center rounded-3xl bg-white shadow-xl transition-transform duration-500 hover:rotate-0">
            {isSuccess ? <Check className="h-10 w-10 text-green-500" /> : <Sparkles className="relative z-10 h-10 w-10 text-primary" />}
          </div>
          <h2 className="mb-2 font-display text-3xl font-bold tracking-tight text-white">{isSuccess ? "Sent Successfully!" : "Unlock Full Report"}</h2>
          <p className="mx-auto max-w-xs text-base font-medium text-indigo-100">{isSuccess ? `We've emailed the PDF to ${email}` : "Get the detailed breakdown, 5-year projections, and tax saving tips."}</p>
        </div>

        <div className="bg-white p-8 dark:bg-zinc-950">
          {isSuccess ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="flex w-full items-center justify-center gap-2 rounded-xl border border-green-100 bg-green-50 p-4 text-center text-sm font-bold text-green-700">
                <Check className="h-4 w-4" /> Check your inbox in 2 mins
              </div>
              <Button onClick={onClose} variant="outline" className="h-12 w-full rounded-xl font-bold">Close Window</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="ml-1 text-sm font-bold uppercase tracking-wider text-muted-foreground">Work Email</Label>
                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <Mail className="h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  </div>
                  <Input id="email" type="email" placeholder="name@company.com" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-14 rounded-2xl border-slate-200 bg-slate-50 pl-11 text-lg font-medium shadow-inner transition-all focus:border-primary focus:ring-4 focus:ring-primary/10 dark:border-zinc-800 dark:bg-zinc-900" />
                </div>
              </div>
              <Button type="submit" className="h-14 w-full rounded-2xl bg-primary text-lg font-bold shadow-xl shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary/90 active:translate-y-0" disabled={isLoading}>
                {isLoading ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Preparing PDF...</> : <span className="flex items-center gap-2">Email Me The Report <Lock className="h-4 w-4 opacity-50" /></span>}
              </Button>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Trusted by 10,000+ hosts. <span className="underline decoration-dotted">No spam guarantee.</span></p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
