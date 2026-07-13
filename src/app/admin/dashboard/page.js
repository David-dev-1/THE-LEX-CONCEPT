import { prisma } from '@/lib/db';
import { getStats } from '@/lib/stats';
import Link from 'next/link';
import ActivityFeed from '@/components/admin/ActivityFeed';
import { CATEGORY_LABELS } from '@/lib/categories';

export const dynamic = 'force-dynamic'; // always show fresh numbers, never cached

export default async function OverviewPage() {
  const stats = await getStats();
  const recentActivity = await prisma.activity.findMany({
    orderBy: { createdAt: 'desc' },
    take: 6,
  });

  return (
    <section>
      <div className="page-title">Overview</div>
      <div className="page-sub">Welcome back, Alexandra. Here's what's really happening on the portfolio.</div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="num">{stats.pageViews30.toLocaleString()}</div>
          <div className="lbl">Page Views (30d)</div>
          <div className={`delta ${stats.viewsChange >= 0 ? 'up' : 'down'}`}>
            {stats.viewsChange >= 0 ? '↑' : '↓'} {Math.abs(stats.viewsChange)}% vs previous 30 days
          </div>
        </div>
        <div className="stat-card">
          <div className="num">{stats.totalWorks}</div>
          <div className="lbl">Works Published</div>
          <div className="delta">Live on the portfolio now</div>
        </div>
        <Link href="/admin/dashboard/messages" className="stat-card" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
          <div className="num">{stats.unreadMessages}</div>
          <div className="lbl">Unread Messages</div>
          <div className={`delta ${stats.unreadMessages > 0 ? 'warn' : ''}`}>
            {stats.unreadMessages > 0 ? 'Needs a reply →' : 'All caught up'}
          </div>
        </Link>
        <div className="stat-card">
          <div className="num">{stats.filterClicks30}</div>
          <div className="lbl">Gallery Filter Clicks (30d)</div>
          <div className="delta">
            {stats.topCategory ? `${CATEGORY_LABELS[stats.topCategory] || stats.topCategory} most viewed` : 'No filter activity yet'}
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head">Recent Activity</div>
        <ActivityFeed items={recentActivity} />
      </div>
    </section>
  );
}
