import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

interface Item {
  id: string;
  location: string;
  platform: string;
  region: string;
  updated?: string;
  flag?: string;
}

export function DirectoryLayout({ title, subtitle, type, items, currentPlatform }: { title: string; subtitle: string; type: "regulations" | "taxes"; items: Item[]; currentPlatform?: string }) {
  return (
    <div className="min-h-screen bg-background pb-20 pt-20">
      <section className="container mx-auto px-4 max-w-4xl text-center mb-16">
        <div className="flex items-center justify-center text-sm text-muted-foreground gap-2 overflow-x-auto whitespace-nowrap mb-6">
          <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1"><Home className="h-3 w-3" /> Home</Link>
          <ChevronRight className="h-4 w-4 flex-shrink-0" />
          <span className="text-foreground font-medium capitalize">{currentPlatform || type}</span>
        </div>
        <h1 className="font-display text-4xl md:text-6xl font-bold mb-6 tracking-tight">{title}</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">{subtitle}</p>
      </section>

      <section className="container mx-auto px-4 max-w-screen-xl">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <Link key={item.id} href={`/${type}/${item.platform}/${type === "regulations" ? item.location.toLowerCase().replace(/[^a-z0-9]+/g, "-") : item.region.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>
              <div className="group bg-card hover:bg-secondary/20 border border-border hover:border-primary/30 rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl cursor-pointer h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="text-2xl">{item.flag || "🌍"}</div>
                  <div>
                    <div className="font-display font-bold text-lg">{item.location}</div>
                    <div className="text-xs uppercase tracking-wider text-muted-foreground">{item.platform}</div>
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">Updated {item.updated || "Oct 2025"}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
