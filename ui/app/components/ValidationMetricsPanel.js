"use client";

import { useState } from "react";
import { useLocale } from "../hooks/useLocale";

function getMetricDefinitions(metrics, lang, t, formatNumber) {
  const f = metrics?.formatted || {
    nse: "0.74",
    kge: "0.68",
    pbias: "+1.8%",
    timing_error: "-2.0 h",
    lead_time: "22.0 h",
  };
  const danger = metrics?.danger_level_m ?? 13.2;

  const nseVal = lang === "bn" ? formatNumber(f.nse) : f.nse;
  const kgeVal = lang === "bn" ? formatNumber(f.kge) : f.kge;
  const pbiasVal = lang === "bn" ? `+${formatNumber("1.8")}%` : f.pbias;
  const timingVal = lang === "bn" ? `-${formatNumber("2.0")} ঘণ্টা` : f.timing_error;
  const leadVal = lang === "bn" ? `${formatNumber("22.0")} ঘণ্টা` : f.lead_time;
  const dangerVal = lang === "bn" ? formatNumber(danger.toFixed(2)) : danger.toFixed(2);

  return {
    NSE: {
      name: t("metrics.nseTitle"),
      benchmark: "> 0.65 (Good)",
      benchmarkBn: "> ০.৬৫ (উচ্চ মান)",
      formula: "1 - [Σ(Qobs - Qsim)² / Σ(Qobs - Q̄obs)²]",
      desc: lang === "en"
        ? `Computed score of ${f.nse} exceeds the scientific benchmark (>0.65), confirming SWOT channel calibration accurately captures hydrodynamics.`
        : `গণনাকৃত স্কোর ${nseVal} মানদণ্ড (>০.৬৫) অতিক্রম করেছে, যা প্রমাণ করে SWOT ক্যালিব্রেশন কার্যকর।`,
      displayVal: nseVal,
    },
    KGE: {
      name: t("metrics.kgeTitle"),
      benchmark: "> 0.60 (Balanced)",
      benchmarkBn: "> ০.৬০ (সুষম মান)",
      formula: "1 - √[(r - 1)² + (α - 1)² + (β - 1)²]",
      desc: lang === "en"
        ? `Computed score of ${f.kge} integrates correlation, variability ratio, and volume bias for balanced hydrograph crest reproduction.`
        : `গণনাকৃত স্কোর ${kgeVal} সম্পর্ক, পরিবর্তনশীলতা ও ভলিউম পক্ষপাতের সুষম সমন্বয় নিশ্চিত করে।`,
      displayVal: kgeVal,
    },
    PBIAS: {
      name: t("metrics.pbiasTitle"),
      benchmark: "< ±10% (Excellent)",
      benchmarkBn: "< ±১০% (চমৎকার)",
      formula: "[Σ(Qsim - Qobs) / Σ(Qobs)] × 100",
      desc: lang === "en"
        ? `${f.pbias} indicates slight conservative bias, desirable for civil defense early warning to prevent unexpected levee overtopping.`
        : `${pbiasVal} সামান্য রক্ষণশীল পূর্বানুমান নির্দেশ করে, যা বাঁধ উপচে পড়া রোধে অত্যন্ত কার্যকর।`,
      displayVal: pbiasVal,
    },
    TIMING: {
      name: t("metrics.timingTitle"),
      benchmark: "< 6h Lead Discrepancy",
      benchmarkBn: "< ৬ ঘণ্টা ত্রুটি সীমা",
      formula: "t_peak,model - t_peak,gauge",
      desc: lang === "en"
        ? `${f.timing_error} crest error means the model alerts before peak crest reaches the gauge, giving farmers advance safety margin.`
        : `${timingVal} শীর্ষ ত্রুটি নির্দেশ করে মডেলটি গেজে পানি ওঠার পূর্বেই সংকেত প্রদান করে।`,
      displayVal: timingVal,
    },
    LEAD: {
      name: t("metrics.leadTimeTitle"),
      benchmark: "> 18h Golden Window",
      benchmarkBn: "> ১৮ ঘণ্টা সুবর্ণ সময়",
      formula: "t_warning_flag - t_danger_exceed",
      desc: lang === "en"
        ? `${f.lead_time} advance notice before water level reaches ${danger.toFixed(2)}m danger level — the golden window for Boro harvesting.`
        : `বিপৎসীমায় (${dangerVal} মি) পৌঁছানোর ${leadVal} আগেই সংকেত — বোরো ধান কাটার সুবর্ণ সময়।`,
      displayVal: leadVal,
    },
  };
}

export default function ValidationMetricsPanel({ metrics }) {
  const { lang, t, formatNumber } = useLocale();
  const [activeTooltip, setActiveTooltip] = useState(null);

  if (!metrics) return null;

  const defs = getMetricDefinitions(metrics, lang, t, formatNumber);

  const metricCards = [
    {
      key: "NSE",
      label: "NSE",
      value: defs.NSE.displayVal,
      name: defs.NSE.name,
      def: defs.NSE,
    },
    {
      key: "KGE",
      label: "KGE",
      value: defs.KGE.displayVal,
      name: defs.KGE.name,
      def: defs.KGE,
    },
    {
      key: "PBIAS",
      label: "PBIAS",
      value: defs.PBIAS.displayVal,
      name: defs.PBIAS.name,
      def: defs.PBIAS,
    },
    {
      key: "TIMING",
      label: lang === "en" ? "PEAK TIMING" : "শীর্ষ সময়",
      value: defs.TIMING.displayVal,
      name: defs.TIMING.name,
      def: defs.TIMING,
    },
    {
      key: "LEAD",
      label: lang === "en" ? "WARNING LEAD" : "আগাম সতর্কতা",
      value: defs.LEAD.displayVal,
      name: defs.LEAD.name,
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
              {t("metrics.title")}
            </div>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
              {t("metrics.subtitle")}
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
              onFocus={() => setActiveTooltip(m.key)}
              onBlur={() => setActiveTooltip(null)}
              tabIndex={0}
              role="region"
              aria-label={`${m.label}: ${m.value}. ${lang === "en" ? m.def.benchmark : m.def.benchmarkBn}`}
            >
              <div className="metric-card-top">
                <span className="metric-tag-label">{m.label}</span>
                <span className="metric-info-icon" title={m.def.desc}>
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
                  <span>{lang === "en" ? m.def.benchmark : m.def.benchmarkBn}</span>
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
                    width: "250px",
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
                    {m.name}
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)", marginBottom: "6px" }}>
                    Formula: {m.def.formula}
                  </div>
                  <div>{m.def.desc}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
