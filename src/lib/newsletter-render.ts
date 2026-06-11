/**
 * newsletter-render.ts
 *
 * Renders a welcome_v1 markdown email (with frontmatter) to HTML + text + subject,
 * applying merge-tag substitution.
 *
 * Why this exists: with the Resend swap we no longer use Postmark's hosted
 * template store. The 10 markdown files in src/lib/newsletter-sequences/welcome_v1/
 * are now the single source of truth and we render them at send time.
 *
 * Frontmatter we honor:
 *   subject_a: "string"
 *   subject_b: "string"     (alt subject — A/B in future, single now)
 *   preheader: "string"     (rendered as inline preheader at top of body)
 *
 * Merge tags: {{name}} or {{ name }} with optional whitespace.
 */

import fs from 'node:fs';
import path from 'node:path';

// markdown → HTML: use a tiny custom converter (no deps) since we control input.
function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, ch => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[ch]!));
}

function md(input: string): string {
  // Process line by line. Supports headings, bold, links, paragraphs, and hr.
  const lines = input.split('\n');
  let html = '';
  let para: string[] = [];
  const flushPara = () => {
    if (para.length) {
      html += `<p>${para.join(' ')}</p>\n`;
      para = [];
    }
  };
  const inline = (s: string) => {
    s = escapeHtml(s);
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color:#7c3aed;text-decoration:underline">$1</a>');
    return s;
  };
  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) {
      flushPara();
      continue;
    }
    if (line.match(/^---+$/)) {
      flushPara();
      html += '<hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>\n';
      continue;
    }
    const h = line.match(/^(#+)\s+(.+)$/);
    if (h) {
      flushPara();
      const level = Math.min(h[1].length, 4);
      html += `<h${level} style="margin:24px 0 12px;font-weight:600">${inline(h[2])}</h${level}>\n`;
      continue;
    }
    para.push(inline(line));
  }
  flushPara();
  return html;
}

interface Frontmatter {
  subject_a?: string;
  subject_b?: string;
  preheader?: string;
  template_alias?: string;
  day_offset?: number;
  stream?: string;
}

function parseFrontmatter(src: string): { fm: Frontmatter; body: string } {
  const m = src.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!m) return { fm: {}, body: src };
  const fm: Record<string, string | number> = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^([a-z_]+):\s*(.*)$/i);
    if (kv) {
      let val: string | number = kv[2].trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      else if (/^\d+$/.test(val)) val = parseInt(val, 10);
      fm[kv[1]] = val;
    }
  }
  // strip trailing yaml-like footer block from body (e.g. unsubscribe_footer)
  let body = m[2];
  body = body.replace(/\n---\nunsubscribe_footer:[\s\S]*$/, '');
  return { fm: fm as Frontmatter, body: body.trim() };
}

function applyMerge(input: string, model: Record<string, string>): string {
  return input.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, k) => model[k] ?? `{{${k}}}`);
}

const SHELL = (subject: string, preheader: string, bodyHtml: string, unsubUrl: string) => `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#faf5ff">
  <span style="display:none!important;font-size:0;line-height:0;max-height:0;max-width:0;opacity:0;overflow:hidden">${escapeHtml(preheader)}</span>
  <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:16px;line-height:1.6;color:#1f2937;max-width:560px;margin:24px auto;padding:24px;background:#ffffff;border-radius:12px">
    ${bodyHtml}
    <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0 16px"/>
    <p style="font-size:12px;color:#6b7280;margin:0">
      You got this email because you subscribed at <a href="https://mrprops.io" style="color:#6b7280">mrprops.io</a>.
      <a href="${unsubUrl}" style="color:#6b7280">Unsubscribe</a>.
    </p>
  </div>
</body></html>`;

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

export interface RenderModel {
  first_name?: string;
  confirm_url: string;
  unsubscribe_url: string;
  utility_burn_typical?: string;
  exchange_student_rent_typical?: string;
  ltr_rent_typical?: string;
  str_summer_rate_typical?: string;
  str_winter_rate_typical?: string;
  loss_per_unit_per_season?: string;
  total_loss_last_winter?: string;
  [k: string]: string | undefined;
}

const DEFAULT_NUMBERS: Record<string, string> = {
  first_name: 'there',
  utility_burn_typical: '€350',
  exchange_student_rent_typical: '€650',
  ltr_rent_typical: '€500',
  str_summer_rate_typical: '€80',
  str_winter_rate_typical: '€35',
  loss_per_unit_per_season: '€2,900',
  total_loss_last_winter: '€17,400',
};

export function renderWelcomeEmail(step: number, model: RenderModel): RenderedEmail {
  if (step < 1 || step > 10) throw new Error(`step ${step} out of range`);
  const filePath = path.join(process.cwd(), 'src/lib/newsletter-sequences/welcome_v1', `email-${step}.md`);
  const src = fs.readFileSync(filePath, 'utf8');
  const { fm, body } = parseFrontmatter(src);

  const fullModel: Record<string, string> = { ...DEFAULT_NUMBERS };
  for (const [k, v] of Object.entries(model)) {
    if (typeof v === 'string') fullModel[k] = v;
  }

  const subject = applyMerge(fm.subject_a ?? `Mr Props · email ${step}`, fullModel);
  const preheader = applyMerge(fm.preheader ?? '', fullModel);
  const mergedBody = applyMerge(body, fullModel);
  const bodyHtml = md(mergedBody);
  const html = SHELL(subject, preheader, bodyHtml, fullModel.unsubscribe_url ?? '');
  const text = mergedBody;

  return { subject, html, text };
}
