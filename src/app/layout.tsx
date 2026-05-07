import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  metadataBase: new URL("https://mrprops.io"),
  title: { default: "Mr. Props | #1 Property Management Operating System", template: "%s | Mr. Props" },
  description: "Automate your rentals, optimize your yields, and master the market with Mr. Props.",
  alternates: { canonical: "/" },
  // Defaults inherited by any page that doesn't set its own openGraph.images
  // via buildMetadata. Static listing pages (/, /tools, /templates, /glossary,
  // /pricing) rely on this fallback so Slack / LinkedIn / Twitter previews
  // always render a thumbnail. Per Helvis 2026-05-07 OG audit.
  openGraph: {
    type: "website",
    siteName: "Mr. Props",
    locale: "en_US",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Mr. Props" }],
  },
  twitter: {
    card: "summary_large_image",
    site: "@mrprops",
    images: ["/og-image.png"],
  },
  robots: { index: true, follow: true },
  icons: { icon: "/favicon.png" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body>
        <div className="min-h-screen flex flex-col bg-background font-sans antialiased text-foreground">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
