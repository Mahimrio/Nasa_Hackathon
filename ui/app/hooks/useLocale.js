"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import en from "../locales/en.json";
import bn from "../locales/bn.json";
import { withViewTransition } from "../lib/viewTransition";

const translations = { en, bn };

// Longest we hold the loading skeleton while web fonts download.
const FONT_WAIT_CAP_MS = 1800;

/**
 * Requests the faces the UI actually uses so the first real paint already has
 * them. Without this, text paints in a fallback font and then reflows when the
 * web fonts arrive, which reads as a stutter on refresh.
 */
function loadUiFonts(lang) {
  if (typeof document === "undefined" || !document.fonts || !document.fonts.load) {
    return Promise.resolve();
  }
  const specs = [
    ["600 20px Fraunces"],
    ["700 20px Fraunces"],
    ["500 14px Manrope"],
    ["700 14px Manrope"],
    ["500 12px 'IBM Plex Mono'"],
  ];
  if (lang === "bn") {
    specs.push(["500 14px 'Noto Sans Bengali'", "\u0985"]);
    specs.push(["600 20px 'Noto Serif Bengali'", "\u0985"]);
  }
  return Promise.all(specs.map(([font, text]) => document.fonts.load(font, text).catch(() => [])));
}

function applyDocumentLang(lang) {
  document.documentElement.lang = lang;
  document.body.classList.toggle("lang-bn", lang === "bn");
}

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

  // The server always renders "bn". We resolve the saved language and the web
  // fonts together, then flip `mounted` once, so nothing visible switches
  // language or font after first paint.
  useEffect(() => {
    let cancelled = false;
    let saved = "bn";
    try {
      const stored = localStorage.getItem("hydrosense_locale");
      if (stored === "en" || stored === "bn") saved = stored;
    } catch {
      // localStorage may fail in restricted contexts
    }

    const cap = new Promise((resolve) => setTimeout(resolve, FONT_WAIT_CAP_MS));
    Promise.race([loadUiFonts(saved), cap]).then(() => {
      if (cancelled) return;
      setLangState(saved);
      setMounted(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const setLang = useCallback((newLang) => {
    if (newLang !== "en" && newLang !== "bn") return;
    try {
      localStorage.setItem("hydrosense_locale", newLang);
    } catch {
      // ignore
    }
    withViewTransition(() => {
      setLangState(newLang);
      // Sync the document inside the transition callback so the "new" snapshot
      // already has the right font stack and <html lang>.
      applyDocumentLang(newLang);
    });
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined") {
      applyDocumentLang(lang);
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
