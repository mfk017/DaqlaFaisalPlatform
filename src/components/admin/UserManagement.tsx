"use client";
import { useTranslation } from "@/components/layout/I18nProvider";

import { useEffect, useState } from "react";
import { Check, X, Shield, Settings2, Clock } from "lucide-react";

type User = {
  id: string;
  full_name: string;
  email: string;
  approved: boolean;
  roles: { role: string; specialty: string | null }[];
};

export function UserManagement() {
  const { t } = useTranslation();

  const [users, setUsers] = useState<User[]>([]);
  const [specialties, setSpecialties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleModalId, setRoleModalId] = useState<string | null>(null);

  const fetchData = async () => {
    const [usersRes, specRes] = await Promise.all([
      fetch("/api/admin/users"),
      fetch("/api/admin/specialties")
    ]);
    const usersData = await usersRes.json();
    const specData = await specRes.json();
    
    setUsers(usersData.users || []);
    setSpecialties(specData.specialties || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleApproval = async (id: string, currentStatus: boolean) => {
    await fetch(`/api/admin/users/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved: !currentStatus }),
    });
    fetchData();
  };

  const assignRole = async (id: string, role: string, specialty?: string) => {
    await fetch(`/api/admin/users/${id}/role`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role, specialty }),
    });
    setRoleModalId(null);
    fetchData();
  };

  if (loading) return <div>{t("loading")}</div>;

  return (
    <>
      <table className="data-table">
        <thead>
          <tr>
            <th>{t("name")}</th>
            <th>{t("email")}</th>
            <th>{t("status")}</th>
            <th>{t("permission")}</th>
            <th>{t("actions")}</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>{u.full_name}</td>
              <td dir="ltr" style={{ textAlign: "right" }}>{u.email}</td>
              <td>
                <span className={`badge ${u.approved ? 'approved' : 'pending'}`}>
                  {u.approved ? t("approved") : t("pending_approval")}
                </span>
              </td>
              <td>
                {u.roles.length > 0 ? (
                  u.roles.map(r => (
                    <span key={r.role} className="badge approved" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                      {r.role} {r.specialty ? `(${r.specialty})` : ''}
                    </span>
                  ))
                ) : (
                  <span className="badge pending">{t("none")}</span>
                )}
              </td>
              <td>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    onClick={() => toggleApproval(u.id, u.approved)}
                    className="btn" 
                    style={{ padding: '6px', width: 'auto', background: u.approved ? 'var(--warning)' : 'var(--success)' }}
                    title={u.approved ? 'إلغاء الموافقة' : 'موافقة'}
                  >
                    {u.approved ? <X size={16} /> : <Check size={16} />}
                  </button>
                  <button 
                    onClick={() => setRoleModalId(u.id)}
                    className="btn" 
                    style={{ padding: '6px', width: 'auto', background: 'var(--primary)' }}
                    title="تغيير الصلاحية"
                  >
                    <Settings2 size={16} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {roleModalId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="auth-card">
            <h2 className="auth-title">{t("set_permission")}</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button className="btn" onClick={() => assignRole(roleModalId, 'admin')}>{t("admin_role")}</button>
              <button className="btn" onClick={() => assignRole(roleModalId, 'supervisor')}>{t("supervisor_role")}</button>
              <button className="btn" onClick={() => assignRole(roleModalId, 'reception')}>{t("reception_role")}</button>
              <button className="btn" onClick={() => assignRole(roleModalId, 'quality')}>جودة (Quality)</button>
              
              <div style={{ borderTop: '1px solid var(--border-light)', margin: '10px 0', paddingTop: '10px' }}>
                <div style={{ marginBottom: '8px', fontWeight: 600, fontSize: '0.9rem' }}>{t("workers_by_specialty")}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  {specialties.map(s => (
                    <button key={s.id} className="btn" style={{ background: 'var(--text-secondary)' }} onClick={() => assignRole(roleModalId, 'worker', s.name)}>
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              <button className="btn" style={{ background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)' }} onClick={() => setRoleModalId(null)}>{t("cancel")}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
