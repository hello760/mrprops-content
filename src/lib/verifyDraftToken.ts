// Phase 5 C-3: HMAC token verifier for /_draft/[id] preview route.
// Shared secret `DRAFT_PREVIEW_SECRET` is set on both market-me-good and mrprops-content
// Vercel projects. Tokens are HMAC-SHA256 of `${id}:${expires_epoch_seconds}` signed
// with the secret, encoded as hex. Short-lived (default 10 minutes).
import { createHmac, timingSafeEqual } from 'node:crypto';

export interface DraftTokenPayload {
  id: string;
  expiresAt: number; // epoch seconds
}

/**
 * Verify a draft preview token against the shared secret.
 * Returns the payload if valid, or null if invalid/expired/missing secret.
 * Returns 404-not-401 semantics: callers should render notFound() on null.
 */
export function verifyDraftToken(token: string | null | undefined, expectedId: string): DraftTokenPayload | null {
  if (!token || typeof token !== 'string') return null;
  const secret = process.env.DRAFT_PREVIEW_SECRET;
  if (!secret) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [idPart, expPart, sig] = parts;
  if (idPart !== expectedId) return null;

  const expiresAt = Number(expPart);
  if (!Number.isFinite(expiresAt) || expiresAt <= 0) return null;
  if (expiresAt < Math.floor(Date.now() / 1000)) return null; // expired

  const payload = `${idPart}:${expPart}`;
  const expected = createHmac('sha256', secret).update(payload).digest('hex');
  // constant-time compare
  const sigBuf = Buffer.from(sig, 'hex');
  const expBuf = Buffer.from(expected, 'hex');
  if (sigBuf.length !== expBuf.length) return null;
  if (!timingSafeEqual(sigBuf, expBuf)) return null;

  return { id: idPart, expiresAt };
}
