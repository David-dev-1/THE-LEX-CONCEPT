import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { checkRateLimit } from '@/lib/rateLimit';
import { isSameOrigin } from '@/lib/csrf';

export const dynamic = 'force-dynamic'; // ensures Vercel always routes every HTTP method to this function

// Protected - full activity log for the admin dashboard.
export async function GET(request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);

  const activity = await prisma.activity.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return NextResponse.json(activity);
}

// Protected - lets the admin clear the entire activity log/stats history.
// Since dashboard stats are computed from these records, this is also how
// the admin "resets" the numbers on the Overview page.
export async function DELETE(request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }

  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await prisma.activity.deleteMany({});
  return NextResponse.json({ success: true });
}

// Public - the live site calls this to record real visitor behavior.
// This is what makes the dashboard stats real instead of hardcoded.
export async function POST(request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ ok: false }, { status: 403 });
  }

  const ip = request.headers.get('x-forwarded-for') || 'unknown';

  if (!checkRateLimit(`track:${ip}`, 60, 60 * 1000)) {
    return NextResponse.json({ ok: false }, { status: 429 });
  }

  const { type, meta } = await request.json();

  if (!['page_view', 'filter_click', 'work_view'].includes(type)) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Cap anything that ends up in the stored message/meta - this endpoint
  // is public, so it shouldn't be possible to stuff arbitrarily large
  // strings into the database just by calling it directly.
  const safeCategory = typeof meta?.category === 'string' ? meta.category.slice(0, 100) : 'unknown';
  const safeTitle = typeof meta?.title === 'string' ? meta.title.slice(0, 200) : 'a project';
  const safeWorkId = Number.isInteger(meta?.workId) ? meta.workId : undefined;

  let message = 'Visitor viewed the portfolio';
  if (type === 'filter_click') message = `Visitor filtered by "${safeCategory}"`;
  if (type === 'work_view') message = `Visitor viewed "${safeTitle}"`;

  const safeMeta = type === 'filter_click' ? { category: safeCategory }
    : type === 'work_view' ? { workId: safeWorkId, title: safeTitle }
    : null;

  await prisma.activity.create({
    data: { type, message, meta: safeMeta ? JSON.stringify(safeMeta) : null },
  });

  if (type === 'work_view' && safeWorkId) {
    await prisma.work.update({
      where: { id: safeWorkId },
      data: { views: { increment: 1 } },
    }).catch(() => {}); // ignore if work was deleted between view and increment
  }

  return NextResponse.json({ ok: true });
}
