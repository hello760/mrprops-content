import { DirectoryLayout } from "@/components/layout/DirectoryLayout";
import { buildMetadata } from "@/lib/metadata";
import { fetchRegulations } from "@/lib/content-pages";

export const revalidate = 3600;
export const metadata = buildMetadata("Regulations", "Local short-term rental regulations by platform and location.", "/regulations");

export default async function RegulationsIndexPage() {
  const regulationGuides = await fetchRegulations();
  return (
    <DirectoryLayout
      title="STR Regulations & Laws"
      subtitle="Navigate local zoning laws, licenses, and permits for your rental business."
      type="regulations"
      items={regulationGuides.map((item) => ({
        id: item.slug,
        location: item.location || item.title,
        platform: item.platform || "airbnb",
        region: item.region || "north-america",
        updated: item.updated,
        flag: "🌍",
      }))}
    />
  );
}
