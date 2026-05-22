"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trackContactFormSubmit, trackEvent } from "@/lib/analytics";

/**
 * Contact-form client wrapper.
 *
 * Markup is unchanged from the prior server-rendered `<form>` in
 * /company/contact/page.tsx; this client component only adds:
 *   - GA4 `contact_form_submit` + `generate_lead` events on submit
 *   - GA4 `form_start` event the first time a field gains focus (CRO funnel)
 *
 * The form itself is still a placeholder — there's no backend endpoint yet.
 * We capture the GA event anyway so the funnel can be measured even before
 * the backend lands.
 */
export function ContactForm() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [started, setStarted] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleFocus = () => {
    if (started) return;
    setStarted(true);
    trackEvent("form_start", { form_id: "contact_main" });
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    trackContactFormSubmit({
      form_id: "contact_main",
      inquiry_type: message.length > 280 ? "long" : "short",
    });
  };

  if (submitted) {
    return (
      <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
        <h3 className="font-bold text-2xl mb-2">Thanks — we got your note.</h3>
        <p className="text-muted-foreground">
          A real human reads every message. We&apos;ll respond within 24 hours.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
      <form className="space-y-6" onSubmit={onSubmit} onFocus={handleFocus}>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">First Name</label>
            <Input
              placeholder="Helvis"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Last Name</label>
            <Input
              placeholder="Schmotex"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Email</label>
          <Input
            type="email"
            placeholder="helvis@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium">Message</label>
          <Textarea
            placeholder="How can we help you?"
            className="min-h-[150px]"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>
        <Button
          type="submit"
          className="w-full bg-primary hover:bg-primary/90 h-12 text-lg"
          data-analytics-cta="contact_form_submit"
          data-analytics-cta-label="Send Message"
          data-analytics-cta-location="contact_form"
        >
          Send Message
        </Button>
      </form>
    </div>
  );
}
