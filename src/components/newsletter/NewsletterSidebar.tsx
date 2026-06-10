"use client";

/**
 * NewsletterSidebar — compact VERTICAL newsletter signup for narrow sidebars
 * (e.g. the /regulations right rail). Same copy + same subscribe wiring as
 * NewsletterCTA (POST /api/newsletter/subscribe, honeypot, analytics, states),
 * but stacked full-width to fit the ~350px column. Identical across every page
 * that renders it — no per-page content.
 */

import { useState } from "react";
import { Check } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  trackNewsletterAttempt,
  trackNewsletterError,
  trackNewsletterSuccess,
} from "@/lib/analytics";

interface Props {
  source?: string;
}

type State = "idle" | "loading" | "success" | "alreadyMember" | "error";

const HEADLINE = "Join hosts running smarter portfolios";
const SUBHEAD =
  "Weekly tips on hybrid portfolios, off-season flips, and the unit economics most operators miss — from Helvis, who runs 6 STR + LTR units in Europe.";

export function NewsletterSidebar({ source = "regulations_sidebar" }: Props) {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "loading") return;
    setState("loading");
    setErrorMsg("");
    const sourceUrl =
      typeof window !== "undefined" ? window.location.pathname : undefined;
    trackNewsletterAttempt({ source, source_url: sourceUrl });
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          website, // honeypot
          source,
          source_url: typeof window !== "undefined" ? window.location.pathname : null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setState("error");
        setErrorMsg(json?.error || "Something went wrong — try again.");
        trackNewsletterError({ source, source_url: sourceUrl, error_message: json?.error || "http_error" });
        return;
      }
      const alreadyMember = Boolean(json?.alreadyMember);
      setState(alreadyMember ? "alreadyMember" : "success");
      trackNewsletterSuccess({ source, source_url: sourceUrl, already_member: alreadyMember });
    } catch {
      setState("error");
      setErrorMsg("Network error — try again.");
      trackNewsletterError({ source, source_url: sourceUrl, error_message: "network_error" });
    }
  }

  return (
    <div className="bg-primary text-primary-foreground rounded-2xl p-6 border border-primary/20 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />
      <div className="relative z-10">
        <h3 className="font-display font-bold text-xl mb-2">{HEADLINE}</h3>
        <p className="text-sm text-primary-foreground/85 mb-5 leading-relaxed">{SUBHEAD}</p>

        {state === "success" ? (
          <div className="flex items-start gap-2 rounded-xl bg-white/15 px-4 py-3 text-sm">
            <Check className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>Welcome aboard. Check your inbox to confirm your subscription.</span>
          </div>
        ) : state === "alreadyMember" ? (
          <div className="flex items-start gap-2 rounded-xl bg-white/15 px-4 py-3 text-sm">
            <Check className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span>Welcome back — you&apos;re already on the list.</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
            <label htmlFor={`nl-side-website-${source}`} className="absolute left-[-9999px] top-[-9999px]" aria-hidden="true">
              Website
              <input
                id={`nl-side-website-${source}`}
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
              className="h-11 w-full bg-white/10 border-white/20 text-white placeholder:text-white/60 focus:bg-white/20 rounded-xl"
            />
            <Button
              type="submit"
              variant="secondary"
              disabled={state === "loading"}
              className="h-11 w-full font-bold rounded-xl shadow-lg text-primary disabled:opacity-60"
            >
              {state === "loading" ? "…" : "Subscribe"}
            </Button>
          </form>
        )}

        {state === "error" && <p className="mt-2 text-xs text-white/80">{errorMsg}</p>}
        {state === "idle" && (
          <p className="mt-3 text-xs text-primary-foreground/60">
            No spam. Unsubscribe anytime.{" "}
            <Link href="/company/privacy" className="underline hover:text-white">Privacy</Link>.
          </p>
        )}
      </div>
    </div>
  );
}
