import type { Metadata } from "next";
import "./globals.css";
import { getLocale, dictionaries } from "@/lib/i18n";
import { I18nProvider } from "@/components/layout/I18nProvider";

export const metadata: Metadata = {
  title: "Factory Workflow",
  description: "Production Workflow Management System",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';
  const dict = dictionaries[locale] || dictionaries['ar'];

  return (
    <html lang={locale} dir={dir}>
      <body>
        <I18nProvider locale={locale} dict={dict}>
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
