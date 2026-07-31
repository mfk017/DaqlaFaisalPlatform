"use client";

import { useEffect, useState } from "react";
import { Trash2, Plus } from "lucide-react";

type Branch = {
  id: string;
  name: string;
  is_archived: boolean;
};

export function BranchManagement() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [newBranchName, setNewBranchName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBranches = async () => {
    const res = await fetch("/api/admin/branches");
    const data = await res.json();
    setBranches(data.branches || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBranchName.trim()) return;

    setIsSubmitting(true);
    await fetch("/api/admin/branches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newBranchName }),
    });
    
    setNewBranchName("");
    setIsSubmitting(false);
    fetchBranches();
  };

  const handleToggle = async (id: string, is_archived: boolean) => {
    const endpoint = is_archived ? "restore" : "archive";
    // We can use a PUT request to a new route, or we can use the DELETE route for archiving and a new route for restore.
    // For simplicity, let's create a toggle route.
    await fetch(`/api/admin/branches/${id}/toggle`, { 
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_archived: !is_archived })
    });
    fetchBranches();
  };

  if (loading) return <div>جاري التحميل...</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '600px' }}>
      <form onSubmit={handleAdd} style={{ display: 'flex', gap: '12px' }}>
        <input
          type="text"
          className="form-input"
          placeholder="اسم الفرع الجديد..."
          value={newBranchName}
          onChange={(e) => setNewBranchName(e.target.value)}
          required
        />
        <button type="submit" className="btn" disabled={isSubmitting} style={{ width: 'auto', whiteSpace: 'nowrap' }}>
          <Plus size={16} /> إضافة فرع
        </button>
      </form>

      {branches.length === 0 ? (
        <div className="auth-card" style={{ maxWidth: '100%', textAlign: 'center', color: 'var(--text-secondary)' }}>
          لا يوجد فروع حالياً
        </div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>الفرع</th>
              <th style={{ width: '120px' }}>الحالة</th>
              <th style={{ width: '120px' }}>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {branches.map((b) => (
              <tr key={b.id}>
                <td style={{ opacity: b.is_archived ? 0.5 : 1, textDecoration: b.is_archived ? 'line-through' : 'none' }}>{b.name}</td>
                <td>
                  <span className="badge" style={{ background: b.is_archived ? 'var(--bg-card)' : 'var(--success-bg)', color: b.is_archived ? 'var(--text-secondary)' : 'var(--success)' }}>
                    {b.is_archived ? 'مؤرشف' : 'نشط'}
                  </span>
                </td>
                <td>
                  <button 
                    onClick={() => handleToggle(b.id, b.is_archived)}
                    className="btn" 
                    style={{ padding: '6px 12px', width: 'auto', background: b.is_archived ? 'var(--primary)' : 'var(--danger-bg)', color: b.is_archived ? '#fff' : 'var(--danger)' }}
                  >
                    {b.is_archived ? 'تنشيط' : 'أرشفة'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
