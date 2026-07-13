import Sidebar from '@/components/admin/Sidebar';

// Access control for everything under here is enforced in src/middleware.js -
// if there's no valid session cookie, the request never reaches this layout,
// it gets redirected to /admin. This file just renders the shell.

export default function DashboardLayout({ children }) {
  return (
    <div className="admin-shell">
      <Sidebar />
      <main className="admin-main">{children}</main>
    </div>
  );
}
