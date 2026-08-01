import { getT } from "@/lib/i18n";
import { requireApproved } from "@/lib/auth";
import { db } from "@/lib/db";
import { calculateEmployeeMetrics, formatDuration } from "@/lib/timeTracking";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Activity, Clock, AlertTriangle, CheckCircle, Search } from "lucide-react";

export default async function WorkloadPage() {
  const t = await getT();

  const session = await requireApproved();
  const isAdmin = session.roles.includes("admin");
  const isSupervisor = session.roles.includes("supervisor");

  if (!isAdmin && !isSupervisor) {
    redirect("/dashboard");
  }

  // Fetch all profiles that are approved
  const profiles = await db.profile.findMany({
    where: { approved: true },
    include: {
      roles: true,
      current_orders: {
        where: { status: { in: ['in_progress', 'returned'] } },
        select: { id: true, priority: true }
      }
    }
  });

  // We need to fetch OrderHistory to calculate avg completion time
  // OPTIMIZATION: Only fetch history from the last 30 days, and only fetch needed fields.
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const historyForMetrics = await db.orderHistory.findMany({
    where: {
      created_at: { gte: thirtyDaysAgo },
      OR: [
        { assigned_to_id: { in: profiles.map(p => p.id) } },
        { actor_id: { in: profiles.map(p => p.id) } }
      ]
    },
    orderBy: { created_at: 'asc' }
  });

  const workloadData = profiles.map(p => {
    const activeOrders = p.current_orders.length;
    const urgentOrders = p.current_orders.filter(o => o.priority === 'rush').length;
    const metrics = calculateEmployeeMetrics(p.id, historyForMetrics);

    return {
      id: p.id,
      name: p.full_name,
      roles: p.roles.map(r => `${r.role === 'worker' ? `عامل (${r.specialty})` : r.role === 'quality' ? t("quality") : r.role === 'reception' ? t("reception") : r.role === 'supervisor' ? t("supervisor") : t("admin")}`),
      activeOrders,
      urgentOrders,
      completedTasks: metrics.completedTasksCount,
      avgTime: metrics.avgCompletionTimeMs,
      reworkCount: metrics.reworkCount,
    };
  });

  // Sort by active orders descending by default
  workloadData.sort((a, b) => b.activeOrders - a.activeOrders);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>أعباء العمل (Workload)</h1>
      </div>

      <div className="auth-card" style={{ maxWidth: '100%' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>{t("employee")}</th>
              <th>{t("role_specialty")}</th>
              <th>{t("current_orders")}</th>
              <th>{t("urgent_orders")}</th>
              <th>{t("avg_completion_time")}</th>
              <th>{t("completed_tasks")}</th>
              <th>{t("actions")}</th>
            </tr>
          </thead>
          <tbody>
            {workloadData.map(worker => (
              <tr key={worker.id}>
                <td>
                  <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{worker.name}</div>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                    {worker.roles.map((r, i) => (
                      <span key={i} className="badge" style={{ background: 'var(--bg-page)', border: '1px solid var(--border-light)', color: 'var(--text-secondary)' }}>{r}</span>
                    ))}
                  </div>
                </td>
                <td>
                  <span className="font-mono" style={{ fontSize: '1.1rem', fontWeight: 800, color: worker.activeOrders > 10 ? 'var(--danger)' : worker.activeOrders > 5 ? 'var(--warning)' : 'var(--success)' }}>
                    {worker.activeOrders}
                  </span>
                </td>
                <td>
                  {worker.urgentOrders > 0 ? (
                    <span className="badge animate-pulse" style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid var(--danger)' }}>
                      🔥 {worker.urgentOrders} مستعجل
                    </span>
                  ) : (
                    <span style={{ color: 'var(--text-secondary)' }}>-</span>
                  )}
                </td>
                <td>
                  <span className="font-mono" style={{ fontWeight: 600 }}>{formatDuration(worker.avgTime)}</span>
                </td>
                <td>
                  <span className="font-mono" style={{ fontWeight: 600 }}>{worker.completedTasks}</span>
                </td>
                <td>
                  <Link href={`/employees/${worker.id}`} className="btn" style={{ padding: '6px 12px', fontSize: '0.85rem', width: 'auto' }}>
                    التفاصيل
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
