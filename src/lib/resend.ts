/**
 * resend.ts
 *
 * Minimal Resend client wrapper — no SDK, native fetch.
 *
 * Auth header: Authorization: Bearer <api-key>
 *
 * Why Resend?
 *   Postmark requires per-account approval before sending to off-domain
 *   recipients. Resend has no such gate, ships to any domain immediately,
 *   and free tier (100/day from a verified domain) covers Mr Props's
 *   bootstrap volume comfortably.
 *
 * Templates: rendered HTML/text are passed inline. The 10 markdown sources
 * in src/lib/newsletter-sequences/welcome_v1/ are converted to HTML at
 * request time (see render-template.ts).
 */

const API_BASE = 'https://api.resend.com';

function getApiKey(): string {
  const k = process.env.RESEND_API_KEY;
  if (!k) throw new Error('RESEND_API_KEY env var not set');
  return k;
}

function getFromAddress(): string {
  return process.env.RESEND_FROM_EMAIL ?? 'Helvis from Mr Props <hi@mrprops.io>';
}

export interface ResendSendOpts {
  to: string;
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
  headers?: Record<string, string>;
  tags?: Array<{ name: string; value: string }>;
  from?: string;
}

export interface ResendSendResponse {
  id: string;
}

export async function sendEmail(opts: ResendSendOpts): Promise<ResendSendResponse> {
  const body: Record<string, unknown> = {
    from: opts.from ?? getFromAddress(),
    to: [opts.to],
    subject: opts.subject,
    html: opts.html,
  };
  if (opts.text) body.text = opts.text;
  if (opts.replyTo) body.reply_to = opts.replyTo;
  if (opts.headers) body.headers = opts.headers;
  if (opts.tags) body.tags = opts.tags;

  const res = await fetch(`${API_BASE}/emails`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Resend send failed (${res.status}): ${text}`);
  }
  return (await res.json()) as ResendSendResponse;
}
