import Link from "next/link";
import type { PortableTextBlock } from "@/lib/content-helpers";

function blockText(block: PortableTextBlock) {
  return (block.children || []).map((child) => child.text || "").join("");
}

function headingId(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function renderInlineChildren(block: PortableTextBlock) {
  const markDefs = block.markDefs || [];
  return (block.children || []).map((child, i) => {
    const text = child.text || "";
    if (!text) return null;
    const key = child._key || `${block._key}-c${i}`;
    const marks = child.marks || [];

    let element: React.ReactNode = text;
    for (const mark of marks) {
      if (mark === "strong") element = <strong key={`${key}-strong`}>{element}</strong>;
      else if (mark === "em") element = <em key={`${key}-em`}>{element}</em>;
      else {
        const def = markDefs.find((md) => md._key === mark);
        if (def && def._type === "link" && def.href) {
          const isExternal = def.href.startsWith("http");
          element = isExternal ? (
            <a key={`${key}-link`} href={def.href} className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">{element}</a>
          ) : (
            <Link key={`${key}-link`} href={def.href} className="text-primary hover:underline">{element}</Link>
          );
        }
      }
    }
    return <span key={key}>{element}</span>;
  });
}

function renderBlock(block: PortableTextBlock, key: string) {
  if (block._type === "contentImage" || block._type === "image") {
    const imageUrl = (block as any)?.asset?.url;
    if (!imageUrl) return null;
    return (
      <figure key={key}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imageUrl} alt={(block as any)?.alt || ""} className="w-full rounded-xl" />
        {(block as any)?.caption ? <figcaption>{(block as any).caption}</figcaption> : null}
      </figure>
    );
  }

  const text = blockText(block);
  if (!text && block._type === "block") return null;
  const children = renderInlineChildren(block);

  if (block.listItem === "bullet" || block.listItem === "number") return <li key={key}>{children}</li>;
  if (block.style === "h2") return <h2 id={headingId(text)} key={key}>{children}</h2>;
  if (block.style === "h3") return <h3 key={key}>{children}</h3>;
  if (block.style === "h4") return <h4 key={key}>{children}</h4>;
  if (block.style === "blockquote") return <blockquote key={key}>{children}</blockquote>;
  return <p key={key}>{children}</p>;
}

/**
 * Renders content from either Sanity PortableText blocks or raw HTML.
 * - When `blocks` has content → renders via PortableText
 * - When `blocks` is empty and `html` is provided → renders HTML directly
 * This supports the Supabase-first content flow where body content is stored as HTML.
 */
export function PortableTextContent({ blocks, html }: { blocks?: PortableTextBlock[]; html?: string }) {
  const content = blocks || [];

  // If we have PortableText blocks, render them
  if (content.length > 0) {
    const result: React.ReactNode[] = [];
    let i = 0;
    while (i < content.length) {
      const block = content[i];
      const key = block._key || `${block._type}-${i}`;
      if (block.listItem) {
        const listType = block.listItem;
        const items: PortableTextBlock[] = [];
        while (i < content.length && content[i].listItem === listType) {
          items.push(content[i]);
          i++;
        }
        const Tag = listType === "number" ? "ol" : "ul";
        result.push(<Tag key={`list-${key}`}>{items.map((item, idx) => renderBlock(item, item._key || `${key}-${idx}`))}</Tag>);
        continue;
      }
      result.push(renderBlock(block, key));
      i++;
    }
    return <>{result}</>;
  }

  // Fallback: render HTML content directly (Supabase flow)
  if (html) {
    return <div dangerouslySetInnerHTML={{ __html: html }} />;
  }

  return null;
}

export function portableTextHeadings(blocks?: PortableTextBlock[], html?: string) {
  // Extract headings from PortableText blocks
  if (blocks && blocks.length > 0) {
    return blocks
      .filter((block) => block.style === "h2")
      .map((block) => {
        const text = blockText(block);
        return { id: headingId(text), label: text };
      })
      .filter((item) => item.label);
  }

  // Extract headings from HTML content (Supabase flow)
  if (html) {
    const headings: { id: string; label: string }[] = [];
    const regex = /<h2[^>]*(?:id="([^"]*)")?[^>]*>(.*?)<\/h2>/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
      const text = match[2].replace(/<[^>]+>/g, '').trim();
      const id = match[1] || headingId(text);
      if (text) headings.push({ id, label: text });
    }
    return headings;
  }

  return [];
}
