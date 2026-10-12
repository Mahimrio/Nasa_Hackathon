"use client";

import { useState } from "react";

const METRIC_DEFINITIONS = {
  NSE: {
    nameEn: "Nash-Sutcliffe Efficiency",
    nameBn: "ন্যাশ-সাটক্লিফ দক্ষতা",
    benchmark: "> 0.65 (Good)",
    formula: "1 - [Σ(Qobs - Qsim)² / Σ(Qobs - Q̄obs)²]",
    descEn: "Standard hydrological goodness-of-fit score. 0.74 confirms the SWOT-calibrated Manning's roughness accurately models channel hydrodynamics compared to BWDB gauge observations.",
    descBn: "স্ট্যান্ডার্ড হাইড্রোলজিক্যাল ফিট স্কোর। ০.৭৪ মান নির্দেশ করে যে SWOT ক্যালিব্রেশন কার্যকরভাবে নদীর স্তর মডেল করতে সক্ষম।",
  },
  KGE: {
    nameEn: "Kling-Gupta Efficiency",
    nameBn: "ক্লিং-গুপ্তা দক্ষতা",
    benchmark: "> 0.60 (Balanced)",
    formula: "1 - √[(r - 1)² + (α - 1)² + (β - 1)²]",
    descEn: "Integrates linear correlation (r), variability ratio (α), and volume bias (β). 0.68 indicates well-balanced hydrograph shape and peak discharge timing.",
    descBn: "লিনিয়ার সম্পর্ক, পরিবর্তনশীলতার অনুপাত এবং ভলিউম পক্ষপাতের সুষম সমন্বয়। ০.৬৮ নির্দেশ করে শীর্ষ প্রবাহের আকার নির্ভরযোগ্য।",
  },
  PBIAS: {
    nameEn: "Percent Bias",
    nameBn: "শতাংশ পক্ষপাত",
    benchmark: "< ±10% (Excellent)",
    formula: "[Σ(Qsim - Qobs) / Σ(Qobs)] × 100",
    descEn: "+1.8% indicates slight conservative over-prediction, desirable for civil defense early warning to prevent unexpected overtopping.",
    descBn: "+১.৮% সামান্য রক্ষণশীল পূর্বানুমান নির্দেশ করে, যা সতর্কবার্তার ক্ষেত্রে বাঁধ উপচে পড়া রোধে সহায়ক।",
  },
  TIMING: {
    nameEn: "Peak Arrival Timing Error",
    nameBn: "শীর্ষ আগমনের সময় ত্রুটি",
    benchmark: "< 6h Lead Error",
    formula: "t_peak,model - t_peak,gauge",
    descEn: "-5.5h error means model predicts the flash flood crest 5.5 hours before gauge observations, giving farmers a vital early warning safety margin.",
    descBn: "-৫.৫ ঘণ্টার ত্রুটি অর্থ মডেলটি প্রকৃত শীর্ষ পৌঁছানোর সাড়ে ৫ ঘণ্টা আগেই সংকেত দেয়, যা কৃষকদের ফসল রক্ষার অতিরিক্ত সময় দেয়।",
  },
  LEAD: {
    nameEn: "Actionable Warning Lead Time",
    nameBn: "কার্যকর সতর্কবার্তা আগাম সময়",
    benchmark: "> 18h Golden Window",
    formula: "t_warning_flag - t_danger_exceed",
    descEn: "21.0 hours of advance notice before water level reaches 13.20m PWD danger level, providing the golden window for Boro rice harvesting and livestock evacuation.",
    descBn: "বিপৎসীমায় পৌঁছানোর ২১ ঘণ্টা আগেই সংকেত, যা বোরো ধান কাটা ও গবাদিপশু নিরাপদে সরিয়ে নেওয়ার জন্য সুবর্ণ সময়।",
  },
};

export default function ValidationMetricsPanel({ metrics, lang }) {
  const [activeTooltip, setActiveTooltip] = useState(null);

  if (!metrics) return null;

  const metricCards = [
    {
      key: "NSE",
      label: "NSE",
      value: metrics.formatted.nse,
      name: lang === "en" ? METRIC_DEFINITIONS.NSE.nameEn : METRIC_DEFINITIONS.NSE.nameBn,
      def: METRIC_DEFINITIONS.NSE,
    },
    {
      key: "KGE",
      label: "KGE",
      value: metrics.formatted.kge,
      name: lang === "en" ? METRIC_DEFINITIONS.KGE.nameEn : METRIC_DEFINITIONS.KGE.nameBn,
      def: METRIC_DEFINITIONS.KGE,
    },
    {
      key: "PBIAS",
      label: "PBIAS",
      value: metrics.formatted.pbias,
      name: lang === "en" ? METRIC_DEFINITIONS.PBIAS.nameEn : METRIC_DEFINITIONS.PBIAS.nameBn,
      def: METRIC_DEFINITIONS.PBIAS,
    },
    {
      key: "TIMING",
      label: lang === "en" ? "PEAK TIMING" : "শীর্ষ সময়",
      value: metrics.formatted.timing_error,
      name: lang === "en" ? METRIC_DEFINITIONS.TIMING.nameEn : METRIC_DEFINITIONS.TIMING.nameBn,
      def: METRIC_DEFINITIONS.TIMING,
    },
    {
      key: "LEAD",
      label: lang === "en" ? "WARNING LEAD" : "আগাম সতর্কতা",
      value: metrics.formatted.lead_time,
      name: lang === "en" ? METRIC_DEFINITIONS.LEAD.nameEn : METRIC_DEFINITIONS.LEAD.nameBn,
      def: METRIC_DEFINITIONS.LEAD,
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
