import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getProofSession } from '@/lib/proofAuth';

export const dynamic = 'force-dynamic'; // ensures Vercel always routes every HTTP method to this function

// The public /proof/[token] link always requires the PIN - no exceptions,
// including for the admin's own browser. An earlier version let a logged-
// in admin session skip the PIN here too (so the designer could preview
// without re-entering it), but that meant testing the link in the same
// browser used for the dashboard looked "broken" - it was silently letting
// the admin straight through. The admin can already see everything about
// a proof from the dashboard's Proof detail page; this route now matches
// exactly what a client experiences.
export async function GET(request, { params }) {
  const { token } = params;

  const proofSession = await getProofSession(request, token);
  if (!proofSession) {
    return NextResponse.json({ error: 'Locked. Enter the PIN to view this proof.' }, { status: 401 });
  }

  const proof = await prisma.proof.findUnique({
    where: { token },
    include: {
      images: {
        orderBy: { order: 'asc' },
        include: { comments: { orderBy: { createdAt: 'asc' } } },
      },
    },
  });

  if (!proof) return NextResponse.json({ error: 'Not found.' }, { status: 404 });

  const { pin, ...safeProof } = proof;
  return NextResponse.json(safeProof);
}
