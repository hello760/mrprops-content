import type { Metadata } from "next";
import Link from "next/link";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  metadataBase: new URL("https://mrprops.io"),
  title: { default: "Mr. Props — Property Management Software", template: "%s | Mr. Props" },
  description: "AI-powered property management tools for short-term rental hosts.",
  alternates: { canonical: "/" },
  openGraph: { type: "website", siteName: "Mr. Props", locale: "en_US" },
  twitter: { card: "summary_large_image", site: "@mrprops" },
  robots: { index: true, follow: true },
};

const menu = [
  { label: "Features", href: "/features/unified-inbox" },
  { label: "Solutions", href: "/services/property-managers" },
  { label: "Free Tools", href: "/tools" },
  { label: "Resources", href: "/guides" },
  { label: "Pricing", href: "/pricing" },
];

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body>
        <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur">
          <div className="container mx-auto flex h-20 max-w-screen-2xl items-center justify-between px-4">
            <Link href="/" className="mr-8 flex items-center space-x-3 transition-opacity hover:opacity-90">
              <div className="h-10 w-10 rounded-full bg-primary/10 p-1" />
              <span className="hidden font-display text-2xl font-bold tracking-tight sm:inline-block">Mr. Props</span>
            </Link>
            <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">{menu.map((item) => <Link key={item.href} href={item.href} className="py-2 transition-colors hover:text-primary text-muted-foreground">{item.label}</Link>)}</nav>
            <div className="hidden lg:flex items-center gap-4 ml-auto"><a href="https://app.mrprops.io/login" className="text-muted-foreground hover:text-foreground font-medium">Log In</a><a href="https://app.mrprops.io/register" className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 rounded-full px-6 py-3 font-bold">Get Started</a></div>
          </div>
        </header>
        <main>{children}</main>
        <footer className="border-t border-border/40 bg-background pt-16 pb-12"><div className="container mx-auto px-4"><div className="grid gap-12 lg:grid-cols-4"><div className="space-y-6"><div className="flex items-center space-x-2"><div className="h-8 w-8 rounded-full bg-primary/10 p-1" /><span className="font-display text-xl font-bold">Mr. Props</span></div><p className="text-muted-foreground leading-relaxed">Empowering property managers and hosts with high-energy tools, insights, and renovation strategies.</p><div className="text-sm text-muted-foreground pt-4">© {new Date().getFullYear()} Mr. Props. All rights reserved.</div></div><div><h3 className="mb-6 text-sm font-bold uppercase tracking-wider text-foreground">Free Tools</h3><ul className="space-y-4 text-sm text-muted-foreground"><li><Link href="/tools" className="hover:text-primary transition-colors block py-1">All Tools</Link></li><li><Link href="/templates" className="hover:text-primary transition-colors block py-1">Templates</Link></li><li><Link href="/compare" className="hover:text-primary transition-colors block py-1">Compare</Link></li></ul></div><div><h3 className="mb-6 text-sm font-bold uppercase tracking-wider text-foreground">Resources</h3><ul className="space-y-4 text-sm text-muted-foreground"><li><Link href="/guides" className="hover:text-primary transition-colors block py-1">All Guides</Link></li><li><Link href="/alternatives" className="hover:text-primary transition-colors block py-1">Alternatives</Link></li><li><Link href="/glossary" className="hover:text-primary transition-colors block py-1">Glossary</Link></li><li><Link href="/regulations" className="hover:text-primary transition-colors block py-1">Regulations</Link></li><li><Link href="/taxes" className="hover:text-primary transition-colors block py-1">Taxes</Link></li></ul></div><div><h3 className="mb-6 text-sm font-bold uppercase tracking-wider text-foreground">Company</h3><ul className="space-y-4 text-sm text-muted-foreground"><li><Link href="/pricing" className="hover:text-primary transition-colors block py-1">Pricing</Link></li><li><a href="https://app.mrprops.io/register" className="hover:text-primary transition-colors block py-1">Get Started</a></li></ul></div></div></div></footer>
      </body>
    </html>
  );
}
