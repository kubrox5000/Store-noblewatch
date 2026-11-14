import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type Language = 'ar' | 'fr';

export const LANG_STORAGE_KEY = 'noblewatch_lang';

interface LanguageContextType {
  lang: Language;
  isFr: boolean;
  setLang: (lang: Language) => void;
  toggleLang: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const readStoredLang = (): Language => {
  try {
    const saved = localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === 'fr' || saved === 'ar') return saved;
  } catch {
    // ignore storage access issues
  }
  return 'ar';
};

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => readStoredLang());

  useEffect(() => {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch {
      // ignore storage errors
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = lang;
      document.documentElement.dir = lang === 'fr' ? 'ltr' : 'rtl';
    }
  }, [lang]);

  const setLang = useCallback((next: Language) => {
    setLangState(next);
  }, []);

  const toggleLang = useCallback(() => {
    setLangState((prev) => (prev === 'ar' ? 'fr' : 'ar'));
  }, []);

  return (
    <LanguageContext.Provider
      value={{
        lang,
        isFr: lang === 'fr',
        setLang,
        toggleLang,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return ctx;
};
