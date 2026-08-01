"use client";
import { useTranslation } from "@/components/layout/I18nProvider";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Activity, AlertTriangle, CheckCircle, Clock, ArrowRight, Loader2, PlusCircle, Search, User } from "lucide-react";
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { FactoryHeatMap } from './FactoryHeatMap';

export function DashboardContent() {
  const { t } = useTranslation();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      const res = await fetch("/api/dashboard");
      const json = await res.json();
      setData(json);
      setLoading(false);
    };
    fetchDashboard();
  }, []);

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: '48px', color: 'var(--text-secondary)' }}><Loader2 className="animate-spin" size={32} /></div>;
  if (!data || data.error) return <div>{t("error_loading_data")}</div>;

  const { roles, my_tasks, intake, qualityQueue, staleOrders, activityFeed, charts, metrics } = data;
  
  const isAdmin = roles.includes('admin');
  const isReception = roles.includes('reception');
  const isQuality = roles.includes('quality');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)' }}>{t("dashboard_alt")}</h1>
        {(isAdmin || isReception) && (
          <Link href="/orders/new" className="btn" style={{ width: 'auto', display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 24px', fontSize: '1.1rem' }}>
            <PlusCircle size={20} /> إضافة طلب جديد
          </Link>
        )}
      </div>

      {isAdmin && (
        <>
          {/* Stale Orders Alert */}
          {staleOrders && staleOrders.length > 0 && (
            <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: 'var(--radius)', padding: '20px' }}>
              <h2 style={{ fontSize: '1.2rem', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', fontWeight: 800 }}>
                <AlertTriangle size={24} /> طلبات متأخرة جداً (تجاوزت الوقت المسموح بـ 50%+)
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {staleOrders.map((o: any) => (
                  <Link key={o.id} href={`/orders/${o.id}`} style={{ display: 'flex', justifyContent: 'space-between', background: 'white', padding: '12px', borderRadius: '8px', textDecoration: 'none', color: 'inherit' }}>
                    <span style={{ fontWeight: 700, color: 'var(--primary)', fontFamily: 'monospace' }}>{o.invoice_number}</span>
                    <span>في مرحلة: {o.stage_name}</span>
                    <span style={{ color: 'var(--danger)', fontWeight: 700 }}>متأخر بـ {o.hours_over} ساعة!</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Metrics Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px' }}>
            <div className="auth-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ padding: '16px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)' }}>
                <Activity size={28} />
              </div>
              <div>
                <div className="font-mono" style={{ fontSize: '2.5rem', fontWeight: 800, lineHeight: 1 }}>{metrics.active}</div>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '4px', fontWeight: 500 }}>{t("orders_in_progress")}</div>
              </div>
            </div>

            <div className="auth-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', borderColor: 'var(--danger-bg)' }}>
              <div style={{ padding: '16px', borderRadius: '50%', background: 'var(--danger-bg)', color: 'var(--danger)' }}>
                <AlertTriangle size={28} />
              </div>
              <div>
                <div className="font-mono" style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--danger)', lineHeight: 1 }}>{metrics.returned}</div>
                <div style={{ color: 'var(--danger)', fontSize: '0.95rem', marginTop: '4px', fontWeight: 600 }}>{t("rejected_orders_for_edit")}</div>
              </div>
            </div>

            <div className="auth-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', borderColor: 'var(--success-bg)' }}>
              <div style={{ padding: '16px', borderRadius: '50%', background: 'var(--success-bg)', color: 'var(--success)' }}>
                <CheckCircle size={28} />
              </div>
              <div>
                <div className="font-mono" style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--success)', lineHeight: 1 }}>{metrics.completed_today}</div>
                <div style={{ color: 'var(--success)', fontSize: '0.95rem', marginTop: '4px', fontWeight: 600 }}>{t("orders_completed_today")}</div>
              </div>
            </div>
          </div>

          {/* Factory Heat Map */}
          <FactoryHeatMap stages={charts.ordersByStage} />
          
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
            {/* Charts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="auth-card" style={{ maxWidth: '100%', height: '350px', display: 'flex', flexDirection: 'column' }}>
                <h2 style={{ fontSize: '1.1rem', marginBottom: '16px', fontWeight: 700 }}>{t("orders_per_stage_wip")}</h2>
                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {charts.ordersByStage.length === 0 ? (
                    <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '40px' }}>{t("no_orders_in_progress")}</div>
                  ) : (
                    charts.ordersByStage.map((s: any) => (
                      <div key={s.name}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '6px', fontWeight: 600 }}>
                          <span>{s.name}</span>
                          <span className="font-mono" style={{ color: 'var(--primary)', fontWeight: 800 }}>{s.count} <span style={{fontFamily:'var(--font-body)'}}>{t("request")}</span></span>
                        </div>
                        <div style={{ width: '100%', height: '10px', background: 'var(--bg-page)', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                          <div style={{ 
                            width: `${Math.min((s.count / (metrics.active || 1)) * 100, 100)}%`, 
                            height: '100%', 
                            background: 'var(--primary)', 
                            borderRadius: '6px' 
                          }}></div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Live Activity Feed */}
            <div className="auth-card" style={{ maxWidth: '100%', display: 'flex', flexDirection: 'column' }}>
              <h2 style={{ fontSize: '1.1rem', marginBottom: '16px', fontWeight: 700 }}>{t("live_timeline")}</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, overflowY: 'auto' }}>
                {activityFeed.map((a: any) => (
                  <div key={a.id} style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Link className="font-mono" href={`/orders/${a.order.id}`} style={{ fontWeight: 700, color: 'var(--primary)', textDecoration: 'none' }}>{a.order.invoice_number}</Link>
                      <span className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{new Date(a.created_at).toLocaleTimeString('ar-SA')}</span>
                    </div>
                    <div style={{ fontSize: '0.9rem', marginTop: '4px' }}>
                      {a.action === 'handed_off' && <span style={{ color: 'var(--success)' }}>{t("receive")} <strong>{a.assigned_to?.full_name}</strong> في مرحلة {a.stage?.name}</span>}
                      {a.action === 'completed' && <span style={{ color: 'var(--success)' }}>أنجز <strong>{a.actor.full_name}</strong> {t("order")}</span>}
                      {a.action === 'returned' && <span style={{ color: 'var(--danger)' }}>{t("reject")} <strong>{a.actor.full_name}</strong> إلى {a.assigned_to?.full_name}</span>}
                      {a.action === 'canceled' && <span style={{ color: 'var(--danger)' }}>ألغى <strong>{a.actor.full_name}</strong> {t("order")}</span>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {(isAdmin || isQuality) && qualityQueue.length > 0 && (
        <div className="auth-card" style={{ maxWidth: '100%', borderTop: '4px solid var(--warning)' }}>
          <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, marginBottom: '20px' }}>
            <Search size={20} color="var(--warning)" /> طلبات بانتظار فحص الجودة ({qualityQueue.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {qualityQueue.map((task: any) => <OrderRow key={task.id} task={task} />)}
          </div>
        </div>
      )}

      {(isAdmin || isReception) && intake.length > 0 && (
        <div className="auth-card" style={{ maxWidth: '100%', borderTop: '4px solid var(--primary)' }}>
          <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, marginBottom: '20px' }}>
            <CheckCircle size={20} color="var(--primary)" /> استلامات اليوم ({intake.length})
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {intake.map((task: any) => <OrderRow key={task.id} task={task} />)}
          </div>
        </div>
      )}

      {/* My Tasks */}
      <div className="auth-card" style={{ maxWidth: '100%' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-light)', paddingBottom: '16px' }}>
          <h2 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800 }}>
            <Clock size={20} color="var(--primary)" /> المهام الموكلة إلي
          </h2>
          <Link href="/orders" className="btn" style={{ width: 'auto', background: 'var(--bg-page)', border: '1px solid var(--border-light)', color: 'var(--text-primary)', padding: '8px 16px', fontSize: '0.9rem', boxShadow: 'var(--shadow-sm)' }}>
            عرض كل الطلبات
          </Link>
        </div>

        {my_tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: 'var(--text-secondary)' }}>
            <div style={{ display: 'inline-flex', padding: '16px', background: 'var(--bg-page)', borderRadius: '50%', marginBottom: '16px' }}>
              <CheckCircle size={32} color="var(--success)" />
            </div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>{t("no_tasks_assigned_now")}</h3>
            <p style={{ marginTop: '4px' }}>{t("great_job_empty")}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {my_tasks.map((task: any) => <OrderRow key={task.id} task={task} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function OrderRow({ task }: { task: any }) {
  const { t } = useTranslation();
  const elapsedHours = Math.floor((new Date().getTime() - new Date(task.updated_at).getTime()) / (1000 * 60 * 60));
  const estimatedHours = task.current_stage?.estimated_hours || 24;
  const isOverdue = task.status !== 'completed' && elapsedHours >= estimatedHours;

  return (
    <Link href={`/orders/${task.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: 'var(--bg-page)', borderRadius: 'var(--radius)', border: '1px solid var(--border-light)', transition: 'all 0.2s', cursor: 'pointer' }}
           onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow)'; }}
           onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-light)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div className="font-mono" style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1.1rem' }}>
            {task.invoice_number}
            {task.priority === 'rush' && <span title={t("urgent")} style={{ marginLeft: '4px' }}>🔥</span>}
          </div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{task.customer_name} — <span style={{ color: 'var(--text-secondary)' }}>{task.category?.name}</span></div>
          {task.current_stage && (
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={14} /> المرحلة: <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{task.current_stage.name}</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {task.current_stage && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
              <span className="font-mono" style={{ fontSize: '0.85rem', fontWeight: 700, color: isOverdue ? 'var(--danger)' : 'var(--text-secondary)' }} dir="ltr">
                {elapsedHours} / {estimatedHours} hr
              </span>
              {isOverdue && <span style={{ fontSize: '0.75rem', color: 'white', background: 'var(--danger)', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }} className="animate-pulse">{t("late")}</span>}
            </div>
          )}
          {task.status === 'returned' && (
            <span className="badge animate-pulse" style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid var(--danger)' }}>
              <AlertTriangle size={14} style={{ display: 'inline', marginRight: '4px' }} />
              مرفوض للتعديل
            </span>
          )}
          <ArrowRight size={24} color="var(--primary)" style={{ opacity: 0.8 }} />
        </div>
      </div>
    </Link>
  );
}
