import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { isSameOrigin } from '@/lib/csrf';

export const dynamic = 'force-dynamic'; // ensures Vercel always routes every HTTP method to this function

const VALID_STATUSES = ['pending', 'changes_requested', 'approved'];

// Protected - full proof detail for the admin's proof management page,
// including every image and every comment.
export async function GET(request, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = parseInt(params.id, 10);
  const proof = await prisma.proof.findUnique({
    where: { id },
    include: {
      images: {
        orderBy: { order: 'asc' },
        include: { comments: { orderBy: { createdAt: 'asc' } } },
      },
    },
  });

  if (!proof) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  const { pin, ...safeProof } = proof;
  return NextResponse.json(safeProof);
}

export async function PUT(request, { params }) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }

  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = parseInt(params.id, 10);
  const body = await request.json();
  const data = {};

  if (body.title !== undefined) data.title = String(body.title).trim().slice(0, 200);
  if (body.clientName !== undefined) data.clientName = String(body.clientName).trim().slice(0, 200) || null;
  if (body.clientEmail !== undefined) data.clientEmail = String(body.clientEmail).trim().slice(0, 200) || null;
  if (body.status !== undefined) {
    if (!VALID_STATUSES.includes(body.status)) {
      return NextResponse.json({ error: 'Invalid status.' }, { status: 400 });
    }
    data.status = body.status;
  }

  const proof = await prisma.proof.update({ where: { id }, data });
  const { pin, ...safeProof } = proof;
  return NextResponse.json(safeProof);
}

export async function DELETE(request, { params }) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }

  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = parseInt(params.id, 10);
  const proof = await prisma.proof.delete({ where: { id } }).catch(() => null);

  if (proof) {
    await prisma.activity.create({
      data: { type: 'delete', message: `Admin deleted client proof "${proof.title}"` },
    });
  }

  return NextResponse.json({ success: true });
}
