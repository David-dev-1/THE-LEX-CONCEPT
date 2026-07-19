import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { isSameOrigin } from '@/lib/csrf';

export const dynamic = 'force-dynamic'; // ensures Vercel always routes every HTTP method to this function

export async function PATCH(request, { params }) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }

  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const commentId = parseInt(params.commentId, 10);
  const { resolved } = await request.json();

  const comment = await prisma.proofComment.update({
    where: { id: commentId },
    data: { resolved: Boolean(resolved) },
  });

  return NextResponse.json(comment);
}
