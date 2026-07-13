import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { hashPassword } from '@/lib/password';
import { isSameOrigin } from '@/lib/csrf';
import { generateProofToken, generatePin } from '@/lib/proofAuth';

// Protected - lists every proof for the admin's "Client Proofs" page.
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const proofs = await prisma.proof.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      images: { select: { id: true } },
      _count: false,
    },
  });

  // Unresolved comment count per proof, computed separately since Prisma's
  // nested counts can't filter on a grandchild relation in one query.
  const withCounts = await Promise.all(
    proofs.map(async (p) => {
      const unresolvedComments = await prisma.proofComment.count({
        where: { resolved: false, proofImage: { proofId: p.id } },
      });
      return { ...p, imageCount: p.images.length, unresolvedComments, pin: undefined };
    })
  );

  return NextResponse.json(withCounts);
}

// Protected - creates a new proof. Returns the PIN in plain text exactly
// once (it's hashed before storage, same as a password, so this is the
// only time it's ever visible) - the admin needs to see it to share it
// with the client.
export async function POST(request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }

  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const title = String(body.title || '').trim().slice(0, 200);
  const clientName = String(body.clientName || '').trim().slice(0, 200);
  const clientEmail = String(body.clientEmail || '').trim().slice(0, 200);
  const customPin = body.pin ? String(body.pin).trim() : '';

  if (!title) {
    return NextResponse.json({ error: 'Give the proof a title.' }, { status: 400 });
  }
  if (customPin && !/^\d{4,8}$/.test(customPin)) {
    return NextResponse.json({ error: 'PIN must be 4-8 digits.' }, { status: 400 });
  }

  const pin = customPin || generatePin();
  const token = generateProofToken();
  const hashedPin = await hashPassword(pin);

  const proof = await prisma.proof.create({
    data: {
      title,
      clientName: clientName || null,
      clientEmail: clientEmail || null,
      token,
      pin: hashedPin,
    },
  });

  await prisma.activity.create({
    data: { type: 'upload', message: `Admin created a client proof: "${title}"` },
  });

  return NextResponse.json({ ...proof, pin }); // pin included once, plain text
}
