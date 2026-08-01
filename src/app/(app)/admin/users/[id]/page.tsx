import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRight, CheckCircle, Activity, Box } from "lucide-react";
import { getT } from "@/lib/i18n";

export default async function UserActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const t = await getT();

  await requireAdmin();
  const p = await params;

  const profile = await db.profile.findUnique({
    where: { id: p.id },
    include: { roles: true }
  });

  if (!profile) return notFound();

  // Fetch unique orders this user has worked on
  // We look at order_history where actor_id = this user
  const historyEntries = await db.orderHistory.findMany({
    where: { actor_id: p.id },
    include: {
      order: {
        include: {
          category: true,
          current_stage: true,
        }
      },
      stage: true
    },
    orderBy: { created_at: 'desc' }
  });

  // Group by order to just show unique orders they touched, or just show the flat history log
  // Showing the flat history log is more detailed and useful to see EXACTLY what they did.

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <Link href="/admin/users" className="btn" style={{ width: 'auto', padding: '8px', background: 'var(--border-light)', color: 'var(--text-primary)' }}>
          <ArrowRight size={20} />
        </Link>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>سجل الموظف: <span style={{ color: 'var(--primary)' }}>{profile.full_name}</span></h1>
      </div>

      <div className="auth-card" style={{ maxWidth: '100%', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.1rem', marginBottom: '16px', fontWeight: 700 }}>المهام المنجزة ({historyEntries.length})</h2>
        
        {historyEntries.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            لم يقم هذا الموظف بأي نشاط حتى الآن.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {historyEntries.map((h) => (
              <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid var(--border-light)', borderRadius: 'var(--radius)' }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{ background: h.action === 'returned' ? 'var(--danger-bg)' : 'var(--success-bg)', color: h.action === 'returned' ? 'var(--danger)' : 'var(--success)', padding: '10px', borderRadius: '50%' }}>
                    {h.action === 'returned' ? <Activity size={20} /> : <CheckCircle size={20} />}
                  </div>
                  <div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                      <Link href={`/orders/${h.order_id}`} style={{ fontWeight: 800, fontFamily: 'monospace', color: 'var(--primary)', textDecoration: 'none' }}>
                        {h.order.invoice_number}
                      </Link>
                      <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>• {h.order.category.name}</span>
                    </div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600 }}>
                      {h.action === 'created' && 'إنشاء طلب جديد'}
                      {h.action === 'handed_off' && `تسليم من مرحلة: ${h.stage?.name || t("unknown")}`}
                      {h.action === 'completed' && t("order_final_delivery")}
                      {h.action === 'returned' && `إعادة بسبب خلل (جودة) من مرحلة: ${h.stage?.name || t("unknown")}`}
                    </div>
                    {h.notes && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        ملاحظة: {h.notes}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ textAlign: 'left', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {new Date(h.created_at).toLocaleString('ar-SA')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
