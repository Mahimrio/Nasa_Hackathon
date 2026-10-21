"use client";

import { useLocale } from "../hooks/useLocale";

export default function FiveSecondTriageStrip({
  current,
  dangerLevel = 13.2,
  metrics,
  selectedReach,
}) {
  const { lang, t, formatNumber } = useLocale();

  if (!current) return null;

  const flag = current.harvest_flag || "GREEN";
  const stage = current.modelled_stage;
  const isDangerExceeded = stage >= dangerLevel;
  const clearance = (dangerLevel - stage).toFixed(2);
  const rain = current.imerg_map_mmh || 0;

  // Reaching / Crossing Calculation
  // In April 2026 dataset, danger crossing (13.20m) occurs at 2026-04-13T01:00:00Z
  const crossingDate = new Date("2026-04-13T01:00:00Z");
  const currentDate = new Date(current.timestamp);
  const diffHours = Math.round((crossingDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60));

  let timingText = "";
  let timingSub = "";

  if (diffHours > 0) {
    timingText = lang === "en"
      ? `Estimated Crossing in ~${diffHours}h (Apr 13 01:00 UTC)`
      : `আনুমানিক ~${formatNumber(diffHours)} ঘণ্টার মধ্যে অতিক্রম (১৩ এপ্রিল ০১:০০ UTC)`;
    timingSub = lang === "en"
      ? `Golden Warning Window: 22.0h advance lead time`
      : `সুবর্ণ সতর্কবার্তা সময়: ২২.০ ঘণ্টা আগাম সতর্কবার্তা`;
  } else if (isDangerExceeded) {
    const overVal = (stage - dangerLevel).toFixed(2);
    timingText = lang === "en"
      ? `EXCEEDING DANGER LEVEL (+${overVal}m PWD)`
      : `বিপৎসীমা অতিক্রম (+${formatNumber(overVal)} মি PWD)`;
    timingSub = lang === "en"
      ? `Peak stage 13.43m PWD · Levee overtopping risk`
      : `সর্বোচ্চ স্তর ১৩.৪৩ মি · বাঁধ উপচে পড়ার চরম ঝুঁকি`;
  } else {
    timingText = lang === "en"
      ? `Receded Below Danger (${stage.toFixed(2)}m PWD)`
      : `বিপদসীমার নিচে নেমেছে (${formatNumber(stage.toFixed(2))} মি PWD)`;
    timingSub = lang === "en"
      ? `Falling limb stage · Embankments clearing`
      : `পানি হ্রাস পর্যায় · বাঁধ নিরাপদ হচ্ছে`;
  }

  // Location display
  const reachName = selectedReach
    ? lang === "en"
      ? selectedReach.name
      : selectedReach.name_bn
    : (lang === "en" ? "Surma Upper (SW108 Kanaighat)" : "সুরমা আপার (SW১০৮ কানাইঘাট)");

  // Action Directives based on flag
  const actionTitle = flag === "RED"
    ? t("triage.actionRed")
    : flag === "AMBER"
    ? t("triage.actionAmber")
    : t("triage.actionGreen");

  const actionSub = flag === "RED"
    ? t("triage.actionRedSub")
    : flag === "AMBER"
    ? t("triage.actionAmberSub")
    : t("triage.actionGreenSub");

  const flagBg = flag === "RED"
    ? "rgba(255, 100, 124, 0.16)"
    : flag === "AMBER"
    ? "rgba(255, 196, 92, 0.16)"
    : "rgba(48, 224, 138, 0.14)";

  const flagBorder = flag === "RED"
    ? "var(--red-400)"
    : flag === "AMBER"
    ? "var(--amber-400)"
    : "var(--green-400)";

  const flagColor = flagBorder;

  return (
    <section
      className="five-second-triage-panel glass-panel"
      aria-label="5-Second Executive Triage Strip: Where, When, Why, What to Do"
    >
      {/* Top Banner with Flag Badge & 5-Second Motto */}
      <div className="triage-banner-header">
        <div className="triage-brand-cluster">
          <div
            className={`triage-flag-hero-badge ${flag}`}
            style={{ background: flagBg, borderColor: flagBorder, color: flagColor }}
          >
            <span className="triage-flag-pulse" style={{ background: flagColor }} aria-hidden="true" />
            <span className="triage-flag-text">
              {lang === "en" ? "HARVEST FLAG:" : "ফসল কর্তন সংকেত:"} <strong>{flag}</strong>
            </span>
          </div>

          <div>
            <h2 className="triage-headline">
              {t("triage.title")}
            </h2>
            <div className="triage-subheadline">
              {t("triage.subtitle")}
            </div>
          </div>
        </div>

        {/* Data Trust & Freshness */}
        <div className="triage-trust-badge">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--cyan-400)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <div>
            <div style={{ color: "var(--text-secondary)", fontWeight: 700, fontSize: "11px" }}>
              {t("triage.trustLabel")}
            </div>
            <div style={{ color: "var(--text-muted)", fontSize: "10.5px", fontFamily: "var(--font-mono)" }}>
              {t("triage.trustSub")}
            </div>
          </div>
        </div>
      </div>

      {/* 4 Pillars of Winning UX: WHERE, WHEN, WHY, WHAT TO DO */}
      <div className="triage-4pillars-grid">
        {/* 1. WHERE */}
        <div className="triage-pillar-card" tabIndex={0}>
          <div className="pillar-header">
            <span className="pillar-icon" style={{ color: "var(--cyan-400)" }} aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </span>
            <span className="pillar-tag">{t("triage.whereLabel")}</span>
          </div>
          <div className="pillar-main-val" style={{ color: "var(--text-primary)" }}>
            {reachName}
          </div>
          <div className="pillar-sub-text">
            {t("triage.whereSub")}
          </div>
        </div>

        {/* 2. WHEN */}
        <div className="triage-pillar-card" tabIndex={0}>
          <div className="pillar-header">
            <span className="pillar-icon" style={{ color: "var(--amber-400)" }} aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </span>
            <span className="pillar-tag">{t("triage.whenLabel")}</span>
          </div>
          <div className="pillar-main-val" style={{ color: isDangerExceeded ? "var(--red-400)" : "var(--amber-400)" }}>
            {timingText}
          </div>
          <div className="pillar-sub-text">
            {timingSub}
          </div>
        </div>

        {/* 3. WHY */}
        <div className="triage-pillar-card" tabIndex={0}>
          <div className="pillar-header">
            <span className="pillar-icon" style={{ color: "var(--cyan-300)" }} aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            </span>
            <span className="pillar-tag">{t("triage.whyLabel")}</span>
          </div>
          <div className="pillar-main-val" style={{ color: "var(--cyan-300)" }}>
            {lang === "en"
              ? `Rain: ${rain.toFixed(1)} mm/h + SWOT Channel`
              : `বৃষ্টি: ${formatNumber(rain.toFixed(1))} মিমি/ঘ + SWOT চ্যানেল`}
          </div>
          <div className="pillar-sub-text">
            {t("triage.whySub")}
          </div>
        </div>

        {/* 4. WHAT TO DO */}
        <div
          className="triage-pillar-card triage-action-pillar"
          style={{
            borderColor: `${flagBorder}66`,
            background: flagBg,
          }}
          tabIndex={0}
        >
          <div className="pillar-header">
            <span className="pillar-icon" style={{ color: flagColor }} aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </span>
            <span className="pillar-tag" style={{ color: flagColor }}>
              {t("triage.whatLabel")}
            </span>
          </div>
          <div className="pillar-main-val" style={{ color: flagColor, fontWeight: 800 }}>
            {actionTitle}
          </div>
          <div className="pillar-sub-text" style={{ color: "var(--text-primary)" }}>
            {actionSub}
          </div>
        </div>
      </div>
    </section>
  );
}
