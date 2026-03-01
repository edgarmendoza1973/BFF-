'use client';
/**
 * LanguageSwitcher — dropdown flag selector for 8 languages.
 * Reads/writes to localStorage('bff_lang') and fires a custom
 * window event 'bff_lang_change' that the layout/pages can listen to.
 * Also PATCHes the user profile so the preference persists in the DB.
 */
import { useState, useEffect, useRef } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';

export const LANG_OPTIONS = [
  { code: 'en', label: 'English',   flag: '🇺🇸', short: 'EN' },
  { code: 'tl', label: 'Filipino',  flag: '🇵🇭', short: 'FIL' },
  { code: 'es', label: 'Español',   flag: '🇪🇸', short: 'ES' },
  { code: 'zh', label: '中文',       flag: '🇨🇳', short: 'ZH' },
  { code: 'ko', label: '한국어',     flag: '🇰🇷', short: 'KO' },
  { code: 'ja', label: '日本語',     flag: '🇯🇵', short: 'JA' },
  { code: 'fr', label: 'Français',  flag: '🇫🇷', short: 'FR' },
  { code: 'de', label: 'Deutsch',   flag: '🇩🇪', short: 'DE' },
] as const;

export type LangCode = typeof LANG_OPTIONS[number]['code'];

interface Props {
  /** 'full' shows flag + label; 'compact' shows flag + short code */
  variant?: 'full' | 'compact';
  /** extra CSS classes for the trigger button */
  className?: string;
}

export function LanguageSwitcher({ variant = 'full', className = '' }: Props) {
  const [current, setCurrent] = useState<LangCode>('en');
  const [open, setOpen]       = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = (localStorage.getItem('bff_lang') || 'en') as LangCode;
    setCurrent(saved);

    const handler = (e: Event) => {
      const detail = (e as CustomEvent<string>).detail as LangCode;
      if (detail) setCurrent(detail);
    };
    window.addEventListener('bff_lang_change', handler);
    return () => window.removeEventListener('bff_lang_change', handler);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectLang = async (code: LangCode) => {
    setCurrent(code);
    setOpen(false);
    localStorage.setItem('bff_lang', code);
    // Notify all listeners (layout, pages)
    window.dispatchEvent(new CustomEvent('bff_lang_change', { detail: code }));
    // Persist to DB (fire-and-forget — user might not be authed on public pages)
    try {
      await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: code }),
      });
    } catch {
      // ignore — localStorage is the source of truth for UI
    }
  };

  const currentOption = LANG_OPTIONS.find(l => l.code === current) || LANG_OPTIONS[0];

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-sm text-gray-600
                   hover:bg-gray-100 transition-colors border border-transparent
                   hover:border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        aria-label="Change language"
        title="Change language"
      >
        <Globe className="h-3.5 w-3.5 text-gray-400 shrink-0" />
        <span className="text-base leading-none">{currentOption.flag}</span>
        {variant === 'full' ? (
          <span className="hidden sm:inline font-medium">{currentOption.label}</span>
        ) : (
          <span className="font-medium text-xs">{currentOption.short}</span>
        )}
        <ChevronDown className={`h-3 w-3 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-1 z-50 w-44 bg-white border border-gray-200
                        rounded-xl shadow-lg overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {LANG_OPTIONS.map(opt => (
            <button
              key={opt.code}
              onClick={() => selectLang(opt.code)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm hover:bg-gray-50
                          transition-colors text-left
                          ${current === opt.code ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'}`}
            >
              <span className="text-base w-5">{opt.flag}</span>
              <span className="flex-1">{opt.label}</span>
              {current === opt.code && <Check className="h-3.5 w-3.5 text-indigo-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
