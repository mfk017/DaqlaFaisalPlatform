"use client";
import { useTranslation } from "@/components/layout/I18nProvider";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export function OrderIntakeForm({ categories, branches }: { categories: any[], branches: any[] }) {
  const { t } = useTranslation();

  const [customerName, setCustomerName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [branchId, setBranchId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  
  const [eligibleUsers, setEligibleUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Find the first stage of the selected category to filter eligible users
  const selectedCat = categories.find(c => c.id === categoryId);
  const firstStage = selectedCat?.stages[0];

  useEffect(() => {
    if (!firstStage) {
      setEligibleUsers([]);
      return;
    }
    const fetchUsers = async () => {
      const q = new URLSearchParams();
      if (firstStage.allowed_role) q.append('role', firstStage.allowed_role);
      if (firstStage.allowed_specialty) q.append('specialty', firstStage.allowed_specialty);
      
      const res = await fetch(`/api/users/eligible?${q.toString()}`);
      const data = await res.json();
      setEligibleUsers(data.users || []);
    };
    fetchUsers();
  }, [firstStage]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customerName,
          category_id: categoryId,
          branch_id: branchId,
          assignee_id: assigneeId
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      router.push(`/orders/${data.order.id}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="auth-card" style={{ maxWidth: '600px' }}>
      <form onSubmit={handleSubmit}>
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-group">
          <label className="form-label">{t("customer_name")}</label>
          <input
            type="text"
            className="form-input"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label className="form-label">{t("delivery_branch")}</label>
          <select className="form-input" value={branchId} onChange={(e) => setBranchId(e.target.value)} required>
            <option value="">{t("select_branch")}</option>
            {branches.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">{t("product_type")}</label>
          <select className="form-input" value={categoryId} onChange={(e) => { setCategoryId(e.target.value); setAssigneeId(""); }} required>
            <option value="">{t("select_category")}</option>
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {firstStage && (
          <div className="form-group" style={{ background: 'var(--primary-light)', padding: '16px', borderRadius: 'var(--radius)', border: '1px solid var(--primary)' }}>
            <label className="form-label" style={{ color: 'var(--primary)' }}>
              المرحلة الأولى: {firstStage.name}
            </label>
            <p style={{ fontSize: '0.85rem', marginBottom: '12px', color: 'var(--text-secondary)' }}>
              يجب تحديد الموظف الذي سيبدأ العمل على هذا الطلب:
            </p>
            <select className="form-input" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} required>
              <option value="">{t("select_employee")}</option>
              {eligibleUsers.map(u => (
                <option key={u.id} value={u.id}>{u.full_name}</option>
              ))}
            </select>
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
          <button type="submit" className="btn" disabled={loading || !categoryId || !branchId || !assigneeId}>
            {loading ? "..." : "إنشاء الطلب وإرساله"}
          </button>
          <Link href="/orders" className="btn" style={{ background: 'transparent', border: '1px solid var(--border-light)', color: 'var(--text-primary)' }}>
            إلغاء
          </Link>
        </div>
      </form>
    </div>
  );
}
