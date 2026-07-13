import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { hashPassword } from '@/lib/password';
import { isSameOrigin } from '@/lib/csrf';
import { generatePin } from '@/lib/proofAuth';

export async function POST(request, { params }) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }

  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = parseInt(params.id, 10);
  const body = await request.json().catch(() => ({}));
  const customPin = body?.pin ? String(body.pin).trim() : '';

  if (customPin && !/^\d{4,8}$/.test(customPin)) {
    return NextResponse.json({ error: 'PIN must be 4-8 digits.' }, { status: 400 });
  }

  const pin = customPin || generatePin();
  const hashedPin = await hashPassword(pin);

  await prisma.proof.update({ where: { id }, data: { pin: hashedPin } });

  return NextResponse.json({ pin }); // shown once, plain text
}
