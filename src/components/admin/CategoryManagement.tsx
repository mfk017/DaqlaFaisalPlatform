"use client";
import { useTranslation } from "@/components/layout/I18nProvider";

import { useEffect, useState } from "react";
import { Trash2, Plus, Settings2 } from "lucide-react";
import Link from "next/link";

type Category = {
  id: string;
  name: string;
  is_active: boolean;
  is_archived: boolean;
  _count: { stages: number };
};

export function CategoryManagement() {
  const { t } = useTranslation();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCategories = async () => {
    const res = await fetch("/api/admin/categories");
    const data = await res.json();
    setCategories(data.categories || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    setIsSubmitting(true);
    await fetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategoryName }),
    });
    
    setNewCategoryName("");
    setIsSubmitting(false);
    fetchCategories();
  };

  const handleToggle = async (id: string, is_archived: boolean) => {
    await fetch(`/api/admin/categories/${id}/toggle`, { 
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_archived: !is_archived })
    });
    fetchCategories();
  };

  if (loading) return <div>{t("loading")}</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <form onSubmit={handleAdd} style={{ display: 'flex', gap: '12px', maxWidth: '600px' }}>
        <input
          type="text"
          className="form-input"
          placeholder="اسم التصنيف الجديد (مثال: تيشرتات)..."
          value={newCategoryName}
          onChange={(e) => setNewCategoryName(e.target.value)}
          required
        />
        <button type="submit" className="btn" disabled={isSubmitting} style={{ width: 'auto', whiteSpace: 'nowrap' }}>
          <Plus size={16} /> إضافة تصنيف
        </button>
      </form>

      {categories.length === 0 ? (
        <div className="auth-card" style={{ maxWidth: '100%', textAlign: 'center', color: 'var(--text-secondary)' }}>
          لا يوجد تصنيفات حالياً
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {categories.map((c) => (
            <div key={c.id} className="auth-card" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', opacity: c.is_archived ? 0.6 : 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', textDecoration: c.is_archived ? 'line-through' : 'none' }}>{c.name}</h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    عدد المراحل: {c._count.stages}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                  <span className="badge" style={{ background: c.is_archived ? 'var(--bg-card)' : (c.is_active ? 'var(--success-bg)' : 'var(--warning-bg)'), color: c.is_archived ? 'var(--text-secondary)' : (c.is_active ? 'var(--success)' : 'var(--warning)') }}>
                    {c.is_archived ? t("archived") : (c.is_active ? 'مفعل' : t("incomplete"))}
                  </span>
                  {!c.is_active && !c.is_archived && (
                    <span style={{ fontSize: '0.7rem', color: 'var(--warning)', maxWidth: '120px', textAlign: 'left' }}>
                      يحتاج إلى مرحلة جودة ومرحلة تسليم
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                <Link href={`/admin/categories/${c.id}`} style={{ flex: 1 }}>
                  <button className="btn btn-secondary" style={{ width: '100%' }}>
                    تعديل سير العمل
                  </button>
                </Link>
                <button 
                  onClick={() => handleToggle(c.id, c.is_archived)}
                  className="btn" 
                  style={{ padding: '8px', width: 'auto', background: c.is_archived ? 'var(--primary)' : 'var(--danger-bg)', color: c.is_archived ? '#fff' : 'var(--danger)' }}
                  title={c.is_archived ? t("activate") : t("archive")}
                >
                  {c.is_archived ? t("activate") : t("archive")}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
