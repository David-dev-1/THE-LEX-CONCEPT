import { prisma } from '@/lib/db';
import ProofsManager from '@/components/admin/ProofsManager';

export const dynamic = 'force-dynamic';

export default async function ProofsPage() {
  const proofs = await prisma.proof.findMany({
    orderBy: { createdAt: 'desc' },
    include: { images: { select: { id: true } } },
  });

  const withCounts = await Promise.all(
    proofs.map(async (p) => {
      const unresolvedComments = await prisma.proofComment.count({
        where: { resolved: false, proofImage: { proofId: p.id } },
      });
      const { pin, images, ...rest } = p;
      return { ...rest, imageCount: images.length, unresolvedComments };
    })
  );

  return (
    <section>
      <div className="page-title">Client Proofs</div>
      <div className="page-sub">
        Share a private, watermarked, PIN-protected link with a client so they can review work and
        leave feedback before you hand over final files.
      </div>
      <ProofsManager initialProofs={withCounts} />
    </section>
  );
}
