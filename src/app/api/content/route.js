import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/session';
import { getSiteContent } from '@/lib/siteContent';
import { isSameOrigin } from '@/lib/csrf';
import { isValidImageUrl, isSafeHttpUrl } from '@/lib/validation';

// Without this, Next.js can treat this route as statically cacheable,
// since the GET handler below takes no parameters and doesn't read
// cookies/headers - it looks like "safe to cache forever" from the
// framework's point of view. On Vercel, that can cause the PUT handler on
// this exact same route to get rejected at the platform level
// (INVALID_REQUEST_METHOD) before it ever reaches this file's code -
// this is what caused Site Content saves to fail with an empty 405.
export const dynamic = 'force-dynamic';

const EDITABLE_FIELDS = [
  'heroEyebrow', 'heroHeadingLine1', 'heroHeadingLine2', 'heroSubtext',
  'heroToolsLabel', 'heroFocusLabel', 'heroBasedLabel',
  'aboutHeadingLine1', 'aboutHeadingLine2', 'aboutParagraph1', 'aboutParagraph2',
  'aboutImageUrl', 'aboutImageBlurDataUrl',
  'statProjects', 'statYears', 'statSatisfaction',
  'contactHeadingLine1', 'contactHeadingLine2', 'contactSubtext', 'contactEmail',
  'instagramUrl', 'facebookUrl', 'tiktokUrl', 'linkedinUrl', 'upworkUrl', 'whatsappUrl',
];
const NUMBER_FIELDS = ['statProjects', 'statYears', 'statSatisfaction'];
const URL_FIELDS = ['instagramUrl', 'facebookUrl', 'tiktokUrl', 'linkedinUrl', 'upworkUrl', 'whatsappUrl'];
const IMAGE_FIELDS = ['aboutImageUrl']; // aboutImageBlurDataUrl is a data: URL, handled separately below
const MAX_SHORT_TEXT = 300; // headings, labels
const MAX_LONG_TEXT = 2000; // paragraphs/subtext

export async function GET() {
  const content = await getSiteContent();
  return NextResponse.json(content);
}

export async function PUT(request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }

  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const data = {};

  for (const field of EDITABLE_FIELDS) {
    if (body[field] === undefined) continue;

    if (NUMBER_FIELDS.includes(field)) {
      const num = parseInt(body[field], 10);
      data[field] = Number.isFinite(num) ? Math.max(0, Math.min(num, 1000000)) : 0;
      continue;
    }

    if (field === 'aboutImageBlurDataUrl') {
      // Generated internally by /api/upload, not typed by the admin - just
      // sanity-check it looks like the data URL we expect before storing.
      const value = String(body[field] || '');
      data[field] = value.startsWith('data:image/') && value.length < 20000 ? value : null;
      continue;
    }

    const value = String(body[field]).trim();

    if (IMAGE_FIELDS.includes(field)) {
      if (value === '') {
        data[field] = null;
      } else if (!isValidImageUrl(value)) {
        return NextResponse.json({ error: 'Image must come from the upload endpoint.' }, { status: 400 });
      } else {
        data[field] = value;
      }
      continue;
    }

    if (URL_FIELDS.includes(field)) {
      if (value === '') {
        data[field] = null; // blank clears the link, hiding it on the site
      } else if (!isSafeHttpUrl(value)) {
        return NextResponse.json(
          { error: `${field.replace('Url', '')} link must be a valid http:// or https:// URL.` },
          { status: 400 }
        );
      } else if (value.length > MAX_SHORT_TEXT) {
        return NextResponse.json({ error: 'That link is too long.' }, { status: 400 });
      } else {
        data[field] = value;
      }
      continue;
    }

    const maxLen = field.toLowerCase().includes('paragraph') || field.toLowerCase().includes('subtext')
      ? MAX_LONG_TEXT
      : MAX_SHORT_TEXT;
    if (value.length > maxLen) {
      return NextResponse.json({ error: `That field is too long (${maxLen} characters max).` }, { status: 400 });
    }
    if (field === 'contactEmail' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return NextResponse.json({ error: 'Contact email must be a valid email address.' }, { status: 400 });
    }
    data[field] = value;
  }

  await getSiteContent(); // ensure row exists first
  const updated = await prisma.siteContent.update({ where: { id: 1 }, data });

  await prisma.activity.create({
    data: { type: 'edit', message: 'Admin updated site content' },
  });

  revalidatePath('/');

  return NextResponse.json(updated);
}
