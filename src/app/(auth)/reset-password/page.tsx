import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { getT } from "@/lib/i18n";
import { Suspense } from "react";

export default async function ResetPasswordPage() {
  const t = await getT();
  
  return (
    <div className="auth-card">
      <h1 className="auth-title">{t("change_password")}</h1>
      <Suspense fallback={<div>{t("loading")}</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
