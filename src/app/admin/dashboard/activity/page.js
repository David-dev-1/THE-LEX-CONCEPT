import { prisma } from '@/lib/db';
import ActivityFeed from '@/components/admin/ActivityFeed';

export const dynamic = 'force-dynamic';

export default async function ActivityLogPage() {
  const activity = await prisma.activity.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return (
    <section>
      <div className="page-title">Activity Log</div>
      <div className="page-sub">Full history of what's happened across the portfolio — most recent 100 events.</div>
      <div className="panel">
        <ActivityFeed items={activity} showClearAll={true} />
      </div>
    </section>
  );
}
