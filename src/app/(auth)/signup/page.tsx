import { SignupForm } from "@/components/auth/SignupForm";
import { getT } from "@/lib/i18n";

import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

export default async function SignupPage() {
  const t = await getT();
  
  return (
    <div className="auth-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1 className="auth-title" style={{ marginBottom: 0 }}>{t("sign_up")}</h1>
        <LanguageSwitcher />
      </div>
      <SignupForm />
    </div>
  );
}
