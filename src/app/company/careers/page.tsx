import type { Metadata } from "next";
import { buildMetadata } from "@/lib/metadata";
import { Briefcase, Code, Rocket, Users } from "lucide-react";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata("Careers | Mr. Props", "Join our team and build the future of proptech.", "/company/careers");
}


export default function CareersPage() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
            <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto mb-16 text-center">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary mb-6">
            <Rocket className="mr-2 h-4 w-4" /> We&apos;re Hiring
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-6">Build the Future of PropTech</h1>
          <p className="text-xl text-muted-foreground">
            Join a remote-first team of builders, designers, and property enthusiasts. We&apos;re changing how the world hosts.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-16">
           {[
              { title: "Remote-First", icon: Users, desc: "Work from anywhere. We care about output, not hours in a chair." },
              { title: "Competitive Pay", icon: Briefcase, desc: "Top-tier salary and equity packages. We want the best talent." },
              { title: "Modern Stack", icon: Code, desc: "React, Node, AI. We use the latest tech to solve hard problems." }
           ].map((perk, i) => (
              <div key={i} className="bg-secondary/20 p-8 rounded-2xl text-center">
                 <div className="h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                    <perk.icon className="h-6 w-6" />
                 </div>
                 <h3 className="font-bold text-lg mb-2">{perk.title}</h3>
                 <p className="text-muted-foreground text-sm">{perk.desc}</p>
              </div>
           ))}
        </div>

        <div className="max-w-3xl mx-auto">
           <h2 className="text-2xl font-bold mb-8">Open Positions</h2>
           <div className="bg-card border border-border rounded-xl p-12 text-center">
               <p className="text-lg text-muted-foreground mb-4">No open positions at the moment.</p>
               <p className="text-sm">Check back later or email us your resume.</p>
           </div>
           
           <div className="mt-12 text-center text-muted-foreground">
              Don&apos;t see your role? Email us at <a href="mailto:careers@mrprops.io" className="text-primary hover:underline">careers@mrprops.io</a>
           </div>
        </div>
      </div>
    </div>
  );
}