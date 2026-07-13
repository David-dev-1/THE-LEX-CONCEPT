'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Overview' },
  { href: '/admin/dashboard/works', label: 'Manage Works' },
  { href: '/admin/dashboard/proofs', label: 'Client Proofs' },
  { href: '/admin/dashboard/content', label: 'Site Content' },
  { href: '/admin/dashboard/messages', label: 'Messages' },
  { href: '/admin/dashboard/activity', label: 'Activity Log' },
  { href: '/admin/dashboard/settings', label: 'Settings' },
];

function ExternalIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin');
    router.refresh();
  }

  return (
    <aside className="sidebar">
      <div className="sb-brand">THE LEX<span>·</span>CONCEPT</div>
      <div className="sb-role">Studio Admin</div>

      {/* Takes the admin back to the live public portfolio in a new tab. */}
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="sb-view-site"
      >
        <ExternalIcon /> View Public Site
      </a>

      <ul className="sb-nav" style={{ listStyle: 'none' }}>
        {NAV_ITEMS.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className={pathname === item.href ? 'active' : ''}>
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
      <button className="sb-logout" onClick={handleLogout}>Log Out</button>
    </aside>
  );
}
