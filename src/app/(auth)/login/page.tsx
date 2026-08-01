import { LoginForm } from "@/components/auth/LoginForm";
import { getT } from "@/lib/i18n";

import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

export default async function LoginPage() {
  const t = await getT();
  
  return (
    <div className="auth-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="auth-title" style={{ marginBottom: 0 }}>{t("sign_in")}</h1>
        <LanguageSwitcher />
      </div>
      <LoginForm />
    </div>
  );
}
