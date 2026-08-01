import { LoginForm } from "@/components/auth/LoginForm";
import { getT } from "@/lib/i18n";

export default async function LoginPage() {
  const t = await getT();
  
  return (
    <div className="auth-card">
      <h1 className="auth-title">{t("sign_in")}</h1>
      <LoginForm />
    </div>
  );
}
