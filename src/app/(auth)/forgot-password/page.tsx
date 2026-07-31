import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { getT } from "@/lib/i18n";

export default function ForgotPasswordPage() {
  const t = getT("ar");
  
  return (
    <div className="auth-card">
      <h1 className="auth-title">{t("forgot_password")}</h1>
      <ForgotPasswordForm />
    </div>
  );
}
