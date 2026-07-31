"use client";

import { useEffect, useState } from "react";
import { formatDuration } from "@/lib/timeTracking";
import { Loader2, Activity, CheckCircle, AlertTriangle, Clock } from "lucide-react";

export function LiveBoardClient() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());

  const fetchData = async () => {
    try {
      const res = await fetch("/api/live");
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Auto-refresh every 15 seconds
    const interval = setInterval(fetchData, 15000);

    // Clock update every second
    const clockInterval = setInterval(() => setTime(new Date()), 1000);

    return () => {
      clearInterval(interval);
      clearInterval(clockInterval);
    };
  }, []);

  if (loading && !data) {
    return (
      <div style={{ height: '100vh', backgroundColor: '#000', color: '#fff', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Loader2 className="animate-spin" size={64} color="var(--primary)" />
      </div>
    );
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#050505', 
      color: '#ffffff', 
      fontFamily: 'var(--font-heading)',
      display: 'flex',
      flexDirection: 'column',
      padding: '40px',
      gap: '40px'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #333', paddingBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '3.5rem', fontWeight: 900, color: 'var(--primary)', margin: 0, lineHeight: 1 }}>شاشة الإنتاج الحية</h1>
          <div style={{ fontSize: '1.5rem', color: '#aaa', marginTop: '8px' }}>تحديث تلقائي مستمر</div>
        </div>
        <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <div className="font-mono" style={{ fontSize: '4rem', fontWeight: 900, lineHeight: 1, letterSpacing: '2px' }}>
            {time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}
          </div>
          <div style={{ fontSize: '1.5rem', color: '#aaa', fontWeight: 700 }}>
            {time.toLocaleDateString('ar-SA')}
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '32px' }}>
        <div style={{ background: '#111', border: '2px solid #333', borderRadius: '16px', padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: 'var(--primary)', marginBottom: '16px' }}><Activity size={64} /></div>
          <div className="font-mono" style={{ fontSize: '7rem', fontWeight: 900, lineHeight: 1 }}>{data?.activeToday || 0}</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#aaa', marginTop: '8px' }}>نشط الآن</div>
        </div>

        <div style={{ background: '#111', border: '2px solid #333', borderRadius: '16px', padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: 'var(--success)', marginBottom: '16px' }}><CheckCircle size={64} /></div>
          <div className="font-mono" style={{ fontSize: '7rem', fontWeight: 900, lineHeight: 1, color: 'var(--success)' }}>{data?.completedToday || 0}</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: '#aaa', marginTop: '8px' }}>أنجز اليوم</div>
        </div>

        <div style={{ background: data?.lateOrdersCount > 0 ? '#2a0000' : '#111', border: `2px solid ${data?.lateOrdersCount > 0 ? 'var(--danger)' : '#333'}`, borderRadius: '16px', padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ color: data?.lateOrdersCount > 0 ? 'var(--danger)' : '#555', marginBottom: '16px' }}>
            <AlertTriangle size={64} className={data?.lateOrdersCount > 0 ? "animate-pulse" : ""} />
          </div>
          <div className="font-mono" style={{ fontSize: '7rem', fontWeight: 900, lineHeight: 1, color: data?.lateOrdersCount > 0 ? 'var(--danger)' : '#555' }}>{data?.lateOrdersCount || 0}</div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: data?.lateOrdersCount > 0 ? 'var(--danger)' : '#555', marginTop: '8px' }}>طلبات متأخرة</div>
        </div>
      </div>

      {/* Urgent Orders Grid */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#111', border: '2px solid #333', borderRadius: '16px', padding: '32px', overflow: 'hidden' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#fff', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <AlertTriangle size={32} color="var(--warning)" /> أهم 5 طلبات تحت التنفيذ (أولوية قصوى)
        </h2>
        
        {(!data?.urgentOrders || data.urgentOrders.length === 0) ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: '#555' }}>
            لا يوجد طلبات مستعجلة حالياً
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {data.urgentOrders.map((o: any) => (
              <div key={o.id} style={{ 
                display: 'flex', 
                alignItems: 'center',
                background: o.isLate ? '#3a0000' : '#222', 
                borderLeft: `8px solid ${o.isLate ? 'var(--danger)' : 'var(--warning)'}`,
                padding: '24px', 
                borderRadius: '8px',
                gap: '24px'
              }}>
                <div className="font-mono" style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', width: '250px' }}>
                  {o.invoice_number}
                </div>
                <div style={{ flex: 1, fontSize: '2rem', fontWeight: 700, color: '#ddd' }}>
                  {o.customer_name}
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', background: '#111', padding: '8px 24px', borderRadius: '4px' }}>
                  {o.current_stage?.name}
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: o.isLate ? 'var(--danger)' : 'var(--warning)', display: 'flex', alignItems: 'center', gap: '12px', minWidth: '200px', justifyContent: 'flex-end' }} dir="ltr">
                  <Clock size={32} />
                  <span className="font-mono">{formatDuration(o.timeSinceMoveMs)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
