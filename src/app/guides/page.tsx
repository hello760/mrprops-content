import { GuideIndexClient } from "@/components/client/GuideIndexClient";
import { fetchGuides } from "@/lib/content-pages";
import { buildMetadata } from "@/lib/metadata";

export const revalidate = 3600;
export const metadata = buildMetadata("Guides", "Mr. Props guides and blog content for property managers.", "/guides");

export default async function GuidesIndexPage() {
  const guides = await fetchGuides();
  return <GuideIndexClient guides={guides} />;
}
