/**
 * postmark.ts
 *
 * Minimal Postmark client wrapper. Uses fetch (native in Node 18+).
 * No external SDK to keep deps tight.
 *
 * Auth header: X-Postmark-Server-Token: <token>
 *
 * Two stream patterns we use:
 *   - "outbound" (transactional) — Email 1 (immediate welcome), confirmation prompts
 *   - "broadcast" (auto unsub handling) — Email 2-10 (the sequence)
 */

const API_BASE = 'https://api.postmarkapp.com';

function getServerToken(): string {
  const t = process.env.POSTMARK_SERVER_TOKEN;
  if (!t) throw new Error('POSTMARK_SERVER_TOKEN env var not set');
  return t;
}

interface SendTemplateOpts {
  TemplateAlias: string;                       // e.g. 'welcome-1'
  To: string;
  TemplateModel: Record<string, unknown>;      // merge-tag values
  MessageStream: 'outbound' | 'broadcast';
  From?: string;                               // defaults to hi@mrprops.io
  ReplyTo?: string;
  Tag?: string;                                // for analytics segmentation
  Metadata?: Record<string, string>;           // captured on Postmark message log
  TrackOpens?: boolean;
  TrackLinks?: 'None' | 'HtmlAndText' | 'HtmlOnly' | 'TextOnly';
}

export interface PostmarkSendResponse {
  To: string;
  SubmittedAt: string;
  MessageID: string;
  ErrorCode: number;
  Message: string;
}

const DEFAULT_FROM = 'Helvis from Mr Props <hi@mrprops.io>';

/**
 * Send an email via a Postmark stored template.
 * Throws on non-2xx response.
 */
export async function sendTemplate(opts: SendTemplateOpts): Promise<PostmarkSendResponse> {
  const body = {
    From: opts.From ?? DEFAULT_FROM,
    ReplyTo: opts.ReplyTo ?? 'hi@mrprops.io',
    To: opts.To,
    TemplateAlias: opts.TemplateAlias,
    TemplateModel: opts.TemplateModel,
    MessageStream: opts.MessageStream,
    ...(opts.Tag ? { Tag: opts.Tag } : {}),
    ...(opts.Metadata ? { Metadata: opts.Metadata } : {}),
    ...(opts.TrackOpens != null ? { TrackOpens: opts.TrackOpens } : {}),
    ...(opts.TrackLinks ? { TrackLinks: opts.TrackLinks } : {}),
  };

  const res = await fetch(`${API_BASE}/email/withTemplate`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Postmark-Server-Token': getServerToken(),
    },
    body: JSON.stringify(body),
  });

  const json = (await res.json()) as PostmarkSendResponse;
  if (!res.ok || json.ErrorCode !== 0) {
    throw new Error(`Postmark sendTemplate failed: HTTP ${res.status} ErrorCode=${json.ErrorCode} Msg=${json.Message}`);
  }
  return json;
}

/**
 * Send a raw email (HTML + Text) without a template — used for the confirmation
 * email if we ever want to send it without a Postmark template.
 * For v1 we use sendTemplate exclusively, but leaving this here as utility.
 */
export async function sendEmail(opts: {
  To: string;
  Subject: string;
  HtmlBody?: string;
  TextBody?: string;
  MessageStream: 'outbound' | 'broadcast';
  From?: string;
  ReplyTo?: string;
  Tag?: string;
  Metadata?: Record<string, string>;
}): Promise<PostmarkSendResponse> {
  const body = {
    From: opts.From ?? DEFAULT_FROM,
    ReplyTo: opts.ReplyTo ?? 'hi@mrprops.io',
    To: opts.To,
    Subject: opts.Subject,
    HtmlBody: opts.HtmlBody,
    TextBody: opts.TextBody,
    MessageStream: opts.MessageStream,
    ...(opts.Tag ? { Tag: opts.Tag } : {}),
    ...(opts.Metadata ? { Metadata: opts.Metadata } : {}),
  };
  const res = await fetch(`${API_BASE}/email`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'X-Postmark-Server-Token': getServerToken(),
    },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as PostmarkSendResponse;
  if (!res.ok || json.ErrorCode !== 0) {
    throw new Error(`Postmark sendEmail failed: HTTP ${res.status} ErrorCode=${json.ErrorCode} Msg=${json.Message}`);
  }
  return json;
}
