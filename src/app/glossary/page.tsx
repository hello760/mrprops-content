import Link from "next/link";
import { fetchGlossaryTerms } from "@/lib/glossary";
import { buildMetadata } from "@/lib/metadata";
export const revalidate = 3600;
export const metadata = buildMetadata("Glossary", "Short-term rental terms explained in plain English.", "/glossary");
export default async function GlossaryIndexPage() { const terms = await fetchGlossaryTerms(); return <div className="min-h-screen bg-background pb-20 pt-8"><div className="container mx-auto px-4 max-w-screen-xl"><div className="text-center max-w-3xl mx-auto mb-12"><h1 className="font-display text-4xl md:text-6xl font-bold mb-6">Glossary</h1><p className="text-xl text-muted-foreground">Terms, metrics, and real estate concepts explained for operators.</p></div><div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{terms.map((term) => <Link key={term.id} href={`/glossary/${term.slug}`} className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-lg transition-all"><h2 className="font-display text-2xl font-bold mb-3">{term.term}</h2><p className="text-muted-foreground line-clamp-3">{term.definition}</p></Link>)}</div></div></div>; }
