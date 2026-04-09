import Image from "next/image";
import Link from "next/link";
import { PortableText, type PortableTextComponents } from "@portabletext/react";
import { headingId, type PortableTextBlock } from "@/lib/content-helpers";

export function portableTextHeadings(blocks?: PortableTextBlock[]) {
  return (blocks || [])
    .filter((block) => /^h[1-6]$/.test(block.style || ""))
    .map((block) => {
      const label = (block.children || []).map((child) => child.text || "").join("");
      return { id: headingId(label), label };
    })
    .filter((item) => item.label);
}

const components: PortableTextComponents = {
  types: {
    image: ({ value }) => {
      const src = value?.asset?.url;
      if (!src) return null;
      return (
        <figure className="my-8 overflow-hidden rounded-2xl border border-border bg-card">
          <Image src={src} alt={value?.alt || ""} width={1400} height={900} className="h-auto w-full" unoptimized />
          {value?.caption ? <figcaption className="px-4 py-3 text-sm text-muted-foreground">{value.caption}</figcaption> : null}
        </figure>
      );
    },
    contentImage: ({ value }) => {
      const src = value?.asset?.url;
      if (!src) return null;
      return (
        <figure className="my-8 overflow-hidden rounded-2xl border border-border bg-card">
          <Image src={src} alt={value?.alt || ""} width={1400} height={900} className="h-auto w-full" unoptimized />
          {value?.caption ? <figcaption className="px-4 py-3 text-sm text-muted-foreground">{value.caption}</figcaption> : null}
        </figure>
      );
    },
    table: ({ value }) => {
      const rows = value?.rows || [];
      if (!rows.length) return null;
      return (
        <div className="my-8 overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[640px] border-collapse">
            <tbody>
              {rows.map((row: any, index: number) => (
                <tr key={index} className="border-b border-border last:border-0">
                  {(row?.cells || []).map((cell: any, cellIndex: number) => (
                    <td key={cellIndex} className="px-4 py-3 align-top text-sm text-foreground">
                      {typeof cell === "string" ? cell : JSON.stringify(cell)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    },
  },
  block: {
    h1: ({ children }) => <h1 id={headingId(String(children))}>{children}</h1>,
    h2: ({ children }) => <h2 id={headingId(String(children))}>{children}</h2>,
    h3: ({ children }) => <h3 id={headingId(String(children))}>{children}</h3>,
    h4: ({ children }) => <h4 id={headingId(String(children))}>{children}</h4>,
    h5: ({ children }) => <h5 id={headingId(String(children))}>{children}</h5>,
    h6: ({ children }) => <h6 id={headingId(String(children))}>{children}</h6>,
    normal: ({ children }) => <p>{children}</p>,
    blockquote: ({ children }) => <blockquote>{children}</blockquote>,
  },
  marks: {
    strong: ({ children }) => <strong>{children}</strong>,
    em: ({ children }) => <em>{children}</em>,
    link: ({ children, value }) => {
      const href = value?.href || "#";
      const external = href.startsWith("http");
      return external ? (
        <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-4">
          {children}
        </a>
      ) : (
        <Link href={href} className="text-primary underline underline-offset-4">{children}</Link>
      );
    },
  },
  list: {
    bullet: ({ children }) => <ul>{children}</ul>,
    number: ({ children }) => <ol>{children}</ol>,
  },
  listItem: {
    bullet: ({ children }) => <li>{children}</li>,
    number: ({ children }) => <li>{children}</li>,
  },
};

export function PortableTextContent({ blocks }: { blocks?: PortableTextBlock[] }) {
  if (!blocks?.length) return null;
  return <PortableText value={blocks as any} components={components} />;
}
