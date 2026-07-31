"use client";

import { useEffect, useState } from "react";
import { Loader2, TrendingUp, AlertTriangle, Activity, CheckCircle, Package, Clock, Download, Calendar } from "lucide-react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
  LineChart, Line
} from 'recharts';

export function ReportsDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Default date range: last 30 days
  const defaultStart = new Date();
  defaultStart.setDate(defaultStart.getDate() - 30);
  const [startDate, setStartDate] = useState(defaultStart.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchReports = async (start: string, end: string) => {
    setLoading(true);
    const q = new URLSearchParams();
    if (start) q.append('startDate', start);
    if (end) q.append('endDate', end);
    const res = await fetch(`/api/reports?${q.toString()}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  };

  useEffect(() => {
    fetchReports(startDate, endDate);
  }, [startDate, endDate]);

  const exportCSV = () => {
    if (!data || !data.raw) return;
    
    const headers = ["Invoice Number", "Customer", "Category", "Branch", "Status", "Priority", "Created At", "Updated At", "Due Date"];
    const rows = data.raw.map((o: any) => [
      o.invoice_number,
      o.customer_name,
      o.category?.name || '',
      o.branch?.name || '',
      o.status,
      o.priority,
      new Date(o.created_at).toLocaleString('en-GB'),
      new Date(o.updated_at).toLocaleString('en-GB'),
      o.due_date ? new Date(o.due_date).toLocaleString('en-GB') : ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row: any) => row.map((str: string) => `"${str}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `factory_orders_${startDate}_to_${endDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading && !data) return <div style={{ display: 'flex', justifyContent: 'center', padding: '64px', color: 'var(--text-secondary)' }}><Loader2 className="animate-spin" size={40} /></div>;
  if (!data || !data.charts) return <div>خطأ في تحميل بيانات التقارير</div>;

  const { headline, charts } = data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '8px' }}>التقارير التحليلية</h1>
          <p style={{ color: 'var(--text-secondary)' }}>نظرة شاملة على أداء خط الإنتاج، وتتبع الاختناقات، ومعدلات الإنجاز والجودة.</p>
        </div>
        
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', background: 'var(--bg-page)', padding: '16px', borderRadius: 'var(--radius)', border: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} color="var(--text-secondary)" />
            <input type="date" className="form-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} style={{ padding: '8px' }} />
            <span>إلى</span>
            <input type="date" className="form-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} style={{ padding: '8px' }} />
          </div>
          <button className="btn" style={{ width: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }} onClick={exportCSV}>
            <Download size={16} /> تصدير CSV
          </button>
        </div>
      </div>

      {loading && <div style={{ textAlign: 'center', color: 'var(--primary)' }}><Loader2 className="animate-spin" size={24} style={{ display: 'inline' }}/> تحديث البيانات...</div>}

      {/* Headline Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        
        <div className="auth-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--primary)' }}>
            <Activity size={20} />
            <span style={{ fontWeight: 600 }}>الطلبات النشطة (قيد التنفيذ)</span>
          </div>
          <div className="font-mono" style={{ fontSize: '2.5rem', fontWeight: 800 }}>{headline.activeOrders}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>من أصل {headline.totalOrders} ضمن الفترة</div>
        </div>

        <div className="auth-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px', borderColor: headline.lateOrderPercentage > 15 ? 'var(--danger-bg)' : 'transparent' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: headline.lateOrderPercentage > 15 ? 'var(--danger)' : 'var(--warning)' }}>
            <AlertTriangle size={20} />
            <span style={{ fontWeight: 600 }}>نسبة الطلبات المتأخرة</span>
          </div>
          <div className="font-mono" style={{ fontSize: '2.5rem', fontWeight: 800, color: headline.lateOrderPercentage > 15 ? 'var(--danger)' : 'var(--text-primary)' }}>{headline.lateOrderPercentage}%</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>بمتوسط تأخير {headline.avgDelayHours} ساعة</div>
        </div>

        <div className="auth-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--success)' }}>
            <CheckCircle size={20} />
            <span style={{ fontWeight: 600 }}>نسبة النجاح من أول مرة (FPY)</span>
          </div>
          <div className="font-mono" style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--success)' }}>{headline.firstPassYield}%</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>طلبات منجزة دون رفض ({headline.completedWithinRange} طلب كلي)</div>
        </div>

        <div className="auth-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--danger)' }}>
            <AlertTriangle size={20} />
            <span style={{ fontWeight: 600 }}>معدل المرفوضات (Defect Rate)</span>
          </div>
          <div className="font-mono" style={{ fontSize: '2.5rem', fontWeight: 800, color: 'var(--danger)' }}>{headline.defectRate}%</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>من إجمالي الطلبات تم رفضها مرة واحدة</div>
        </div>

        <div className="auth-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: 'var(--text-primary)' }}>
            <Clock size={20} />
            <span style={{ fontWeight: 600 }}>متوسط وقت الإنجاز</span>
          </div>
          <div className="font-mono" style={{ fontSize: '2.5rem', fontWeight: 800 }}>{headline.avgCycleTimeHours} <span style={{ fontSize: '1rem', fontWeight: 500, color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>ساعة</span></div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>من الإنشاء إلى التسليم النهائي</div>
        </div>

      </div>

      {/* Main Charts Area */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px' }}>
        
        {/* 1. WIP by Stage */}
        <div className="auth-card" style={{ maxWidth: '100%', height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '8px', fontWeight: 800 }}>1. اختناقات الإنتاج (WIP BY STAGE)</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>عدد الطلبات المتراكمة في كل مرحلة حالياً.</p>
          <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {charts.wipByStage.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-secondary)', marginTop: '40px' }}>لا يوجد طلبات قيد التنفيذ حالياً.</div>
            ) : (
              charts.wipByStage.map((s: any) => (
                <div key={s.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.95rem', marginBottom: '8px', fontWeight: 600 }}>
                    <span>{s.name}</span>
                    <span className="font-mono" style={{ color: 'var(--primary)', fontWeight: 800 }}>{s.count} <span style={{ fontFamily: 'var(--font-body)' }}>طلب</span></span>
                  </div>
                  <div style={{ width: '100%', height: '12px', background: 'var(--bg-page)', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-light)' }}>
                    <div style={{ 
                      width: `${Math.min((s.count / (headline.activeOrders || 1)) * 100, 100)}%`, 
                      height: '100%', 
                      background: 'linear-gradient(90deg, var(--danger) 0%, var(--primary) 100%)', 
                      borderRadius: '6px' 
                    }}></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 2. Status Breakdown */}
        <div className="auth-card" style={{ maxWidth: '100%', height: '400px', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '24px', fontWeight: 800 }}>2. توزيع حالة الطلبات الإجمالية</h2>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={charts.statusBreakdown} cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={5} dataKey="value">
                  {charts.statusBreakdown.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{borderRadius: 'var(--radius)', border: 'none', boxShadow: 'var(--shadow-lg)'}}/>
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* 4. Defect Rates by Stage */}
        <div className="auth-card" style={{ maxWidth: '100%', height: '350px', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '8px', fontWeight: 800 }}>3. مصدر المرفوضات (DEFECT ORIGIN)</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>توضح من أي مرحلة يتم رفض الطلبات في الغالب ضمن الفترة.</p>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.defectOrigin} layout="vertical" margin={{ top: 0, right: 10, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-light)" />
                <XAxis type="number" tick={{fontSize: 12, fill: 'var(--text-secondary)'}} axisLine={false} tickLine={false} allowDecimals={false}/>
                <YAxis type="category" dataKey="name" tick={{fontSize: 12, fill: 'var(--text-secondary)', fontWeight: 600}} axisLine={false} tickLine={false} width={100} />
                <Tooltip cursor={{fill: 'var(--bg-page)'}} contentStyle={{borderRadius: 'var(--radius)', border: 'none', boxShadow: 'var(--shadow-lg)'}}/>
                <Bar dataKey="count" fill="var(--danger)" radius={[0, 4, 4, 0]} name="عدد الرفضات" barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 5. Worker Performance Leaderboard */}
        <div className="auth-card" style={{ maxWidth: '100%', height: '350px', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '8px', fontWeight: 800 }}>4. أداء الموظفين (العمال)</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>المهام المنجزة للموظفين (لا يتأثر بنطاق التاريخ، سجل كامل).</p>
          
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {charts.workerPerformance?.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-secondary)' }}>لا يوجد بيانات للعمال.</div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>اسم العامل</th>
                    <th style={{ textAlign: 'center' }}>المهام المنجزة</th>
                  </tr>
                </thead>
                <tbody>
                  {charts.workerPerformance?.map((worker: any) => (
                    <tr key={worker.id}>
                      <td style={{ fontWeight: 600 }}>{worker.name}</td>
                      <td style={{ textAlign: 'center', fontWeight: 800, color: 'var(--primary)' }}>{worker.completedTasks}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Average Time Per Stage */}
        <div className="auth-card" style={{ maxWidth: '100%', height: '350px', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '8px', fontWeight: 800 }}>متوسط وقت الإنجاز لكل مرحلة</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>يساعد في تحديد أبطأ الأقسام أو المراحل في المصنع.</p>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.stageDurations} layout="vertical" margin={{ top: 0, right: 10, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border-light)" />
                <XAxis type="number" tick={{fontSize: 12, fill: 'var(--text-secondary)'}} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{fontSize: 12, fill: 'var(--text-secondary)', fontWeight: 600}} axisLine={false} tickLine={false} width={100} />
                <Tooltip cursor={{fill: 'var(--bg-page)'}} contentStyle={{borderRadius: 'var(--radius)', border: 'none', boxShadow: 'var(--shadow-lg)'}}/>
                <Bar dataKey="avgHours" fill="var(--warning)" radius={[0, 4, 4, 0]} name="متوسط الوقت (ساعة)" barSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Trend */}
        <div className="auth-card" style={{ maxWidth: '100%', height: '350px', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '8px', fontWeight: 800 }}>معدل استلام الطلبات اليومي (Trend)</h2>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.ordersPerDay} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                <XAxis dataKey="date" tick={{fontSize: 12, fill: 'var(--text-secondary)'}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 12, fill: 'var(--text-secondary)'}} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip cursor={{stroke: 'var(--border-light)'}} contentStyle={{borderRadius: 'var(--radius)', border: 'none', boxShadow: 'var(--shadow-lg)'}}/>
                <Line type="monotone" dataKey="count" stroke="var(--primary)" strokeWidth={3} dot={{r: 4, fill: 'var(--primary)'}} activeDot={{r: 8}} name="عدد الطلبات" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* 6. Volume & Cycle by Category */}
        <div className="auth-card" style={{ maxWidth: '100%', height: '350px', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '24px', fontWeight: 800 }}>حجم العمل ووقت الإنجاز حسب التصنيف</h2>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.volumeByCategory} margin={{ top: 0, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                <XAxis dataKey="name" tick={{fontSize: 12, fill: 'var(--text-secondary)'}} axisLine={false} tickLine={false} angle={-30} textAnchor="end" />
                <YAxis yAxisId="left" tick={{fontSize: 12, fill: 'var(--text-secondary)'}} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis yAxisId="right" orientation="right" tick={{fontSize: 12, fill: 'var(--success)'}} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: 'var(--bg-page)'}} contentStyle={{borderRadius: 'var(--radius)', border: 'none', boxShadow: 'var(--shadow-lg)'}}/>
                <Legend verticalAlign="bottom" height={36}/>
                <Bar yAxisId="left" dataKey="count" fill="var(--primary-light)" stroke="var(--primary)" strokeWidth={2} radius={[4, 4, 0, 0]} name="عدد الطلبات" />
                <Bar yAxisId="right" dataKey="avgCycleHours" fill="var(--success)" radius={[4, 4, 0, 0]} name="وقت الإنجاز المتوسط (ساعة)" barSize={10} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 6. Volume & Cycle by Branch */}
        <div className="auth-card" style={{ maxWidth: '100%', height: '350px', display: 'flex', flexDirection: 'column' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '24px', fontWeight: 800 }}>حجم العمل ووقت الإنجاز حسب الفرع</h2>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.volumeByBranch} margin={{ top: 0, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                <XAxis dataKey="name" tick={{fontSize: 12, fill: 'var(--text-secondary)'}} axisLine={false} tickLine={false} angle={-30} textAnchor="end" />
                <YAxis yAxisId="left" tick={{fontSize: 12, fill: 'var(--text-secondary)'}} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis yAxisId="right" orientation="right" tick={{fontSize: 12, fill: 'var(--success)'}} axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: 'var(--bg-page)'}} contentStyle={{borderRadius: 'var(--radius)', border: 'none', boxShadow: 'var(--shadow-lg)'}}/>
                <Legend verticalAlign="bottom" height={36}/>
                <Bar yAxisId="left" dataKey="count" fill="var(--primary-light)" stroke="var(--primary)" strokeWidth={2} radius={[4, 4, 0, 0]} name="عدد الطلبات" />
                <Bar yAxisId="right" dataKey="avgCycleHours" fill="var(--success)" radius={[4, 4, 0, 0]} name="وقت الإنجاز المتوسط (ساعة)" barSize={10} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
}
