import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { isSameOrigin } from '@/lib/csrf';
import { prisma } from '@/lib/db';
import sharp from 'sharp';
import { watermarkImage } from '@/lib/watermark';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic'; // ensures Vercel always routes every HTTP method to this function

export async function POST(request, { params }) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }

  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const proofId = parseInt(params.id, 10);
  const proof = await prisma.proof.findUnique({ where: { id: proofId } });
  if (!proof) return NextResponse.json({ error: 'Proof not found.' }, { status: 404 });

  const formData = await request.formData();
  const file = formData.get('file');
  const title = formData.get('title') ? String(formData.get('title')).slice(0, 200) : null;

  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
  }
  if (!file.type || !file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Only image files are allowed.' }, { status: 400 });
  }
  if (file.size > 20 * 1024 * 1024) {
    return NextResponse.json({ error: 'Image must be under 20MB.' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const filename = `proof-${Date.now()}-${Math.round(Math.random() * 1e6)}`;

  let watermarkedBuffer, blurDataUrl;
  try {
    // Resized down first so the watermark tiling looks consistent and the
    // file stays light - this is a review copy, not a delivery file.
    const resized = await sharp(buffer).resize({ width: 1600, withoutEnlargement: true }).toBuffer();
    watermarkedBuffer = await watermarkImage(resized, proof.clientName || 'PROOF');

    const tinyBuffer = await sharp(buffer).resize({ width: 24 }).webp({ quality: 40 }).toBuffer();
    blurDataUrl = `data:image/webp;base64,${tinyBuffer.toString('base64')}`;
  } catch {
    return NextResponse.json({ error: 'Could not process this image. Try a different file.' }, { status: 400 });
  }

  let imageUrl;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import('@vercel/blob');
    const result = await put(`proofs/${filename}.webp`, watermarkedBuffer, {
      access: 'public',
      contentType: 'image/webp',
    });
    imageUrl = result.url;
  } else {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });
    await writeFile(path.join(uploadDir, `${filename}.webp`), watermarkedBuffer);
    imageUrl = `/uploads/${filename}.webp`;
  }

  const maxOrder = await prisma.proofImage.aggregate({
    where: { proofId },
    _max: { order: true },
  });

  const image = await prisma.proofImage.create({
    data: {
      proofId,
      title,
      imageUrl,
      blurDataUrl,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  return NextResponse.json(image);
}
