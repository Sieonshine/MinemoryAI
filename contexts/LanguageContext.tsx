"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import type { Lang } from "@/lib/translations";
import {
  LANG_STORAGE_KEY,
  translations,
  type TranslationKeys,
} from "@/lib/translations";

type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: TranslationKeys;
};

const defaultLang: Lang = "ko";
const stored = (): Lang => {
  if (typeof window === "undefined") return defaultLang;
  const v = localStorage.getItem(LANG_STORAGE_KEY) as Lang | null;
  return v === "ko" || v === "en" || v === "es" ? v : defaultLang;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(defaultLang);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLangState(stored());
    setMounted(true);
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    if (typeof window !== "undefined") {
      localStorage.setItem(LANG_STORAGE_KEY, next);
    }
  }, []);

  const t = mounted ? translations[lang] : translations[defaultLang];

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return ctx;
}
