import type { Metadata } from "next";
import { buildMetadata } from "@/lib/metadata";

export const revalidate = 3600;

export async function generateMetadata(): Promise<Metadata> {
  return buildMetadata("Privacy Policy | Mr. Props", "Our privacy commitment to you.", "/company/privacy");
}


export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
            <div className="container mx-auto px-4 max-w-3xl">
        <h1 className="font-display text-4xl font-bold mb-8">Privacy Policy</h1>
        
        <div className="prose prose-invert max-w-none space-y-8 text-muted-foreground">
          <p>Last updated: December 28, 2025</p>
          
          <section>
             <h2 className="text-2xl font-bold text-foreground mb-4">1. Introduction</h2>
             <p>Mr. Props ("we," "our," or "us") respects your privacy and is committed to protecting it through our compliance with this policy. This policy describes the types of information we may collect from you or that you may provide when you visit the website app.mrprops.io.</p>
          </section>

          <section>
             <h2 className="text-2xl font-bold text-foreground mb-4">2. Information We Collect</h2>
             <p>We collect several types of information from and about users of our Website, including information:</p>
             <ul className="list-disc pl-6 space-y-2 mt-4">
               <li>By which you may be personally identified, such as name, postal address, e-mail address, telephone number.</li>
               <li>About your internet connection, the equipment you use to access our Website, and usage details.</li>
             </ul>
          </section>

          <section>
             <h2 className="text-2xl font-bold text-foreground mb-4">3. Use of Your Information</h2>
             <p>We use information that we collect about you or that you provide to us, including any personal information:</p>
             <ul className="list-disc pl-6 space-y-2 mt-4">
               <li>To present our Website and its contents to you.</li>
               <li>To provide you with information, products, or services that you request from us.</li>
               <li>To fulfill any other purpose for which you provide it.</li>
             </ul>
          </section>

          <section>
             <h2 className="text-2xl font-bold text-foreground mb-4">4. Data Security</h2>
             <p>We have implemented measures designed to secure your personal information from accidental loss and from unauthorized access, use, alteration, and disclosure. All information you provide to us is stored on our secure servers behind firewalls.</p>
          </section>
          
          <section>
             <h2 className="text-2xl font-bold text-foreground mb-4">5. Contact Information</h2>
             <p>To ask questions or comment about this privacy policy and our privacy practices, contact us at: privacy@mrprops.io</p>
          </section>
        </div>
      </div>
    </div>
  );
}