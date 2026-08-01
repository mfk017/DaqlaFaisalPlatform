import { getT } from "@/lib/i18n";
import { requireApproved } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateEmployeeMetrics, formatDuration } from "@/lib/timeTracking";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Activity, AlertTriangle, CheckCircle, Clock } from "lucide-react";

export default async function EmployeeDashboardPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();

  const session = await requireApproved();
  const isAdmin = session.roles.includes("admin");
  const isSupervisor = session.roles.includes("supervisor");

  if (!isAdmin && !isSupervisor) {
    redirect("/dashboard");
  }

  const p = await params;
  
  const profile = await db.profile.findUnique({
    where: { id: p.id },
    include: {
      roles: true,
      current_orders: {
        where: { status: { in: ['in_progress', 'returned'] } },
        include: {
          category: true,
          current_stage: true
        },
        orderBy: { created_at: 'desc' }
      }
    }
  });

  if (!profile) {
    notFound();
  }

  const historyForMetrics = await db.orderHistory.findMany({
    where: {
      OR: [
        { assigned_to_id: profile.id },
        { actor_id: profile.id }
      ]
    },
    orderBy: { created_at: 'asc' }
  });

  const metrics = calculateEmployeeMetrics(profile.id, historyForMetrics);

  // Calculate today's and this month's completed orders
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  let completedToday = 0;
  let completedThisMonth = 0;

  for (const event of historyForMetrics) {
    if (event.actor_id === profile.id && (event.action === 'handed_off' || event.action === 'completed')) {
      if (event.created_at >= today) completedToday++;
      if (event.created_at >= firstOfMonth) completedThisMonth++;
    }
  }

  const totalAttempts = metrics.completedTasksCount;
  const successfulAttempts = totalAttempts - metrics.reworkCount;
  const qcPassRate = totalAttempts > 0 
    ? Math.round((successfulAttempts / totalAttempts) * 100) 
    : 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <Link href="/workload" className="btn" style={{ width: 'auto', padding: '8px', background: 'var(--border-light)', color: 'var(--text-primary)' }}>
          <ArrowRight size={20} />
        </Link>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          لوحة الموظف: <span style={{ color: 'var(--primary)' }}>{profile.full_name}</span>
        </h1>
      </div>

      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '8px' }}>
        {profile.roles.map((r, i) => (
          <span key={i} className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)', fontSize: '1rem', padding: '6px 12px' }}>
            {r.role === 'worker' ? `عامل (${r.specialty})` : r.role === 'quality' ? t("quality") : r.role === 'reception' ? t("reception") : r.role === 'supervisor' ? t("supervisor") : t("admin")}
          </span>
        ))}
      </div>

      {/* Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
        <div className="auth-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '16px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)' }}>
            <Activity size={28} />
          </div>
          <div>
            <div className="font-mono" style={{ fontSize: '2rem', fontWeight: 800, lineHeight: 1 }}>{profile.current_orders.length}</div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px', fontWeight: 600 }}>{t("current_pending_orders")}</div>
          </div>
        </div>

        <div className="auth-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '16px', borderRadius: '50%', background: 'var(--success-bg)', color: 'var(--success)' }}>
            <CheckCircle size={28} />
          </div>
          <div>
            <div className="font-mono" style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--success)', lineHeight: 1 }}>
              {completedToday} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>/ {completedThisMonth} هذا الشهر</span>
            </div>
            <div style={{ color: 'var(--success)', fontSize: '0.9rem', marginTop: '4px', fontWeight: 600 }}>{t("completed_tasks_today")}</div>
          </div>
        </div>

        <div className="auth-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ padding: '16px', borderRadius: '50%', background: 'var(--warning-bg)', color: 'var(--warning)' }}>
            <Clock size={28} />
          </div>
          <div>
            <div className="font-mono" style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--warning)', lineHeight: 1 }}>{formatDuration(metrics.avgCompletionTimeMs)}</div>
            <div style={{ color: 'var(--warning)', fontSize: '0.9rem', marginTop: '8px', fontWeight: 600 }}>{t("avg_completion_time")}</div>
          </div>
        </div>

        <div className="auth-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', borderColor: qcPassRate < 80 ? 'var(--danger-bg)' : 'transparent' }}>
          <div style={{ padding: '16px', borderRadius: '50%', background: qcPassRate >= 80 ? 'var(--success-bg)' : 'var(--danger-bg)', color: qcPassRate >= 80 ? 'var(--success)' : 'var(--danger)' }}>
            {qcPassRate >= 80 ? <CheckCircle size={28} /> : <AlertTriangle size={28} />}
          </div>
          <div>
            <div className="font-mono" style={{ fontSize: '2rem', fontWeight: 800, color: qcPassRate >= 80 ? 'var(--success)' : 'var(--danger)', lineHeight: 1 }}>
              {qcPassRate}%
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px', fontWeight: 600 }}>{t("first_time_success_rate")}</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '2px' }}>أعيد للعمل {metrics.reworkCount} مرة</div>
          </div>
        </div>
      </div>

      <div className="auth-card" style={{ maxWidth: '100%' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '20px' }}>{t("assigned_current_orders")}</h2>
        {profile.current_orders.length === 0 ? (
          <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '24px' }}>{t("no_assigned_orders_now")}</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {profile.current_orders.map(order => (
              <Link key={order.id} href={`/orders/${order.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--bg-page)', borderRadius: 'var(--radius)', border: '1px solid var(--border-light)' }}>
                  <div>
                    <div className="font-mono" style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem' }}>
                      {order.invoice_number}
                      {order.priority === 'rush' && <span title={t("urgent")} style={{ marginLeft: '4px' }}>🔥</span>}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      المرحلة: <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{order.current_stage.name}</span>
                    </div>
                  </div>
                  <div>
                    <span className={`badge ${order.status === 'returned' ? 'animate-pulse' : ''}`} style={{ background: order.status === 'returned' ? 'var(--danger-bg)' : 'var(--primary-light)', color: order.status === 'returned' ? 'var(--danger)' : 'var(--primary)' }}>
                      {order.status === 'returned' ? t("rejected_for_edit") : 'قيد التنفيذ'}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
