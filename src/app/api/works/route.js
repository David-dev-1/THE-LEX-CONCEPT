import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { isSameOrigin } from '@/lib/csrf';
import { isValidImageUrl } from '@/lib/validation';
import { CATEGORY_VALUES } from '@/lib/categories';

// Public - powers the portfolio gallery on the live site.
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const includesDrafts = searchParams.get('includeDrafts') === 'true';

  const session = includesDrafts ? await getSession() : null;

  const where = {
    ...(category && category !== 'all' ? { category } : {}),
    ...(session ? {} : { status: 'live' }), // only admins (with session) can see drafts
  };

  const works = await prisma.work.findMany({ where, orderBy: { createdAt: 'desc' } });
  return NextResponse.json(works);
}

// Protected - admin creates a new work entry (after uploading the image via /api/upload).
export async function POST(request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }

  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { title, category, description, imageUrl, thumbUrl, blurDataUrl, status } = body;

  if (!title || !category || !imageUrl) {
    return NextResponse.json({ error: 'Title, category, and image are required.' }, { status: 400 });
  }
  if (!CATEGORY_VALUES.includes(category)) {
    return NextResponse.json({ error: 'Invalid category.' }, { status: 400 });
  }
  if (!isValidImageUrl(imageUrl) || (thumbUrl && !isValidImageUrl(thumbUrl))) {
    return NextResponse.json({ error: 'Image must come from the upload endpoint.' }, { status: 400 });
  }
  if (title.length > 200) {
    return NextResponse.json({ error: 'Title is too long (200 characters max).' }, { status: 400 });
  }
  if (description && description.length > 2000) {
    return NextResponse.json({ error: 'Description is too long (2000 characters max).' }, { status: 400 });
  }

  const work = await prisma.work.create({
    data: {
      title: title.trim(),
      category,
      description: (description || '').trim(),
      imageUrl,
      thumbUrl: thumbUrl || imageUrl,
      blurDataUrl: blurDataUrl || null,
      status: status === 'draft' ? 'draft' : 'live',
    },
  });

  await prisma.activity.create({
    data: {
      type: 'upload',
      message: `Admin uploaded "${title}" to ${category}`,
      meta: JSON.stringify({ workId: work.id }),
    },
  });

  // The homepage is cached (see revalidate in app/page.js) so it stays fast
  // under heavy traffic - this tells Next.js to refresh that cache right
  // now instead of waiting for the next scheduled revalidation.
  revalidatePath('/');

  return NextResponse.json(work);
}
