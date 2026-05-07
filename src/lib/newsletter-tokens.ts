/**
 * newsletter-tokens.ts
 *
 * HMAC-signed tokens for soft double opt-in confirmation + unsubscribe.
 * Uses Node.js built-in crypto. No external deps.
 *
 * Token format: <base64url-payload>.<base64url-signature>
 * Payload is JSON: { sub: subscriberId, exp: epoch_seconds, kind: 'confirm'|'unsub' }
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

export type TokenKind = 'confirm' | 'unsub';

interface TokenPayload {
  sub: string;       // subscriber UUID
  exp: number;       // epoch seconds
  kind: TokenKind;
}

function getSecret(): string {
  const s = process.env.NEWSLETTER_CONFIRM_SECRET;
  if (!s) throw new Error('NEWSLETTER_CONFIRM_SECRET env var not set');
  return s;
}

function b64urlEncode(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(s: string): Buffer {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  return Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/') + pad, 'base64');
}

/**
 * Sign a payload — returns "payload_b64.signature_b64" string suitable for URL param.
 * @param subscriberId  UUID of the subscriber
 * @param kind          'confirm' (5-day window) or 'unsub' (90-day window)
 */
export function signToken(subscriberId: string, kind: TokenKind): string {
  const ttlSeconds = kind === 'confirm' ? 5 * 24 * 60 * 60 : 90 * 24 * 60 * 60;
  const payload: TokenPayload = {
    sub: subscriberId,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
    kind,
  };
  const payloadJson = JSON.stringify(payload);
  const payloadB64 = b64urlEncode(Buffer.from(payloadJson, 'utf-8'));
  const sig = createHmac('sha256', getSecret()).update(payloadB64).digest();
  const sigB64 = b64urlEncode(sig);
  return `${payloadB64}.${sigB64}`;
}

/**
 * Verify a token. Returns the payload if valid, null if invalid/expired.
 * Constant-time comparison to prevent timing attacks.
 */
export function verifyToken(token: string, expectedKind: TokenKind): TokenPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;

  // Recompute expected signature
  const expectedSig = createHmac('sha256', getSecret()).update(payloadB64).digest();
  let providedSig: Buffer;
  try {
    providedSig = b64urlDecode(sigB64);
  } catch {
    return null;
  }
  if (providedSig.length !== expectedSig.length) return null;
  if (!timingSafeEqual(providedSig, expectedSig)) return null;

  // Parse payload
  let payload: TokenPayload;
  try {
    payload = JSON.parse(b64urlDecode(payloadB64).toString('utf-8'));
  } catch {
    return null;
  }
  if (!payload.sub || typeof payload.sub !== 'string') return null;
  if (typeof payload.exp !== 'number') return null;
  if (payload.kind !== expectedKind) return null;
  if (payload.exp < Math.floor(Date.now() / 1000)) return null; // expired

  return payload;
}
