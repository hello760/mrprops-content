import { GlossaryIndexClient } from "@/components/client/GlossaryIndexClient";
import { fetchGlossaryTerms } from "@/lib/glossary";
import { buildMetadata } from "@/lib/metadata";

export const revalidate = 3600;
export const metadata = buildMetadata("Glossary", "Short-term rental terms explained in plain English.", "/glossary");

export default async function GlossaryIndexPage() {
  const terms = await fetchGlossaryTerms();
  return <GlossaryIndexClient terms={terms} />;
}
