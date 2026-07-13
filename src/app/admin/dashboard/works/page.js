import { prisma } from '@/lib/db';
import WorksManager from '@/components/admin/WorksManager';

export const dynamic = 'force-dynamic';

export default async function ManageWorksPage() {
  const works = await prisma.work.findMany({ orderBy: { createdAt: 'desc' } });

  return (
    <section>
      <div className="page-title">Manage Works</div>
      <div className="page-sub">Upload, edit, or remove portfolio pieces. Changes reflect on the live site instantly.</div>
      <WorksManager initialWorks={works} />
    </section>
  );
}
