"use client";

import { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { useLocale } from "../hooks/useLocale";

const TelemetryContext = createContext(null);

export function TelemetryProvider({ children }) {
  const { lang } = useLocale();
  const intlLocale = lang === "bn" ? "bn-BD" : "en-GB";
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
    const timer = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timer);
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

  const dangerLevel = 13.2;

  // Formatted date strings
  const dateStr = useMemo(() => {
    if (!current) return "";
    return new Date(current.timestamp).toLocaleDateString(intlLocale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  }, [current, intlLocale]);

  const timeStr = useMemo(() => {
    if (!current) return "";
    return new Date(current.timestamp).toLocaleTimeString(intlLocale, {
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
      timeZone: "UTC",
    });
  }, [current, intlLocale]);

  const startDateStr = useMemo(() => {
    if (!eventData || !eventData.length) return "";
    return new Date(eventData[0].timestamp).toLocaleDateString(intlLocale, {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  }, [eventData, intlLocale]);

  const endDateStr = useMemo(() => {
    if (!eventData || !eventData.length) return "";
    return new Date(eventData[eventData.length - 1].timestamp).toLocaleDateString(intlLocale, {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  }, [eventData, intlLocale]);

  const value = {
    eventData,
    gaugeData,
    metrics,
    reachMeta,
    calibration,
    sliderIdx,
    setSliderIdx,
    peakIdx,
    current,
    chartWindow,
    currentGaugeLevel,
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
    loadError,
    fetchData,
  };

  return <TelemetryContext.Provider value={value}>{children}</TelemetryContext.Provider>;
}

export function useTelemetry() {
  const context = useContext(TelemetryContext);
  if (!context) {
    throw new Error("useTelemetry must be used within a TelemetryProvider");
  }
  return context;
}
