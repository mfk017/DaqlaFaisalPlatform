import { cookies } from 'next/headers';
import { ar } from './i18n/ar';
import { hi } from './i18n/hi';

export type Lang = 'ar' | 'hi';
export type Dictionary = typeof ar;

export const dictionaries = {
  ar,
  hi,
};

export async function getLocale(): Promise<Lang> {
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value;
  if (locale === 'hi') {
    return 'hi';
  }
  return 'ar'; // Default
}

// Server-side translation helper
export async function getT() {
  const locale = await getLocale();
  const dict = dictionaries[locale] || dictionaries['ar'];
  
  return (key: any) => {
    return dict[key as keyof Dictionary] || ar[key as keyof Dictionary] || key;
  };
}
