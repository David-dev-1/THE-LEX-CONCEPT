import { NextResponse } from 'next/server';
import { isSameOrigin } from '@/lib/csrf';

export async function POST(request) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set('session', '', { maxAge: 0, path: '/' });
  return response;
}
