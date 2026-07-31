"use client";

import { useEffect, useState } from "react";
import { Trash2, Plus } from "lucide-react";

type Branch = {
  id: string;
  name: string;
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

  const handleDelete = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذا الفرع؟")) return;
    
    await fetch(`/api/admin/branches/${id}`, { method: "DELETE" });
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
              <th style={{ width: '80px' }}>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {branches.map((b) => (
              <tr key={b.id}>
                <td>{b.name}</td>
                <td>
                  <button 
                    onClick={() => handleDelete(b.id)}
                    className="btn" 
                    style={{ padding: '6px', width: 'auto', background: 'var(--danger-bg)', color: 'var(--danger)' }}
                    title="حذف"
                  >
                    <Trash2 size={16} />
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
