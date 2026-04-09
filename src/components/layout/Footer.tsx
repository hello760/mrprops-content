import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export function Footer() {
  return (
    <footer className="border-t border-border/40 bg-background pt-16 pb-12">
      <div className="container mx-auto px-4">
        <div className="grid gap-12 lg:grid-cols-4">
          <div className="space-y-6 order-2 lg:order-1">
            <div className="flex items-center space-x-2">
              <img src="/mascot.png" alt="Mr. Props Logo" className="h-8 w-8 rounded-full bg-primary/10 p-1" />
              <span className="font-display text-xl font-bold">Mr. Props</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">Empowering property managers and hosts with high-energy tools, insights, and renovation strategies.</p>
            <div className="flex space-x-4">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-all duration-300 text-xs font-bold">X</a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-all duration-300 text-xs font-bold">IG</a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-white transition-all duration-300 text-[10px] font-bold">IN</a>
            </div>
            <div className="text-sm text-muted-foreground pt-4">&copy; {new Date().getFullYear()} Mr. Props. All rights reserved.</div>
          </div>

          <div className="space-y-4 order-1 lg:order-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-primary">Stay in the Loop</h3>
            <p className="text-sm text-muted-foreground mb-4">Get the latest renovation tips and market insights delivered to your inbox.</p>
            <form className="relative group">
              <Input placeholder="Enter your email" className="h-12 bg-secondary/30 border-border rounded-full pr-12 focus-visible:ring-primary focus-visible:ring-offset-0 transition-all" />
              <Button type="submit" size="icon" className="absolute right-1 top-1 h-10 w-10 rounded-full bg-primary hover:bg-primary/90 shadow-md"><ArrowRight className="h-4 w-4" /></Button>
            </form>
          </div>

          <div className="order-3 lg:order-3">
            <h3 className="mb-6 text-sm font-bold uppercase tracking-wider text-foreground">Free Tools</h3>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li><Link href="/tools/finance/rental-yield-calculator" className="hover:text-primary cursor-pointer transition-colors block py-1">Rental Yield Calculator</Link></li>
              <li><Link href="/tools/renovations/renovation-calculator" className="hover:text-primary cursor-pointer transition-colors block py-1">Renovation ROI</Link></li>
              <li><Link href="/tools/booking/airbnb-profit-calculator" className="hover:text-primary cursor-pointer transition-colors block py-1">Airbnb Profit Calc</Link></li>
              <li><Link href="/tools/booking/cleaning-fee-calculator" className="hover:text-primary cursor-pointer transition-colors block py-1">Cleaning Fee Estimator</Link></li>
              <li><Link href="/templates" className="hover:text-primary cursor-pointer transition-colors block py-1">Host Templates</Link></li>
            </ul>
          </div>

          <div className="order-4 lg:order-4 space-y-8">
            <div>
              <h3 className="mb-6 text-sm font-bold uppercase tracking-wider text-foreground">Resources</h3>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li><Link href="/guides" className="hover:text-primary cursor-pointer transition-colors block py-1">All Guides</Link></li>
                <li><Link href="/compare" className="hover:text-primary cursor-pointer transition-colors block py-1">Software Comparisons</Link></li>
                <li><Link href="/alternatives" className="hover:text-primary cursor-pointer transition-colors block py-1">Alternatives</Link></li>
                <li><Link href="/glossary" className="hover:text-primary cursor-pointer transition-colors block py-1">Glossary</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="mb-6 text-sm font-bold uppercase tracking-wider text-foreground">Company</h3>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li><Link href="/pricing" className="hover:text-primary cursor-pointer transition-colors block py-1">Pricing</Link></li>
                <li><a href="https://app.mrprops.io/register" className="hover:text-primary cursor-pointer transition-colors block py-1">Get Started</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
