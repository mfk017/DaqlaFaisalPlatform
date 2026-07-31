import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { getT } from "@/lib/i18n";
import { Suspense } from "react";

export default function ResetPasswordPage() {
  const t = getT("ar");
  
  return (
    <div className="auth-card">
      <h1 className="auth-title">تغيير كلمة المرور</h1>
      <Suspense fallback={<div>جاري التحميل...</div>}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
