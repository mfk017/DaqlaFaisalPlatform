"use client";

import { useEffect, useState } from "react";
import { Trash2, Plus, ArrowUp, ArrowDown, Shield, Box } from "lucide-react";

type Stage = {
  id: string;
  name: string;
  order_index: number;
  is_quality: boolean;
  is_final: boolean;
  allowed_role: string | null;
  allowed_specialty: string | null;
};

type Category = {
  id: string;
  name: string;
  is_active: boolean;
  stages: Stage[];
};

export function WorkflowBuilder({ categoryId }: { categoryId: string }) {
  const [category, setCategory] = useState<Category | null>(null);
  const [specialties, setSpecialties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // New Stage Form
  const [name, setName] = useState("");
  const [role, setRole] = useState("worker");
  const [specialty, setSpecialty] = useState("");
  const [isQuality, setIsQuality] = useState(false);
  const [isFinal, setIsFinal] = useState(false);
  const [estimatedHours, setEstimatedHours] = useState(24);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = async () => {
    const [catRes, specRes] = await Promise.all([
      fetch(`/api/admin/categories/${categoryId}/stages`),
      fetch("/api/admin/specialties")
    ]);
    const catData = await catRes.json();
    const specData = await specRes.json();
    setCategory(catData.category);
    setSpecialties(specData.specialties || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [categoryId]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    await fetch(`/api/admin/categories/${categoryId}/stages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        allowed_role: role,
        allowed_specialty: specialty || null,
        is_quality: isQuality,
        is_final: isFinal,
        estimated_hours: estimatedHours
      }),
    });
    
    setName("");
    setRole("worker");
    setSpecialty("");
    setIsQuality(false);
    setIsFinal(false);
    setEstimatedHours(24);
    setIsSubmitting(false);
    fetchData();
  };

  const handleDelete = async (stageId: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه المرحلة؟")) return;
    await fetch(`/api/admin/categories/${categoryId}/stages/${stageId}`, { method: "DELETE" });
    fetchData();
  };

  const moveStage = async (index: number, direction: 'up' | 'down') => {
    if (!category) return;
    
    const stages = [...category.stages];
    if (direction === 'up' && index > 0) {
      const temp = stages[index];
      stages[index] = stages[index - 1];
      stages[index - 1] = temp;
    } else if (direction === 'down' && index < stages.length - 1) {
      const temp = stages[index];
      stages[index] = stages[index + 1];
      stages[index + 1] = temp;
    } else {
      return;
    }

    // Optimistic UI update
    setCategory({ ...category, stages });

    // Save to server
    await fetch(`/api/admin/categories/${categoryId}/stages`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stages }),
    });
    
    fetchData(); // re-fetch to ensure sync and active status update
  };

  if (loading) return <div>جاري التحميل...</div>;
  if (!category) return <div>لم يتم العثور على التصنيف</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Status Card */}
      <div className="auth-card" style={{ maxWidth: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', marginBottom: '8px' }}>حالة المسار</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            يجب أن يحتوي المسار على الأقل على مرحلة جودة واحدة ومرحلة تسليم نهائية واحدة ليتم تفعيله.
          </p>
        </div>
        <div>
          {category.is_active ? (
            <span className="badge approved" style={{ fontSize: '1rem', padding: '8px 16px' }}>نشط ومفعل</span>
          ) : (
            <span className="badge pending" style={{ fontSize: '1rem', padding: '8px 16px' }}>غير مكتمل</span>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px', alignItems: 'start' }}>
        {/* Stages List */}
        <div>
          <h3 style={{ marginBottom: '16px' }}>خطوات المسار ({category.stages.length})</h3>
          
          {category.stages.length === 0 ? (
            <div className="auth-card" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
              لم يتم إضافة أي مراحل بعد
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {category.stages.map((stage, index) => (
                <div key={stage.id} className="auth-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                  
                  {/* Order Controls */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <button 
                      onClick={() => moveStage(index, 'up')}
                      disabled={index === 0}
                      className="btn"
                      style={{ padding: '4px', width: 'auto', background: index === 0 ? 'transparent' : 'var(--border-light)', color: 'var(--text-primary)' }}
                    >
                      <ArrowUp size={16} />
                    </button>
                    <button 
                      onClick={() => moveStage(index, 'down')}
                      disabled={index === category.stages.length - 1}
                      className="btn"
                      style={{ padding: '4px', width: 'auto', background: index === category.stages.length - 1 ? 'transparent' : 'var(--border-light)', color: 'var(--text-primary)' }}
                    >
                      <ArrowDown size={16} />
                    </button>
                  </div>
                  
                  {/* Stage Number */}
                  <div style={{ 
                    width: '32px', height: '32px', borderRadius: '50%', 
                    background: 'var(--primary-light)', color: 'var(--primary)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 'bold'
                  }}>
                    {index + 1}
                  </div>

                  {/* Stage Details */}
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '4px' }}>
                      {stage.name}
                    </div>
                    <div style={{ display: 'flex', gap: '8px', fontSize: '0.85rem' }}>
                      <span className="badge" style={{ background: 'var(--bg-page)', color: 'var(--text-secondary)' }}>
                        الموظف المطلوب: {stage.allowed_role} {stage.allowed_specialty ? `(${stage.allowed_specialty})` : ''}
                      </span>
                      {stage.is_quality && (
                        <span className="badge" style={{ background: 'var(--danger-bg)', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Shield size={12} /> جودة
                        </span>
                      )}
                      {stage.is_final && (
                        <span className="badge" style={{ background: 'var(--success-bg)', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Box size={12} /> تسليم نهائي
                        </span>
                      )}
                      <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        الوقت المتوقع: {(stage as any).estimated_hours || 24} ساعة
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div>
                    <button 
                      onClick={() => handleDelete(stage.id)}
                      className="btn"
                      style={{ padding: '8px', width: 'auto', background: 'var(--danger-bg)', color: 'var(--danger)' }}
                      title="حذف المرحلة"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add New Stage Form */}
        <div className="auth-card" style={{ position: 'sticky', top: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>إضافة مرحلة جديدة</h3>
          
          <form onSubmit={handleAdd}>
            <div className="form-group">
              <label className="form-label">اسم المرحلة (مثال: القص، الخياطة)</label>
              <input type="text" className="form-input" value={name} onChange={(e) => setName(e.target.value)} required />
            </div>

            <div className="form-group">
              <label className="form-label">الدور المطلوب للاستلام</label>
              <select className="form-input" value={role} onChange={(e) => { setRole(e.target.value); setSpecialty(""); }}>
                <option value="worker">عامل (Worker)</option>
                <option value="quality">مراقب جودة (Quality)</option>
                <option value="reception">استقبال (Reception)</option>
                <option value="admin">مدير (Admin)</option>
              </select>
            </div>

            {role === 'worker' && (
              <div className="form-group">
                <label className="form-label">التخصص المطلوب (اختياري)</label>
                <select className="form-input" value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
                  <option value="">أي تخصص</option>
                  {specialties.map(s => (
                    <option key={s.id} value={s.name}>{s.label}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">الوقت المتوقع للإنجاز (بالساعات)</label>
              <input type="number" className="form-input" value={estimatedHours} onChange={(e) => setEstimatedHours(parseInt(e.target.value) || 24)} min="1" required />
            </div>

            <div className="form-group" style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '16px' }}>
              <input type="checkbox" id="isQ" checked={isQuality} onChange={(e) => setIsQuality(e.target.checked)} style={{ width: '18px', height: '18px' }} />
              <label htmlFor="isQ" style={{ fontWeight: 600, color: 'var(--danger)' }}>هذه المرحلة للرقابة والجودة</label>
            </div>

            <div className="form-group" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input type="checkbox" id="isF" checked={isFinal} onChange={(e) => setIsFinal(e.target.checked)} style={{ width: '18px', height: '18px' }} />
              <label htmlFor="isF" style={{ fontWeight: 600, color: 'var(--success)' }}>هذه هي المرحلة النهائية (تسليم للفرع)</label>
            </div>

            <button type="submit" className="btn" disabled={isSubmitting} style={{ marginTop: '16px' }}>
              <Plus size={16} /> إضافة المرحلة
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
