"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Clock, CheckCircle, AlertTriangle, Loader2 } from "lucide-react";

type Order = {
  id: string;
  invoice_number: string;
  customer_name: string;
  status: string;
  priority: string;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  category: { name: string };
  branch: { name: string };
  current_stage: { name: string, estimated_hours: number };
  current_assignee: { full_name: string };
};

export function OrderList({ canCreate, isWorker }: { canCreate: boolean, isWorker?: boolean }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState('mine');
  const [search, setSearch] = useState('');
  const [priority, setPriority] = useState('all');
  const [loading, setLoading] = useState(true);

  // Debounced search effect
  useEffect(() => {
    const delay = setTimeout(() => {
      fetchOrders(filter, search, priority);
    }, 300);
    return () => clearTimeout(delay);
  }, [filter, search, priority]);

  const fetchOrders = async (f: string, s: string, p: string) => {
    setLoading(true);
    const q = new URLSearchParams({ filter: f });
    if (s) q.append('search', s);
    if (p && p !== 'all') q.append('priority', p);
    
    const res = await fetch(`/api/orders?${q.toString()}`);
    const data = await res.json();
    setOrders(data.orders || []);
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>الطلبات</h1>
        {canCreate && (
          <Link href="/orders/new" className="btn" style={{ width: 'auto', textDecoration: 'none' }}>
            <Plus size={16} /> طلب جديد
          </Link>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-light)', paddingBottom: '16px', flexWrap: 'wrap' }}>
        <button 
          className="btn" 
          style={{ width: 'auto', background: filter === 'mine' ? 'var(--primary)' : 'var(--bg-page)', color: filter === 'mine' ? 'white' : 'var(--text-secondary)' }}
          onClick={() => setFilter('mine')}
        >
          طلباتي الحالية
        </button>
        {!isWorker && (
          <>
            <button 
              className="btn" 
              style={{ width: 'auto', background: filter === 'all' ? 'var(--primary)' : 'var(--bg-page)', color: filter === 'all' ? 'white' : 'var(--text-secondary)' }}
              onClick={() => setFilter('all')}
            >
              الكل (قيد التنفيذ)
            </button>
            <button 
              className="btn" 
              style={{ width: 'auto', background: filter === 'returned' ? 'var(--danger)' : 'var(--bg-page)', color: filter === 'returned' ? 'white' : 'var(--text-secondary)' }}
              onClick={() => setFilter('returned')}
            >
              المرفوضة (تحتاج تعديل)
            </button>
            <button 
              className="btn" 
              style={{ width: 'auto', background: filter === 'completed' ? 'var(--success)' : 'var(--bg-page)', color: filter === 'completed' ? 'white' : 'var(--text-secondary)' }}
              onClick={() => setFilter('completed')}
            >
              المنجزة
            </button>
          </>
        )}

        <div style={{ flex: 1 }}></div>

        <input 
          type="text" 
          className="form-input" 
          placeholder="بحث برقم الفاتورة أو العميل..."
          style={{ width: '250px' }}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select 
          className="form-input" 
          style={{ width: 'auto' }}
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          <option value="all">كل الأولويات</option>
          <option value="rush">🔥 مستعجل</option>
          <option value="normal">عادي</option>
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px', color: 'var(--text-secondary)' }}><Loader2 className="animate-spin" size={32} /></div>
      ) : orders.length === 0 ? (
        <div className="auth-card" style={{ maxWidth: '100%', textAlign: 'center', color: 'var(--text-secondary)' }}>
          لا يوجد طلبات مطابقة للفلتر المحدد
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>رقم الفاتورة</th>
              <th>العميل</th>
              <th>التصنيف</th>
              <th>المرحلة الحالية</th>
              <th>الموظف المسؤول</th>
              <th>تاريخ الطلب</th>
              <th>الوقت المستغرق</th>
              <th style={{ width: '100px' }}>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const elapsedHours = Math.floor((new Date().getTime() - new Date(o.updated_at).getTime()) / (1000 * 60 * 60));
              const estimatedHours = o.current_stage.estimated_hours || 24;
              const isOverdue = o.status !== 'completed' && elapsedHours >= estimatedHours;

              const globalDueOverdue = o.due_date && o.status !== 'completed' && new Date() > new Date(o.due_date);

              return (
                <tr key={o.id} style={{ cursor: 'pointer', background: globalDueOverdue ? 'rgba(232, 92, 74, 0.1)' : isOverdue ? 'var(--danger-bg)' : undefined }} onClick={() => window.location.href = `/orders/${o.id}`}>
                  <td className="font-mono" style={{ fontWeight: 700, color: 'var(--primary)', fontSize: '1.05rem' }}>
                    {o.invoice_number}
                    {o.priority === 'rush' && <span title="طلب مستعجل" style={{ marginLeft: '4px' }}>🔥</span>}
                  </td>
                  <td style={{ fontWeight: 600 }}>{o.customer_name}</td>
                  <td>{o.category.name}</td>
                  <td style={{ fontWeight: 500 }}>{o.current_stage.name}</td>
                  <td>{o.current_assignee.full_name}</td>
                  <td className="font-mono" dir="ltr" style={{ textAlign: 'right', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <div>{new Date(o.created_at).toLocaleDateString('ar-SA')}</div>
                    {o.due_date && (
                      <div style={{ color: globalDueOverdue ? 'var(--danger)' : 'var(--primary)', fontWeight: 600, marginTop: '4px' }}>
                        تسليم: {new Date(o.due_date).toLocaleDateString('ar-SA')}
                        {globalDueOverdue && <span className="animate-pulse" style={{ display: 'block', fontSize: '0.75rem', fontFamily: 'var(--font-body)' }}>فات الموعد!</span>}
                      </div>
                    )}
                  </td>
                  <td>
                    {o.status === 'completed' ? (
                      <span style={{ color: 'var(--success)', fontWeight: 600 }}>منجز</span>
                    ) : o.status === 'canceled' ? (
                      <span style={{ color: 'var(--danger)', fontWeight: 600 }}>ملغي</span>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span className="font-mono" style={{ fontWeight: 600, color: isOverdue ? 'var(--danger)' : 'var(--text-primary)' }} dir="ltr">
                          {elapsedHours} / {estimatedHours} hr
                        </span>
                        {isOverdue && <span style={{ fontSize: '0.75rem', color: 'var(--danger)', fontWeight: 700 }} className="animate-pulse">متأخر!</span>}
                      </div>
                    )}
                  </td>
                  <td>
                    {o.status === 'in_progress' && <span className="badge pending"><Clock size={12} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} /> جاري</span>}
                    {o.status === 'returned' && <span className="badge animate-pulse" style={{ background: 'var(--danger-bg)', color: 'var(--danger)', border: '1px solid var(--danger)' }}><AlertTriangle size={12} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} /> معاد للتعديل</span>}
                    {o.status === 'completed' && <span className="badge approved"><CheckCircle size={12} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} /> منجز</span>}
                    {o.status === 'canceled' && <span className="badge"><AlertTriangle size={12} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} /> ملغي</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
