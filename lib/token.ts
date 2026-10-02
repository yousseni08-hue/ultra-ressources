import crypto from 'node:crypto';

// Jeton d'accès à une ressource : prouve que l'opt-in a eu lieu, sans base de données.
// Format : base64url(payload).signature
function secret() {
  const s = process.env.LEAD_TOKEN_SECRET;
  if (!s) throw new Error('LEAD_TOKEN_SECRET manquant');
  return s;
}

export function signToken(payload: Record<string, string | number>) {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifyToken<T = Record<string, string | number>>(token?: string | null): T | null {
  if (!token) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;
  const expected = crypto.createHmac('sha256', secret()).update(body).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(body, 'base64url').toString());
  } catch {
    return null;
  }
}
