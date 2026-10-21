"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useLocale } from "./hooks/useLocale";
import { useTelemetry } from "./context/TelemetryContext";
import AppHeader from "./components/AppHeader";
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

      {/* Main Dashboard Application Shell (§1. Dashboard — Detect Risk) */}
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
        <div className="journey-pathway-banner" aria-label="Next Steps in User Journey">
          <Link href="/forecast" className="pathway-card neu-raised">
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

          <Link href="/advisory" className="pathway-card neu-raised">
            <div>
              <div className="pathway-title">
                {lang === "en" ? "3. Decide What to Do: Harvest Advisory ➔" : "৩. কী সিদ্ধান্ত নেবেন: ফসল কর্তন নির্দেশিকা ➔"}
              </div>
              <div className="pathway-desc">
                {lang === "en"
                  ? "View location-specific directives, 22.0h warning window, affected haor areas, and field checklists for farmers & DAE officers."
                  : "এলাকা-ভিত্তিক সুপারিশ, ২২.০ ঘণ্টা সতর্কবার্তা সময়সীমা, প্লাবিত হাওর এবং কৃষক ও কৃষি কর্মকর্তাদের নির্দেশিকা দেখুন।"}
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
              ? "BWDB SW108 Kanaighat Hydrometric Gauge"
              : "বাপাউবো SW১০৮ কানাইঘাট হাইড্রোগ্রাফিক গেজ"}
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
