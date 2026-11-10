"use client";

import { useState } from "react";
import { useLocale } from "../hooks/useLocale";

function getMetricDefinitions(metrics, lang, t, formatNumber) {
  const isReal =
    Boolean(metrics?.real_hindcast) ||
    String(metrics?.provenance || "").startsWith("EXPLORATORY");

  // Localise a numeric value. Never invent a fallback: a missing metric is
  // rendered as N/A rather than a plausible-looking default.
  const fmt = (value, digits = 2) => {
    if (value === null || value === undefined || value === "" || Number.isNaN(Number(value))) {
      return "N/A";
    }
    const text = Number(value).toFixed(digits);
    return lang === "bn" ? formatNumber(text) : text;
  };
  const unit = (text, suffix) => (text === "N/A" ? text : `${text}${suffix}`);

  const danger = metrics?.danger_level_m ?? 13.2;
  const dangerVal = lang === "bn" ? formatNumber(danger.toFixed(2)) : danger.toFixed(2);

  const leadVal = metrics?.lead_time_h == null
    ? "N/A"
    : unit(fmt(metrics.lead_time_h, 1), lang === "bn" ? " ঘণ্টা" : " h");

  if (isReal) {
    const m = metrics?.real_hindcast?.metrics || {};
    return {
      MAE: {
        name: lang === "en" ? "Mean Absolute Error" : "গড় পরম ত্রুটি",
        benchmark: "±0.18 m (SWOT WSE)",
        benchmarkBn: "±০.১৮ মি (SWOT WSE)",
        formula: "mean(|ΔH_sim − ΔH_obs|)",
        desc: lang === "en"
          ? `Average absolute difference of ${unit(fmt(m.mae_relative_rise_m), " m")} between modelled and observed relative stage rise, computed only at raw BWDB observation timestamps.`
          : `মডেল ও পর্যবেক্ষিত আপেক্ষিক জলস্তর বৃদ্ধির গড় পরম পার্থক্য ${unit(fmt(m.mae_relative_rise_m), " মি")}, কেবল BWDB-এর মূল পর্যবেক্ষণ সময়ে গণনা করা হয়েছে।`,
        displayVal: unit(fmt(m.mae_relative_rise_m), lang === "bn" ? " মি" : " m"),
      },
      RMSE: {
        name: lang === "en" ? "Root Mean Square Error" : "মূল গড় বর্গ ত্রুটি",
        benchmark: "Lower is better",
        benchmarkBn: "কম হলে ভালো",
        formula: "sqrt(mean((ΔH_sim − ΔH_obs)²))",
        desc: lang === "en"
          ? `Residual standard deviation of ${unit(fmt(m.rmse_relative_rise_m), " m")} across the rising and falling limbs.`
          : `ঊর্ধ্ব ও নিম্ন প্রবাহে অবশিষ্ট ত্রুটির পরিমাণ ${unit(fmt(m.rmse_relative_rise_m), " মি")}।`,
        displayVal: unit(fmt(m.rmse_relative_rise_m), lang === "bn" ? " মি" : " m"),
      },
      PEAKDIFF: {
        name: lang === "en" ? "Peak Stage Difference" : "শীর্ষ জলস্তরের পার্থক্য",
        benchmark: "Local basin only",
        benchmarkBn: "কেবল স্থানীয় অববাহিকা",
        formula: "ΔH_sim,max − ΔH_obs,max",
        desc: lang === "en"
          ? `Modelled peak rise differs from the observed peak by ${unit(fmt(m.peak_stage_difference_m), " m")}. The local 425 km² basin omits transboundary Barak macro-inflow.`
          : `মডেলের শীর্ষ বৃদ্ধি পর্যবেক্ষণের তুলনায় ${unit(fmt(m.peak_stage_difference_m), " মি")} ভিন্ন; স্থানীয় ৪২৫ বর্গকিমি অববাহিকা সীমান্ত-পার বরাক প্রবাহ বাদ দেয়।`,
        displayVal: unit(fmt(m.peak_stage_difference_m), lang === "bn" ? " মি" : " m"),
      },
      BIAS: {
        name: lang === "en" ? "Mean Bias" : "গড় পক্ষপাত",
        benchmark: "Unbiased = 0",
        benchmarkBn: "নিরপেক্ষ = ০",
        formula: "mean(ΔH_sim − ΔH_obs)",
        desc: lang === "en"
          ? `Systematic ${unit(fmt(m.bias_relative_rise_m), " m")} offset on relative stage rise. No observational calibration was performed.`
          : `আপেক্ষিক জলস্তরে ${unit(fmt(m.bias_relative_rise_m), " মি")} পদ্ধতিগত বিচ্যুতি; কোনো পর্যবেক্ষণ-ভিত্তিক ক্রমাঙ্কন করা হয়নি।`,
        displayVal: unit(fmt(m.bias_relative_rise_m), lang === "bn" ? " মি" : " m"),
      },
      LEAD: {
        name: t("metrics.leadTimeTitle"),
        benchmark: "> 18h Golden Window",
        benchmarkBn: "> ১৮ ঘণ্টা সুবর্ণ সময়",
        formula: "t_warning_flag − t_danger_exceed",
        desc: lang === "en"
          ? "Not reported: an issue-time forecast experiment is required to measure warning lead time."
          : "প্রদর্শিত নয়: সতর্কবার্তার সময় নির্ধারণে ইস্যু-সময়ের পূর্বাভাস পরীক্ষা প্রয়োজন।",
        displayVal: "N/A",
      },
      DANGER: {
        name: lang === "en" ? "Danger Level" : "বিপদ সীমা",
        benchmark: "PWD datum",
        benchmarkBn: "PWD ডেটাম",
        formula: "official BWDB threshold",
        desc: lang === "en"
          ? `Official danger level ${dangerVal} m (PWD). Absolute crossing is unverified without a surveyed geodetic tie.`
          : `সরকারি বিপদ সীমা ${dangerVal} মি (PWD)। জিওডেটিক টাই ছাড়া পরম ক্রসিং যাচাই করা যায় না।`,
        displayVal: unit(dangerVal, lang === "bn" ? " মি" : " m"),
      },
    };
  }

  // Demo mode: synthetic engineering-test metrics. Missing values stay N/A.
  return {
    NSE: {
      name: t("metrics.nseTitle"),
      benchmark: "> 0.65 (Good)",
      benchmarkBn: "> ০.৬৫ (উচ্চ মান)",
      formula: "1 - [Σ(Qobs - Qsim)² / Σ(Qobs - Q̄obs)²]",
      desc: lang === "en"
        ? `Synthetic benchmark score ${fmt(metrics?.nse)}. Not evidence of real-world skill; the fixture scenario is constructed.`
        : `সিন্থেটিক বেঞ্চমার্ক স্কোর ${fmt(metrics?.nse)}। বাস্তব-বিশ্বের দক্ষতার প্রমাণ নয়; ফিক্সচার দৃশ্যপট কৃত্রিম।`,
      displayVal: fmt(metrics?.nse),
    },
    KGE: {
      name: t("metrics.kgeTitle"),
      benchmark: "> 0.60 (Balanced)",
      benchmarkBn: "> ০.৬০ (সুষম মান)",
      formula: "1 - √[(r - 1)² + (α - 1)² + (β - 1)²]",
      desc: lang === "en"
        ? `Synthetic benchmark score ${fmt(metrics?.kge)} on the constructed fixture series.`
        : `কৃত্রিম ফিক্সচার সিরিজে সিন্থেটিক বেঞ্চমার্ক স্কোর ${fmt(metrics?.kge)}।`,
      displayVal: fmt(metrics?.kge),
    },
    PBIAS: {
      name: t("metrics.pbiasTitle"),
      benchmark: "< ±10% (Excellent)",
      benchmarkBn: "< ±১০% (চমৎকার)",
      formula: "[Σ(Qsim - Qobs) / Σ(Qobs)] × 100",
      desc: lang === "en"
        ? `Synthetic percentage bias ${fmt(metrics?.pbias, 1)}% in the fixture scenario.`
        : `ফিক্সচার দৃশ্যপটে সিন্থেটিক শতকরা পক্ষপাত ${fmt(metrics?.pbias, 1)}%।`,
      displayVal: unit(fmt(metrics?.pbias, 1), "%"),
    },
    TIMING: {
      name: t("metrics.timingTitle"),
      benchmark: "< 6h Lead Discrepancy",
      benchmarkBn: "< ৬ ঘণ্টা ত্রুটি সীমা",
      formula: "t_peak,model - t_peak,gauge",
      desc: lang === "en"
        ? `Synthetic crest timing error of ${unit(fmt(metrics?.timing_error_h, 1), " h")} in the fixture scenario.`
        : `ফিক্সচার দৃশ্যপটে শীর্ষ সময়ের সিন্থেটিক ত্রুটি ${unit(fmt(metrics?.timing_error_h, 1), " ঘণ্টা")}।`,
      displayVal: unit(fmt(metrics?.timing_error_h, 1), lang === "bn" ? " ঘণ্টা" : " h"),
    },
    LEAD: {
      name: t("metrics.leadTimeTitle"),
      benchmark: "> 18h Golden Window",
      benchmarkBn: "> ১৮ ঘণ্টা সুবর্ণ সময়",
      formula: "t_warning_flag - t_danger_exceed",
      desc: lang === "en"
        ? "Not reported: an issue-time forecast product and independent observations are required to measure warning lead time."
        : "প্রদর্শিত নয়: সতর্কবার্তার সময় নির্ধারণে ইস্যু-সময়ের পূর্বাভাস ও স্বাধীন পর্যবেক্ষণ প্রয়োজন।",
      displayVal: leadVal,
    },
  };
}

export default function ValidationMetricsPanel({ metrics }) {
  const { lang, t, formatNumber } = useLocale();
  const [activeTooltip, setActiveTooltip] = useState(null);

  if (!metrics) return null;

  const defs = getMetricDefinitions(metrics, lang, t, formatNumber);
  const isReal =
    Boolean(metrics?.real_hindcast) ||
    String(metrics?.provenance || "").startsWith("EXPLORATORY");

  const metricCards = (isReal
    ? [
        ["MAE", "MAE"],
        ["RMSE", "RMSE"],
        ["PEAKDIFF", lang === "en" ? "PEAK DIFFERENCE" : "শীর্ষ পার্থক্য"],
        ["BIAS", lang === "en" ? "MEAN BIAS" : "গড় পক্ষপাত"],
        ["DANGER", lang === "en" ? "DANGER LEVEL" : "বিপদ সীমা"],
      ]
    : [
        ["NSE", "NSE"],
        ["KGE", "KGE"],
        ["PBIAS", "PBIAS"],
        ["TIMING", lang === "en" ? "PEAK TIMING" : "শীর্ষ সময়"],
        ["LEAD", lang === "en" ? "WARNING LEAD" : "আগাম সতর্কতা", true],
      ]
  ).map(([key, label, accent]) => ({
    key,
    label,
    value: defs[key].displayVal,
    name: defs[key].name,
    def: defs[key],
    accent,
  }));

  const provenanceLabel = String(metrics?.provenance || "UNKNOWN");
  const isSynthetic = provenanceLabel === "SYNTHETIC";

  return (
    <section className="glass-panel card-padding dashboard-full-row" aria-label={lang === "en" ? "Scientific Model Validation Metrics" : "বৈজ্ঞানিক মডেল যাচাইকরণ মেট্রিক্স"}>
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
            <div style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "2px" }}>
              {t("metrics.subtitle")}
            </div>
          </div>
        </div>

        <div style={{ fontSize: "13px", fontFamily: "var(--font-mono)", color: "var(--text-secondary)", fontWeight: 550 }}>
          {lang === "en" ? "Calibration:" : "ক্রমাঙ্কন:"} {metrics.calibration_period} → {lang === "en" ? "Test:" : "পরীক্ষা:"} {metrics.test_period}
        </div>
      </div>

      {/* Provenance banner — never hide what the numbers are */}
      <div
        role="status"
        style={{
          margin: "10px 0 14px",
          padding: "8px 12px",
          borderRadius: "8px",
          fontSize: "12.5px",
          lineHeight: 1.45,
          border: "1px solid var(--border-subtle)",
          background: isSynthetic ? "rgba(180, 120, 0, 0.10)" : "rgba(20, 110, 90, 0.10)",
          color: "var(--text-secondary)",
          fontFamily: "var(--font-mono)",
        }}
      >
        <strong>{provenanceLabel}</strong>
        {isSynthetic
          ? lang === "en"
            ? " — synthetic engineering fixture. Not real-world validation."
            : " — সিন্থেটিক ইঞ্জিনিয়ারিং ফিক্সচার। বাস্তব-বিশ্বের যাচাই নয়।"
          : lang === "en"
            ? " — real NASA SWOT / GPM IMERG / BWDB SW266 inputs; uncalibrated literature hydraulics. NSE/KGE omitted."
            : " — বাস্তব NASA SWOT / GPM IMERG / BWDB SW266 ইনপুট; অ-ক্রমাঙ্কিত সাহিত্য-ভিত্তিক হাইড্রোলিক্স। NSE/KGE বাদ।"}
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
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{lang === "en" ? m.def.benchmark : m.def.benchmarkBn}</span>
                </div>
              </div>

              {/* Tooltip on Hover / Focus (Light Professional Card) */}
              {isHovered && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "105%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "270px",
                    background: "var(--surface-popover)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "8px",
                    padding: "12px 14px",
                    boxShadow: "0 8px 24px rgba(23, 59, 87, 0.14)",
                    zIndex: 30,
                    fontSize: "13px",
                    lineHeight: "1.45",
                    color: "var(--text-primary)",
                    pointerEvents: "none",
                  }}
                >
                  <div style={{ color: "var(--blue-deep)", fontWeight: 750, marginBottom: "4px", fontSize: "14px" }}>
                    {m.name}
                  </div>
                  <div style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--blue-primary)", fontWeight: 600, marginBottom: "6px" }}>
                    Formula: {m.def.formula}
                  </div>
                  <div style={{ color: "var(--text-secondary)", fontSize: "12.5px" }}>{m.def.desc}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
