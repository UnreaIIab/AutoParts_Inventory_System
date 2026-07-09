"use client";

import * as React from "react";
import { fr } from "./dictionary";

export type Lang = "en" | "fr";

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = React.createContext<I18nContextValue | null>(null);

export function useT() {
  const ctx = React.useContext(I18nContext);
  if (!ctx) throw new Error("useT must be used within LanguageProvider");
  return ctx;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = React.useState<Lang>("en");

  React.useEffect(() => {
    const stored = localStorage.getItem("lang");
    if (stored === "fr" || stored === "en") {
      setLangState(stored);
      document.documentElement.lang = stored;
    }
  }, []);

  const setLang = React.useCallback((next: Lang) => {
    localStorage.setItem("lang", next);
    setLangState(next);
    document.documentElement.lang = next;
  }, []);

  const t = React.useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      let out = lang === "fr" ? fr[key] ?? key : key;
      if (vars) {
        for (const k in vars) out = out.replaceAll(`{${k}}`, String(vars[k]));
      }
      return out;
    },
    [lang],
  );

  const value = React.useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
