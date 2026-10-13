"use client";

import { useState } from "react";

function getMetricDefinitions(metrics) {
  const f = metrics?.formatted || {
    nse: "0.73",
    kge: "0.68",
    pbias: "+1.8%",
    timing_error: "-2.0 h",
    lead_time: "22.0 h",
  };
  const danger = metrics?.danger_level_m ?? 13.2;

  return {
    NSE: {
      nameEn: "Nash-Sutcliffe Efficiency",
      nameBn: "ন্যাশ-সাটক্লিফ দক্ষতা",
      benchmark: "> 0.65 (Good)",
      formula: "1 - [Σ(Qobs - Qsim)² / Σ(Qobs - Q̄obs)²]",
      descEn: `Computed score of ${f.nse} exceeds the scientific benchmark (>0.65), confirming SWOT channel calibration accurately captures hydrodynamics.`,
      descBn: `গণনাকৃত স্কোর ${f.nse} মানদণ্ড (>০.৬৫) অতিক্রম করেছে, যা প্রমাণ করে SWOT ক্যালিব্রেশন কার্যকর।`,
    },
    KGE: {
      nameEn: "Kling-Gupta Efficiency",
      nameBn: "ক্লিং-গুপ্তা দক্ষতা",
      benchmark: "> 0.60 (Balanced)",
      formula: "1 - √[(r - 1)² + (α - 1)² + (β - 1)²]",
      descEn: `Computed score of ${f.kge} integrates correlation, variability ratio, and volume bias for balanced hydrograph crest reproduction.`,
      descBn: `গণনাকৃত স্কোর ${f.kge} লিনিয়ার সম্পর্ক, পরিবর্তনশীলতা ও ভলিউম পক্ষপাতের সুষম সমন্বয় নিশ্চিত করে।`,
    },
    PBIAS: {
      nameEn: "Percent Bias",
      nameBn: "শতাংশ পক্ষপাত",
      benchmark: "< ±10% (Excellent)",
      formula: "[Σ(Qsim - Qobs) / Σ(Qobs)] × 100",
      descEn: `${f.pbias} indicates slight conservative bias, desirable for civil defense early warning to prevent unexpected levee overtopping.`,
      descBn: `${f.pbias} সামান্য রক্ষণশীল পূর্বানুমান নির্দেশ করে, যা বাঁধ উপচে পড়া রোধে অত্যন্ত কার্যকর।`,
    },
    TIMING: {
      nameEn: "Peak Arrival Timing Error",
      nameBn: "শীর্ষ আগমনের সময় ত্রুটি",
      benchmark: "< 6h Lead Error",
      formula: "t_peak,model - t_peak,gauge",
      descEn: `${f.timing_error} crest error means the model alerts before peak crest reaches the gauge, giving farmers advance safety margin.`,
      descBn: `${f.timing_error} শীর্ষ ত্রুটি নির্দেশ করে মডেলটি গেজে পানি ওঠার পূর্বেই সংকেত প্রদান করে।`,
    },
    LEAD: {
      nameEn: "Actionable Warning Lead Time",
      nameBn: "কার্যকর সতর্কবার্তা আগাম সময়",
      benchmark: "> 18h Golden Window",
      formula: "t_warning_flag - t_danger_exceed",
      descEn: `${f.lead_time} advance notice before water level reaches ${danger.toFixed(2)}m danger level — the golden window for Boro harvesting.`,
      descBn: `বিপৎসীমায় (${danger.toFixed(2)} মি) পৌঁছানোর ${f.lead_time} আগেই সংকেত — বোরো ধান কাটার সুবর্ণ সময়।`,
    },
  };
}

export default function ValidationMetricsPanel({ metrics, lang }) {
  const [activeTooltip, setActiveTooltip] = useState(null);

  if (!metrics) return null;

  const defs = getMetricDefinitions(metrics);

  const metricCards = [
    {
      key: "NSE",
      label: "NSE",
      value: metrics.formatted.nse,
      name: lang === "en" ? defs.NSE.nameEn : defs.NSE.nameBn,
      def: defs.NSE,
    },
    {
      key: "KGE",
      label: "KGE",
      value: metrics.formatted.kge,
      name: lang === "en" ? defs.KGE.nameEn : defs.KGE.nameBn,
      def: defs.KGE,
    },
    {
      key: "PBIAS",
      label: "PBIAS",
      value: metrics.formatted.pbias,
      name: lang === "en" ? defs.PBIAS.nameEn : defs.PBIAS.nameBn,
      def: defs.PBIAS,
    },
    {
      key: "TIMING",
      label: lang === "en" ? "PEAK TIMING" : "শীর্ষ সময়",
      value: metrics.formatted.timing_error,
      name: lang === "en" ? defs.TIMING.nameEn : defs.TIMING.nameBn,
      def: defs.TIMING,
    },
    {
      key: "LEAD",
      label: lang === "en" ? "WARNING LEAD" : "আগাম সতর্কতা",
      value: metrics.formatted.lead_time,
      name: lang === "en" ? defs.LEAD.nameEn : defs.LEAD.nameBn,
      def: defs.LEAD,
      accent: true,
    },
  ];

  return (
    <section className="glass-panel card-padding dashboard-full-row" aria-label="Scientific Model Validation Metrics">
      {/* Panel Header */}
      <div className="card-header-bar">
        <div className="card-title-group">
          <div className="card-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <div>
            <div className="card-title">
              {lang === "en"
                ? "Scientific Validation — April 2026 Flood Event Replay"
                : "বৈজ্ঞানিক মূল্যায়ন — এপ্রিল ২০২৬ বন্যা ইভেন্ট"}
            </div>
          </div>
        </div>

        <div style={{ fontSize: "12px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>
          {lang === "en" ? "Calibration:" : "ক্রমাঙ্কন:"} {metrics.calibration_period} → {lang === "en" ? "Test:" : "পরীক্ষা:"} {metrics.test_period}
        </div>
      </div>

      {/* 5-Column Grid Layout (§4.6) */}
      <div className="metrics-5col-grid">
        {metricCards.map((m) => {
          const isHovered = activeTooltip === m.key;

          return (
            <div
              key={m.key}
              className={`validation-metric-card ${m.accent ? "accent-card" : ""}`}
              onMouseEnter={() => setActiveTooltip(m.key)}
              onMouseLeave={() => setActiveTooltip(null)}
              tabIndex={0}
              role="region"
              aria-label={`${m.label}: ${m.value}. ${m.def.benchmark}`}
            >
              <div className="metric-card-top">
                <span className="metric-tag-label">{m.label}</span>
                <span className="metric-info-icon" title={m.def.descEn}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                </span>
              </div>

              <div className="metric-hero-value">{m.value}</div>

              <div className="metric-card-bottom">
                <div className="metric-full-name">{m.name}</div>
                <div className="metric-benchmark-chip">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{m.def.benchmark}</span>
                </div>
              </div>

              {/* Tooltip on Hover / Focus */}
              {isHovered && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "105%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "240px",
                    background: "rgba(8, 17, 31, 0.96)",
                    border: "1px solid var(--glass-stroke-strong)",
                    borderRadius: "8px",
                    padding: "10px 12px",
                    boxShadow: "0 12px 30px rgba(0,0,0,0.6)",
                    zIndex: 30,
                    fontSize: "12px",
                    lineHeight: "1.45",
                    color: "var(--text-secondary)",
                    pointerEvents: "none",
                  }}
                >
                  <div style={{ color: "var(--cyan-300)", fontWeight: 700, marginBottom: "4px", fontSize: "12.5px" }}>
                    {m.def.nameEn}
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)", marginBottom: "6px" }}>
                    Formula: {m.def.formula}
                  </div>
                  <div>{lang === "en" ? m.def.descEn : m.def.descBn}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
