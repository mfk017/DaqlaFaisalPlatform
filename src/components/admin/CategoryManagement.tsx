"use client";

import { useEffect, useState } from "react";
import { Trash2, Plus, Settings2 } from "lucide-react";
import Link from "next/link";

type Category = {
  id: string;
  name: string;
  is_active: boolean;
  _count: { stages: number };
};

export function CategoryManagement() {
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

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا التصنيف؟ جميع المراحل المرتبطة سيتم حذفها أيضاً.")) return;
    
    await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
    fetchCategories();
  };

  if (loading) return <div>جاري التحميل...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '800px' }}>
      <form onSubmit={handleAdd} style={{ display: 'flex', gap: '12px' }}>
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
        <table className="data-table">
          <thead>
            <tr>
              <th>التصنيف</th>
              <th>المراحل</th>
              <th>الحالة</th>
              <th style={{ width: '120px' }}>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id}>
                <td style={{ fontWeight: 600 }}>{c.name}</td>
                <td>{c._count.stages} مراحل</td>
                <td>
                  <span className={`badge ${c.is_active ? 'approved' : 'pending'}`}>
                    {c.is_active ? 'نشط' : 'غير مكتمل'}
                  </span>
                </td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <Link 
                      href={`/admin/categories/${c.id}`}
                      className="btn" 
                      style={{ padding: '6px', width: 'auto', background: 'var(--primary)', color: 'white', textDecoration: 'none' }}
                      title="بناء المسار"
                    >
                      <Settings2 size={16} />
                    </Link>
                    <button 
                      onClick={() => handleDelete(c.id)}
                      className="btn" 
                      style={{ padding: '6px', width: 'auto', background: 'var(--danger-bg)', color: 'var(--danger)' }}
                      title="حذف"
                    >
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
  );
}
