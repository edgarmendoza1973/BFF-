'use client';
/**
 * useTranslation — thin hook that reads the current language from localStorage
 * and returns a `t(key)` function backed by src/lib/i18n.ts.
 *
 * Usage:
 *   const { t, lang } = useTranslation();
 *   <h1>{t('nav.bible')}</h1>
 */
import { useState, useEffect, useCallback } from 'react';
import { getLang, type LangCode } from '@/lib/i18n';

export function useTranslation() {
  const [lang, setLang] = useState<LangCode>('en');

  useEffect(() => {
    // Initialise from localStorage
    const saved = (localStorage.getItem('bff_lang') || 'en') as LangCode;
    setLang(saved);

    // React to changes made by LanguageSwitcher
    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail as LangCode;
      if (detail) setLang(detail);
    };
    window.addEventListener('bff_lang_change', handler);
    return () => window.removeEventListener('bff_lang_change', handler);
  }, []);

  /** Translate a key; falls back to the key itself if not found */
  const t = useCallback(
    (key: string, fallback?: string): string => getLang(lang, key) ?? fallback ?? key,
    [lang]
  );

  return { t, lang };
}
