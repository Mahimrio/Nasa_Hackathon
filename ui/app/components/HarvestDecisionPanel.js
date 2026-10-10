"use client";

const FLAG_CONFIG = {
  GREEN: {
    statusKey: "NORMAL",
    labelEn: "NORMAL",
    labelBn: "স্বাভাবিক",
    icon: "✓",
    color: "#30E08A",
    orbClass: "NORMAL",
    descriptionEn: "Water level safely within channel storage capacity. Rice harvesting can proceed at standard agricultural schedule.",
    descriptionBn: "নদীর পানি বিপৎসীমার নিরাপদ নিচে রয়েছে। ধান কাটার স্বাভাবিক কার্যক্রম অব্যাহত রাখা যাবে।",
  },
  AMBER: {
    statusKey: "WATCH",
    labelEn: "WATCH",
    labelBn: "সতর্কতা",
    icon: "⚠",
    color: "#FFC45C",
    orbClass: "WATCH",
    descriptionEn: "Rising limb detected upstream in Meghalaya. Prepare labor, combine harvesters, and threshing yards for priority harvesting within 24-48 hours.",
    descriptionBn: "উজানে দ্রুত পানি বৃদ্ধি পাচ্ছে। আগামী ২৪-৪৮ ঘণ্টার মধ্যে পাকা ধান জরুরি ভিত্তিতে কাটার প্রস্তুতি গ্রহণ করুন।",
  },
  RED: {
    statusKey: "CRITICAL",
    labelEn: "CRITICAL",
    labelBn: "জরুরি অবস্থা",
    icon: "⛔",
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
}) {
  if (!current) return null;

  const flagConf = FLAG_CONFIG[current.harvest_flag] || FLAG_CONFIG.GREEN;
  const stage = current.modelled_stage;
  const stagePct = Math.min(100, Math.max(0, ((stage - 6.5) / (14.5 - 6.5)) * 100));
  const dangerPct = Math.min(100, Math.max(0, ((dangerLevel - 6.5) / (14.5 - 6.5)) * 100));
  const clearance = (dangerLevel - stage).toFixed(2);
  const isExceeded = stage >= dangerLevel;

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
            <div className="card-eyebrow">
              {lang === "en" ? "OPERATIONAL EARLY WARNING" : "অপারেশনাল সতর্কবার্তা"}
            </div>
            <div className="card-title">
              {lang === "en" ? "Harvest Decision Engine" : "ফসল কাটার সিদ্ধান্ত ইঞ্জিন"}
            </div>
          </div>
        </div>

        <span
          style={{
            fontSize: "11px",
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
          <span style={{ filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.5))" }}>
            {flagConf.icon}
          </span>
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
              boxShadow: `0 0 10px ${flagConf.color}88`,
            }}
          />
          <div
            className="stage-gauge-danger-marker"
            style={{ left: `${dangerPct}%` }}
            title={`Danger Level: ${dangerLevel}m`}
          />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: "4px", fontSize: "10px", color: "var(--text-muted)" }}>
          <span>6.5m (Base)</span>
          <span style={{ color: "var(--red-400)" }}>{dangerLevel}m (Danger)</span>
          <span>14.5m</span>
        </div>
      </div>

      {/* Hydrological Parameter Readout Table */}
      <div className="param-table">
        <div className="param-row">
          <span className="param-label">
            <span>📏</span>
            {lang === "en" ? "Modelled Stage" : "মডেল পানি স্তর"}
          </span>
          <span className="param-value" style={{ color: "var(--cyan-300)" }}>
            {stage.toFixed(2)} m PWD
          </span>
        </div>

        <div className="param-row">
          <span className="param-label">
            <span>⛔</span>
            {lang === "en" ? "Danger Level" : "বিপদসীমা"}
          </span>
          <span className="param-value" style={{ color: "var(--red-400)" }}>
            {dangerLevel.toFixed(2)} m PWD
          </span>
        </div>

        <div className="param-row">
          <span className="param-label">
            <span>🛡️</span>
            {lang === "en" ? "Safety Clearance" : "নিরাপদ ব্যবধান"}
          </span>
          <span className="param-value" style={{ color: isExceeded ? "var(--red-400)" : "var(--green-400)" }}>
            {isExceeded ? `+${Math.abs(clearance)} m EXCEEDED` : `${clearance} m buffer`}
          </span>
        </div>

        {currentGaugeLevel != null && (
          <div className="param-row">
            <span className="param-label">
              <span>★</span>
              {lang === "en" ? "BWDB Kanaighat (Observed)" : "BWDB পর্যবেক্ষণ স্তর"}
            </span>
            <span className="param-value" style={{ color: "var(--amber-400)" }}>
              {currentGaugeLevel.toFixed(2)} m PWD
            </span>
          </div>
        )}

        <div className="param-row">
          <span className="param-label">
            <span>🌧️</span>
            {lang === "en" ? "Rainfall (IMERG)" : "বৃষ্টিপাত (IMERG)"}
          </span>
          <span className="param-value">
            {current.imerg_map_mmh.toFixed(2)} mm/h
          </span>
        </div>

        <div className="param-row">
          <span className="param-label">
            <span>🌊</span>
            {lang === "en" ? "Routed Discharge (Q)" : "প্রবাহিত নিঃসরণ (Q)"}
          </span>
          <span className="param-value">
            {current.routed_q ? `${current.routed_q.toFixed(1)} m³/s` : "36.9 m³/s"}
          </span>
        </div>

        <div className="param-row">
          <span className="param-label">
            <span>⏱️</span>
            {lang === "en" ? "Wave Travel Time" : "ঢেউ পৌঁছানোর সময়"}
          </span>
          <span className="param-value">
            ~25.9 h
          </span>
        </div>

        {metrics && (
          <div className="param-row">
            <span className="param-label">
              <span>🛰️</span>
              {lang === "en" ? "SWOT Calibration Geometry" : "SWOT জ্যামিতি তারিখ"}
            </span>
            <span className="param-value" style={{ fontSize: "11px" }}>
              {metrics.swot_last_geometry_date}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
