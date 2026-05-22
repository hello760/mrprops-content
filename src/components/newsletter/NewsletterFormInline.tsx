"use client";

/**
 * NewsletterFormInline — compact email + arrow-button form.
 * Used in the Footer (every page). Replaces the prior decorative <form>.
 *
 * Source attribution flows through the `source` prop (e.g. "footer").
 * On submit POSTs to /api/newsletter/subscribe and shows inline success.
 */

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
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

export function NewsletterFormInline({ source = "footer" }: Props) {
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
        setErrorMsg(json?.error || "Something went wrong, try again in a sec.");
        trackNewsletterError({
          source,
          source_url: sourceUrl,
          error_message: json?.error || "http_error",
        });
        return;
      }
      if (json?.alreadyMember) {
        setState("alreadyMember");
        trackNewsletterSuccess({
          source,
          source_url: sourceUrl,
          already_member: true,
        });
      } else {
        setState("success");
        trackNewsletterSuccess({
          source,
          source_url: sourceUrl,
          already_member: false,
        });
      }
    } catch {
      setState("error");
      setErrorMsg("Network error — try again.");
      trackNewsletterError({
        source,
        source_url: sourceUrl,
        error_message: "network_error",
      });
    }
  }

  if (state === "success") {
    return (
      <div className="flex items-center gap-3 rounded-full bg-primary/10 px-4 py-3 text-sm text-foreground">
        <Check className="h-4 w-4 text-primary flex-shrink-0" />
        <span>Welcome aboard. Check your inbox → confirm your subscription → I'll start sharing the wisdom.</span>
      </div>
    );
  }
  if (state === "alreadyMember") {
    return (
      <div className="flex items-center gap-3 rounded-full bg-secondary/40 px-4 py-3 text-sm text-foreground">
        <Check className="h-4 w-4 text-primary flex-shrink-0" />
        <span>Welcome back. You&apos;re already on the list.</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="relative group" noValidate>
      {/* Honeypot — hidden from real users, visible to bots that auto-fill all form fields */}
      <label htmlFor={`nl-website-${source}`} className="absolute left-[-9999px] top-[-9999px]" aria-hidden="true">
        Website
        <input
          id={`nl-website-${source}`}
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
        className="h-12 bg-secondary/30 border-border rounded-full pr-12 focus-visible:ring-primary focus-visible:ring-offset-0 transition-all"
      />
      <Button
        type="submit"
        size="icon"
        disabled={state === "loading"}
        className="absolute right-1 top-1 h-10 w-10 rounded-full bg-primary hover:bg-primary/90 shadow-md disabled:opacity-60"
        aria-label="Subscribe to newsletter"
      >
        {state === "loading" ? (
          <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        ) : (
          <ArrowRight className="h-4 w-4" />
        )}
      </Button>
      {state === "error" && (
        <p className="mt-2 text-xs text-red-500">{errorMsg}</p>
      )}
    </form>
  );
}
