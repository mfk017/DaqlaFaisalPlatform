"use client";
import { useTranslation } from "@/components/layout/I18nProvider";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export default function PendingClient() {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/refresh', { method: 'POST' });
      const data = await res.json();
      if (data.approved) {
        window.location.href = '/dashboard';
      } else {
        window.location.reload();
      }
    } catch (e) {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <h1 className="auth-title">{t("pending_approval")}</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
          حسابك بانتظار موافقة الإدارة. يرجى الانتظار أو التواصل مع المشرف.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button className="btn" onClick={handleRefresh} disabled={loading} style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
            {loading ? <Loader2 className="animate-spin" size={20} /> : null}
            تحديث
          </button>
          
          <form action="/api/auth/logout" method="POST" style={{ width: '100%' }}>
            <button type="submit" className="btn" style={{ background: 'transparent', color: 'var(--danger)', border: '1px solid var(--danger)', width: '100%' }}>
              تسجيل الخروج
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
