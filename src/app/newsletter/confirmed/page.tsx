import Link from "next/link";
import { Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata(
  "You're confirmed",
  "Thanks for confirming your Mr Props newsletter subscription.",
  "/newsletter/confirmed",
);

interface Props {
  searchParams: Promise<{ status?: string }>;
}

export default async function NewsletterConfirmedPage({ searchParams }: Props) {
  const { status } = await searchParams;

  if (status === "invalid" || status === "error") {
    return (
      <div className="min-h-[60vh] flex items-center justify-center px-4 py-20">
        <div className="max-w-md text-center space-y-6">
          <div className="mx-auto h-16 w-16 rounded-full bg-amber-50 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-amber-500" />
          </div>
          <h1 className="font-display text-3xl font-bold">
            That link didn&apos;t work
          </h1>
          <p className="text-muted-foreground">
            The confirmation link may be expired (5-day window) or already used. If you
            never subscribed, you can ignore this — you won&apos;t hear from us again.
          </p>
          <div className="flex justify-center gap-3">
            <Button asChild>
              <Link href="/">Back to home</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/guides">Read the guides</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-20">
      <div className="max-w-md text-center space-y-6">
        <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Check className="h-8 w-8 text-primary" />
        </div>
        <h1 className="font-display text-3xl font-bold">
          You&apos;re in.
        </h1>
        <p className="text-muted-foreground text-lg">
          Email 2 lands in 2 days. The story I lost €17,400 on. Don&apos;t skip it.
        </p>
        <p className="text-sm text-muted-foreground">
          — Helvis
        </p>
        <div className="flex justify-center gap-3 pt-4">
          <Button asChild>
            <Link href="/guides">Read the guides while you wait</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
