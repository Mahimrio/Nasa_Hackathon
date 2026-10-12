"use client";

import { useState, useEffect } from "react";

export default function AppHeader({
  lang,
  setLang,
  currentDateStr,
  currentTimeStr,
  onOpenBulletin,
  onOpenModelInfo,
}) {
  const [liveUtc, setLiveUtc] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveUtc(
        now.toISOString().slice(11, 19) + " UTC"
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="app-topbar" role="banner">
      {/* Brand & Mission Identification */}
      <div className="topbar-brand">
        <div className="brand-glyph" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
          </svg>
        </div>
        <div className="brand-text">
          <div className="brand-name">
            HydroSense
            <span className="brand-badge">SWOT</span>
          </div>
          <div className="brand-sub">
            {lang === "en"
              ? "Haor Basin Flood Early Warning System"
              : "হাওর অববাহিকা বন্যা আগাম সতর্কবার্তা"}
          </div>
        </div>
      </div>

      {/* Central Telemetry & Freshness Indicator */}
      <div className="topbar-center-status">
        <div className="status-pill" title="Hydrologic routing engine running on 30-min GPM IMERG cycle">
          <div className="status-beacon" />
          <span style={{ color: "var(--text-secondary)", fontSize: "12px" }}>
            {lang === "en" ? "STATUS:" : "অবস্থা:"}
          </span>
          <strong style={{ color: "var(--green-400)", letterSpacing: "0.04em" }}>
            {lang === "en" ? "OPERATIONAL REPLAY" : "সক্রিয় সিমুলেশন"}
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
            EN
          </button>
          <button
            className={`lang-option ${lang === "bn" ? "active" : ""}`}
            onClick={() => setLang("bn")}
            role="radio"
            aria-checked={lang === "bn"}
            title="বাংলা (Bengali)"
          >
            বাংলা
          </button>
        </div>

        {/* Advisory Bulletin Button */}
        <button
          className="btn-standard neu-raised"
          onClick={onOpenBulletin}
          title={lang === "en" ? "Generate Agricultural Advisory Bulletin" : "কৃষি বুলেটিন তৈরি করুন"}
          aria-label="Generate Agricultural Advisory Bulletin"
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
            <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
          </svg>
          <span>{lang === "en" ? "Advisory Bulletin" : "পরামর্শ বুলেটিন"}</span>
        </button>

        {/* Model Architecture Info */}
        <button
          className="btn-icon neu-raised"
          onClick={onOpenModelInfo}
          title={lang === "en" ? "About SWOT Hydrologic Model Architecture" : "মডেল তথ্য"}
          aria-label="Model Information"
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
