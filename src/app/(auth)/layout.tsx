import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="auth-container" style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', top: '24px', right: '24px' }}>
        <LanguageSwitcher />
      </div>
      {children}
    </div>
  );
}
