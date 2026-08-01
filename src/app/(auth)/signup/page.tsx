import { SignupForm } from "@/components/auth/SignupForm";
import { getT } from "@/lib/i18n";

export default async function SignupPage() {
  const t = await getT();
  
  return (
    <div className="auth-card">
      <h1 className="auth-title">{t("sign_up")}</h1>
      <SignupForm />
    </div>
  );
}
