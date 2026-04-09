import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { buildMetadata } from "@/lib/metadata";
import { Team } from "@/components/sections/Team";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata("About Us | Mr. Props", "Our mission to democratize property management technology.", "/company/about");
}


export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
            <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto mb-16 text-center">
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-6">About Mr. Props</h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            We&apos;re on a mission to democratize real estate technology. We believe every host, whether they have one unit or one hundred, deserves the same powerful tools as the big hotel chains.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto mb-24">
           <div>
              <h2 className="text-3xl font-bold mb-6">Our Story</h2>
              <div className="space-y-4 text-muted-foreground text-lg">
                 <p>Mr. Props started when our founder, Helvis, was managing 15 short-term rental properties on spreadsheets. It was chaos. Double bookings, missed cleanings, and maintenance nightmares.</p>
                 <p>He looked for software solutions but found only two options: overly expensive enterprise tools or clunky, outdated apps that looked like Windows 95.</p>
                 <p>So he built Mr. Props. A modern, beautiful, and powerful operating system for the new generation of property entrepreneurs.</p>
              </div>
           </div>
           <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-border/50">
              <img src="/assets/stock_images/diverse_team_working_2b25c720.jpg" alt="Team working" className="w-full h-full object-cover" />
           </div>
        </div>

        <Team />
        
        <div className="text-center mt-16">
           <h2 className="text-2xl font-bold mb-4">Join the movement</h2>
           <Button size="lg" className="bg-primary hover:bg-primary/90 h-12 px-8 rounded-full" asChild>
            <Link href="/register">Start Your Free Trial</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}