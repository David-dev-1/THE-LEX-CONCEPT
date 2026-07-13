import { prisma } from '@/lib/db';
import { notFound } from 'next/navigation';
import ProofDetail from '@/components/admin/ProofDetail';

export const dynamic = 'force-dynamic';

export default async function ProofDetailPage({ params }) {
  const id = parseInt(params.id, 10);
  const proof = await prisma.proof.findUnique({
    where: { id },
    include: {
      images: {
        orderBy: { order: 'asc' },
        include: { comments: { orderBy: { createdAt: 'asc' } } },
      },
    },
  });

  if (!proof) notFound();

  const { pin, ...safeProof } = proof;

  return (
    <section>
      <ProofDetail proof={safeProof} />
    </section>
  );
}
