import type { Metadata } from "next";
import Link from "next/link";
import { buildMetadata } from "@/lib/metadata";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MessageSquare } from "lucide-react";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata("Contact Us | Mr. Props", "Get in touch with our team.", "/company/contact");
}


export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
            <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto mb-16 text-center">
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-6">Get in Touch</h1>
          <p className="text-xl text-muted-foreground">
            Questions about the platform? Enterprise inquiries? We&apos;re here to help.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto">
           <div className="space-y-8">
              <div>
                 <h2 className="text-2xl font-bold mb-4">Contact Information</h2>
                 <p className="text-muted-foreground mb-8">Fill out the form and our team will get back to you within 24 hours.</p>
                 
                 <div className="space-y-6">
                    <div className="flex items-center gap-4">
                       <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <Mail className="h-5 w-5" />
                       </div>
                       <div>
                          <div className="font-bold">Email Us</div>
                          <div className="text-muted-foreground">support@mrprops.io</div>
                       </div>
                    </div>
                    <div className="flex items-center gap-4">
                       <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                          <MessageSquare className="h-5 w-5" />
                       </div>
                       <div>
                          <div className="font-bold">Live Chat</div>
                          <div className="text-muted-foreground">Available Mon-Fri, 9am-5pm EST</div>
                       </div>
                    </div>
                 </div>
              </div>
              
              <div className="bg-secondary/20 p-6 rounded-2xl">
                 <h3 className="font-bold mb-2">FAQ</h3>
                 <p className="text-sm text-muted-foreground mb-4">Check our knowledge base for quick answers to common questions.</p>
                 <Button variant="outline" className="w-full" asChild>
                    <Link href="/glossary">Visit Help Center</Link>
                 </Button>
              </div>
           </div>

           <div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
              <form className="space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                       <label className="text-sm font-medium">First Name</label>
                       <Input placeholder="Helvis" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-medium">Last Name</label>
                       <Input placeholder="Schmotex" />
                    </div>
                 </div>
                 <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input type="email" placeholder="helvis@example.com" />
                 </div>
                 <div className="space-y-2">
                    <label className="text-sm font-medium">Message</label>
                    <Textarea placeholder="How can we help you?" className="min-h-[150px]" />
                 </div>
                 <Button className="w-full bg-primary hover:bg-primary/90 h-12 text-lg">Send Message</Button>
              </form>
           </div>
        </div>
      </div>
    </div>
  );
}