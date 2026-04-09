"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Menu, X, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

interface MenuItem {
  label: string;
  href?: string;
  dropdown?: SubMenuItem[];
  megaMenu?: boolean;
}

interface SubMenuItem {
  label: string;
  href: string;
  desc: string;
  highlight?: boolean;
}

const menuItems: MenuItem[] = [
  { label: "Features", dropdown: [
    { label: "Unified Inbox", href: "/features/unified-inbox", desc: "Manage all messages in one place" },
    { label: "Calendar", href: "/features/calendar", desc: "Sync bookings across platforms" },
    { label: "View All Features", href: "/features/all", desc: "Explore the full suite", highlight: true },
  ]},
  { label: "Solutions", dropdown: [
    { label: "For Property Managers", href: "/services/property-managers", desc: "Scale your portfolio efficiently" },
    { label: "For Airbnb Hosts", href: "/services/airbnb-hosts", desc: "Automate your single unit" },
    { label: "Demo Account", href: "https://app.mrprops.io/", desc: "Try it yourself" },
  ]},
  { label: "Free Tools", dropdown: [
    { label: "All Free Tools", href: "/tools", desc: "View all calculators & resources" },
    { label: "Rental Yield Calc", href: "/tools/finance/rental-yield-calculator", desc: "Calculate gross & net yield", highlight: true },
    { label: "Renovation ROI", href: "/tools/renovations/renovation-calculator", desc: "Calculate upgrade returns" },
    { label: "Airbnb Profit Calc", href: "/tools/booking/airbnb-profit-calculator", desc: "Estimate monthly earnings" },
    { label: "Cleaning Fee Tool", href: "/tools/booking/cleaning-fee-calculator", desc: "Set competitive pricing" },
    { label: "Templates", href: "/templates", desc: "Checklists & Email scripts" },
  ], megaMenu: true },
  { label: "Resources", dropdown: [
    { label: "Blog & Guides", href: "/guides", desc: "Expert strategies & tips" },
    { label: "Software Comparisons", href: "/compare", desc: "Side-by-side reviews", highlight: true },
    { label: "Alternatives", href: "/alternatives", desc: "Switching guides" },
    { label: "Glossary", href: "/glossary", desc: "Real estate terms defined" },
    { label: "Regulations", href: "/regulations", desc: "Local compliance rules" },
    { label: "Taxes", href: "/taxes", desc: "Financial compliance guide" },
  ], megaMenu: true },
  { label: "Pricing", href: "/pricing" },
];

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const pathname = usePathname();
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (navRef.current && !navRef.current.contains(event.target as Node)) setActiveDropdown(null);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  const toggleDropdown = (label: string) => setActiveDropdown(activeDropdown === label ? null : label);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80" ref={navRef}>
      <div className="container mx-auto flex h-20 max-w-screen-2xl items-center justify-between px-4">
        <Link href="/" className="mr-8 flex items-center space-x-3 transition-opacity hover:opacity-90">
          <img src="/mascot.png" alt="Mr. Props Logo" className="h-10 w-10 rounded-full bg-primary/10 p-1 object-contain" />
          <span className="hidden font-display text-2xl font-bold tracking-tight sm:inline-block">Mr. Props</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium">
          {menuItems.map((item) => (
            <div key={item.label} className="relative group">
              {item.dropdown ? (
                <button className={cn("flex items-center gap-1 py-2 transition-colors hover:text-primary focus:outline-none", activeDropdown === item.label ? "text-primary" : "text-muted-foreground")} onClick={() => toggleDropdown(item.label)} onMouseEnter={() => setActiveDropdown(item.label)}>
                  {item.label}
                  <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", activeDropdown === item.label ? "rotate-180" : "")} />
                </button>
              ) : (
                <Link href={item.href!} className={cn("py-2 transition-colors hover:text-primary relative group block", pathname === item.href ? "text-primary font-bold" : "text-muted-foreground")}>
                  {item.label}
                  <span className={cn("absolute bottom-0 left-0 h-0.5 w-full bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300", pathname === item.href ? "scale-x-100" : "")} />
                </Link>
              )}

              {item.dropdown && activeDropdown === item.label && (
                <div className={cn("absolute top-full left-0 mt-2 bg-card border border-border rounded-xl shadow-xl p-2 animate-in fade-in zoom-in-95 duration-200 z-50", item.megaMenu ? "w-[600px] p-4" : "w-72")} onMouseLeave={() => setActiveDropdown(null)}>
                  <div className={cn("grid gap-2", item.megaMenu ? "grid-cols-2 gap-4" : "grid-cols-1")}>
                    {item.dropdown.map((subItem) => {
                      const isActive = pathname === subItem.href;
                      const external = subItem.href.startsWith("http");
                      const content = (
                        <div className={cn("block p-3 rounded-lg hover:bg-secondary/50 transition-colors group/item h-full", isActive ? "bg-primary/5 border border-primary/10" : "hover:bg-primary/5", subItem.highlight && !isActive ? "bg-secondary/30" : "")}>
                          <div className={cn("font-medium text-foreground group-hover/item:text-primary mb-1", isActive ? "text-primary font-bold" : "")}>{subItem.label}</div>
                          {subItem.desc && <div className="text-xs text-muted-foreground font-normal leading-snug">{subItem.desc}</div>}
                        </div>
                      );
                      return external ? <a key={subItem.href} href={subItem.href}>{content}</a> : <Link key={subItem.href} href={subItem.href}>{content}</Link>;
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-4 ml-auto">
          <Button variant="ghost" className="text-muted-foreground hover:text-foreground font-medium" asChild><a href="https://app.mrprops.io/login">Log In</a></Button>
          <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/25 rounded-full px-6 font-bold" asChild><a href="https://app.mrprops.io/register">Get Started</a></Button>
        </div>

        <button className="lg:hidden p-2 text-foreground focus:outline-none" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">{isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}</button>
      </div>

      {isOpen && (
        <div className="lg:hidden fixed inset-0 top-20 z-[100] bg-background border-t border-border animate-in slide-in-from-top-5 duration-300 flex flex-col h-[calc(100vh-5rem)]">
          <nav className="flex-1 overflow-y-auto p-4 pb-20">
            <div className="flex flex-col space-y-2">
              {menuItems.map((item) => (
                <div key={item.label} className="border-b border-border/50 last:border-0 pb-2">
                  {item.dropdown ? (
                    <div className="space-y-2"><div className="font-bold text-lg py-3 px-2 text-foreground flex items-center justify-between">{item.label}<ChevronDown className="h-4 w-4 text-muted-foreground opacity-50" /></div><div className="pl-2 space-y-1 grid grid-cols-1 gap-1">{item.dropdown.map((subItem) => subItem.href.startsWith("http") ? <a key={subItem.href} href={subItem.href} onClick={() => setIsOpen(false)} className="block py-3 px-4 text-muted-foreground hover:text-primary hover:bg-secondary/30 rounded-lg transition-colors bg-secondary/10"><div className="font-medium text-foreground">{subItem.label}</div>{subItem.desc && <div className="text-xs opacity-70 font-normal mt-0.5">{subItem.desc}</div>}</a> : <Link key={subItem.href} href={subItem.href} onClick={() => setIsOpen(false)} className="block py-3 px-4 text-muted-foreground hover:text-primary hover:bg-secondary/30 rounded-lg transition-colors bg-secondary/10"><div className="font-medium text-foreground">{subItem.label}</div>{subItem.desc && <div className="text-xs opacity-70 font-normal mt-0.5">{subItem.desc}</div>}</Link>)}</div></div>
                  ) : <Link href={item.href!} className="block font-bold text-lg py-4 px-2 hover:text-primary transition-colors" onClick={() => setIsOpen(false)}>{item.label}</Link>}
                </div>
              ))}
            </div>
          </nav>
          <div className="p-4 border-t border-border bg-background/95 backdrop-blur pb-8"><div className="flex flex-col gap-3"><Button variant="outline" className="w-full justify-center rounded-xl h-12 text-lg font-medium" asChild><a href="https://app.mrprops.io/login">Log In</a></Button><Button className="w-full rounded-xl h-12 bg-primary text-white font-bold text-lg shadow-lg" asChild><a href="https://app.mrprops.io/register">Get Started</a></Button></div></div>
        </div>
      )}
    </header>
  );
}
