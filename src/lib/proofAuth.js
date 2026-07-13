import { SignJWT, jwtVerify } from 'jose';
import crypto from 'crypto';

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-only-secret-please-change-before-deploying-to-production'
);

// The private URL itself (/proof/{token}) - long and unguessable.
export function generateProofToken() {
  return crypto.randomBytes(24).toString('base64url');
}

// A short, human-typeable PIN the designer shares with the client
// separately from the link (e.g. over WhatsApp) - so having the link
// alone isn't enough to see the work.
export function generatePin() {
  return String(Math.floor(100000 + Math.random() * 900000)); // 6 digits
}

// The cookie name is scoped to the specific proof's token, so a client
// with access to one proof never gets a cookie that could be reused for
// a different one.
export function proofCookieName(token) {
  return `proof_${token}`;
}

export async function createProofSession(proofId, token) {
  return new SignJWT({ proofId, token })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d')
    .sign(secret);
}

export async function verifyProofSession(sessionValue, token) {
  try {
    const { payload } = await jwtVerify(sessionValue, secret);
    // The token embedded in the session must match the token in the URL -
    // stops a session cookie for one proof being replayed against another.
    if (payload.token !== token) return null;
    return payload;
  } catch {
    return null;
  }
}

// Convenience helper used by every client-facing /api/proof/[token]/*
// route: reads the token-scoped cookie off the request and verifies it.
export async function getProofSession(request, token) {
  const cookieValue = request.cookies.get(proofCookieName(token))?.value;
  if (!cookieValue) return null;
  return verifyProofSession(cookieValue, token);
}
