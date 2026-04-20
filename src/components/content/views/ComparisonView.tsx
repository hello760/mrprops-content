// Phase 5: shared comparison page renderer. Imported by both the production
// route (/compare/[slug]/page.tsx) and the draft preview route (/draft/[id]/page.tsx)
// to guarantee byte-identical output.
import { Check, Trophy, Minus, ArrowRight, Star } from "lucide-react";
import { PortableTextContent, portableTextHeadings } from "@/components/content/PortableTextContent";
import { FAQAndCTA } from "@/components/content/PageBits";
import type { DirectoryEntry } from "@/lib/content-pages";

function startCase(value?: string) {
  return (value || "").split("-").filter(Boolean).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

export function ComparisonView({ comparison, slug }: { comparison: DirectoryEntry; slug: string }) {
  const slugParts = (slug || "").split("-vs-");
  const fallbackA = startCase(slugParts[0]) || "A";
  const fallbackB = startCase(slugParts[1]) || "B";
  const left = comparison.primaryItem?.trim() || fallbackA;
  const right = comparison.secondaryItem?.trim() || fallbackB;
  const comparisonTitle = comparison.heroTitle || comparison.title || `${left} vs ${right}`;
  const introText = comparison.heroDescription || comparison.excerpt || `${left} and ${right} solve similar problems, but they are built for different kinds of operators.`;
  const contentHeadings = portableTextHeadings(comparison.body, comparison.bodyHtml);
  const tableRows = comparison.comparisonTableRows?.length ? comparison.comparisonTableRows : [
    { feature: "Price", primaryValue: "$49/unit", secondaryValue: "$19/unit", mrPropsValue: "$9/unit" },
    { feature: "Unified Inbox", primaryValue: true, secondaryValue: true, mrPropsValue: true },
    { feature: "Direct Booking Site", primaryValue: true, secondaryValue: false, mrPropsValue: true },
    { feature: "Renovation Calculator", primaryValue: false, secondaryValue: false, mrPropsValue: true },
  ];
  const faqs = comparison.faqs?.length ? comparison.faqs : [
    { question: `Does ${left} work in Europe?`, answer: "Yes, but support quality and local-market fit vary." },
    { question: `Is ${right} good for scaling?`, answer: "It depends on workflow complexity and the number of units you operate." },
    { question: "Can I migrate my data?", answer: "Yes, most modern platforms support imports or assisted migration." },
  ];
  const snapshotCards = tableRows.slice(0, 4);

  // FIX-018 (PF-18): new structured_data schema emits platformReviews[] with
  // { product, platform, rating, reviewCount, highlight, url }. We pivot it into
  // the existing primary/secondary per-platform shape so the ReviewComparisonCard
  // component renders unchanged. Falls back to legacy capterraReviews/trustpilotReviews
  // on older pieces that haven't been re-extracted yet.
  const platformReviewsArray = Array.isArray((comparison as any).platformReviews)
    ? ((comparison as any).platformReviews as Array<{ product?: string; platform?: string; rating?: number; reviewCount?: number; highlight?: string; url?: string }>)
    : [];
  const buildReviewSide = (product: string, platform: string) => {
    const match = platformReviewsArray.find((r) =>
      String(r.product || "").trim().toLowerCase() === product.toLowerCase()
      && String(r.platform || "").trim().toLowerCase() === platform.toLowerCase(),
    );
    if (!match) return null;
    return { rating: typeof match.rating === "number" ? match.rating : null, reviewCount: typeof match.reviewCount === "number" ? match.reviewCount : null, url: match.url };
  };
  const reviewSectionsFromNewSchema = ["Trustpilot", "Capterra", "G2"]
    .map((platform) => ({
      key: platform.toLowerCase(),
      title: `${platform} Rating`,
      reviews: {
        primary: buildReviewSide(left, platform) || undefined,
        secondary: buildReviewSide(right, platform) || undefined,
      },
    }))
    .filter((section) => section.reviews.primary?.rating || section.reviews.secondary?.rating);
  const reviewSectionsLegacy = [
    { key: "capterra", title: "Capterra Rating", reviews: (comparison as any).capterraReviews },
    { key: "trustpilot", title: "Trustpilot Rating", reviews: (comparison as any).trustpilotReviews },
  ].filter((section) => section.reviews?.primary?.rating || section.reviews?.secondary?.rating);
  const reviewSections = reviewSectionsFromNewSchema.length > 0 ? reviewSectionsFromNewSchema : reviewSectionsLegacy;

  return <div className="min-h-screen bg-background"><section className="px-4 pb-12 pt-16 md:pt-20"><div className="mx-auto max-w-6xl"><div className="mx-auto max-w-3xl text-center"><div className="mb-4 inline-flex items-center rounded-full border border-primary/15 bg-primary/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-primary md:text-sm">{comparison.heroBadge || "2026 Software Showdown"}</div><h1 className="font-display text-4xl font-bold tracking-tight text-foreground md:text-6xl">{comparisonTitle}</h1><p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">{introText}</p></div><div className="mt-8 grid gap-5 lg:grid-cols-[0.92fr_1.08fr] lg:items-stretch"><div className="space-y-4">{snapshotCards.map((row, index) => <div key={`${row.feature}-${index}`} className="rounded-[28px] border border-border bg-card px-5 py-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)] md:px-6"><div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">{row.feature}</div><div className="mt-3 grid grid-cols-3 gap-3"><MetricValue label={left} value={row.primaryValue ?? "—"} /><MetricValue label={right} value={row.secondaryValue ?? "—"} /><MetricValue label="Mr. Props" value={row.mrPropsValue ?? "—"} emphasize /></div></div>)}{contentHeadings.length > 0 ? <div className="rounded-[28px] border border-border bg-card px-5 py-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)] md:px-6"><div className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">{comparison.tocTitle || "Inside this comparison"}</div><div className="mt-3 flex flex-wrap gap-2.5">{contentHeadings.slice(0, 6).map((heading) => <a key={heading.id} href={`#${heading.id}`} className="rounded-full border border-border bg-background px-3.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary">{heading.label}</a>)}</div></div> : null}</div><div className="relative overflow-hidden rounded-[32px] border border-slate-900/10 bg-slate-950 shadow-[0_24px_80px_rgba(15,23,42,0.22)] min-h-[420px]"><div className="absolute inset-0 h-full w-full object-cover opacity-85" style={{ backgroundImage: `url(${comparison.image})`, backgroundSize: 'cover', backgroundPosition: 'center' }} /><div className="absolute inset-0 bg-gradient-to-br from-slate-950/88 via-slate-900/45 to-primary/30" /><div className="relative flex h-full flex-col justify-between p-5 text-white md:p-7"><div className="flex items-start justify-between gap-3"><div className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] backdrop-blur">{comparison.comparisonSnapshotTitle || "Comparison Snapshot"}</div><a href={comparison.ctaPrimaryButton?.href || "https://app.mrprops.io/register"} className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/12 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white backdrop-blur transition hover:bg-white/20">{comparison.showdownButtonLabel || "Try Mr. Props"}<ArrowRight className="h-3.5 w-3.5" /></a></div><div className="mx-auto my-8 flex w-full max-w-md items-center justify-between gap-3 rounded-full border border-white/12 bg-white/10 px-4 py-3 backdrop-blur-sm"><div className="min-w-0 text-left"><div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/65">Option A</div><div className="truncate text-base font-semibold md:text-lg">{left}</div></div><div className="rounded-full border border-white/20 bg-white/12 px-3 py-1 text-[11px] font-black tracking-[0.26em] text-white/90">VS</div><div className="min-w-0 text-right"><div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/65">Option B</div><div className="truncate text-base font-semibold md:text-lg">{right}</div></div></div><div className="max-w-sm rounded-[28px] border border-white/12 bg-white/10 p-4 backdrop-blur md:p-5"><div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">Verdict</div><p className="mt-2 text-sm leading-6 text-white/90 md:text-base">Compare pricing, automation, direct booking tools, and operator fit side by side before committing.</p></div></div></div></div><div className="mt-5 overflow-hidden rounded-[32px] bg-[linear-gradient(135deg,#5b21b6_0%,#7c3aed_45%,#a855f7_100%)] px-6 py-8 text-white shadow-[0_24px_70px_rgba(91,33,182,0.28)] md:px-10 md:py-10"><div className="max-w-3xl"><div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/95"><Trophy className="h-4 w-4" />{comparison.showdownBadge || "Is there a better way?"}</div><h2 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-5xl">{comparison.showdownTitle || "Don’t settle for “good enough”"}</h2><p className="mt-4 max-w-2xl text-base leading-7 text-white/88 md:text-lg">{comparison.showdownDescription || `${left} and ${right} both have trade-offs. Mr. Props was built to close the operational gaps teams actually feel every day.`}</p></div></div></div></section><div className="container mx-auto max-w-screen-xl px-4 pb-20">{reviewSections.length > 0 ? <div className="mb-12 grid gap-4 md:grid-cols-2">{reviewSections.map((section) => <ReviewComparisonCard key={section.key} title={section.title} nameA={left} nameB={right} reviews={section.reviews} />)}</div> : null}<div id="full-breakdown" className="mb-20 scroll-mt-24"><div className="mb-6 text-center"><div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/75">Detailed comparison</div><h2 className="mt-2 font-display text-3xl font-bold">The Full Breakdown</h2></div><div className="overflow-x-auto rounded-3xl border border-border bg-card shadow-xl"><table className="w-full min-w-[800px] border-collapse"><thead><tr><th className="w-1/4 border-b border-border p-6 text-left text-lg font-bold text-muted-foreground">Feature</th><th className="w-1/4 border-b border-border bg-muted/20 p-6 text-center text-lg font-bold text-muted-foreground">{left}</th><th className="w-1/4 border-b border-border bg-muted/20 p-6 text-center text-lg font-bold text-muted-foreground">{right}</th><th className="relative w-1/4 border-b border-primary/20 bg-primary/10 p-6 text-center"><div className="absolute left-0 right-0 top-0 h-1.5 bg-primary" /><div className="font-display text-2xl font-bold text-primary">Mr. Props</div><div className="mt-1 text-[10px] font-bold uppercase tracking-wider text-primary/70">Best Choice</div></th></tr></thead><tbody>{tableRows.map((row, i) => <tr key={i} className="border-b border-border transition-colors hover:bg-muted/30 last:border-0"><td className="p-6 text-lg font-medium">{row.feature}</td><td className="border-r border-border/50 bg-muted/5 p-6 text-center text-muted-foreground">{renderCell(row.primaryValue ?? "")}</td><td className="border-r border-border/50 bg-muted/5 p-6 text-center text-muted-foreground">{renderCell(row.secondaryValue ?? "")}</td><td className="bg-primary/5 p-6 text-center text-lg font-bold text-foreground">{renderCell(row.mrPropsValue ?? "", true)}</td></tr>)}</tbody></table></div></div>{comparison.body?.length ? <div className="mb-20 rounded-[2rem] border border-border bg-card p-8 shadow-sm md:p-12"><div className="prose prose-lg max-w-none dark:prose-invert"><PortableTextContent blocks={comparison.body} html={comparison.bodyHtml} /></div></div> : null}<FAQAndCTA faqs={faqs} faqTitle={comparison.faqTitle || "Common Questions"} ctaTitle={comparison.ctaTitle || `Compare ${left} and ${right} to Choose the Right Vacation Rental Software`} ctaText={comparison.ctaText || "If you want modern operations without enterprise complexity, Mr. Props is built to help you move faster."} ctaPrimaryButton={comparison.ctaPrimaryButton || { label: "Start Free Migration" }} ctaSecondaryButton={comparison.ctaSecondaryButton} /></div></div>;
}

function ReviewComparisonCard({ title, nameA, nameB, reviews }: { title: string; nameA: string; nameB: string; reviews?: { primary?: { rating?: number | null; reviewCount?: number | null; url?: string }; secondary?: { rating?: number | null; reviewCount?: number | null; url?: string } } }) {
  return <div className="rounded-[28px] border border-border bg-card px-5 py-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)] md:px-6"><div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground/80"><Star className="h-3.5 w-3.5 text-amber-500" />{title}</div><div className="mt-4 grid gap-3 sm:grid-cols-2"><ReviewValue label={nameA} data={reviews?.primary} /><ReviewValue label={nameB} data={reviews?.secondary} /></div></div>;
}

function ReviewValue({ label, data }: { label: string; data?: { rating?: number | null; reviewCount?: number | null; url?: string } }) {
  const inner = <div className="rounded-2xl border border-border bg-background px-4 py-4"><div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/75">{label}</div><div className="mt-2 text-2xl font-bold tracking-tight text-foreground">{typeof data?.rating === "number" ? `${data.rating.toFixed(1)}/5` : "—"}</div><div className="mt-1 text-sm text-muted-foreground">{typeof data?.reviewCount === "number" ? `${data.reviewCount.toLocaleString()} reviews` : "No review count"}</div></div>;
  return data?.url ? <a href={data.url} target="_blank" rel="noreferrer" className="block transition-transform hover:-translate-y-0.5">{inner}</a> : inner;
}

function MetricValue({ label, value, emphasize = false }: { label: string; value: string | boolean; emphasize?: boolean }) {
  return <div className={`rounded-2xl border px-3 py-3 text-center ${emphasize ? "border-primary/20 bg-primary/8" : "border-border bg-background"}`}><div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/75">{label}</div><div className={`mt-2 text-sm font-semibold md:text-base ${emphasize ? "text-primary" : "text-foreground"}`}>{renderCell(value, emphasize)}</div></div>;
}

function renderCell(value: string | boolean, isPrimary = false) {
  if (value === true) return <Check className={`mx-auto h-5 w-5 ${isPrimary ? "text-green-600" : "text-gray-400"}`} />;
  if (value === false) return <Minus className="mx-auto h-5 w-5 text-gray-300" />;
  return <span>{value}</span>;
}
