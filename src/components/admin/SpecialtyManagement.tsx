"use client";
import { useTranslation } from "@/components/layout/I18nProvider";

import { useEffect, useState } from "react";
import { Trash2, Plus, Edit } from "lucide-react";

type Specialty = {
  id: string;
  name: string;
  label: string;
  created_at: string;
};

export function SpecialtyManagement() {
  const { t } = useTranslation();

  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [name, setName] = useState("");
  const [label, setLabel] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchSpecialties = async () => {
    const res = await fetch("/api/admin/specialties");
    const data = await res.json();
    setSpecialties(data.specialties || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchSpecialties();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !label.trim()) return;

    if (editingId) {
      await fetch(`/api/admin/specialties/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), label: label.trim() }),
      });
    } else {
      await fetch("/api/admin/specialties", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), label: label.trim() }),
      });
    }

    setName("");
    setLabel("");
    setEditingId(null);
    fetchSpecialties();
  };

  const handleEdit = (s: Specialty) => {
    setName(s.name);
    setLabel(s.label);
    setEditingId(s.id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا التخصص؟")) return;
    await fetch(`/api/admin/specialties/${id}`, { method: "DELETE" });
    fetchSpecialties();
  };

  if (loading) return <div>{t("loading")}</div>;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '24px', alignItems: 'start' }}>
      
      {/* Specialties List */}
      <div>
        <h3 style={{ marginBottom: '16px' }}>{t("specialties_roles_list")}</h3>
        {specialties.length === 0 ? (
          <div className="auth-card" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            لا يوجد تخصصات مضافة
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>{t("id_name")}</th>
                <th>{t("name_arabic_label")}</th>
                <th>{t("added_date")}</th>
                <th>{t("actions")}</th>
              </tr>
            </thead>
            <tbody>
              {specialties.map(s => (
                <tr key={s.id}>
                  <td className="font-mono">{s.name}</td>
                  <td style={{ fontWeight: 600 }}>{s.label}</td>
                  <td className="font-mono" style={{ fontSize: '0.85rem' }}>{new Date(s.created_at).toLocaleDateString('ar-SA')}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => handleEdit(s)} className="btn" style={{ padding: '6px', width: 'auto', background: 'var(--primary)' }}>
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDelete(s.id)} className="btn" style={{ padding: '6px', width: 'auto', background: 'var(--danger-bg)', color: 'var(--danger)' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Form */}
      <div className="auth-card" style={{ position: 'sticky', top: '24px' }}>
        <h3 style={{ marginBottom: '16px' }}>{editingId ? 'تعديل التخصص' : 'إضافة تخصص جديد'}</h3>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="form-group">
            <label className="form-label">{t("id_code")}</label>
            <input 
              type="text" 
              className="form-input font-mono" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g. printing"
              dir="ltr"
              required 
            />
          </div>
          <div className="form-group">
            <label className="form-label">{t("name_arabic_display")}</label>
            <input 
              type="text" 
              className="form-input" 
              value={label} 
              onChange={e => setLabel(e.target.value)} 
              placeholder="e.g. طباعة"
              required 
            />
          </div>
          
          <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
            <button type="submit" className="btn" style={{ flex: 1 }}>
              {editingId ? <><Edit size={16} /> {t("save_changes")}</> : <><Plus size={16} /> إضافة التخصص</>}
            </button>
            {editingId && (
              <button 
                type="button" 
                className="btn" 
                style={{ width: 'auto', background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)' }}
                onClick={() => { setEditingId(null); setName(""); setLabel(""); }}
              >
                إلغاء
              </button>
            )}
          </div>
        </form>
      </div>

    </div>
  );
}
