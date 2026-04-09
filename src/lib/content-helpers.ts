export interface PortableTextMarkDef {
  _key?: string;
  _type?: string;
  href?: string;
}

export interface PortableTextSpan {
  _key?: string;
  _type?: string;
  text?: string;
  marks?: string[];
}

export interface PortableTextBlock {
  _key?: string;
  _type: string;
  style?: string;
  listItem?: "bullet" | "number";
  level?: number;
  markDefs?: PortableTextMarkDef[];
  children?: PortableTextSpan[];
  [key: string]: unknown;
}

export function portableTextToPlainText(blocks?: PortableTextBlock[]) {
  return (blocks || [])
    .map((block) => (block.children || []).map((child) => child.text || "").join(""))
    .join("\n\n")
    .trim();
}

export function formatDisplayDate(date?: string, fallback = "Oct 24, 2025") {
  if (!date) return fallback;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function calculateReadTime(text: string) {
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(wordCount / 200))} min read`;
}

export function startCaseSlug(value?: string | null) {
  return (value || "")
    .split("-")
    .filter(Boolean)
    .map((part) => (part.length <= 3 ? part.toUpperCase() : part.charAt(0).toUpperCase() + part.slice(1)))
    .join(" ");
}

export function stripPrefix(slug: string | undefined, prefix: string) {
  return (slug || "").replace(new RegExp(`^${prefix}/`), "") || slug || "";
}

export function headingId(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
