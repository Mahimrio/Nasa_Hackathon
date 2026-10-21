"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import AppHeader from "./components/AppHeader";
import PageContextBar from "./components/PageContextBar";
import RiverMapPanel from "./components/RiverMapPanel";
import HarvestDecisionPanel from "./components/HarvestDecisionPanel";
import HydrographPanel from "./components/HydrographPanel";
import ValidationMetricsPanel from "./components/ValidationMetricsPanel";
import OperationalLimitsPanel from "./components/OperationalLimitsPanel";
import ReachInspectorModal from "./components/ReachInspectorModal";
import AdvisoryBulletinModal from "./components/AdvisoryBulletinModal";
import ModelArchitectureModal from "./components/ModelArchitectureModal";

export default function DashboardPage() {
  const [eventData, setEventData] = useState(null);
  const [gaugeData, setGaugeData] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [reachMeta, setReachMeta] = useState(null);
  const [calibration, setCalibration] = useState(null);
  const [sliderIdx, setSliderIdx] = useState(0);
  const [lang, setLang] = useState("en");
  const [selectedReachId, setSelectedReachId] = useState("22211000011");
  const [inspectingReach, setInspectingReach] = useState(null);
  const [showBulletin, setShowBulletin] = useState(false);
  const [showModelInfo, setShowModelInfo] = useState(false);
  const [loading, setLoading] = useState(true);

  // ---- DATA FETCHING ----
  useEffect(() => {
    Promise.all([
      fetch("/data/event_timeseries.json").then((r) => r.json()),
      fetch("/data/gauge_observations.json").then((r) => r.json()),
      fetch("/data/metrics_summary.json").then((r) => r.json()),
      fetch("/data/reach_metadata.json").then((r) => r.json()),
      fetch("/data/calibration_summary.json").then((r) => r.json()),
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
        setLoading(false);
      });
  }, []);

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

  // ---- LOADING SCREEN ----
  if (loading) {
    return (
      <div className="loading-screen-wrap" role="status" aria-live="polite">
        <div className="spinner-gyro" aria-hidden="true" />
        <div className="loading-headline">Initializing HydroSense-SWOT Pipeline Telemetry…</div>
        <div className="loading-subtext">
          Loading SWOT orbital reach calibration and GPM IMERG hydrologic routing datasets
        </div>
      </div>
    );
  }

  // ---- ERROR SCREEN ----
  if (!eventData || !current) {
    return (
      <div className="loading-screen-wrap" role="alert">
        <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="var(--red-400)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <div className="loading-headline" style={{ color: "var(--red-400)" }}>
          Failed to load pipeline datasets
        </div>
        <div className="loading-subtext">
          Verify static data files in public/data or run `python scripts/export_json.py`.
        </div>
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
    <>
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
          HydroSense-SWOT · NASA Space Apps Challenge 2026 · Tier 4 User Delivery Interface
        </div>
        <div className="footer-citations">
          <span>NASA SWOT L2 HR RiverSP 2.0 (KaRIn Altimetry)</span>
          <span>•</span>
          <span>GPM IMERG Early Run V07 (0.1° Half-Hourly)</span>
          <span>•</span>
          <span>BWDB SW108 Kanaighat Hydrometric Gauge</span>
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
    </>
  );
}
