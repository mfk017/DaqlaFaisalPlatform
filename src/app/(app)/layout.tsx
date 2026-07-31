import { requireApproved } from "@/lib/auth";
import Link from "next/link";
import { getT } from "@/lib/i18n";
import { db } from "@/lib/db";
import { UserCircle, LogOut, Home, Users, Settings, BarChart2 } from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireApproved();
  const t = getT("ar");
  const isAdmin = session.roles.includes("admin");

  const profile = await db.profile.findUnique({
    where: { id: session.sub }
  });

  // Determine display role
  let roleDisplay = "مستخدم";
  if (isAdmin) roleDisplay = "مدير (Admin)";
  else if (session.roles.includes("worker")) roleDisplay = `عامل (${session.specialty || ''})`;
  else if (session.roles.includes("quality")) roleDisplay = "مفتش جودة";
  else if (session.roles.includes("reception")) roleDisplay = "استقبال";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-header">
          {t("app_name")}
        </div>
        <nav className="sidebar-nav">
          <Link href="/dashboard" className="nav-link">
            <Home size={20} />
            {t("dashboard")}
          </Link>
          <Link href="/orders" className="nav-link">
            <Settings size={20} />
            {t("orders")}
          </Link>
          
          {isAdmin && (
            <>
              <Link href="/admin/users" className="nav-link">
                <Users size={20} />
                {t("users")}
              </Link>
              <Link href="/reports" className="nav-link">
                <BarChart2 size={20} />
                التقارير
              </Link>
              <Link href="/admin/branches" className="nav-link">
                <Settings size={20} />
                {t("branches")}
              </Link>
              <Link href="/admin/categories" className="nav-link">
                <Settings size={20} />
                {t("categories")}
              </Link>
              <Link href="/admin/specialties" className="nav-link">
                <Settings size={20} />
                التخصصات والأدوار
              </Link>
            </>
          )}
        </nav>
      </aside>
      <main className="main-content">
        <header className="topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div></div> {/* empty div to push content to the left if needed, or leave it flex-end */}
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <ThemeToggle />
            {/* Account Info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', paddingRight: '24px', borderRight: '1px solid var(--border-light)' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>{profile?.full_name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{roleDisplay}</div>
              </div>
              <div style={{ background: 'var(--primary-light)', color: 'var(--primary)', padding: '8px', borderRadius: '50%' }}>
                <UserCircle size={24} />
              </div>
            </div>

            {/* Logout Button */}
            <form action="/api/auth/logout" method="POST">
              <button type="submit" className="btn" style={{ background: 'transparent', color: 'var(--danger)', width: 'auto', border: '1px solid var(--danger)' }}>
                <LogOut size={16} />
                {t("logout")}
              </button>
            </form>
          </div>
        </header>
        <div className="page-content">
          {children}
        </div>
      </main>
    </div>
  );
}
