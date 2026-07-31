import { LoginForm } from "@/components/auth/LoginForm";
import { getT } from "@/lib/i18n";

export default function LoginPage() {
  const t = getT("ar");
  
  return (
    <div className="auth-card">
      <h1 className="auth-title">{t("sign_in")}</h1>
      <LoginForm />
    </div>
  );
}
