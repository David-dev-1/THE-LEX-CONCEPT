import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyPassword } from '@/lib/password';
import { createProofSession, proofCookieName } from '@/lib/proofAuth';
import { checkRateLimit } from '@/lib/rateLimit';
import { isSameOrigin } from '@/lib/csrf';

export const dynamic = 'force-dynamic'; // ensures Vercel always routes every HTTP method to this function

export async function POST(request, { params }) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }

  const { token } = params;
  const ip = request.headers.get('x-forwarded-for') || 'unknown';

  // A 6-digit PIN has far fewer possibilities than a real password, so
  // this is deliberately stricter than the admin login's rate limit.
  if (!checkRateLimit(`proof-unlock:${token}:${ip}`, 8, 15 * 60 * 1000)) {
    return NextResponse.json({ error: 'Too many attempts. Try again in 15 minutes.' }, { status: 429 });
  }

  const { pin } = await request.json();
  if (!pin) return NextResponse.json({ error: 'Enter the PIN.' }, { status: 400 });

  const proof = await prisma.proof.findUnique({ where: { token } });
  if (!proof || !(await verifyPassword(String(pin).trim(), proof.pin))) {
    return NextResponse.json({ error: 'Incorrect PIN.' }, { status: 401 });
  }

  const session = await createProofSession(proof.id, token);
  const response = NextResponse.json({ success: true });
  response.cookies.set(proofCookieName(token), session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 days - clients revisit over a review cycle
  });

  return response;
}
