"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "../hooks/useLocale";
import { useTelemetry } from "../context/TelemetryContext";

export default function AppHeader({
  currentDateStr,
  currentTimeStr,
  onOpenBulletin,
  onOpenModelInfo,
}) {
  const { lang, setLang, t } = useLocale();
  const { theme, toggleTheme } = useTelemetry();
  const pathname = usePathname();
  const [isOnline, setIsOnline] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuButtonRef = useRef(null);

  useEffect(() => {
    const updateOnline = () => {
      if (typeof navigator !== "undefined") {
        setIsOnline(navigator.onLine);
      }
    };
    updateOnline();
    window.addEventListener("online", updateOnline);
    window.addEventListener("offline", updateOnline);

    return () => {
      window.removeEventListener("online", updateOnline);
      window.removeEventListener("offline", updateOnline);
    };
  }, []);

  useEffect(() => {
    if (!isMobileMenuOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsMobileMenuOpen(false);
        mobileMenuButtonRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileMenuOpen]);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const isDashboardActive = pathname === "/" || pathname === "/dashboard";
  const isForecastActive = pathname === "/forecast";
  const isAdvisoryActive = pathname === "/advisory";
  const isTrendsActive = pathname === "/trends";

  return (
    <header className={`app-topbar ${isMobileMenuOpen ? "topbar-mobile-menu-open" : ""}`} role="banner">
      {/* Column 1: Brand & Regional Context */}
      <div className="topbar-left">
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
            <div className="brand-title">
              {t("contextBar.title")}
              <span className="brand-region-badge">{t("contextBar.haorBasinBadge")}</span>
            </div>
            <div className="brand-tagline">
              {t("contextBar.subtitle")}
            </div>
          </div>
        </Link>
      </div>

      {/* Column 2: Strictly Centered Page Shifter / Core Journey Tabs */}
      <nav
        id="topbar-navigation"
        className="topbar-center topbar-nav"
        aria-label={t("app.navAria")}
        onClick={closeMobileMenu}
      >
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
        <Link href="/trends" className={`topbar-nav-link ${isTrendsActive ? "active" : ""}`} aria-current={isTrendsActive ? "page" : undefined}>
          <span>{lang === "en" ? "Trend Explorer" : "প্রবণতা"}</span>
        </Link>
      </nav>

      {/* Column 3: Live Replay Telemetry + Language + Quick Bulletin CTA + Model Info */}
      <div id="topbar-controls" className="topbar-right">
        {/* Central Telemetry & Freshness Indicator */}
        <div className="topbar-status-wrapper topbar-center-status">
          <div
            className="status-pill status-pill-replay"
            title={
              lang === "en"
                ? "Hydrologic routing engine running on 30-min GPM IMERG cycle (Offline-ready with local static JSON)"
                : "৩০ মিনিটের GPM IMERG চক্রে হাইড্রোলজিক রাউটিং ইঞ্জিন (লোকাল স্ট্যাটিক JSON সহ অফলাইন-রেডি)"
            }
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
            <div className="status-stack">
              <span className="status-kicker">
                <span className="sr-only">{t("app.statusLabel")}</span>
                <strong
                  style={{
                    color: isOnline ? "var(--green-400)" : "var(--amber-400)",
                  }}
                >
                  {isOnline
                    ? t("app.statusReplay")
                    : (lang === "en" ? "OFFLINE · CACHED TELEMETRY" : "অফলাইন · লোকাল ক্যাশ")}
                </strong>
              </span>
              <span className="status-timestamp" title={t("app.replayTimestampTitle")}>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                {currentDateStr} · {currentTimeStr} UTC
              </span>
            </div>
          </div>
        </div>

        {/* Actions & Bilingual Switcher */}
        <div className="topbar-actions">
          {/* Language Segmented Toggle */}
          <div className="segmented-lang" role="radiogroup" aria-label={t("app.displayLanguage")}>
            <button
              type="button"
              className={`lang-option ${lang === "en" ? "active" : ""}`}
              onClick={() => {
                setLang("en");
                closeMobileMenu();
              }}
              role="radio"
              aria-checked={lang === "en"}
              title="English"
              lang="en"
            >
              {t("app.langEn")}
            </button>
            <button
              type="button"
              className={`lang-option ${lang === "bn" ? "active" : ""}`}
              onClick={() => {
                setLang("bn");
                closeMobileMenu();
              }}
              role="radio"
              aria-checked={lang === "bn"}
              title="বাংলা (Bengali)"
              lang="bn"
            >
              {t("app.langBn")}
            </button>
          </div>

          {/* Theme Switcher: Mocha Earth vs Light Field */}
          <button
            type="button"
            className="theme-toggle-btn"
            onClick={() => {
              toggleTheme();
              closeMobileMenu();
            }}
            title={
              theme === "mocha"
                ? (lang === "en" ? "Switch to Light Field Theme" : "লাইট ফিল্ড থিমে পরিবর্তন করুন")
                : (lang === "en" ? "Switch to Mocha Earth Theme" : "মোখা আর্থ থিমে পরিবর্তন করুন")
            }
            aria-label={theme === "mocha" ? "Switch to Light theme" : "Switch to Mocha theme"}
          >
            <span className="theme-toggle-icon" aria-hidden="true">{theme === "mocha" ? "☕" : "☀️"}</span>
            <span className="theme-toggle-label">
              {theme === "mocha" ? (lang === "en" ? "Mocha" : "মোখা") : (lang === "en" ? "Light" : "লাইট")}
            </span>
          </button>

          {/* Advisory Bulletin Button */}
          <button
            className="btn-standard neu-raised topbar-advisory-btn"
            onClick={() => {
              closeMobileMenu();
              onOpenBulletin();
            }}
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
            onClick={() => {
              closeMobileMenu();
              onOpenModelInfo();
            }}
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
      </div>

      <button
        ref={mobileMenuButtonRef}
        type="button"
        className="topbar-mobile-toggle"
        aria-label={isMobileMenuOpen ? t("app.closeMenu") : t("app.openMenu")}
        aria-expanded={isMobileMenuOpen}
        aria-controls="topbar-navigation topbar-controls"
        onClick={() => setIsMobileMenuOpen((open) => !open)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {isMobileMenuOpen ? (
            <path d="M18 6 6 18M6 6l12 12" />
          ) : (
            <path d="M4 7h16M4 12h16M4 17h16" />
          )}
        </svg>
      </button>
    </header>
  );
}
