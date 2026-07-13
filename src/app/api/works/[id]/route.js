import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { isSameOrigin } from '@/lib/csrf';
import { isValidImageUrl } from '@/lib/validation';
import { CATEGORY_VALUES } from '@/lib/categories';

export async function PUT(request, { params }) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }

  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = parseInt(params.id, 10);
  const body = await request.json();
  const { title, category, description, status, imageUrl, thumbUrl, blurDataUrl } = body;

  if (category !== undefined && !CATEGORY_VALUES.includes(category)) {
    return NextResponse.json({ error: 'Invalid category.' }, { status: 400 });
  }
  if (imageUrl !== undefined && !isValidImageUrl(imageUrl)) {
    return NextResponse.json({ error: 'Image must come from the upload endpoint.' }, { status: 400 });
  }
  if (thumbUrl !== undefined && !isValidImageUrl(thumbUrl)) {
    return NextResponse.json({ error: 'Image must come from the upload endpoint.' }, { status: 400 });
  }
  if (title !== undefined && title.length > 200) {
    return NextResponse.json({ error: 'Title is too long (200 characters max).' }, { status: 400 });
  }
  if (description !== undefined && description.length > 2000) {
    return NextResponse.json({ error: 'Description is too long (2000 characters max).' }, { status: 400 });
  }

  const work = await prisma.work.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title: title.trim() } : {}),
      ...(category !== undefined ? { category } : {}),
      ...(description !== undefined ? { description: description.trim() } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(imageUrl !== undefined ? { imageUrl } : {}),
      ...(thumbUrl !== undefined ? { thumbUrl } : {}),
      ...(blurDataUrl !== undefined ? { blurDataUrl } : {}),
    },
  });

  await prisma.activity.create({
    data: {
      type: 'edit',
      message: `Admin updated "${work.title}"`,
      meta: JSON.stringify({ workId: id }),
    },
  });

  revalidatePath('/');

  return NextResponse.json(work);
}

export async function DELETE(request, { params }) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }

  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const id = parseInt(params.id, 10);
  const work = await prisma.work.delete({ where: { id } });

  await prisma.activity.create({
    data: { type: 'delete', message: `Admin deleted "${work.title}"` },
  });

  revalidatePath('/');

  return NextResponse.json({ success: true });
}
