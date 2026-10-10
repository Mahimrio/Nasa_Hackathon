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
          <span className="brand-glyph-icon">💧</span>
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
          <span style={{ color: "var(--text-secondary)", fontSize: "11.5px" }}>
            {lang === "en" ? "STATUS:" : "অবস্থা:"}
          </span>
          <strong style={{ color: "var(--green-400)", letterSpacing: "0.04em" }}>
            {lang === "en" ? "OPERATIONAL REPLAY" : "সক্রিয় সিমুলেশন"}
          </strong>
        </div>

        <div className="status-pill" title="Replay timeline timestamp">
          <span style={{ color: "var(--cyan-400)", fontFamily: "var(--font-mono)", fontSize: "11.5px" }}>
            🗓 {currentDateStr} · {currentTimeStr} UTC
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
        >
          <span aria-hidden="true">📋</span>
          <span>{lang === "en" ? "Advisory Bulletin" : "পরামর্শ বুলেটিন"}</span>
        </button>

        {/* Model Architecture Info */}
        <button
          className="btn-icon neu-raised"
          onClick={onOpenModelInfo}
          title={lang === "en" ? "About SWOT Hydrologic Model Architecture" : "মডেল তথ্য"}
          aria-label="Model Information"
        >
          <span aria-hidden="true">ℹ️</span>
        </button>
      </div>
    </header>
  );
}
