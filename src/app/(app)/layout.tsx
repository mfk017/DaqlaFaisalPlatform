import { requireApproved } from "@/lib/auth";
import Link from "next/link";
import { getT } from "@/lib/i18n";
import { db } from "@/lib/db";
import { UserCircle, LogOut, Home, Users, Settings, BarChart2, Activity } from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireApproved();
  const t = await getT();
  const isAdmin = session.roles.includes("admin");
  const isSupervisor = session.roles.includes("supervisor");
  const isManagement = isAdmin || isSupervisor || session.roles.includes("reception");

  const profile = await db.profile.findUnique({
    where: { id: session.sub }
  });

  let roleDisplay = t("user_role_user");
  if (isAdmin) roleDisplay = t("user_role_admin");
  else if (isSupervisor) roleDisplay = t("user_role_supervisor");
  else if (session.roles.includes("worker")) roleDisplay = `${t("user_role_worker")} (${session.specialty || ''})`;
  else if (session.roles.includes("quality")) roleDisplay = t("user_role_quality");
  else if (session.roles.includes("reception")) roleDisplay = t("user_role_reception");

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
          
          {(isAdmin || isSupervisor) && (
            <>
              <Link href="/workload" className="nav-link">
                <Users size={20} />
                {t("workload")}
              </Link>
              <Link href="/reports" className="nav-link">
                <BarChart2 size={20} />
                {t("reports")}
              </Link>
              <Link href="/live" className="nav-link" target="_blank">
                <Activity size={20} />
                {t("live_board")}
              </Link>
            </>
          )}
          
          {isAdmin && (
            <>
              <Link href="/admin/users" className="nav-link">
                <Users size={20} />
                {t("users")}
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
                {t("specialties_roles")}
              </Link>
            </>
          )}
        </nav>
      </aside>
      <main className="main-content">
        <header className="topbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div></div> {/* empty div to push content to the left if needed, or leave it flex-end */}
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <LanguageSwitcher />
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
