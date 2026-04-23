"use client";

import { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";

export type Language = "de" | "en";

const STORAGE_KEY = "language";

interface LanguageContextValue<T = Record<string, unknown>> {
  readonly language: Language;
  readonly setLanguage: (lang: Language) => void;
  readonly t: T;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const LanguageContext = createContext<LanguageContextValue<any> | null>(null);

function detectLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "de" || stored === "en") {
      return stored;
    }
  } catch {
    // localStorage not available
  }

  if (typeof navigator !== "undefined") {
    const browserLang = navigator.language;
    if (browserLang.startsWith("de")) {
      return "de";
    }
  }

  return "en";
}

interface LanguageProviderProps<T> {
  readonly translations: Record<Language, T>;
  readonly defaultLanguage?: Language;
  readonly children: React.ReactNode;
}

export function LanguageProvider<T>({ translations, children, defaultLanguage }: LanguageProviderProps<T>) {
  const [language, setLanguageState] = useState<Language>(defaultLanguage ?? "en");
  const [mounted, setMounted] = useState(!!defaultLanguage);

  useEffect(() => {
    if (!defaultLanguage) {
      const detected = detectLanguage();
      setLanguageState(detected);
      document.documentElement.lang = detected;
      setMounted(true);
    } else {
      document.documentElement.lang = defaultLanguage;
    }
  }, [defaultLanguage]);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // localStorage not available
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      try {
        localStorage.setItem(STORAGE_KEY, language);
      } catch {
        // localStorage not available
      }
    }
  }, [language, mounted]);

  const t = useMemo(() => translations[language], [translations, language]);

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useTranslations<T = Record<string, unknown>>(): T {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslations must be used within a LanguageProvider");
  }
  return context.t as T;
}

export function useLanguage(): { language: Language; setLanguage: (lang: Language) => void } {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return { language: context.language, setLanguage: context.setLanguage };
}
