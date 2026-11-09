"use client";

import { useState, useEffect, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "../hooks/useLocale";
import { useTelemetry } from "../context/TelemetryContext";
import HydroSenseLogo from "./HydroSenseLogo";
import { navTransitionTypes } from "../lib/navDirection";

/**
 * Positions a sliding highlight under the active child of `container`.
 * Writes CSS variables only (no React state), so moving it never re-renders.
 * The container must be `position: relative`; the indicator reads the variables.
 */
function placeIndicator(container, activeSelector) {
  if (!container) return;
  const active = container.querySelector(activeSelector);
  if (!active || active.offsetWidth === 0) {
    container.style.setProperty("--ind-o", "0");
    return;
  }
  container.style.setProperty("--ind-x", `${active.offsetLeft}px`);
  container.style.setProperty("--ind-y", `${active.offsetTop}px`);
  container.style.setProperty("--ind-w", `${active.offsetWidth}px`);
  container.style.setProperty("--ind-h", `${active.offsetHeight}px`);
  container.style.setProperty("--ind-o", "1");
}

function useSlidingIndicator(containerRef, activeSelector, deps) {
  const [animated, setAnimated] = useState(false);

  useLayoutEffect(() => {
    const container = containerRef.current;
    placeIndicator(container, activeSelector);
    // Enable transitions only after the first placement, so it never slides in from 0.
    const frame = requestAnimationFrame(() => setAnimated(true));

    if (!container || typeof ResizeObserver === "undefined") {
      return () => cancelAnimationFrame(frame);
    }
    // Fonts, language and viewport changes resize the tabs; keep the highlight glued to them.
    const observer = new ResizeObserver(() => placeIndicator(container, activeSelector));
    observer.observe(container);
    container.querySelectorAll("a, button").forEach((el) => observer.observe(el));
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return animated;
}

export default function AppHeader({
  currentDateStr,
  currentTimeStr,
  onOpenBulletin,
  onOpenModelInfo,
}) {
  const { lang, setLang, t, mounted } = useLocale();
  const { theme, toggleTheme } = useTelemetry();
  const pathname = usePathname();
  const [isOnline, setIsOnline] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pending, setPending] = useState(null);
  const mobileMenuButtonRef = useRef(null);
  const navRef = useRef(null);
  const langRef = useRef(null);

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

  const routeKey =
    pathname === "/" || pathname === "/dashboard"
      ? "dashboard"
      : pathname === "/forecast"
        ? "forecast"
        : pathname === "/advisory"
          ? "advisory"
          : pathname === "/trends"
            ? "trends"
            : null;

  // Optimistic: the highlight starts sliding on click, before the route has committed.
  // The pending choice is tied to the pathname it was made on, so it expires by itself
  // once navigation lands (or if the user stays on the same page).
  const activeKey = pending && pending.fromPath === pathname ? pending.key : routeKey;

  const isDashboardActive = activeKey === "dashboard";
  const isForecastActive = activeKey === "forecast";
  const isAdvisoryActive = activeKey === "advisory";
  const isTrendsActive = activeKey === "trends";

  const navAnimated = useSlidingIndicator(navRef, ".topbar-nav-link.active", [
    activeKey,
    lang,
    mounted,
    isMobileMenuOpen,
  ]);
  const langAnimated = useSlidingIndicator(langRef, ".lang-option.active", [lang, mounted, isMobileMenuOpen]);

  const choose = (key) => () => setPending({ key, fromPath: pathname });

  return (
    <header
      className={`app-topbar ${isMobileMenuOpen ? "topbar-mobile-menu-open" : ""}`}
      role="banner"
      data-ready={mounted ? "true" : "false"}
    >
      {/* Column 1: Brand & Regional Context */}
      <div className="topbar-left">
        <Link href="/" className="topbar-brand" transitionTypes={navTransitionTypes(pathname, "/")}>
          <div className="brand-glyph" aria-hidden="true">
            <HydroSenseLogo size={22} />
          </div>
          <div className="brand-text">
            <div className="brand-name">
              {t("app.title")}
              <span className="brand-badge">{t("app.badge")}</span>
            </div>
          </div>
        </Link>
      </div>

      {/* Column 2: Strictly Centered Page Shifter / Core Journey Tabs */}
      <nav
        id="topbar-navigation"
        ref={navRef}
        className={`topbar-center topbar-nav ${navAnimated ? "is-animated" : ""}`}
        aria-label={t("app.navAria")}
        onClick={closeMobileMenu}
      >
        <span className="nav-indicator" aria-hidden="true" />
        <Link
          href="/dashboard"
          transitionTypes={navTransitionTypes(pathname, "/dashboard")}
          className={`topbar-nav-link ${isDashboardActive ? "active" : ""}`}
          aria-current={routeKey === "dashboard" ? "page" : undefined}
          onClick={choose("dashboard")}
        >
          <span className="nav-step-badge">1</span>
          <span>{lang === "en" ? "Dashboard" : "ড্যাশবোর্ড"}</span>
        </Link>

        <Link
          href="/forecast"
          transitionTypes={navTransitionTypes(pathname, "/forecast")}
          className={`topbar-nav-link ${isForecastActive ? "active" : ""}`}
          aria-current={routeKey === "forecast" ? "page" : undefined}
          onClick={choose("forecast")}
        >
          <span className="nav-step-badge">2</span>
          <span>{lang === "en" ? "Forecast & Analysis" : "পূর্বাভাস ও বিশ্লেষণ"}</span>
        </Link>

        <Link
          href="/advisory"
          transitionTypes={navTransitionTypes(pathname, "/advisory")}
          className={`topbar-nav-link ${isAdvisoryActive ? "active" : ""}`}
          aria-current={routeKey === "advisory" ? "page" : undefined}
          onClick={choose("advisory")}
        >
          <span className="nav-step-badge">3</span>
          <span>{lang === "en" ? "Harvest Advisory" : "ফসল কর্তন পরামর্শ"}</span>
        </Link>
        <Link
          href="/trends"
          transitionTypes={navTransitionTypes(pathname, "/trends")}
          className={`topbar-nav-link ${isTrendsActive ? "active" : ""}`}
          aria-current={routeKey === "trends" ? "page" : undefined}
          onClick={choose("trends")}
        >
          <span className="nav-step-badge nav-step-badge--nasa" style={{ background: "var(--teal-primary, #0ea5e9)", color: "#0b1215", fontWeight: 800, padding: "0 5px", borderRadius: "4px" }}>
            NASA
          </span>
          <span>{lang === "en" ? "Trend Detective" : "ট্রেন্ড ডিটেকটিভ"}</span>
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
          <div
            ref={langRef}
            className={`segmented-lang ${langAnimated ? "is-animated" : ""}`}
            role="radiogroup"
            aria-label={t("app.displayLanguage")}
          >
            <span className="lang-indicator" aria-hidden="true" />
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
            <span className="theme-toggle-icon" aria-hidden="true">
              {theme === "mocha" ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 8h1a4 4 0 0 1 0 8h-1" />
                  <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
                  <path d="M7 2v3M11 2v3M15 2v3" />
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                </svg>
              )}
            </span>
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
