"use client";

const FLAG_CONFIG = {
  GREEN: {
    statusKey: "NORMAL",
    labelEn: "NORMAL",
    labelBn: "স্বাভাবিক",
    color: "#30E08A",
    orbClass: "NORMAL",
    descriptionEn: "Water level safely within channel storage capacity. Rice harvesting can proceed at standard agricultural schedule.",
    descriptionBn: "নদীর পানি বিপৎসীমার নিরাপদ নিচে রয়েছে। ধান কাটার স্বাভাবিক কার্যক্রম অব্যাহত রাখা যাবে।",
  },
  AMBER: {
    statusKey: "WATCH",
    labelEn: "WATCH",
    labelBn: "সতর্কতা",
    color: "#FFC45C",
    orbClass: "WATCH",
    descriptionEn: "Rising limb detected upstream in Meghalaya. Prepare labor, combine harvesters, and threshing yards for priority harvesting within 24-48 hours.",
    descriptionBn: "উজানে দ্রুত পানি বৃদ্ধি পাচ্ছে। আগামী ২৪-৪৮ ঘণ্টার মধ্যে পাকা ধান জরুরি ভিত্তিতে কাটার প্রস্তুতি গ্রহণ করুন।",
  },
  RED: {
    statusKey: "CRITICAL",
    labelEn: "CRITICAL",
    labelBn: "জরুরি অবস্থা",
    color: "#FF647C",
    orbClass: "CRITICAL",
    descriptionEn: "Flash flood stage exceedance imminent (>13.20m PWD). Immediate emergency harvest of 80%+ mature Boro rice before dyke overtopping.",
    descriptionBn: "বিপৎসীমা (১৩.২০ মিটার) অতিক্রম আসন্ন! বাঁধ উপচে পড়ার পূর্বেই ৮০% পাকা ধান অবিলম্বে কেটে সুরক্ষিত স্থানে স্থানান্তর করুন।",
  },
};

export default function HarvestDecisionPanel({
  current,
  dangerLevel = 13.2,
  currentGaugeLevel,
  metrics,
  lang,
  selectedReach,
}) {
  if (!current) return null;

  const flagConf = FLAG_CONFIG[current.harvest_flag] || FLAG_CONFIG.GREEN;
  const stage = current.modelled_stage;
  const stagePct = Math.min(100, Math.max(0, ((stage - 6.5) / (14.5 - 6.5)) * 100));
  const dangerPct = Math.min(100, Math.max(0, ((dangerLevel - 6.5) / (14.5 - 6.5)) * 100));
  const clearance = (dangerLevel - stage).toFixed(2);
  const isExceeded = stage >= dangerLevel;
  const reachDisplayName = selectedReach
    ? lang === "en"
      ? selectedReach.name
      : selectedReach.name_bn
    : "Kanaighat";

  return (
    <section
      className="glass-panel card-padding decision-panel"
      aria-label={`Harvest Decision: ${flagConf.labelEn}`}
      aria-live="polite"
    >
      {/* Panel Header */}
      <div className="card-header-bar">
        <div className="card-title-group">
          <div className="card-icon" style={{ color: flagConf.color }} aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
          <div>
            <div className="card-title">
              {lang === "en" ? "Harvest Decision Engine" : "ফসল কাটার সিদ্ধান্ত ইঞ্জিন"}
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "1px" }}>
              {reachDisplayName}
            </div>
          </div>
        </div>

        <span
          style={{
            fontSize: "12px",
            fontFamily: "var(--font-mono)",
            color: flagConf.color,
            padding: "2px 8px",
            borderRadius: "4px",
            background: `rgba(${flagConf.color === "#30E08A" ? "48,224,138" : flagConf.color === "#FFC45C" ? "255,196,92" : "255,100,124"}, 0.12)`,
            border: `1px solid ${flagConf.color}44`,
          }}
        >
          {lang === "en" ? flagConf.labelEn : flagConf.labelBn}
        </span>
      </div>

      {/* Central Visual Orb and Status Title */}
      <div className="decision-hero-status">
        <div
          className={`decision-status-orb ${flagConf.orbClass}`}
          role="img"
          aria-label={`Status Flag: ${flagConf.labelEn}`}
        >
          {current.harvest_flag === "RED" ? (
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
          ) : current.harvest_flag === "AMBER" ? (
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          ) : (
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>

        <div className={`decision-status-title ${flagConf.orbClass}`}>
          {lang === "en" ? flagConf.labelEn : flagConf.labelBn}
        </div>

        <p className="decision-advisory-text">
          {lang === "en" ? current.advisory_en : current.advisory_bn}
        </p>
      </div>

      {/* Water Stage Gauge Progress Bar */}
      <div className="stage-gauge-bar-container">
        <div className="stage-gauge-header">
          <span>{lang === "en" ? "Water Level vs Danger Level" : "পানি স্তর বনাম বিপদসীমা"}</span>
          <span style={{ fontFamily: "var(--font-mono)", color: flagConf.color, fontWeight: 700 }}>
            {stage.toFixed(2)} m / {dangerLevel.toFixed(2)} m
          </span>
        </div>
        <div className="stage-gauge-track">
          <div
            className="stage-gauge-fill"
            style={{
              width: `${stagePct}%`,
              background: isExceeded
                ? "var(--gradient-critical)"
                : current.harvest_flag === "AMBER"
                ? "var(--gradient-watch)"
                : "var(--gradient-good)",
            }}
          />
          <div
            className="stage-gauge-danger-marker"
            style={{ left: `${dangerPct}%` }}
            title={`Danger Level: ${dangerLevel}m`}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", fontSize: "12px", color: "var(--text-secondary)" }}>
          <span>6.5m (Base)</span>
          <span style={{ color: "var(--red-400)" }}>{dangerLevel}m (Danger)</span>
          <span>14.5m</span>
        </div>
      </div>

      {/* Hydrological Parameter Readout Table */}
      <div className="param-table">
        <div className="param-row">
          <span className="param-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21.3 8.7l-6-6a1 1 0 0 0-1.4 0l-12 12a1 1 0 0 0 0 1.4l6 6a1 1 0 0 0 1.4 0l12-12a1 1 0 0 0 0-1.4z" />
              <line x1="7.5" y1="10.5" x2="10.5" y2="7.5" />
              <line x1="10.5" y1="13.5" x2="13.5" y2="10.5" />
              <line x1="13.5" y1="16.5" x2="16.5" y2="13.5" />
            </svg>
            {lang === "en" ? "Modelled Stage" : "মডেল পানি স্তর"}
          </span>
          <span className="param-value" style={{ color: "var(--cyan-300)" }}>
            {stage.toFixed(2)} m PWD
          </span>
        </div>

        <div className="param-row">
          <span className="param-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--red-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
            </svg>
            {lang === "en" ? "Danger Level" : "বিপদসীমা"}
          </span>
          <span className="param-value" style={{ color: "var(--red-400)" }}>
            {dangerLevel.toFixed(2)} m PWD
          </span>
        </div>

        <div className="param-row">
          <span className="param-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            {lang === "en" ? "Safety Clearance" : "নিরাপদ ব্যবধান"}
          </span>
          <span className="param-value" style={{ color: isExceeded ? "var(--red-400)" : "var(--green-400)" }}>
            {isExceeded ? `+${Math.abs(clearance)} m EXCEEDED` : `${clearance} m buffer`}
          </span>
        </div>

        {currentGaugeLevel != null && (
          <div className="param-row">
            <span className="param-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--amber-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              {lang === "en" ? "BWDB Kanaighat (Observed)" : "BWDB পর্যবেক্ষণ স্তর"}
            </span>
            <span className="param-value" style={{ color: "var(--amber-400)" }}>
              {currentGaugeLevel.toFixed(2)} m PWD
            </span>
          </div>
        )}

        <div className="param-row">
          <span className="param-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
              <line x1="8" y1="19" x2="8" y2="21" />
              <line x1="12" y1="19" x2="12" y2="21" />
              <line x1="16" y1="19" x2="16" y2="21" />
            </svg>
            {lang === "en" ? "Rainfall (IMERG)" : "বৃষ্টিপাত (IMERG)"}
          </span>
          <span className="param-value">
            {current.imerg_map_mmh.toFixed(2)} mm/h
          </span>
        </div>

        <div className="param-row">
          <span className="param-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
              <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
              <path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
            </svg>
            {lang === "en" ? "Routed Discharge (Q)" : "প্রবাহিত নিঃসরণ (Q)"}
          </span>
          <span className="param-value">
            {current.routed_q ? `${current.routed_q.toFixed(1)} m³/s` : "36.9 m³/s"}
          </span>
        </div>

        <div className="param-row">
          <span className="param-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {lang === "en" ? "Wave Travel Time (K)" : "ঢেউ পৌঁছানোর সময়"}
          </span>
          <span className="param-value" style={{ color: "var(--cyan-300)" }}>
            {metrics?.travel_time_h ? `~${metrics.travel_time_h.toFixed(1)} h` : "~25.9 h"}
          </span>
        </div>

        <div className="param-row">
          <span className="param-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            {lang === "en" ? "IMERG Timestamp" : "IMERG সময়সীমা"}
          </span>
          <span className="param-value" style={{ fontSize: "12px", fontFamily: "var(--font-mono)" }}>
            {current.timestamp.slice(0, 16).replace("T", " ")} UTC
          </span>
        </div>

        {metrics && (
          <div className="param-row">
            <span className="param-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
              </svg>
              {lang === "en" ? "SWOT Calibration Geometry" : "SWOT জ্যামিতি তারিখ"}
            </span>
            <span className="param-value" style={{ fontSize: "12px", fontFamily: "var(--font-mono)" }}>
              {metrics.swot_last_geometry_date}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
