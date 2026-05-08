"use client";

/**
 * NewsletterCTA — the big purple "Join smart hosts" block.
 *
 * Originally lived inline in GuideIndexClient. Refactored into a reusable
 * component used across 8 listing pages (footer is separate, uses
 * NewsletterFormInline).
 *
 * Source attribution via `source` prop (e.g. "tools_cta").
 */

import { useState } from "react";
import { Check } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface Props {
  source?: string;
  /** Override headline if needed per page. Default: "Join hosts running smarter portfolios" */
  headline?: string;
  /** Override subhead if needed per page */
  subhead?: string;
}

type State = "idle" | "loading" | "success" | "alreadyMember" | "error";

const DEFAULT_HEADLINE = "Join hosts running smarter portfolios";
const DEFAULT_SUBHEAD =
  "Get weekly tips on hybrid portfolios, off-season flips, and the unit economics most operators miss — from Helvis, who manages 6 mixed STR + LTR units in Europe.";

export function NewsletterCTA({ source = "guides_cta", headline, subhead }: Props) {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "loading") return;
    setState("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          website,
          source,
          source_url: typeof window !== "undefined" ? window.location.pathname : null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState("error");
        setErrorMsg(json?.error || "Something went wrong — try again.");
        return;
      }
      setState(json?.alreadyMember ? "alreadyMember" : "success");
    } catch {
      setState("error");
      setErrorMsg("Network error — try again.");
    }
  }

  return (
    <div className="bg-primary text-primary-foreground rounded-3xl p-8 md:p-12 mb-16 flex flex-col md:flex-row items-center justify-between gap-8 shadow-xl shadow-primary/20 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
      <div className="relative z-10 space-y-4 max-w-xl text-center md:text-left">
        <h3 className="font-display text-2xl md:text-3xl font-bold">{headline ?? DEFAULT_HEADLINE}</h3>
        <p className="text-primary-foreground/80 text-lg">{subhead ?? DEFAULT_SUBHEAD}</p>
      </div>
      <div className="relative z-10 w-full md:w-auto">
        {state === "success" ? (
          <div className="flex items-center gap-3 rounded-xl bg-white/15 px-5 py-3 text-sm">
            <Check className="h-4 w-4 flex-shrink-0" />
            <span>Welcome aboard. Check your inbox → confirm your subscription → I'll start sharing the wisdom.</span>
          </div>
        ) : state === "alreadyMember" ? (
          <div className="flex items-center gap-3 rounded-xl bg-white/15 px-5 py-3 text-sm">
            <Check className="h-4 w-4 flex-shrink-0" />
            <span>Welcome back. You&apos;re already on the list.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3" noValidate>
            <label htmlFor={`nl-cta-website-${source}`} className="absolute left-[-9999px] top-[-9999px]" aria-hidden="true">
              Website
              <input
                id={`nl-cta-website-${source}`}
                type="text"
                tabIndex={-1}
                autoComplete="off"
                value={website}
                onChange={(e) => setWebsite(e.target.value)}
              />
            </label>
            <Input
              type="email"
              required
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={state === "loading"}
              className="h-12 bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20 min-w-[280px] rounded-xl"
            />
            <Button
              type="submit"
              variant="secondary"
              size="lg"
              disabled={state === "loading"}
              className="h-12 font-bold px-8 rounded-xl shadow-lg disabled:opacity-60"
            >
              {state === "loading" ? "…" : "Subscribe"}
            </Button>
          </form>
        )}
        {state === "error" && (
          <p className="mt-2 text-xs text-white/80">{errorMsg}</p>
        )}
        {state === "idle" && (
          <p className="mt-3 text-xs text-primary-foreground/60">
            By subscribing you agree to our{" "}
            <Link href="/company/privacy" className="underline hover:text-white">
              privacy policy
            </Link>
            . Unsubscribe anytime.
          </p>
        )}
      </div>
    </div>
  );
}
