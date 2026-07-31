"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getT } from "@/lib/i18n";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const t = getT("ar");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login failed");
      }

      if (!data.approved) {
        router.push("/pending-approval");
      } else {
        router.push("/dashboard");
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

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

      <div className="form-group">
        <label className="form-label">{t("password")}</label>
        <input
          type="password"
          className="form-input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      <button type="submit" className="btn" disabled={loading} style={{ marginTop: '16px' }}>
        {loading ? "..." : t("sign_in")}
      </button>

      <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.875rem' }}>
        <Link href="/signup" style={{ color: 'var(--primary)', textDecoration: 'none' }}>
          {t("no_account")}
        </Link>
      </div>
      <div style={{ marginTop: '12px', textAlign: 'center', fontSize: '0.875rem' }}>
        <Link href="/forgot-password" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
          {t("forgot_password")}
        </Link>
      </div>
    </form>
  );
}
