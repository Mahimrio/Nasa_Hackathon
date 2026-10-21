"use client";

import { useLocale } from "../hooks/useLocale";

export default function HarvestAdvisorySection({
  current,
  dangerLevel = 13.2,
  metrics,
  selectedReach,
  onOpenBulletin,
}) {
  const { lang, t, formatNumber } = useLocale();

  if (!current) return null;

  const flag = current.harvest_flag || "GREEN";
  const stage = current.modelled_stage;
  const isDanger = stage >= dangerLevel;
  const clearance = (dangerLevel - stage).toFixed(2);
  const rain = current.imerg_map_mmh || 0;

  const reachName = selectedReach
    ? lang === "en"
      ? selectedReach.name
      : selectedReach.name_bn
    : (lang === "en" ? "Surma Upper Reach (SW108 Kanaighat)" : "সুরমা আপার রিচ (SW১০৮ কানাইঘাট)");

  const recTitle = flag === "RED"
    ? t("advisorySection.actionHarvestUrgently")
    : flag === "AMBER"
    ? t("advisorySection.actionPrepareToHarvest")
    : t("advisorySection.actionContinueMonitoring");

  const flagColor = flag === "RED"
    ? "var(--red-400)"
    : flag === "AMBER"
    ? "var(--amber-400)"
    : "var(--green-400)";

  const flagBg = flag === "RED"
    ? "var(--red-bg)"
    : flag === "AMBER"
    ? "var(--amber-bg)"
    : "var(--green-bg)";

  const affectedAreas = [
    t("advisorySection.affectedArea1"),
    t("advisorySection.affectedArea2"),
    t("advisorySection.affectedArea3"),
    t("advisorySection.affectedArea4"),
    t("advisorySection.affectedArea5"),
    t("advisorySection.affectedArea6"),
  ];

  return (
    <section
      id="journey-harvest-advisory"
      className="glass-panel card-padding dashboard-full-row harvest-advisory-section"
      aria-label={t("advisorySection.sectionTitle")}
    >
      {/* Section Header */}
      <div className="card-header-bar" style={{ marginBottom: "16px" }}>
        <div className="card-title-group">
          <div
            className="card-icon"
            style={{ color: flagColor, background: flagBg, borderColor: `${flagColor}44` }}
            aria-hidden="true"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="brand-badge" style={{ fontSize: "11px", background: "rgba(56, 189, 248, 0.15)", color: "var(--cyan-300)" }}>
                {t("advisorySection.sectionBadge")}
              </span>
              <h2 className="card-title" style={{ fontSize: "18px" }}>
                {t("advisorySection.sectionTitle")}
              </h2>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
              {t("advisorySection.sectionSubtitle")}
            </p>
          </div>
        </div>

        <button
          className="btn-standard btn-primary"
          onClick={onOpenBulletin}
          style={{ minHeight: "44px", padding: "0 18px", fontSize: "13px", fontWeight: 700 }}
          aria-label={t("advisorySection.openBulletinBtn")}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          <span>{t("advisorySection.openBulletinBtn")}</span>
        </button>
      </div>

      {/* Top Banner: Location Specific Recommendation */}
      <div
        className="advisory-recommendation-hero"
        style={{
          background: flagBg,
          border: `1.5px solid ${flagColor}66`,
        }}
      >
        <div className="advisory-hero-flag-icon" style={{ color: flagColor }}>
          {flag === "RED" ? (
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          ) : flag === "AMBER" ? (
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          ) : (
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", fontWeight: 700 }}>
            {t("advisorySection.recommendationTitle")} · {reachName}
          </div>
          <div style={{ fontSize: "22px", fontWeight: 800, color: flagColor, marginTop: "2px" }}>
            {recTitle}
          </div>
          <div style={{ fontSize: "13.5px", color: "var(--text-primary)", marginTop: "4px", lineHeight: "1.5" }}>
            {lang === "en" ? current.advisory_en : current.advisory_bn}
          </div>
        </div>

        <div className="advisory-hero-stats">
          <div className="advisory-stat-box">
            <span className="stat-label">{lang === "en" ? "Modelled Stage" : "মডেল পানি স্তর"}</span>
            <span className="stat-val" style={{ color: "var(--cyan-300)" }}>
              {formatNumber(stage.toFixed(2))} m PWD
            </span>
          </div>
          <div className="advisory-stat-box">
            <span className="stat-label">{lang === "en" ? "Danger Clearance" : "বিপদসীমা ব্যবধান"}</span>
            <span className="stat-val" style={{ color: isDanger ? "var(--red-400)" : "var(--green-400)" }}>
              {isDanger ? `+${formatNumber((stage - dangerLevel).toFixed(2))}m` : `${formatNumber(clearance)}m`}
            </span>
          </div>
          <div className="advisory-stat-box">
            <span className="stat-label">{lang === "en" ? "Lead Window" : "সতর্কতা সময়"}</span>
            <span className="stat-val" style={{ color: "var(--amber-400)" }}>
              {formatNumber("22.0")} h
            </span>
          </div>
        </div>
      </div>

      {/* Grid: 2 Columns -> Why Triggered + Warning Window & Affected Areas */}
      <div className="advisory-evidence-grid">
        {/* Left Column: Why this recommendation was triggered */}
        <div className="advisory-subcard glass-panel" style={{ padding: "18px" }}>
          <h3 className="advisory-subcard-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--cyan-400)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            {t("advisorySection.whyTriggeredTitle")}
          </h3>

          <div className="advisory-triggers-list">
            <div className="trigger-item">
              <span className="trigger-dot active" aria-hidden="true" />
              <div>
                <strong>{t("advisorySection.trigger1Title")}</strong>
                <p>{t("advisorySection.trigger1Desc")}</p>
                <div className="trigger-metric-tag">
                  {lang === "en" ? "Current Rate:" : "বর্তমান মাত্রা:"} <strong>{formatNumber(rain.toFixed(2))} mm/h</strong>
                </div>
              </div>
            </div>

            <div className="trigger-item">
              <span className="trigger-dot active" aria-hidden="true" />
              <div>
                <strong>{t("advisorySection.trigger2Title")}</strong>
                <p>{t("advisorySection.trigger2Desc")}</p>
                <div className="trigger-metric-tag">
                  {lang === "en" ? "Calibrated Roughness:" : "ক্যালিব্রেটকৃত রুক্ষতা:"} <strong>Manning n = {formatNumber("0.035")}</strong> · {lang === "en" ? "Lead:" : "লিড:"} <strong>~{formatNumber("22.0")} h</strong>
                </div>
              </div>
            </div>

            <div className="trigger-item">
              <span className={`trigger-dot ${isDanger ? "danger" : "warning"}`} aria-hidden="true" />
              <div>
                <strong>{t("advisorySection.trigger3Title")}</strong>
                <p>{t("advisorySection.trigger3Desc")}</p>
                <div className="trigger-metric-tag">
                  {lang === "en" ? "Danger Threshold:" : "বিপদসীমা মান:"} <strong>{formatNumber(dangerLevel.toFixed(2))} m PWD</strong> ({isDanger ? (lang === "en" ? "BREACHED" : "অতিক্রম") : (lang === "en" ? "APPROACHING" : "আসন্ন")})
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Estimated Warning Window & Affected Haor Areas */}
        <div className="advisory-subcard glass-panel" style={{ padding: "18px" }}>
          <h3 className="advisory-subcard-title">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--amber-400)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {t("advisorySection.warningWindowTitle")}
          </h3>

          {/* Golden Window Callout */}
          <div className="golden-window-banner">
            <div className="golden-window-hero-val">{formatNumber("22.0")} {lang === "en" ? "HOURS" : "ঘণ্টা"}</div>
            <div className="golden-window-hero-label">{t("advisorySection.goldenWindowLabel")}</div>
          </div>

          {/* Affected Areas List */}
          <div style={{ marginTop: "16px" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "8px" }}>
              {t("advisorySection.affectedAreasTitle")}
            </div>
            <div className="affected-areas-tags">
              {affectedAreas.map((area, i) => (
                <span key={i} className="affected-area-chip">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {area}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Practical Action Directives: Farmers vs Agricultural Officers */}
      <div className="advisory-action-split-grid">
        {/* Farmers Column */}
        <div className="advisory-action-box farmer-box">
          <div className="action-box-header">
            <div className="action-box-icon" style={{ color: "var(--cyan-300)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <h4 className="action-box-title">{t("advisorySection.farmerDirectivesTitle")}</h4>
          </div>
          <ul className="action-checklist">
            <li>
              <span className="check-bullet" aria-hidden="true">✓</span>
              <span>{t("advisorySection.farmerStep1")}</span>
            </li>
            <li>
              <span className="check-bullet" aria-hidden="true">✓</span>
              <span>{t("advisorySection.farmerStep2")}</span>
            </li>
            <li>
              <span className="check-bullet" aria-hidden="true">✓</span>
              <span>{t("advisorySection.farmerStep3")}</span>
            </li>
          </ul>
        </div>

        {/* Agricultural Officers Column */}
        <div className="advisory-action-box officer-box">
          <div className="action-box-header">
            <div className="action-box-icon" style={{ color: "var(--amber-400)" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <h4 className="action-box-title">{t("advisorySection.officerDirectivesTitle")}</h4>
          </div>
          <ul className="action-checklist">
            <li>
              <span className="check-bullet officer" aria-hidden="true">✓</span>
              <span>{t("advisorySection.officerStep1")}</span>
            </li>
            <li>
              <span className="check-bullet officer" aria-hidden="true">✓</span>
              <span>{t("advisorySection.officerStep2")}</span>
            </li>
            <li>
              <span className="check-bullet officer" aria-hidden="true">✓</span>
              <span>{t("advisorySection.officerStep3")}</span>
            </li>
            <li>
              <span className="check-bullet officer" aria-hidden="true">✓</span>
              <span>{t("advisorySection.officerStep4")}</span>
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
