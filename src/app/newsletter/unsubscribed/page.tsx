import Link from "next/link";
import { Button } from "@/components/ui/button";
import { buildMetadata } from "@/lib/metadata";

export const metadata = buildMetadata(
  "You've unsubscribed",
  "You've been removed from the Mr Props newsletter.",
  "/newsletter/unsubscribed",
);

export default function NewsletterUnsubscribedPage() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-20">
      <div className="max-w-md text-center space-y-6">
        <h1 className="font-display text-3xl font-bold">
          You&apos;re unsubscribed.
        </h1>
        <p className="text-muted-foreground text-lg">
          No more emails from us. No hard feelings — most newsletters aren&apos;t for
          everyone.
        </p>
        <p className="text-sm text-muted-foreground">
          If you unsubscribed by mistake, you can{" "}
          <Link href="/" className="underline hover:text-primary">
            re-subscribe from any page
          </Link>
          .
        </p>
        <div className="flex justify-center gap-3 pt-4">
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
