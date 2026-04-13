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
    ];
  },
};

export default nextConfig;
