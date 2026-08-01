"use client";
import { useTranslation } from "@/components/layout/I18nProvider";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { User, Calendar, CheckCircle, ArrowRightCircle, AlertTriangle, FastForward, Plus, Camera, Clock } from "lucide-react";
import { ProductionLine } from "./ProductionLine";

export function OrderDetail({ order, canAct, currentUserId, isAdmin }: { order: any, canAct: boolean, currentUserId: string, isAdmin: boolean }) {
  const { t } = useTranslation();

  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [eligibleUsers, setEligibleUsers] = useState<any[]>([]);
  const [nextStageId, setNextStageId] = useState("");
  const [nextAssigneeId, setNextAssigneeId] = useState("");
  const [notes, setNotes] = useState("");
  const [actionType, setActionType] = useState<"hand_off" | "complete" | "return" | "add_note" | "cancel">("hand_off");

  const [isEditing, setIsEditing] = useState(false);
  const [editPriority, setEditPriority] = useState(order.priority || 'normal');
  const [editDueDate, setEditDueDate] = useState(order.due_date ? new Date(order.due_date).toISOString().split('T')[0] : '');

  const [image, setImage] = useState<File | null>(null);

  // Determine current stage index
  const stages = order.category.stages;
  const currentStageIndex = stages.findIndex((s: any) => s.id === order.current_stage_id);
  const isFinalStage = order.current_stage.is_final;
  const isQualityStage = order.current_stage.is_quality;
  
  // Default to the immediate next stage for hand-off
  const defaultNextStage = currentStageIndex < stages.length - 1 ? stages[currentStageIndex + 1] : null;

  useEffect(() => {
    if (defaultNextStage && actionType === 'hand_off') {
      setNextStageId(defaultNextStage.id);
    }
  }, [defaultNextStage, actionType]);

  useEffect(() => {
    if (!nextStageId) {
      setEligibleUsers([]);
      return;
    }
    const fetchUsers = async () => {
      const stage = stages.find((s: any) => s.id === nextStageId);
      if (!stage) return;

      const q = new URLSearchParams();
      if (stage.allowed_role) q.append('role', stage.allowed_role);
      if (stage.allowed_specialty) q.append('specialty', stage.allowed_specialty);
      
      const res = await fetch(`/api/users/eligible?${q.toString()}`);
      const data = await res.json();
      setEligibleUsers(data.users || []);
    };
    fetchUsers();
  }, [nextStageId, stages]);

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: editPriority, due_date: editDueDate || null })
      });
      if (!res.ok) throw new Error("فشل تعديل الطلب");
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (actionType !== 'complete' && actionType !== 'add_note') {
      if (!nextStageId) {
        setError("الرجاء اختيار المرحلة التالية");
        return;
      }
      if (!nextAssigneeId) {
        setError("الرجاء اختيار الموظف المستلم");
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("action", actionType);
      if (actionType !== 'complete' && actionType !== 'add_note') {
        formData.append("next_stage_id", nextStageId);
        formData.append("next_assignee_id", nextAssigneeId);
      }
      if (notes) formData.append("notes", notes);
      if (image) formData.append("image", image);

      const res = await fetch(`/api/orders/${order.id}/hand-off`, {
        method: "POST",
        body: formData,
      });

      let data;
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch (e) {
        throw new Error(`Server returned an invalid response (${res.status}): ${text.substring(0, 100)}`);
      }

      if (!res.ok) throw new Error(data.error || 'حدث خطأ غير معروف');

      window.location.reload();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Visual Production Line */}
      <div className="auth-card" style={{ maxWidth: '100%' }}>
        <h2 style={{ fontSize: '1.2rem', margin: 0, paddingBottom: '16px', borderBottom: '1px solid var(--border-light)' }}>
          خط الإنتاج: <span className="font-mono" style={{ color: 'var(--primary)' }}>{order.invoice_number}</span>
        </h2>
        <ProductionLine 
          stages={stages} 
          currentStageId={order.current_stage_id} 
          status={order.status} 
          currentAssigneeName={order.current_assignee?.full_name} 
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px', alignItems: 'start' }}>
        {/* Left Column: Details & Timeline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="auth-card" style={{ maxWidth: '100%' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>
              <h2 style={{ fontSize: '1.2rem', margin: 0 }}>{t("order_data")}</h2>
              {isAdmin && !isEditing && order.status !== 'canceled' && (
                <button className="btn btn-secondary" style={{ width: 'auto', padding: '4px 12px' }} onClick={() => setIsEditing(true)}>
                  تعديل الأولوية / التسليم
                </button>
              )}
            </div>
            
            {isEditing ? (
              <form onSubmit={handleEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">{t("priority")}</label>
                    <select className="form-input" value={editPriority} onChange={(e) => setEditPriority(e.target.value)}>
                      <option value="normal">{t("ordinary")}</option>
                      <option value="rush">{t("urgent_fire")}</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t("expected_delivery_date_optional")}</label>
                    <input type="date" className="form-input font-mono" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button type="submit" className="btn" disabled={loading}>{t("save_changes")}</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>{t("cancel")}</button>
                </div>
              </form>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'block' }}>{t("customer")}</span>
                  <span style={{ fontWeight: 600 }}>{order.customer_name}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'block' }}>{t("category")}</span>
                  <span style={{ fontWeight: 600 }}>{order.category.name}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'block' }}>{t("priority")}</span>
                  <span style={{ fontWeight: 600, color: order.priority === 'rush' ? 'var(--warning)' : 'var(--text-primary)' }}>
                    {order.priority === 'rush' ? t("urgent_fire") : t("ordinary")}
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'block' }}>{t("expected_delivery_date")}</span>
                  <span className="font-mono" style={{ fontWeight: 600, color: order.due_date && order.status !== 'completed' && new Date() > new Date(order.due_date) ? 'var(--danger)' : 'var(--text-primary)' }}>
                    {order.due_date ? new Date(order.due_date).toLocaleDateString('ar-SA') : 'غير محدد'}
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'block' }}>{t("target_branch")}</span>
                  <span style={{ fontWeight: 600 }}>{order.branch.name}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'block' }}>{t("general_status")}</span>
                  <span className={`badge ${order.status === 'completed' ? 'approved' : order.status === 'returned' ? 'pending animate-pulse' : order.status === 'canceled' ? 'pending' : ''}`} style={{ background: order.status === 'returned' || order.status === 'canceled' ? 'var(--danger-bg)' : undefined, color: order.status === 'returned' || order.status === 'canceled' ? 'var(--danger)' : undefined, border: order.status === 'returned' || order.status === 'canceled' ? '1px solid var(--danger)' : undefined }}>
                    {order.status === 'in_progress' ? t("executing") : order.status === 'completed' ? 'منجز وتم التسليم' : order.status === 'canceled' ? t("cancelled") : 'مرفوض ومُعاد'}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="auth-card" style={{ maxWidth: '100%' }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>{t("timeline")}</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {order.history.map((h: any, i: number) => (
                <div key={h.id} style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{ 
                      width: '32px', height: '32px', borderRadius: '50%', 
                      background: h.action === 'returned' ? 'var(--danger-bg)' : h.action === 'completed' ? 'var(--success-bg)' : h.action === 'added_note' ? 'var(--bg-page)' : 'var(--primary-light)',
                      color: h.action === 'returned' ? 'var(--danger)' : h.action === 'completed' ? 'var(--success)' : h.action === 'added_note' ? 'var(--text-secondary)' : 'var(--primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      {h.action === 'created' && <Plus size={16} />}
                      {h.action === 'handed_off' && <ArrowRightCircle size={16} />}
                      {h.action === 'completed' && <CheckCircle size={16} />}
                      {h.action === 'returned' && <AlertTriangle size={16} />}
                      {h.action === 'added_note' && <FastForward size={16} />} 
                    </div>
                    {i !== order.history.length - 1 && <div style={{ width: '2px', flex: 1, background: 'var(--border-light)', marginTop: '4px' }}></div>}
                  </div>
                  
                  <div style={{ paddingBottom: i !== order.history.length - 1 ? '16px' : '0' }}>
                    <div style={{ fontWeight: 600 }}>
                      {h.action === 'created' && 'تم إنشاء الطلب'}
                      {h.action === 'handed_off' && `تم إنجاز مرحلة (${h.stage?.name || 'مرحلة'}) وتسليمها`}
                      {h.action === 'completed' && `تم تسليم الطلب نهائياً للفرع`}
                      {h.action === 'returned' && `تم رفض المرحلة (${h.stage?.name || 'مرحلة'}) وإعادتها للتعديل`}
                      {h.action === 'added_note' && `إضافة ملاحظة / مرفق في مرحلة (${h.stage?.name || 'مرحلة'})`}
                    </div>
                    
                    <div style={{ display: 'flex', gap: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><User size={12} /> من: {h.actor?.full_name}</span>
                      {h.assigned_to && <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><ArrowRightCircle size={12} /> إلى: {h.assigned_to.full_name}</span>}
                      <span className="font-mono" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Calendar size={12} /> {new Date(h.created_at).toLocaleString('ar-SA')}</span>
                    </div>

                    {h.notes && (
                      <div style={{ marginTop: '8px', padding: '12px 16px', background: 'var(--bg-page)', borderRadius: 'var(--radius)', fontSize: '0.9rem', color: 'var(--text-primary)', border: '1px solid var(--border-light)' }}>
                        {h.notes}
                      </div>
                    )}

                    {h.image_url && (
                      <div style={{ marginTop: '8px' }}>
                        <img src={h.image_url} alt="Note Attachment" style={{ maxWidth: '200px', borderRadius: 'var(--radius)', border: '1px solid var(--border-light)' }} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Hand-off Actions */}
        <div style={{ position: 'sticky', top: '24px' }}>
          <div className="auth-card">
            <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '12px' }}>{t("current_operation")}</h2>
            
            <div style={{ padding: '16px', background: 'var(--bg-page)', borderRadius: 'var(--radius)', marginBottom: '16px', border: '1px solid var(--border-light)' }}>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'block' }}>{t("current_stage")}</span>
              <span style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)', display: 'block', marginBottom: '8px' }}>
                {order.current_stage?.name}
              </span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'block' }}>{t("current_responsible_employee")}</span>
              <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <User size={16} /> {order.current_assignee?.full_name}
              </span>
              {(() => {
                const elapsedHours = Math.floor((new Date().getTime() - new Date(order.updated_at).getTime()) / (1000 * 60 * 60));
                const estimatedHours = order.current_stage?.estimated_hours || 24;
                const isOverdue = order.status !== 'completed' && elapsedHours >= estimatedHours;
                
                return (
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--border-light)' }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', display: 'block', marginBottom: '4px' }}>{t("time_taken_in_stage")}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={16} color={isOverdue ? 'var(--danger)' : 'var(--text-secondary)'} />
                      <span className="font-mono" style={{ fontWeight: 800, fontSize: '1.1rem', color: isOverdue ? 'var(--danger)' : 'var(--text-primary)' }} dir="ltr">
                        {elapsedHours} / {estimatedHours} hr
                      </span>
                      {isOverdue && <span className="badge animate-pulse" style={{ background: 'var(--danger)', color: 'white', fontWeight: 700 }}>{t("exceeded_expected_time")}</span>}
                    </div>
                  </div>
                );
              })()}
            </div>

            {order.status === 'completed' ? (
              <div style={{ padding: '16px', background: 'var(--success-bg)', color: 'var(--success)', borderRadius: 'var(--radius)', textAlign: 'center', fontWeight: 600, border: '1px solid var(--success)' }}>
                تم إنجاز الطلب وتسليمه بالكامل.
              </div>
            ) : !canAct ? (
              <div style={{ padding: '16px', border: '1px dashed var(--border-light)', borderRadius: 'var(--radius)', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                أنت لست الموظف المسؤول عن هذه المرحلة حالياً، لا يمكنك تنفيذ إجراء.
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {error && <div className="error-message">{error}</div>}

                {/* Action Selection for Quality / Final stages */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button type="button" className={`btn ${actionType !== 'add_note' ? 'btn-secondary' : ''}`} style={{ flex: '1 1 45%' }} onClick={() => setActionType('add_note')}>
                    إضافة ملاحظة / صورة فقط
                  </button>
                  {isFinalStage && (
                    <button type="button" className={`btn ${actionType === 'complete' ? '' : 'btn-secondary'}`} style={{ flex: '1 1 45%', background: actionType === 'complete' ? 'var(--success)' : '' }} onClick={() => setActionType('complete')}>
                      إغلاق الطلب (منجز)
                    </button>
                  )}
                  {!isFinalStage && (
                    <button type="button" className={`btn ${actionType === 'hand_off' ? '' : 'btn-secondary'}`} style={{ flex: '1 1 45%' }} onClick={() => setActionType('hand_off')}>
                      تسليم للمرحلة التالية
                    </button>
                  )}
                  {isQualityStage && (
                    <button type="button" className={`btn ${actionType === 'return' ? 'btn-danger' : 'btn-secondary'}`} style={{ flex: '1 1 45%', background: actionType === 'return' ? 'var(--danger)' : '', color: actionType === 'return' ? '#fff' : '' }} onClick={() => setActionType('return')}>
                      رفض (إعادة للتعديل)
                    </button>
                  )}
                  {isAdmin && (
                    <button type="button" className={`btn ${actionType === 'cancel' ? 'btn-danger' : 'btn-secondary'}`} style={{ flex: '1 1 100%', background: actionType === 'cancel' ? 'var(--danger)' : '', color: actionType === 'cancel' ? '#fff' : '' }} onClick={() => setActionType('cancel')}>
                      إلغاء الطلب بالكامل
                    </button>
                  )}
                </div>

                {actionType !== 'complete' && actionType !== 'add_note' && actionType !== 'cancel' && (
                  <>
                    <div className="form-group">
                      <label className="form-label">{actionType === 'return' ? 'إعادة إلى مرحلة:' : 'المرحلة التالية:'}</label>
                      <select className="form-input" value={nextStageId} onChange={(e) => { setNextStageId(e.target.value); setNextAssigneeId(""); }}>
                        <option value="">{t("select_stage")}</option>
                        {actionType === 'return' ? (
                          stages.slice(0, currentStageIndex).map((s: any) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))
                        ) : (
                          defaultNextStage && <option value={defaultNextStage.id}>{defaultNextStage.name}</option>
                        )}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">الموظف المستلم:</label>
                      <select className="form-input" value={nextAssigneeId} onChange={(e) => setNextAssigneeId(e.target.value)} disabled={!nextStageId}>
                        <option value="">{t("select_employee")}</option>
                        {eligibleUsers.map(u => (
                          <option key={u.id} value={u.id}>{u.full_name}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}

                <div className="form-group">
                  <label className="form-label">{actionType === 'cancel' ? 'سبب الإلغاء (مطلوب)' : 'ملاحظات (اختياري)'}</label>
                  <textarea className="form-input form-textarea" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="اكتب الملاحظات..." required={actionType === 'cancel'} />
                </div>

                <div className="form-group">
                  <label className="form-label">{t("attachments")}</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <label className="btn btn-secondary" style={{ cursor: 'pointer', width: 'auto', display: 'flex', gap: '8px' }}>
                      <Camera size={16} />
                      <span>{image ? "تغيير الصورة" : "التقاط / إرفاق صورة"}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        style={{ display: 'none' }} 
                        onChange={(e) => setImage(e.target.files?.[0] || null)} 
                      />
                    </label>
                    {image && (
                      <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600, maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        تم إرفاق: {image.name}
                      </span>
                    )}
                  </div>
                </div>

                <button type="submit" className={`btn ${actionType === 'return' || actionType === 'cancel' ? 'btn-danger' : ''}`} disabled={loading} style={{ background: actionType === 'return' || actionType === 'cancel' ? 'var(--danger)' : actionType === 'complete' ? 'var(--success)' : actionType === 'add_note' ? 'var(--primary)' : 'var(--primary)', color: '#fff', border: 'none' }}>
                  {loading ? "جاري الحفظ..." : actionType === 'return' ? "تأكيد الرفض والإعادة" : actionType === 'cancel' ? "تأكيد الإلغاء" : actionType === 'complete' ? "تأكيد التسليم النهائي" : actionType === 'add_note' ? "إضافة الملاحظة وحفظها" : "تأكيد وإرسال للموظف"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
