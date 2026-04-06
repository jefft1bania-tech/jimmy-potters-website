'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import translations, { Lang, Translations } from '@/lib/translations';

interface LanguageContextType {
  lang: Lang;
  t: Translations;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'en',
  t: translations.en,
  toggleLang: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en');

  // Persist language choice in localStorage
  useEffect(() => {
    const saved = localStorage.getItem('jp-lang') as Lang | null;
    if (saved === 'en' || saved === 'es') {
      setLang(saved);
    }
  }, []);

  function toggleLang() {
    const next = lang === 'en' ? 'es' : 'en';
    setLang(next);
    localStorage.setItem('jp-lang', next);
  }

  const t = translations[lang] as Translations;

  return (
    <LanguageContext.Provider value={{ lang, t, toggleLang }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
