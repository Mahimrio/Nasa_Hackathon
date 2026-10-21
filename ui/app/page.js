"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { useLocale } from "./hooks/useLocale";
import AppHeader from "./components/AppHeader";
import PageContextBar from "./components/PageContextBar";
import RiverMapPanel from "./components/RiverMapPanel";
import HarvestDecisionPanel from "./components/HarvestDecisionPanel";
import HydrographPanel from "./components/HydrographPanel";
import ValidationMetricsPanel from "./components/ValidationMetricsPanel";
import OperationalLimitsPanel from "./components/OperationalLimitsPanel";
import DashboardSkeleton from "./components/DashboardSkeleton";
import ErrorBoundary from "./components/ErrorBoundary";

// Code-split heavy interactive modals so they are loaded on-demand only (Guard P10 Bundle Optimization)
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
  const { lang, setLang, t, isBangla, formatNumber } = useLocale();
  const [eventData, setEventData] = useState(null);
  const [gaugeData, setGaugeData] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [reachMeta, setReachMeta] = useState(null);
  const [calibration, setCalibration] = useState(null);
  const [sliderIdx, setSliderIdx] = useState(0);
  const [selectedReachId, setSelectedReachId] = useState("22211000011");
  const [inspectingReach, setInspectingReach] = useState(null);
  const [showBulletin, setShowBulletin] = useState(false);
  const [showModelInfo, setShowModelInfo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // ---- RESILIENT DATA FETCHING WITH RETRY ----
  const fetchData = useCallback(() => {
    setLoading(true);
    setLoadError(null);

    Promise.all([
      fetch("/data/event_timeseries.json").then((r) => {
        if (!r.ok) throw new Error("Failed to load event_timeseries.json");
        return r.json();
      }),
      fetch("/data/gauge_observations.json").then((r) => {
        if (!r.ok) throw new Error("Failed to load gauge_observations.json");
        return r.json();
      }),
      fetch("/data/metrics_summary.json").then((r) => {
        if (!r.ok) throw new Error("Failed to load metrics_summary.json");
        return r.json();
      }),
      fetch("/data/reach_metadata.json").then((r) => {
        if (!r.ok) throw new Error("Failed to load reach_metadata.json");
        return r.json();
      }),
      fetch("/data/calibration_summary.json").then((r) => {
        if (!r.ok) throw new Error("Failed to load calibration_summary.json");
        return r.json();
      }),
    ])
      .then(([ev, ga, met, rm, cal]) => {
        setEventData(ev);
        setGaugeData(ga);
        setMetrics(met);
        setReachMeta(rm);
        setCalibration(cal);

        // Find peak stage index dynamically from data
        const pIdx = ev.reduce(
          (best, d, i) => (d.modelled_stage > ev[best].modelled_stage ? i : best),
          0
        );
        // Start ~1 day before peak for immediate interesting context
        setSliderIdx(Math.max(0, pIdx - 36));
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load HydroSense pipeline data:", err);
        setLoadError(err.message || "Failed to load telemetry datasets");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);


  // ---- PEAK INDEX ----
  const peakIdx = useMemo(() => {
    if (!eventData || !eventData.length) return 0;
    return eventData.reduce(
      (best, d, i) => (d.modelled_stage > eventData[best].modelled_stage ? i : best),
      0
    );
  }, [eventData]);

  // ---- CURRENT TIMELINE SNAPSHOT ----
  const current = useMemo(() => {
    if (!eventData || sliderIdx >= eventData.length) return null;
    return eventData[sliderIdx];
  }, [eventData, sliderIdx]);

  // ---- CHART WINDOW (Show ±3 days around slider) ----
  const chartWindow = useMemo(() => {
    if (!eventData || !gaugeData) return [];
    const windowSize = 144; // 144 hourly points ≈ 6 days window
    const start = Math.max(0, sliderIdx - 72);
    const end = Math.min(eventData.length, start + windowSize);
    const sliced = eventData.slice(start, end);

    // Index gauge observations by timestamp
    const gaugeMap = {};
    gaugeData.forEach((g) => {
      gaugeMap[g.timestamp] = g.water_level_m;
    });

    return sliced.map((d) => ({
      time: d.timestamp.slice(5, 16).replace("T", " "),
      timestamp: d.timestamp,
      modelled: d.modelled_stage,
      lower: d.stage_lower,
      upper: d.stage_upper,
      observed: gaugeMap[d.timestamp] ?? null,
      baseline: d.baseline_stage ?? (7.74 + (d.baseline_rain_6h ?? 0) * 0.045),
      rainfall: d.imerg_map_mmh,
      flag: d.harvest_flag,
    }));
  }, [eventData, gaugeData, sliderIdx]);

  // ---- CURRENT GAUGE READING ----
  const currentGaugeLevel = useMemo(() => {
    if (!gaugeData || !current) return null;
    const match = gaugeData.find((g) => g.timestamp === current.timestamp);
    return match ? match.water_level_m : null;
  }, [gaugeData, current]);

  // ---- CURRENT SELECTED REACH ----
  const selectedReach = useMemo(() => {
    if (!reachMeta) return null;
    return reachMeta.find((r) => r.reach_id === selectedReachId) || null;
  }, [reachMeta, selectedReachId]);

  // ---- DYNAMIC REACH RISK CALCULATION ----
  const reachRiskLevel = useCallback(
    (reachId) => {
      if (!current) return "GREEN";
      if (reachId === "22211000011") return current.harvest_flag;
      // Secondary reaches derived from upstream wave propagation
      if (current.future_stage >= 13.2) return "RED";
      if (current.future_stage >= 13.2 * 0.8) return "AMBER";
      return "GREEN";
    },
    [current]
  );

  // ---- SHIMMER LOADING SKELETON (Guard P10: CLS < 0.1, instantaneous perceived load) ----
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

  // ---- ERROR SCREEN WITH RETRY ACTION ----
  if (!eventData || !current) {
    return (
      <div className="loading-screen-wrap" role="alert">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--red-400)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <div className="loading-headline" style={{ color: "var(--red-400)", marginTop: "12px" }}>
          {lang === "en" ? "Failed to Load Pipeline Datasets" : "টেলিম্যাট্রি ডেটাসেট লোড করা যায়নি"}
        </div>
        <div className="loading-subtext" style={{ maxWidth: "480px", marginBottom: "18px" }}>
          {lang === "en"
            ? "Could not read static JSON telemetry from /public/data. Check network connectivity or local files."
            : "পাবলিক ফোল্ডারের স্ট্যাটিক JSON ফাইল পড়তে ব্যর্থ হয়েছে। ফাইল বা সংযোগ যাচাই করুন।"}
        </div>
        <button
          className="btn-standard btn-primary"
          onClick={fetchData}
          style={{ minHeight: "44px", padding: "0 22px", fontSize: "13px", fontWeight: 700 }}
        >
          <svg
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
            <path d="M3 3v5h5" />
          </svg>
          <span>{lang === "en" ? "Retry Loading Telemetry" : "পুনরায় চেষ্টা করুন"}</span>
        </button>
      </div>
    );
  }

  const dangerLevel = 13.2;
  const currentDate = new Date(current.timestamp);
  const dateStr = currentDate.toLocaleDateString("en-GB", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  const timeStr = currentDate.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });

  const startDateStr = new Date(eventData[0].timestamp).toLocaleDateString("en-GB", {
    month: "short",
    day: "numeric",
  });
  const endDateStr = new Date(eventData[eventData.length - 1].timestamp).toLocaleDateString(
    "en-GB",
    {
      month: "short",
      day: "numeric",
    }
  );

  return (
    <ErrorBoundary lang={lang} onRetry={fetchData}>
      {/* Skip to Main Content Link (§8 Accessibility) */}
      <a href="#main-content" className="skip-to-content">
        {lang === "en" ? "Skip to Main Content" : "মূল বিষয়বস্তুতে যান"}
      </a>

      {/* Top Application Bar */}
      <AppHeader
        lang={lang}
        setLang={setLang}
        currentDateStr={dateStr}
        currentTimeStr={timeStr}
        onOpenBulletin={() => setShowBulletin(true)}
        onOpenModelInfo={() => setShowModelInfo(true)}
      />

      {/* Main Dashboard Application Shell */}
      <main id="main-content" className="dashboard-shell" role="main" tabIndex="-1">
        {/* Context Strip & Quick Timeline Jumps */}
        <PageContextBar
          lang={lang}
          reaches={reachMeta}
          selectedReachId={selectedReachId}
          setSelectedReachId={setSelectedReachId}
          onJumpToSlider={(idx) => setSliderIdx(idx)}
          peakIdx={peakIdx}
          eventDataLength={eventData.length}
        />

        {/* Hero Row: 8-col Reach Map + 4-col Harvest Decision Engine (§3.1) */}
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

        {/* Hydrograph and Timeline Scrubber Row (Full 12/12 Width) */}
        <div className="dashboard-full-row">
          <HydrographPanel
            chartData={chartWindow}
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

        {/* Scientific Validation Benchmark Metrics Row (Full 12/12 Width) */}
        <ValidationMetricsPanel metrics={metrics} lang={lang} />

        {/* Permanent Operational Limitations & Methodological Bounds */}
        <OperationalLimitsPanel lang={lang} metrics={metrics} />
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
