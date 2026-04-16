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
      {
        source: "/airbnb-profit-calculator",
        destination: "/tools/booking/airbnb-profit-calculator",
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
