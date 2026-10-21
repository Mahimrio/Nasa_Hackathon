"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "../hooks/useLocale";

export default function AppHeader({
  currentDateStr,
  currentTimeStr,
  onOpenBulletin,
  onOpenModelInfo,
}) {
  const { lang, setLang, t } = useLocale();
  const pathname = usePathname();
  const [liveUtc, setLiveUtc] = useState("");
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveUtc(
        now.toISOString().slice(11, 19) + " UTC"
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);

    const updateOnline = () => {
      if (typeof navigator !== "undefined") {
        setIsOnline(navigator.onLine);
      }
    };
    updateOnline();
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, []);

  const isDashboardActive = pathname === "/" || pathname === "/dashboard";
  const isForecastActive = pathname === "/forecast";
  const isAdvisoryActive = pathname === "/advisory";

  return (
    <header className="app-topbar" role="banner">
      {/* Brand & Mission Identification */}
      <Link href="/" className="topbar-brand">
        <div className="brand-glyph" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
          </svg>
        </div>
        <div className="brand-text">
          <div className="brand-name">
            {t("app.title")}
            <span className="brand-badge">{t("app.badge")}</span>
          </div>
          <div className="brand-sub">
            {t("app.subtitle")}
          </div>
        </div>
      </Link>

      {/* Primary Route Navigation Tabs (§1 Dashboard, §2 Forecast, §3 Advisory) */}
      <nav className="topbar-nav" aria-label="Core User Journey Navigation">
        <Link
          href="/dashboard"
          className={`topbar-nav-link ${isDashboardActive ? "active" : ""}`}
          aria-current={isDashboardActive ? "page" : undefined}
        >
          <span className="nav-step-badge">1</span>
          <span>{lang === "en" ? "Dashboard" : "ড্যাশবোর্ড"}</span>
        </Link>

        <Link
          href="/forecast"
          className={`topbar-nav-link ${isForecastActive ? "active" : ""}`}
          aria-current={isForecastActive ? "page" : undefined}
        >
          <span className="nav-step-badge">2</span>
          <span>{lang === "en" ? "Forecast & Analysis" : "পূর্বাভাস ও বিশ্লেষণ"}</span>
        </Link>

        <Link
          href="/advisory"
          className={`topbar-nav-link ${isAdvisoryActive ? "active" : ""}`}
          aria-current={isAdvisoryActive ? "page" : undefined}
        >
          <span className="nav-step-badge">3</span>
          <span>{lang === "en" ? "Harvest Advisory" : "ফসল কর্তন পরামর্শ"}</span>
        </Link>
      </nav>

      {/* Central Telemetry & Freshness Indicator */}
      <div className="topbar-center-status">
        <div
          className="status-pill"
          title="Hydrologic routing engine running on 30-min GPM IMERG cycle (Offline-ready with local static JSON)"
        >
          <div
            className="status-beacon"
            style={{
              background: isOnline ? "var(--green-400)" : "var(--amber-400)",
              boxShadow: isOnline
                ? "0 0 8px var(--green-400)"
                : "0 0 8px var(--amber-400)",
            }}
          />
          <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>
            {t("app.statusLabel")}
          </span>
          <strong
            style={{
              color: isOnline ? "var(--green-400)" : "var(--amber-400)",
              letterSpacing: "0.04em",
            }}
          >
            {isOnline
              ? t("app.statusReplay")
              : (lang === "en" ? "OFFLINE · CACHED TELEMETRY" : "অফলাইন · লোকাল ক্যাশ")}
          </strong>
        </div>

        <div className="status-pill" title="Replay timeline timestamp">
          <span style={{ color: "var(--cyan-400)", fontFamily: "var(--font-mono)", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "5px" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {currentDateStr} · {currentTimeStr} UTC
          </span>
        </div>
      </div>

      {/* Actions & Bilingual Switcher */}
      <div className="topbar-actions">
        {/* Language Segmented Toggle */}
        <div className="segmented-lang" role="radiogroup" aria-label="Display Language">
          <button
            className={`lang-option ${lang === "en" ? "active" : ""}`}
            onClick={() => setLang("en")}
            role="radio"
            aria-checked={lang === "en"}
            title="English"
          >
            {t("app.langEn")}
          </button>
          <button
            className={`lang-option ${lang === "bn" ? "active" : ""}`}
            onClick={() => setLang("bn")}
            role="radio"
            aria-checked={lang === "bn"}
            title="বাংলা (Bengali)"
          >
            {t("app.langBn")}
          </button>
        </div>

        {/* Advisory Bulletin Button */}
        <button
          className="btn-standard neu-raised"
          onClick={onOpenBulletin}
          title={lang === "en" ? "Generate Agricultural Advisory Bulletin" : "কৃষি বুলেটিন তৈরি করুন"}
          aria-label={t("app.advisoryBulletinBtn")}
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1 2-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          </svg>
          <span>{t("app.advisoryBulletinBtn")}</span>
        </button>

        {/* Model Architecture Info */}
        <button
          className="btn-icon neu-raised"
          onClick={onOpenModelInfo}
          title={lang === "en" ? "About SWOT Hydrologic Model Architecture" : "মডেল তথ্য"}
          aria-label={t("app.modelInfoBtn")}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </button>
      </div>
    </header>
  );
}
