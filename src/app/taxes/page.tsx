import { DirectoryLayout } from "@/components/layout/DirectoryLayout";
import { buildMetadata } from "@/lib/metadata";
import { fetchTaxes } from "@/lib/content-pages";

export const revalidate = 3600;
export const metadata = buildMetadata("Taxes", "Short-term rental taxes by platform and region.", "/taxes");

export default async function TaxesIndexPage() {
  const taxGuides = await fetchTaxes();
  return (
    <DirectoryLayout
      title="Short-Term Rental Tax Guides"
      subtitle="Comprehensive tax compliance guides for hosts across the globe."
      type="taxes"
      items={taxGuides.map((item) => ({
        id: item.slug,
        location: item.location || item.title,
        platform: item.platform || "airbnb",
        region: item.region || item.slug.split("/").at(-1) || "north-america",
        updated: item.updated,
        flag: "🌍",
      }))}
    />
  );
}
