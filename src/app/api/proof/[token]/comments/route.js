import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getProofSession } from '@/lib/proofAuth';
import { isSameOrigin } from '@/lib/csrf';
import { checkRateLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic'; // ensures Vercel always routes every HTTP method to this function

export async function POST(request, { params }) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }

  const { token } = params;
  const proofSession = await getProofSession(request, token);
  if (!proofSession) {
    return NextResponse.json({ error: 'Locked. Enter the PIN to view this proof.' }, { status: 401 });
  }

  const ip = request.headers.get('x-forwarded-for') || 'unknown';
  if (!checkRateLimit(`proof-comment:${token}:${ip}`, 30, 60 * 1000)) {
    return NextResponse.json({ error: 'Slow down a little and try again.' }, { status: 429 });
  }

  const body = await request.json();
  const { proofImageId, x, y, message, authorName } = body;

  const imageId = parseInt(proofImageId, 10);
  const px = Number(x);
  const py = Number(y);

  if (!Number.isInteger(imageId) || !Number.isFinite(px) || !Number.isFinite(py)) {
    return NextResponse.json({ error: 'Invalid comment position.' }, { status: 400 });
  }
  if (px < 0 || px > 100 || py < 0 || py > 100) {
    return NextResponse.json({ error: 'Comment position out of bounds.' }, { status: 400 });
  }
  if (!message || !String(message).trim()) {
    return NextResponse.json({ error: 'Write a comment before submitting.' }, { status: 400 });
  }

  // Verify the image actually belongs to this proof - stops someone from
  // pinning a comment onto an image from a different proof entirely by
  // guessing/enumerating image IDs.
  const image = await prisma.proofImage.findFirst({
    where: { id: imageId, proof: { token } },
  });
  if (!image) return NextResponse.json({ error: 'Image not found on this proof.' }, { status: 404 });

  const comment = await prisma.proofComment.create({
    data: {
      proofImageId: imageId,
      x: px,
      y: py,
      message: String(message).trim().slice(0, 2000),
      authorName: String(authorName || 'Client').trim().slice(0, 100) || 'Client',
      authorType: 'client',
    },
  });

  const proof = await prisma.proof.findUnique({ where: { token } });
  await prisma.activity.create({
    data: { type: 'message', message: `New feedback on proof "${proof?.title || token}"` },
  });

  return NextResponse.json(comment);
}
