"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { NAV_FORWARD } from "./lib/navDirection";
import { useLocale } from "./hooks/useLocale";
import { useTelemetry } from "./context/TelemetryContext";

import DashboardFooter from "./components/DashboardFooter";
import PageContextBar from "./components/PageContextBar";
import RiverMapPanel from "./components/RiverMapPanel";
import HarvestDecisionPanel from "./components/HarvestDecisionPanel";
import FiveSecondTriageStrip from "./components/FiveSecondTriageStrip";
import DashboardSkeleton from "./components/DashboardSkeleton";
import ErrorBoundary from "./components/ErrorBoundary";

// Code-split heavy interactive modals so they are loaded on-demand only (P10)
const ReachInspectorModal = dynamic(
  () => import("./components/ReachInspectorModal"),
  { ssr: false }
);
const AdvisoryBulletinModal = dynamic(
  () => import("./components/AdvisoryBulletinModal"),
  { ssr: false }
);
const ModelArchitectureModal = dynamic(
  () => import("./components/ModelArchitectureModal"),
  { ssr: false }
);

export default function DashboardPage() {
  const { lang, setLang, t } = useLocale();
  const {
    eventData,
    reachMeta,
    calibration,
    sliderIdx,
    setSliderIdx,
    peakIdx,
    current,
    currentGaugeLevel,
    selectedReachId,
    setSelectedReachId,
    selectedReach,
    reachRiskLevel,
    dangerLevel,
    dateStr,
    timeStr,
    inspectingReach,
    setInspectingReach,
    showBulletin,
    setShowBulletin,
    showModelInfo,
    setShowModelInfo,
    loading,
    fetchData,
    metrics,
  } = useTelemetry();

  if (loading) {
    return <DashboardSkeleton lang={lang} />;
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
      {/* Main Dashboard Application Shell (§1. Dashboard — Detect Risk) */}
      <main id="main-content" className="dashboard-shell" role="main" tabIndex="-1">
        {/* NASA Space Apps Challenge 2026: Earth System Trend Detective Feature Banner */}
        <section
          className="glass-panel nasa-challenge-hero-card"
          role="region"
          aria-label={lang === "en" ? "NASA Challenge Response Spotlight" : "নাসা চ্যালেঞ্জ স্পটলাইট"}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "1rem",
            padding: "0.85rem 1.25rem",
            marginBottom: "0.85rem",
            borderLeft: "4px solid var(--teal-primary, #0ea5e9)",
            background: "linear-gradient(90deg, rgba(14, 165, 233, 0.12) 0%, rgba(20, 24, 33, 0.65) 100%)",
            borderRadius: "8px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem", maxWidth: "800px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 800,
                  letterSpacing: "0.08em",
                  padding: "2px 7px",
                  borderRadius: "4px",
                  background: "var(--teal-primary, #0ea5e9)",
                  color: "#0a0a0a",
                  textTransform: "uppercase",
                }}
              >
                NASA Space Apps Challenge 2026
              </span>
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  color: "var(--teal-primary, #0ea5e9)",
                }}
              >
                EARTH SYSTEM TREND DETECTIVE
              </span>
            </div>
            <p style={{ margin: 0, fontSize: "13px", lineHeight: "1.4", color: "var(--text-secondary, #cbd5e1)" }}>
              {lang === "en"
                ? "25-Year Climatological Rainfall Trend Analysis (2001–2025) across Transboundary Quadrants using 1,525 daily provenance-verified NASA GPM IMERG Final granules. Verified null result with Hamed–Rao Modified Mann–Kendall inference."
                : "১,৫২৫টি দৈনিক যাচাইকৃত নাসা GPM IMERG Final গ্রানুল ব্যবহার করে ২৫ বছরের (২০০১–২০২৫) প্রাক-বর্ষা বৃষ্টিপাত প্রবণতা বিশ্লেষণ। হামেদ–রাও সংশোধিত মান–কেন্ডাল পরিসংখ্যান সহ অপরিবর্তিত/নাল ফলাফল যাচাই।"
              }
            </p>
          </div>
          <Link
            href="/trends"
            transitionTypes={NAV_FORWARD}
            className="btn-standard neu-raised"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              background: "var(--teal-primary, #0ea5e9)",
              color: "#0b1215",
              fontWeight: 700,
              fontSize: "12px",
              padding: "8px 16px",
              borderRadius: "6px",
              textDecoration: "none",
              whiteSpace: "nowrap",
            }}
          >
            <span>{lang === "en" ? "Explore NASA Trend Detective ➔" : "নাসা ট্রেন্ড ডিটেকটিভ দেখুন ➔"}</span>
          </Link>
        </section>

        {/* Context Strip & Quick Timeline Jumps */}
        <PageContextBar
          reaches={reachMeta}
          selectedReachId={selectedReachId}
          setSelectedReachId={setSelectedReachId}
          onJumpToSlider={(idx) => setSliderIdx(idx)}
          peakIdx={peakIdx}
          eventDataLength={eventData.length}
        />

        {/* 5-Second Executive Triage Strip: Where, When, Why, What to Do */}
        <FiveSecondTriageStrip
          current={current}
          dangerLevel={dangerLevel}
          metrics={metrics}
          selectedReach={selectedReach}
        />

        {/* Hero Row: 8-col Reach Map + 4-col Harvest Decision Rail (§1. Dashboard — Detect Risk) */}
        <div className="dashboard-hero-row">
          <RiverMapPanel
            reaches={reachMeta}
            riskFn={reachRiskLevel}
            lang={lang}
            selectedReachId={selectedReachId}
            setSelectedReachId={setSelectedReachId}
            currentStage={current.modelled_stage}
            dangerLevel={dangerLevel}
            currentGaugeLevel={currentGaugeLevel}
            currentRainfall={current?.rainfall ?? current?.imerg_map_mmh ?? 0}
            onInspectReach={(r) => setInspectingReach(r)}
          />

          <HarvestDecisionPanel
            current={current}
            dangerLevel={dangerLevel}
            currentGaugeLevel={currentGaugeLevel}
            metrics={metrics}
            lang={lang}
            selectedReach={selectedReach}
          />
        </div>

        {/* Cross-Route Decision Journey Pathway Navigation */}
        <div className="journey-pathway-banner" aria-label={lang === "en" ? "Next Steps in User Journey" : "পরবর্তী ধাপসমূহ"}>
          <Link href="/forecast" transitionTypes={NAV_FORWARD} className="pathway-card neu-raised">
            <div>
              <div className="pathway-title">
                {lang === "en" ? "2. Understand Why: Forecast & Analysis ➔" : "২. পূর্বাভাসের কারণ জানুন: হাইড্রো বিশ্লেষণ ➔"}
              </div>
              <div className="pathway-desc">
                {lang === "en"
                  ? "Inspect observed vs predicted hydrograph crest, 13.20m danger crossing time, and NSE/KGE validation benchmarks."
                  : "পর্যবেক্ষিত বনাম পূর্বাভাস হাইড্রোগ্রাফ, ১৩.২০ মি বিপদসীমা অতিক্রমের সময় এবং বৈজ্ঞানিক যাচাই মানদণ্ড দেখুন।"}
              </div>
            </div>
            <div className="pathway-arrow" aria-hidden="true">
              ➔
            </div>
          </Link>

          <Link href="/advisory" transitionTypes={NAV_FORWARD} className="pathway-card neu-raised">
            <div>
              <div className="pathway-title">
                {lang === "en" ? "3. Decide What to Do: Harvest Advisory ➔" : "৩. কী সিদ্ধান্ত নেবেন: ফসল কর্তন নির্দেশিকা ➔"}
              </div>
              <div className="pathway-desc">
                {lang === "en"
                  ? "View location-specific directives, simulated stage risetime, affected haor areas, and field checklists for farmers & DAE officers."
                  : "এলাকা-ভিত্তিক সুপারিশ, সিমুলেটেড পানি বৃদ্ধির সময়সীমা, প্লাবিত হাওর এবং কৃষক ও কৃষি কর্মকর্তাদের নির্দেশিকা দেখুন।"}
              </div>
            </div>
            <div className="pathway-arrow" aria-hidden="true">
              ➔
            </div>
          </Link>
        </div>
      </main>

      <DashboardFooter />

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
