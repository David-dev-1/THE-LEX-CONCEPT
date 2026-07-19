import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getProofSession } from '@/lib/proofAuth';
import { isSameOrigin } from '@/lib/csrf';

export const dynamic = 'force-dynamic'; // ensures Vercel always routes every HTTP method to this function

const VALID_STATUSES = ['changes_requested', 'approved'];

export async function POST(request, { params }) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }

  const { token } = params;
  const proofSession = await getProofSession(request, token);
  if (!proofSession) {
    return NextResponse.json({ error: 'Locked. Enter the PIN to view this proof.' }, { status: 401 });
  }

  const { status } = await request.json();
  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
  }

  const proof = await prisma.proof.update({ where: { token }, data: { status } });

  await prisma.activity.create({
    data: {
      type: 'edit',
      message: status === 'approved'
        ? `Client approved proof "${proof.title}"`
        : `Client requested changes on proof "${proof.title}"`,
    },
  });

  return NextResponse.json({ success: true, status: proof.status });
}
