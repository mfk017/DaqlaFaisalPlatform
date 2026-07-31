"use client";

import { useState } from "react";
import Link from "next/link";
import { getT } from "@/lib/i18n";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const t = getT("ar");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to request reset");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div style={{ textAlign: 'center' }}>
        <div style={{ color: 'var(--success)', marginBottom: '16px', fontWeight: 600 }}>
          تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني (للتجربة المحلية، تحقق من سجلات الخادم).
        </div>
        <Link href="/login" className="btn">
          العودة لتسجيل الدخول
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-group">
        <label className="form-label">{t("email")}</label>
        <input
          type="email"
          className="form-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>

      <button type="submit" className="btn" disabled={loading} style={{ marginTop: '16px' }}>
        {loading ? "..." : "إرسال رابط الاستعادة"}
      </button>

      <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.875rem' }}>
        <Link href="/login" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
          العودة لتسجيل الدخول
        </Link>
      </div>
    </form>
  );
}
