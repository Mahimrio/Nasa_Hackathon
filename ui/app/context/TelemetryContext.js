"use client";

import { createContext, useContext, useState, useEffect, useMemo, useCallback, startTransition } from "react";
import { useLocale } from "../hooks/useLocale";

const TelemetryContext = createContext(null);

export function TelemetryProvider({ children }) {
  const { lang } = useLocale();
  const intlLocale = lang === "bn" ? "bn-BD" : "en-GB";
  const [rawEventData, setRawEventData] = useState(null);
  const [rawGaugeData, setRawGaugeData] = useState(null);
  const [selectedYear, setSelectedYear] = useState(2026);
  const availableYears = useMemo(() => [2020, 2021, 2022, 2023, 2024, 2025, 2026], []);
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
  const [theme, setTheme] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        return localStorage.getItem("hydrosense_theme") || "mocha";
      } catch {
        return "mocha";
      }
    }
    return "mocha";
  });

  // ---- THEME DOM SYNC ----
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === "mocha" ? "light" : "mocha";
      try {
        localStorage.setItem("hydrosense_theme", next);
      } catch {}
      return next;
    });
  }, []);

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
        setRawEventData(ev);
        setRawGaugeData(ga);
        setMetrics(met);
        setReachMeta(rm);
        setCalibration(cal);

        // Initial slider index placed ~36h before 2026 peak
        const initial2026 = ev.filter((d) => d.timestamp && d.timestamp.startsWith("2026-"));
        const evToUse = initial2026.length > 0 ? initial2026 : ev;
        const pIdx = evToUse.reduce(
          (best, d, i) => (d.modelled_stage > evToUse[best].modelled_stage ? i : best),
          0
        );
        setSliderIdx(Math.max(0, pIdx - 36));
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load HydroSense pipeline data:", err);
        setLoadError(err.message || "Failed to load telemetry datasets");
        setLoading(false);
      });
  }, []);

  // Filter synthetic retrospective routing scenarios for the selected year.
  const eventData = useMemo(() => {
    if (!rawEventData || !rawEventData.length) return null;
    const prefix = `${selectedYear}-`;
    const filtered = rawEventData.filter((d) => d.timestamp && d.timestamp.startsWith(prefix));
    return filtered.length > 0 ? filtered : rawEventData;
  }, [rawEventData, selectedYear]);

  // Filter synthetic gauge-shaped scenarios for the selected year.
  const gaugeData = useMemo(() => {
    if (!rawGaugeData || !rawGaugeData.length) return null;
    const prefix = `${selectedYear}-`;
    const filtered = rawGaugeData.filter((g) => g.timestamp && g.timestamp.startsWith(prefix));
    return filtered.length > 0 ? filtered : rawGaugeData;
  }, [rawGaugeData, selectedYear]);

  // Dynamic scientific validation metrics tailored to the active year
  const activeMetrics = useMemo(() => {
    if (!metrics) return null;
    if (metrics.by_year && metrics.by_year[selectedYear]) {
      return {
        ...metrics,
        ...metrics.by_year[selectedYear],
        active_year: selectedYear,
      };
    }
    return metrics;
  }, [metrics, selectedYear]);

  // When selectedYear changes, dynamically focus slider to ~36 hours before that year's peak
  useEffect(() => {
    if (!eventData || !eventData.length) return;
    const pIdx = eventData.reduce(
      (best, d, i) => (d.modelled_stage > eventData[best].modelled_stage ? i : best),
      0
    );
    startTransition(() => setSliderIdx(Math.max(0, pIdx - 36)));
  }, [selectedYear, eventData]);

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
    metrics: activeMetrics || metrics,
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
    theme,
    setTheme,
    toggleTheme,
    selectedYear,
    setSelectedYear,
    availableYears,
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
