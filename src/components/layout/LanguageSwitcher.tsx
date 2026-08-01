'use client';

import { useRouter } from 'next/navigation';
import { useTranslation } from './I18nProvider';

import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { locale, t } = useTranslation();
  const router = useRouter();

  const handleLanguageChange = (newLocale: 'ar' | 'hi') => {
    if (newLocale === locale) return;
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000`;
    router.refresh();
  };

  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      background: 'var(--bg-page)', 
      border: '1px solid var(--border-light)',
      borderRadius: '24px', 
      padding: '4px',
      gap: '4px',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{ padding: '0 8px', color: 'var(--text-secondary)' }}>
        <Globe size={16} />
      </div>
      <button 
        onClick={() => handleLanguageChange('ar')}
        style={{ 
          padding: '6px 16px', 
          borderRadius: '20px', 
          border: 'none', 
          background: locale === 'ar' ? 'var(--primary)' : 'transparent',
          color: locale === 'ar' ? '#fff' : 'var(--text-secondary)',
          fontWeight: locale === 'ar' ? 800 : 600,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          fontSize: '0.9rem',
          fontFamily: 'var(--font-heading)'
        }}
      >
        العربية
      </button>
      <button 
        onClick={() => handleLanguageChange('hi')}
        style={{ 
          padding: '6px 16px', 
          borderRadius: '20px', 
          border: 'none', 
          background: locale === 'hi' ? 'var(--primary)' : 'transparent',
          color: locale === 'hi' ? '#fff' : 'var(--text-secondary)',
          fontWeight: locale === 'hi' ? 800 : 600,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          fontSize: '0.9rem',
          fontFamily: 'var(--font-heading)'
        }}
      >
        हिन्दी
      </button>
    </div>
  );
}
