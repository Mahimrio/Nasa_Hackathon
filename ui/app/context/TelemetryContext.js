"use client";

import { createContext, useContext, useState, useEffect, useMemo, useCallback, startTransition } from "react";
import { useLocale } from "../hooks/useLocale";
import { withViewTransition } from "../lib/viewTransition";

const TelemetryContext = createContext(null);

export function TelemetryProvider({ children }) {
  const { lang, mounted: localeReady } = useLocale();
  const intlLocale = lang === "bn" ? "bn-BD" : "en-GB";
  const [rawEventData, setRawEventData] = useState(null);
  const [rawGaugeData, setRawGaugeData] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [metrics, setMetrics] = useState(null);
  const [reachMeta, setReachMeta] = useState(null);
  const [calibration, setCalibration] = useState(null);
  const [sliderIdx, setSliderIdx] = useState(0);
  const [selectedReachId, setSelectedReachId] = useState(null);
  const [inspectingReach, setInspectingReach] = useState(null);

  // Years come from the exported dataset, never from a hardcoded list. A real
  // hindcast export covers 2024; a synthetic demo covers 2020-2026.
  const availableYears = useMemo(() => {
    if (Array.isArray(metrics?.available_years) && metrics.available_years.length) {
      return [...metrics.available_years].sort((a, b) => a - b);
    }
    if (!rawEventData || !rawEventData.length) return [];
    const years = Array.from(
      new Set(
        rawEventData
          .map((d) => Number(String(d?.timestamp || "").slice(0, 4)))
          .filter((y) => Number.isFinite(y))
      )
    );
    return years.sort((a, b) => a - b);
  }, [metrics, rawEventData]);

  const activeYear = useMemo(() => {
    if (selectedYear != null) return selectedYear;
    return availableYears.length ? availableYears[availableYears.length - 1] : null;
  }, [selectedYear, availableYears]);

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
    let link = document.getElementById("app-favicon");
    if (!link) {
      link = document.createElement("link");
      link.id = "app-favicon";
      link.rel = "icon";
      link.type = "image/svg+xml";
      document.head.appendChild(link);
    }
    link.href = theme === "mocha" ? "/logo-mocha.svg" : "/logo-light.svg";
  }, [theme]);

  const toggleTheme = useCallback(() => {
    const next = document.documentElement.getAttribute("data-theme") === "mocha" ? "light" : "mocha";
    try {
      localStorage.setItem("hydrosense_theme", next);
    } catch {}
    withViewTransition(() => {
      setTheme(next);
      document.documentElement.setAttribute("data-theme", next);
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

        // Default to the latest year actually present in the export. Real
        // hindcasts cover a single event year (2024); demos cover 2020-2026.
        const yearsInData = Array.from(
          new Set((ev || []).map((d) => Number(String(d?.timestamp || "").slice(0, 4))).filter(Number.isFinite))
        ).sort((a, b) => a - b);
        const defaultYear =
          Array.isArray(met?.available_years) && met.available_years.length
            ? met.available_years[met.available_years.length - 1]
            : yearsInData.length
              ? yearsInData[yearsInData.length - 1]
              : null;
        setSelectedYear(defaultYear);

        // Default reach: the gauged target reach, never a synthetic constant.
        const defaultReach =
          (Array.isArray(rm) && rm.find((r) => r.has_gauge)?.reach_id) ||
          met?.target_reach_id ||
          (Array.isArray(rm) && rm[0]?.reach_id) ||
          null;
        setSelectedReachId((prev) => prev ?? defaultReach);

        // Place the slider ~36h before the peak of the active year.
        const scoped = defaultYear == null
          ? ev
          : (ev.filter((d) => d.timestamp && d.timestamp.startsWith(`${defaultYear}-`)) || []);
        const evToUse = scoped.length > 0 ? scoped : ev;
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

  // Filter retrospective routing scenarios for the active year.
  const eventData = useMemo(() => {
    if (!rawEventData || !rawEventData.length) return null;
    if (activeYear == null) return rawEventData;
    const prefix = `${activeYear}-`;
    const filtered = rawEventData.filter((d) => d.timestamp && d.timestamp.startsWith(prefix));
    return filtered.length > 0 ? filtered : rawEventData;
  }, [rawEventData, activeYear]);

  // Filter gauge observations for the active year.
  const gaugeData = useMemo(() => {
    if (!rawGaugeData || !rawGaugeData.length) return null;
    if (activeYear == null) return rawGaugeData;
    const prefix = `${activeYear}-`;
    const filtered = rawGaugeData.filter((g) => g.timestamp && g.timestamp.startsWith(prefix));
    return filtered.length > 0 ? filtered : rawGaugeData;
  }, [rawGaugeData, activeYear]);

  // Dynamic scientific validation metrics tailored to the active year
  const activeMetrics = useMemo(() => {
    if (!metrics) return null;
    if (metrics.by_year && metrics.by_year[activeYear]) {
      return {
        ...metrics,
        ...metrics.by_year[activeYear],
        active_year: activeYear,
      };
    }
    return metrics;
  }, [metrics, activeYear]);

  // When the active year changes, dynamically focus slider to ~36 hours before that year's peak
  useEffect(() => {
    if (!eventData || !eventData.length) return;
    const pIdx = eventData.reduce(
      (best, d, i) => (d.modelled_stage > eventData[best].modelled_stage ? i : best),
      0
    );
    startTransition(() => setSliderIdx(Math.max(0, pIdx - 36)));
  }, [activeYear, eventData]);

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

  // Nearest-observation lookup (tolerance 30 min). Real BWDB readings are
  // discrete daily values, so exact timestamp equality is not guaranteed.
  // Wrapped in useCallback so React Compiler memoization is stable.
  const makeGaugeLookup = useCallback(() => {
    if (!gaugeData || !gaugeData.length) return () => null;
    const parsed = gaugeData
      .map((g) => ({ t: Date.parse(g.timestamp), v: g.water_level_m }))
      .filter((g) => Number.isFinite(g.t))
      .sort((a, b) => a.t - b.t);
    const TOL = 30 * 60 * 1000;
    return (iso) => {
      const t = Date.parse(iso);
      if (!Number.isFinite(t)) return null;
      let best = null;
      for (const g of parsed) {
        const diff = Math.abs(g.t - t);
        if (best === null || diff < best.diff) best = { diff, v: g.v };
        if (g.t - t > TOL) break;
      }
      return best && best.diff <= TOL ? best.v : null;
    };
  }, [gaugeData]);

  // ---- CHART WINDOW (Show ±3 days around slider) ----
  const chartWindow = useMemo(() => {
    if (!eventData || !gaugeData) return [];
    const windowSize = 144; // 144 hourly points ≈ 6 days window
    const start = Math.max(0, sliderIdx - 72);
    const end = Math.min(eventData.length, start + windowSize);
    const sliced = eventData.slice(start, end);

    const lookup = makeGaugeLookup();
    return sliced.map((d) => ({
      time: d.timestamp.slice(5, 16).replace("T", " "),
      timestamp: d.timestamp,
      modelled: d.modelled_stage,
      lower: d.stage_lower,
      upper: d.stage_upper,
      observed: lookup(d.timestamp),
      baseline: d.baseline_stage ?? (7.74 + (d.baseline_rain_6h ?? 0) * 0.045),
      rainfall: d.imerg_map_mmh,
      flag: d.harvest_flag,
    }));
  }, [eventData, gaugeData, sliderIdx, makeGaugeLookup]);

  // ---- CURRENT GAUGE READING ----
  const currentGaugeLevel = useMemo(() => {
    if (!current) return null;
    return makeGaugeLookup()(current.timestamp);
  }, [current, makeGaugeLookup]);

  // ---- CURRENT SELECTED REACH ----
  const selectedReach = useMemo(() => {
    if (!reachMeta) return null;
    return reachMeta.find((r) => r.reach_id === selectedReachId) || null;
  }, [reachMeta, selectedReachId]);

  // The gauged target reach is defined by the export, not by a hardcoded ID.
  const targetReachId = useMemo(() => {
    if (metrics?.target_reach_id) return metrics.target_reach_id;
    if (Array.isArray(reachMeta)) {
      const gauged = reachMeta.find((r) => r.has_gauge);
      if (gauged) return gauged.reach_id;
    }
    return null;
  }, [metrics, reachMeta]);

  const dangerLevel = metrics?.danger_level_m ?? 13.2;

  // ---- DYNAMIC REACH RISK CALCULATION ----
  const reachRiskLevel = useCallback(
    (reachId) => {
      if (!current) return "GREEN";
      if (targetReachId != null && reachId === targetReachId) return current.harvest_flag;
      // Secondary reaches derived from upstream wave propagation
      if (current.future_stage >= dangerLevel) return "RED";
      if (current.future_stage >= dangerLevel * 0.8) return "AMBER";
      return "GREEN";
    },
    [current, targetReachId, dangerLevel]
  );

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
    // Stay in the skeleton until the saved language and web fonts are resolved,
    // so the first real paint never swaps language or font.
    loading: loading || !localeReady,
    loadError,
    fetchData,
    theme,
    setTheme,
    toggleTheme,
    selectedYear: activeYear,
    setSelectedYear,
    availableYears,
    targetReachId,
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
