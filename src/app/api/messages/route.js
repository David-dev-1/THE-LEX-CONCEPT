import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';

export const dynamic = 'force-dynamic'; // ensures Vercel always routes every HTTP method to this function

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const messages = await prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(messages);
}
