'use client';

import React, { createContext, useContext, ReactNode } from 'react';
import type { Dictionary, Lang } from '@/lib/i18n';

interface I18nContextType {
  locale: Lang;
  dict: Dictionary;
  t: (key: keyof Dictionary) => string;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ 
  locale, 
  dict, 
  children 
}: { 
  locale: Lang; 
  dict: Dictionary; 
  children: ReactNode 
}) {
  const t = (key: any) => {
    return dict[key as keyof Dictionary] || key;
  };

  return (
    <I18nContext.Provider value={{ locale, dict, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useTranslation must be used within an I18nProvider');
  }
  return context;
}
