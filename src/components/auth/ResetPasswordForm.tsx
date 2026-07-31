"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getT } from "@/lib/i18n";
import Link from "next/link";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const id = searchParams.get("id");
  
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const t = getT("ar");

  if (!token || !id) {
    return <div className="error-message">رابط الاستعادة غير صالح أو منتهي الصلاحية.</div>;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, id, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to reset password");
      }

      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
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
          تم تغيير كلمة المرور بنجاح. سيتم تحويلك لتسجيل الدخول...
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-group">
        <label className="form-label">كلمة المرور الجديدة</label>
        <input
          type="password"
          className="form-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          dir="ltr"
        />
      </div>

      <button type="submit" className="btn" disabled={loading} style={{ marginTop: '16px' }}>
        {loading ? "..." : "حفظ كلمة المرور"}
      </button>
    </form>
  );
}
