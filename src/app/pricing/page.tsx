import type { Metadata } from "next";
import { PricingPageClient } from "@/components/client/PricingPageClient";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata("Pricing", "Simple pricing for short-term rental operators and property managers.", "/pricing");

export default function PricingPage() {
  return <PricingPageClient />;
}
