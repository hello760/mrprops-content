import type { Metadata } from "next";
import { buildMetadata } from "@/lib/metadata";
import Link from "next/link";
import { ArrowRight, Users, Briefcase, Mail, Shield } from "lucide-react";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata("Company | Mr. Props", "Building the future of property management technology.", "/company");
}


export default function CompanyPage() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
            
      <div className="container mx-auto px-4 text-center max-w-4xl mb-20">
        <h1 className="font-display text-4xl md:text-6xl font-bold mb-6">
          Building the future of property management.
        </h1>
        <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
          We provide the tools, data, and automation that empower hosts to scale from one unit to one thousand.
        </p>
      </div>

      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link href="/company/about" className="block"><div className="group bg-card border border-border hover:border-primary/50 p-8 rounded-3xl transition-all hover:shadow-lg cursor-pointer h-full flex flex-col items-center text-center">
              <div className="h-14 w-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="h-7 w-7" />
              </div>
              <h3 className="font-display text-xl font-bold mb-3">About Us</h3>
              <p className="text-muted-foreground text-sm mb-6">Our mission, our story, and the team behind the platform.</p>
              <div className="mt-auto text-primary font-bold text-sm flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
                Read Story <ArrowRight className="h-3 w-3" />
              </div>
            </div></Link>

          <Link href="/company/careers" className="block"><div className="group bg-card border border-border hover:border-primary/50 p-8 rounded-3xl transition-all hover:shadow-lg cursor-pointer h-full flex flex-col items-center text-center">
              <div className="h-14 w-14 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Briefcase className="h-7 w-7" />
              </div>
              <h3 className="font-display text-xl font-bold mb-3">Careers</h3>
              <p className="text-muted-foreground text-sm mb-6">Join our remote-first team and help us change the industry.</p>
              <div className="mt-auto text-primary font-bold text-sm flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
                View Openings <ArrowRight className="h-3 w-3" />
              </div>
            </div></Link>

          <Link href="/company/contact" className="block"><div className="group bg-card border border-border hover:border-primary/50 p-8 rounded-3xl transition-all hover:shadow-lg cursor-pointer h-full flex flex-col items-center text-center">
              <div className="h-14 w-14 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Mail className="h-7 w-7" />
              </div>
              <h3 className="font-display text-xl font-bold mb-3">Contact</h3>
              <p className="text-muted-foreground text-sm mb-6">Get in touch with our support, sales, or partnership teams.</p>
              <div className="mt-auto text-primary font-bold text-sm flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
                Send Message <ArrowRight className="h-3 w-3" />
              </div>
            </div></Link>

          <Link href="/company/privacy" className="block"><div className="group bg-card border border-border hover:border-primary/50 p-8 rounded-3xl transition-all hover:shadow-lg cursor-pointer h-full flex flex-col items-center text-center">
              <div className="h-14 w-14 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="h-7 w-7" />
              </div>
              <h3 className="font-display text-xl font-bold mb-3">Privacy</h3>
              <p className="text-muted-foreground text-sm mb-6">Our commitment to protecting your data and privacy.</p>
              <div className="mt-auto text-primary font-bold text-sm flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-y-2 group-hover:translate-y-0">
                View Policy <ArrowRight className="h-3 w-3" />
              </div>
            </div></Link>
        </div>
      </div>
    </div>
  );
}