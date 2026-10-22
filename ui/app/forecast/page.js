"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useLocale } from "../hooks/useLocale";
import { useTelemetry } from "../context/TelemetryContext";
import AppHeader from "../components/AppHeader";
import PageContextBar from "../components/PageContextBar";
import HydrographPanel from "../components/HydrographPanel";
import ValidationMetricsPanel from "../components/ValidationMetricsPanel";
import OperationalLimitsPanel from "../components/OperationalLimitsPanel";
import DashboardSkeleton from "../components/DashboardSkeleton";
import ErrorBoundary from "./../components/ErrorBoundary";

// Code-split heavy interactive modals so they are loaded on-demand only
const ReachInspectorModal = dynamic(
  () => import("../components/ReachInspectorModal"),
  { ssr: false }
);
const AdvisoryBulletinModal = dynamic(
  () => import("../components/AdvisoryBulletinModal"),
  { ssr: false }
);
const ModelArchitectureModal = dynamic(
  () => import("../components/ModelArchitectureModal"),
  { ssr: false }
);

export default function ForecastPage() {
  const { lang, setLang, t } = useLocale();
  const {
    eventData,
    metrics,
    calibration,
    reachMeta,
    sliderIdx,
    setSliderIdx,
    peakIdx,
    current,
    chartWindow,
    selectedReachId,
    setSelectedReachId,
    selectedReach,
    reachRiskLevel,
    dangerLevel,
    dateStr,
    timeStr,
    startDateStr,
    endDateStr,
    inspectingReach,
    setInspectingReach,
    showBulletin,
    setShowBulletin,
    showModelInfo,
    setShowModelInfo,
    loading,
    fetchData,
  } = useTelemetry();

  if (loading) {
    return (
      <>
        <AppHeader
          currentDateStr="-- --- 2026"
          currentTimeStr="--:--"
          onOpenBulletin={() => {}}
          onOpenModelInfo={() => {}}
        />
        <DashboardSkeleton lang={lang} />
      </>
    );
  }

  if (!eventData || !current) {
    return (
      <div className="loading-screen-wrap" role="alert">
        <div className="loading-headline" style={{ color: "var(--red-400)", marginTop: "12px" }}>
          {lang === "en" ? "Failed to Load Pipeline Datasets" : "টেলিম্যাট্রি ডেটাসেট লোড করা যায়নি"}
        </div>
        <button
          className="btn-standard btn-primary"
          onClick={fetchData}
          style={{ minHeight: "44px", padding: "0 22px", fontSize: "13px", fontWeight: 700 }}
        >
          {lang === "en" ? "Retry Loading Telemetry" : "পুনরায় চেষ্টা করুন"}
        </button>
      </div>
    );
  }

  return (
    <ErrorBoundary lang={lang} onRetry={fetchData}>
      {/* Skip to Main Content */}
      <a href="#main-content" className="skip-to-content">
        {lang === "en" ? "Skip to Main Content" : "মূল বিষয়বস্তুতে যান"}
      </a>

      {/* Top Application Bar with Route Navigation */}
      <AppHeader
        currentDateStr={dateStr}
        currentTimeStr={timeStr}
        onOpenBulletin={() => setShowBulletin(true)}
        onOpenModelInfo={() => setShowModelInfo(true)}
      />

      {/* Main Forecast & Analysis Page Container (§2. Forecast & Analysis — Understand Why) */}
      <main id="main-content" className="dashboard-shell" role="main" tabIndex="-1">
        {/* Context Strip & Quick Timeline Jumps */}
        <PageContextBar
          reaches={reachMeta}
          selectedReachId={selectedReachId}
          setSelectedReachId={setSelectedReachId}
          onJumpToSlider={(idx) => setSliderIdx(idx)}
          peakIdx={peakIdx}
          eventDataLength={eventData.length}
        />

        {/* Executive Page Overview Header */}
        <div className="glass-panel" style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="brand-badge" style={{ fontSize: "11px", background: "rgba(56, 189, 248, 0.15)", color: "var(--cyan-300)" }}>
                {lang === "en" ? "STAGE 2 OF 3" : "ধাপ ২ / ৩"}
              </span>
              <h1 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                {lang === "en" ? "Forecast & Analysis — Understand Why" : "পূর্বাভাস ও বিশ্লেষণ — কেন এই পূর্বাভাস"}
              </h1>
            </div>
            <p style={{ fontSize: "12.5px", color: "var(--text-muted)", marginTop: "4px", margin: 0 }}>
              {lang === "en"
                ? "Physical evidence: GPM IMERG convective precipitation hyetograph, SWOT-calibrated kinematic wave routing, and danger crest timing."
                : "প্রাকৃতিক প্রমাণ: আইমার্জ বৃষ্টিপাতের ঘনত্ব, সোয়াট অলটিমেট্রি নির্ভর তরঙ্গ সঞ্চালন এবং বিপদসীমা অতিক্রমের সুনির্দিষ্ট সময়।"}
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <Link
              href="/dashboard"
              className="btn-standard neu-inset"
              style={{ minHeight: "40px", padding: "0 14px", fontSize: "12px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <span>⬅</span>
              <span>{lang === "en" ? "1. Detect Risk (Dashboard)" : "১. ঝুঁকি শনাক্তকরণ"}</span>
            </Link>

            <Link
              href="/advisory"
              className="btn-standard btn-primary"
              style={{ minHeight: "40px", padding: "0 14px", fontSize: "12px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <span>{lang === "en" ? "3. Harvest Advisory" : "৩. ফসল কর্তন নির্দেশিকা"}</span>
              <span>➔</span>
            </Link>
          </div>
        </div>

        {/* 1. Hydrograph and Timeline Scrubber Row (Full 12/12 Width) */}
        <div className="dashboard-full-row">
          <HydrographPanel
            chartData={chartWindow}
            eventData={eventData}
            current={current}
            dangerLevel={dangerLevel}
            sliderIdx={sliderIdx}
            setSliderIdx={setSliderIdx}
            eventDataLength={eventData.length}
            startDateStr={startDateStr}
            endDateStr={endDateStr}
            dateStr={dateStr}
            timeStr={timeStr}
            lang={lang}
            peakIdx={peakIdx}
            selectedReach={selectedReach}
          />
        </div>

        {/* 2. Scientific Validation Benchmark Metrics Row (Full 12/12 Width) */}
        <ValidationMetricsPanel metrics={metrics} lang={lang} />

        {/* 3. Permanent Operational Limitations & Methodological Bounds */}
        <OperationalLimitsPanel lang={lang} metrics={metrics} />

        {/* Pathway Navigation Footer */}
        <div className="journey-pathway-banner" aria-label={lang === "en" ? "Next Steps in User Journey" : "পরবর্তী ধাপসমূহ"}>
          <Link href="/dashboard" className="pathway-card neu-raised">
            <div>
              <div className="pathway-title">
                {lang === "en" ? "⬅ Return to 1. Dashboard (Detect Risk)" : "⬅ ১. ড্যাশবোর্ডে ফিরে যান (ঝুঁকি শনাক্তকরণ)"}
              </div>
              <div className="pathway-desc">
                {lang === "en"
                  ? "View live river reach map, current harvest flag, and 5-second risk triage."
                  : "লাইভ নদী মানচিত্র, সার্বিক ফসল কর্তন সংকেত এবং ৫-সেকেন্ড ট্রায়াজ দেখুন।"}
              </div>
            </div>
            <div className="pathway-arrow" aria-hidden="true">
              ⬅
            </div>
          </Link>

          <Link href="/advisory" className="pathway-card neu-raised">
            <div>
              <div className="pathway-title">
                {lang === "en" ? "Proceed to 3. Harvest Advisory (Decide & Act) ➔" : "৩. ফসল কর্তন নির্দেশিকা দেখুন (সিদ্ধান্ত ও পদক্ষেপ) ➔"}
              </div>
              <div className="pathway-desc">
                {lang === "en"
                  ? "Explore location-specific harvest recommendations, warning window, and field directives."
                  : "এলাকা-ভিত্তিক কর্তন সুপারিশ, ২২ ঘণ্টার সুবর্ণ সময় এবং মাঠপর্যায়ের করণীয় দেখুন।"}
              </div>
            </div>
            <div className="pathway-arrow" aria-hidden="true">
              ➔
            </div>
          </Link>
        </div>
      </main>

      {/* Global Application Footer */}
      <footer className="dashboard-footer" role="contentinfo">
        <div>
          {lang === "en"
            ? "HydroSense-SWOT · NASA Space Apps Challenge 2026 · Tier 4 User Delivery Interface"
            : "হাইড্রোসেন্স-SWOT · নাসা স্পেস অ্যাপস চ্যালেঞ্জ ২০২৬ · টিয়ার ৪ ইন্টারফেস"}
        </div>
        <div className="footer-citations">
          <span>
            {lang === "en"
              ? "NASA SWOT L2 HR RiverSP 2.0 (KaRIn Altimetry)"
              : "নাসা SWOT L2 HR RiverSP 2.0 (KaRIn অলটিমেট্রি)"}
          </span>
          <span>•</span>
          <span>
            {lang === "en"
              ? "GPM IMERG Early Run V07 (0.1° Half-Hourly)"
              : "GPM IMERG আর্লি রান V07 (০.১° আধা-ঘণ্টা)"}
          </span>
          <span>•</span>
          <span>
            {lang === "en"
              ? "BWDB SW266 (Model SW108) Kanaighat Gauge"
              : "বাপাউবো SW২৬৬ (মডেল SW১০৮) কানাইঘাট গেজ"}
          </span>
        </div>
      </footer>

      {/* Interactive Modals */}
      {inspectingReach && (
        <ReachInspectorModal
          reach={inspectingReach}
          calibrationData={calibration}
          riskFn={reachRiskLevel}
          lang={lang}
          onClose={() => setInspectingReach(null)}
        />
      )}

      {showBulletin && (
        <AdvisoryBulletinModal
          current={current}
          dateStr={dateStr}
          timeStr={timeStr}
          dangerLevel={dangerLevel}
          lang={lang}
          onClose={() => setShowBulletin(false)}
        />
      )}

      {showModelInfo && (
        <ModelArchitectureModal lang={lang} onClose={() => setShowModelInfo(false)} />
      )}
    </ErrorBoundary>
  );
}
