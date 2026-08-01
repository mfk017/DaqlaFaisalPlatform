'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from './I18nProvider';

export function LanguageSwitcher() {
  const { locale, t } = useTranslation();
  const router = useRouter();

  const handleLanguageChange = (newLocale: 'ar' | 'hi') => {
    if (newLocale === locale) return;
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
    router.refresh();
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <select 
        value={locale}
        onChange={(e) => handleLanguageChange(e.target.value as 'ar' | 'hi')}
        className="form-input"
        style={{ padding: '6px 12px', minWidth: '120px', background: 'var(--bg-page)' }}
      >
        <option value="ar">{t("arabic")}</option>
        <option value="hi">हिन्दी</option>
      </select>
    </div>
  );
}
