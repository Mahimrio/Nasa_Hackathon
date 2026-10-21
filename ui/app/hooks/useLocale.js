"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import en from "../locales/en.json";
import bn from "../locales/bn.json";

const translations = { en, bn };

export const LocaleContext = createContext(null);

export const BENGALI_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

export function toBengaliNumber(val) {
  if (val === null || val === undefined) return "";
  return String(val).replace(/[0-9]/g, (w) => BENGALI_DIGITS[+w]);
}

export function LocaleProvider({ children }) {
  // Default to Bangla ('bn') per Prompt 8 target user profile (Upazila Agriculture Officer)
  const [lang, setLangState] = useState("bn");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem("hydrosense_locale");
      if (saved === "en" || saved === "bn") {
        setLangState(saved);
      } else {
        setLangState("bn");
      }
    } catch {
      // localStorage may fail in restricted contexts
    }
  }, []);

  const setLang = useCallback((newLang) => {
    if (newLang !== "en" && newLang !== "bn") return;
    setLangState(newLang);
    try {
      localStorage.setItem("hydrosense_locale", newLang);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
      if (lang === "bn") {
        document.body.classList.add("lang-bn");
      } else {
        document.body.classList.remove("lang-bn");
      }
    }
  }, [lang]);

  const t = useCallback(
    (keyPath, params = {}) => {
      const currentDict = translations[lang] || translations.bn;
      const fallbackDict = translations.en;

      const keys = keyPath.split(".");
      let val = currentDict;
      for (const k of keys) {
        val = val?.[k];
        if (val === undefined) break;
      }

      if (val === undefined) {
        // Fallback to English if key missing
        val = fallbackDict;
        for (const k of keys) {
          val = val?.[k];
          if (val === undefined) break;
        }
      }

      if (typeof val !== "string") {
        return val ?? keyPath;
      }

      // Replace {param} placeholders
      return val.replace(/\{(\w+)\}/g, (_, k) => {
        if (params[k] !== undefined) {
          return lang === "bn" && typeof params[k] === "number"
            ? toBengaliNumber(params[k])
            : String(params[k]);
        }
        return `{${k}}`;
      });
    },
    [lang]
  );

  const formatNumber = useCallback(
    (num) => {
      if (lang === "bn") return toBengaliNumber(num);
      return String(num);
    },
    [lang]
  );

  const value = useMemo(
    () => ({
      lang,
      setLang,
      t,
      isBangla: lang === "bn",
      formatNumber,
      mounted,
    }),
    [lang, setLang, t, formatNumber, mounted]
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    throw new Error("useLocale must be used within a LocaleProvider");
  }
  return ctx;
}
