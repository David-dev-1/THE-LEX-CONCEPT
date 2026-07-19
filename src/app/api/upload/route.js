import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { isSameOrigin } from '@/lib/csrf';
import sharp from 'sharp';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export const dynamic = 'force-dynamic'; // ensures Vercel always routes every HTTP method to this function

// This is what keeps the site fast despite real, high-quality images:
// every upload is converted to WebP (much smaller than JPEG/PNG at the
// same visual quality) and saved at two sizes - a large, high-quality
// version for lightboxes and a lighter thumbnail for the gallery grid.
// A tiny (24px) blurred preview is also generated and returned directly
// so the gallery can show an instant blur-up placeholder while the real
// image streams in, instead of a blank space.
//
// IMPORTANT if deploying to Vercel: serverless functions there have a
// request body size limit (historically ~4.5MB on standard plans). The
// 20MB cap below is safe for local development and traditional Node
// hosting, but a file over roughly 4MB may be rejected by the platform
// itself before this code even runs, with no way for this route to
// produce a friendlier error. If large uploads matter in production,
// switch to Vercel Blob's client-side direct-upload flow (the browser
// uploads straight to Blob storage, bypassing the function entirely) -
// see the README for details.

export async function POST(request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }

  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get('file');

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
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;

  let fullBuffer, thumbBuffer, blurDataUrl;
  try {
    // Full version: large enough for a crisp lightbox view, still web-friendly.
    fullBuffer = await sharp(buffer)
      .resize({ width: 2000, withoutEnlargement: true })
      .webp({ quality: 92 })
      .toBuffer();

    // Thumbnail: what the gallery grid actually loads - small and light.
    thumbBuffer = await sharp(buffer)
      .resize({ width: 640, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    // Blur placeholder: tiny + heavily compressed, encoded directly as a
    // data URL so it can render instantly with zero extra network request.
    const tinyBuffer = await sharp(buffer)
      .resize({ width: 24 })
      .webp({ quality: 40 })
      .toBuffer();
    blurDataUrl = `data:image/webp;base64,${tinyBuffer.toString('base64')}`;
  } catch (err) {
    return NextResponse.json({ error: 'Could not process this image. Try a different file.' }, { status: 400 });
  }

  // Production path: if a Vercel Blob token is configured, store there
  // (Vercel's serverless functions have an ephemeral filesystem, so local
  // disk storage does not persist reliably in that environment).
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import('@vercel/blob');
    const full = await put(`works/${filename}-full.webp`, fullBuffer, {
      access: 'public',
      contentType: 'image/webp',
      cacheControlMaxAge: 31536000,
    });
    const thumb = await put(`works/${filename}-thumb.webp`, thumbBuffer, {
      access: 'public',
      contentType: 'image/webp',
      cacheControlMaxAge: 31536000,
    });
    return NextResponse.json({ imageUrl: full.url, thumbUrl: thumb.url, blurDataUrl });
  }

  // Local dev / traditional Node hosting path: save to /public/uploads.
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, `${filename}-full.webp`), fullBuffer);
  await writeFile(path.join(uploadDir, `${filename}-thumb.webp`), thumbBuffer);

  return NextResponse.json({
    imageUrl: `/uploads/${filename}-full.webp`,
    thumbUrl: `/uploads/${filename}-thumb.webp`,
    blurDataUrl,
  });
}
