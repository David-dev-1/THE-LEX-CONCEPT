import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { isSameOrigin } from '@/lib/csrf';
import { prisma } from '@/lib/db';

export async function DELETE(request, { params }) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }

  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const imageId = parseInt(params.imageId, 10);
  await prisma.proofImage.delete({ where: { id: imageId } }).catch(() => {});

  return NextResponse.json({ success: true });
}
