import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.sanity.io" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  async redirects() {
    return [
      // Fix slug mismatch: Sanity uses hostaway-vs-guesty, old link uses guesty-vs-hostaway
      {
        source: "/compare/guesty-vs-hostaway",
        destination: "/compare/hostaway-vs-guesty",
        permanent: true,
      },
      // Redirect root-level calculator slugs to proper /tools/{category}/{slug} paths
      // (airbnb-profit-calculator skips intermediate — see cannibalization redirects below)
      {
        source: "/airbnb-profit-calculator",
        destination: "/tools/airbnb/airbnb-revenue-calculator",
        permanent: true,
      },
      {
        source: "/renovation-roi-calculator",
        destination: "/tools/booking/renovation-roi-calculator",
        permanent: true,
      },
      {
        source: "/cleaning-fee-calculator",
        destination: "/tools/booking/cleaning-fee-calculator",
        permanent: true,
      },
      // Cannibalization cleanup 2026-04-19: new 207-topic batch superseded these 4 published URLs.
      // Redirect to the winning new topic in each pair to preserve any inbound links / shares.
      {
        source: "/tools/booking/airbnb-profit-calculator",
        destination: "/tools/airbnb/airbnb-revenue-calculator",
        permanent: true,
      },
      {
        source: "/tools/cleaning/airbnb-profit-calculator",
        destination: "/tools/airbnb/airbnb-cleaning-fee-calculator",
        permanent: true,
      },
      {
        source: "/glossary/what-is-dynamic-pricing-1775749911",
        destination: "/glossary/what-is-dynamic-pricing-in-short-term-rentals",
        permanent: true,
      },
      {
        source: "/glossary/break-even-occupancy",
        destination: "/glossary/what-is-a-break-even-occupancy-rate",
        permanent: true,
      },
      // Redirect root-level template slugs to proper /templates/{category}/{slug} paths
      {
        source: "/guest-welcome-letter",
        destination: "/templates/guest-experience/airbnb-welcome-book",
        permanent: true,
      },
      {
        source: "/airbnb-welcome-letter-template-for-guests",
        destination: "/templates/template/airbnb-welcome-letter-template-for-guests",
        permanent: true,
      },
      {
        source: "/pet-policy-template",
        destination: "/templates/legal/house-rules-template",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
