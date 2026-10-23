"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useLocale } from "../hooks/useLocale";
import { useTelemetry } from "../context/TelemetryContext";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from "recharts";

export default function HydrographPanel({
  chartData,
  eventData,
  current,
  dangerLevel = 13.2,
  sliderIdx,
  setSliderIdx,
  eventDataLength,
  startDateStr,
  endDateStr,
  dateStr,
  timeStr,
  peakIdx,
  selectedReach,
  selectedYear: propSelectedYear,
  setSelectedYear: propSetSelectedYear,
  availableYears: propAvailableYears,
}) {
  const { lang, t, formatNumber } = useLocale();
  const telemetry = useTelemetry?.() || {};
  const selectedYear = propSelectedYear ?? telemetry?.selectedYear ?? 2026;
  const setSelectedYear = propSetSelectedYear ?? telemetry?.setSelectedYear ?? (() => {});
  const availableYears = propAvailableYears ?? telemetry?.availableYears ?? [2020, 2021, 2022, 2023, 2024, 2025, 2026];

  const [isYearDropdownOpen, setIsYearDropdownOpen] = useState(false);
  const yearDropdownRef = useRef(null);

  // Close year dropdown when clicking outside or pressing Escape
  useEffect(() => {
    if (!isYearDropdownOpen) return;
    const handleClickOutside = (e) => {
      if (yearDropdownRef.current && !yearDropdownRef.current.contains(e.target)) {
        setIsYearDropdownOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsYearDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isYearDropdownOpen]);

  const yearMeta = {
    2020: { en: "Monsoon Inflow", bn: "বর্ষা প্লাবন" },
    2021: { en: "Moderate Event", bn: "মাঝারি ঢল" },
    2022: { en: "Historic Megaflood", bn: "ঐতিহাসিক সিলেট বন্যা" },
    2023: { en: "Normal Season", bn: "স্বাভাবিক মৌসুম" },
    2024: { en: "Flash Flood", bn: "পাহাড়ি ঢল" },
    2025: { en: "Pre-Monsoon", bn: "প্রাক-বর্ষা" },
    2026: { en: "Live Simulation", bn: "লাইভ সিমুলেশন" },
  };

  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1); // 1x, 2x, 5x
  const [skipHours, setSkipHours] = useState("6");
  const dayRailRef = useRef(null);

  // Playback timer loop
  useEffect(() => {
    if (!isPlaying) return;
    const intervalMs = playSpeed === 5 ? 120 : playSpeed === 2 ? 280 : 500;
    const timer = setInterval(() => {
      setSliderIdx((prev) => {
        if (prev >= eventDataLength - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, playSpeed, eventDataLength, setSliderIdx]);

  // Event day blocks derived from the full UTC timeline
  const eventDays = useMemo(() => {
    if (!eventData?.length) return [];
    const locale = lang === "bn" ? "bn-BD" : "en-GB";
    const weekdayFmt = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" });
    const dayFmt = new Intl.DateTimeFormat(locale, { day: "2-digit", timeZone: "UTC" });
    const monthFmt = new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" });
    const fullFmt = new Intl.DateTimeFormat(locale, {
      weekday: "short",
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    });

    const seen = new Map();
    eventData.forEach((row, idx) => {
      const key = row.timestamp?.slice(0, 10);
      if (!key || seen.has(key)) return;
      const date = new Date(`${key}T00:00:00Z`);
      seen.set(key, {
        key,
        startIndex: idx,
        weekday: weekdayFmt.format(date),
        day: dayFmt.format(date),
        month: monthFmt.format(date),
        fullLabel: fullFmt.format(date),
      });
    });
    return Array.from(seen.values());
  }, [eventData, lang]);

  const activeDayKey = current?.timestamp?.slice(0, 10);
  const activeDay = eventDays.find((day) => day.key === activeDayKey);

  // Keep the active day block centered in the horizontal rail
  useEffect(() => {
    const rail = dayRailRef.current;
    if (!rail || !activeDayKey) return;
    const activeChip = rail.querySelector('[data-active-day="true"]');
    if (!activeChip) return;
    const railRect = rail.getBoundingClientRect();
    const chipRect = activeChip.getBoundingClientRect();
    const centeredLeft =
      rail.scrollLeft + (chipRect.left - railRect.left) - (railRect.width - chipRect.width) / 2;
    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    rail.scrollTo({ left: Math.max(0, centeredLeft), behavior: reduceMotion ? "auto" : "smooth" });
  }, [activeDayKey]);

  const clampIndex = (idx) => Math.max(0, Math.min(eventDataLength - 1, idx));

  const parsedSkipHours = Number.parseInt(skipHours, 10);
  const effectiveSkipHours = Math.max(
    1,
    Math.min(eventDataLength - 1, Number.isNaN(parsedSkipHours) ? 1 : parsedSkipHours)
  );

  const applyTimeSkip = (direction) => {
    setIsPlaying(false);
    setSkipHours(String(effectiveSkipHours));
    setSliderIdx((idx) => clampIndex(idx + direction * effectiveSkipHours));
  };

  const jumpToDay = (day) => {
    setIsPlaying(false);
    setSliderIdx(clampIndex(day.startIndex));
  };

  const currentTimeFormatted = current ? current.timestamp.slice(5, 16).replace("T", " ") : "";
  const currentClock = current?.timestamp?.slice(11, 16) ?? "";
  const currentDateLabel = activeDay?.fullLabel || dateStr;
  const reachDisplayName = selectedReach
    ? lang === "en"
      ? selectedReach.name
      : selectedReach.name_bn
    : (lang === "en" ? "Kanaighat Gauge (SW266 / SW108)" : "কানাইঘাট গেজ (SW২৬৬ / SW১০৮)");

  const corridorText = selectedReach?.river === "Kushiyara"
    ? t("hydrograph.corridorKushiyara")
    : t("hydrograph.corridorSurma");

  return (
    <section className="glass-panel card-padding hydrograph-panel" aria-label={lang === "en" ? "Hydrologic Time-Series Analysis" : "হাইড্রোলজিক সময়-ক্রম বিশ্লেষণ"}>
      {/* Screen Reader Chart Summary Alternative (§8 Accessibility) */}
      <div className="sr-only" role="region" aria-label={lang === "en" ? "Hydrograph Accessible Summary" : "হাইড্রোগ্রাফ বিবরণী"}>
        {t("hydrograph.srSummary", {
          reachName: reachDisplayName,
          startDate: startDateStr,
          endDate: endDateStr,
          stage: current?.modelled_stage?.toFixed(2),
          danger: dangerLevel.toFixed(2),
        })}
      </div>

      {/* Panel Header */}
      <div className="card-header-bar">
        <div className="card-title-group" style={{ alignItems: "flex-start" }}>
          <div className="card-icon" style={{ marginTop: "3px" }} aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div>
            <div className="card-title">
              {t("hydrograph.title")} {reachDisplayName} {corridorText}
            </div>

            {/* Dropdown button for years (2020 to 2026) under the title text */}
            <div
              className="year-dropdown-container"
              ref={yearDropdownRef}
              style={{
                position: "relative",
                marginTop: "8px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <button
                type="button"
                id="hydrograph-year-dropdown-btn"
                onClick={() => setIsYearDropdownOpen((prev) => !prev)}
                className="btn-standard neu-inset year-dropdown-btn"
                aria-haspopup="listbox"
                aria-expanded={isYearDropdownOpen}
                aria-label={
                  lang === "en"
                    ? `Selected Year: ${selectedYear}. Click to change year.`
                    : `নির্বাচিত বছর: ${formatNumber(selectedYear)}। বছর পরিবর্তন করতে ক্লিক করুন।`
                }
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "7px",
                  padding: "5px 12px",
                  fontSize: "12px",
                  borderRadius: "var(--radius-pill, 9999px)",
                  cursor: "pointer",
                  color: "var(--text-primary)",
                  fontWeight: 600,
                  transition: "all 0.2s ease",
                  border: isYearDropdownOpen
                    ? "1px solid var(--cyan-400)"
                    : "1px solid var(--border-subtle)",
                  boxShadow: isYearDropdownOpen
                    ? "0 0 0 3px rgba(40, 123, 181, 0.2)"
                    : undefined,
                }}
              >
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="var(--cyan-400)"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                </svg>
                <span>
                  {t("hydrograph.yearLabel") || (lang === "en" ? "Year: " : "বছর: ")}
                  <strong
                    style={{
                      color: "var(--cyan-400)",
                      fontFamily: "var(--font-mono, monospace)",
                    }}
                  >
                    {formatNumber(selectedYear)}
                  </strong>
                </span>
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: "4px",
                    background:
                      selectedYear === 2026
                        ? "rgba(40, 123, 181, 0.16)"
                        : "rgba(183, 121, 31, 0.16)",
                    color:
                      selectedYear === 2026 ? "var(--cyan-400)" : "var(--amber-400)",
                    textTransform: "uppercase",
                    letterSpacing: "0.03em",
                  }}
                >
                  {selectedYear === 2026
                    ? (lang === "en" ? "Live" : "সিমুলেশন")
                    : (lang === "en" ? "Historic" : "ঐতিহাসিক")}
                </span>
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  style={{
                    transform: isYearDropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
                    transition: "transform 0.2s ease",
                    marginLeft: "2px",
                  }}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {/* Dropdown Menu List */}
              {isYearDropdownOpen && (
                <div
                  role="listbox"
                  aria-label={t("hydrograph.selectYearTitle") || (lang === "en" ? "Select Year" : "বছর নির্বাচন করুন")}
                  style={{
                    position: "absolute",
                    top: "calc(100% + 6px)",
                    left: 0,
                    zIndex: 100,
                    minWidth: "240px",
                    background: "var(--surface-card, #FFFFFF)",
                    border: "1px solid var(--border-subtle, #BDCFDA)",
                    borderRadius: "10px",
                    boxShadow:
                      "0 12px 28px -6px rgba(0, 0, 0, 0.25), 0 8px 16px -8px rgba(0, 0, 0, 0.15)",
                    padding: "6px",
                    backdropFilter: "blur(12px)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                  }}
                >
                  <div
                    style={{
                      padding: "6px 10px 4px",
                      fontSize: "11px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      color: "var(--text-muted)",
                      borderBottom: "1px solid var(--border-subtle)",
                      marginBottom: "4px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span>
                      {t("hydrograph.yearMenuTitle") ||
                        (lang === "en"
                          ? "Select Year (2020–2026)"
                          : "বছর নির্বাচন (২০২০–২০২৬)")}
                    </span>
                    <span style={{ fontSize: "10px", opacity: 0.8 }}>SW108</span>
                  </div>

                  {availableYears.map((yr) => {
                    const isSelected = yr === selectedYear;
                    const meta = yearMeta[yr] || {};
                    return (
                      <button
                        key={yr}
                        type="button"
                        role="option"
                        aria-selected={isSelected}
                        onClick={() => {
                          setSelectedYear(yr);
                          setIsYearDropdownOpen(false);
                        }}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          gap: "10px",
                          padding: "8px 12px",
                          borderRadius: "6px",
                          border: "none",
                          background: isSelected
                            ? "rgba(40, 123, 181, 0.15)"
                            : "transparent",
                          color: isSelected
                            ? "var(--cyan-400)"
                            : "var(--text-primary)",
                          cursor: "pointer",
                          fontSize: "13px",
                          fontWeight: isSelected ? 700 : 500,
                          textAlign: "left",
                          transition: "background 0.15s ease",
                          width: "100%",
                        }}
                        onMouseEnter={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background =
                              "var(--surface-active, rgba(0, 0, 0, 0.05))";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isSelected) {
                            e.currentTarget.style.background = "transparent";
                          }
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "var(--font-mono, monospace)",
                              fontSize: "13.5px",
                              fontWeight: isSelected ? 800 : 600,
                            }}
                          >
                            {formatNumber(yr)}
                          </span>
                          <span
                            style={{
                              fontSize: "10.5px",
                              padding: "1px 5px",
                              borderRadius: "4px",
                              background:
                                yr === 2026
                                  ? "rgba(40, 123, 181, 0.18)"
                                  : "rgba(128, 128, 128, 0.14)",
                              color:
                                yr === 2026
                                  ? "var(--cyan-400)"
                                  : "var(--text-muted)",
                            }}
                          >
                            {lang === "en" ? meta.en : meta.bn}
                          </span>
                        </div>
                        {isSelected && (
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="var(--cyan-400)"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="chart-header-actions">
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "14px", fontSize: "12px", color: "var(--text-secondary)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "14px", height: "3px", background: "#287BB5", borderRadius: "2px" }} />
              {t("hydrograph.modelledStage")}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "14px", height: "0px", borderTop: "2px dashed #173B57" }} />
              {t("hydrograph.bwdbObserved")}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "14px", height: "0px", borderTop: "2px dotted #566B7C" }} />
              {t("hydrograph.rainfallBaseline")}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "10px", height: "8px", background: "rgba(40, 123, 181, 0.18)", borderRadius: "2px", border: "1px solid rgba(40, 123, 181, 0.35)" }} />
              {t("hydrograph.uncertaintyBand")}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "10px", height: "8px", background: "rgba(40, 123, 181, 0.45)", borderRadius: "2px" }} />
              {t("hydrograph.imergRain")}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "14px", height: "0px", borderTop: "2px dashed #B7791F" }} />
              {t("hydrograph.dangerLevel")} ({formatNumber(dangerLevel.toFixed(2))}m)
            </span>
          </div>
        </div>
      </div>

      {/* Current Replay Snapshot — pinned above the chart for instant readability */}
      <div className="chart-current-bar">
        <div className="chart-current-main">
          <span className="chart-current-dot" aria-hidden="true" />
          <span className="chart-current-label">{t("hydrograph.currentSnapshot")}</span>
          <strong className="chart-current-date">{currentDateLabel}</strong>
          <span className="chart-current-time">
            {currentClock ? formatNumber(currentClock) : "—"} UTC
          </span>
        </div>
        <div className="chart-current-meta">
          <span className="chart-current-stage">
            {t("hydrograph.currentStage")}{" "}
            <strong>{formatNumber(current?.modelled_stage?.toFixed(2))} m PWD</strong>
          </span>
          <span className="chart-current-step">
            {t("hydrograph.stepLabel")} {formatNumber(sliderIdx + 1)}/{formatNumber(eventDataLength)}
          </span>
        </div>
      </div>

      {/* Danger Threshold & Estimated Crossing Intelligence Banner (§2 Forecast & Analysis) */}
      <div className="hydrograph-crossing-callout">
        <div className="crossing-badge-main">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--amber-400)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span style={{ fontWeight: 700, color: "var(--amber-400)" }}>
            {lang === "en" ? "STATUTORY DANGER THRESHOLD:" : "সরকারি বিপৎসীমা:"} {formatNumber(dangerLevel.toFixed(2))}m PWD
          </span>
        </div>

        <div className="crossing-badge-timing">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>
            {lang === "en" ? "Estimated Crossing Time:" : "বিপদসীমা অতিক্রমের পূর্বাভাস সময়:"}{" "}
            <strong style={{ color: "var(--text-primary)" }}>
              {lang === "en" ? `13 Apr ${selectedYear} · 01:00 UTC` : `১৩ এপ্রিল ${formatNumber(selectedYear)} · ০১:০০ UTC`}
            </strong>
          </span>
        </div>

        <div className="crossing-badge-lead">
          <span style={{ color: "var(--cyan-300)", fontWeight: 700 }}>
            {lang === "en" ? "Actionable Warning Lead:" : "কার্যকর সতর্কতা লিড:"} {formatNumber("22.0")} {lang === "en" ? "Hours" : "ঘণ্টা"}
          </span>
          <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>
            ({lang === "en" ? "Golden Harvest Window" : "বোরো ধান কর্তনের সুবর্ণ সময়"})
          </span>
        </div>
      </div>

      {/* 1. Rainfall Hyetograph (Inverted Bar Chart) */}
      <div style={{ width: "100%", height: 80, background: "transparent", padding: "4px 0" }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 2, right: 30, bottom: 0, left: 20 }}>
            <CartesianGrid stroke="#E5ECF0" vertical={false} />
            <XAxis dataKey="time" hide />
            <YAxis
              reversed
              domain={[0, "auto"]}
              tick={{ fontSize: 12, fill: "#566B7C", fontFamily: "var(--font-mono)" }}
              label={{
                value: t("hydrograph.rainAxis"),
                angle: -90,
                position: "insideLeft",
                fontSize: 12,
                fill: "#566B7C",
                offset: 10,
              }}
              width={55}
            />
            <Bar dataKey="rainfall" fill="rgba(40, 123, 181, 0.65)" radius={[0, 0, 2, 2]} />
            {currentTimeFormatted && (
              <ReferenceLine x={currentTimeFormatted} stroke="#287BB5" strokeWidth={1.5} strokeDasharray="3 3" />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* 2. Main Stage Hydrograph */}
      <div style={{ width: "100%", height: 320, background: "transparent", padding: "6px 0" }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 12, right: 30, bottom: 8, left: 20 }}>
            <CartesianGrid stroke="#E5ECF0" strokeDasharray="4 4" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 12, fill: "#566B7C", fontFamily: "var(--font-mono)" }}
              interval={14}
            />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fontSize: 12, fill: "#566B7C", fontFamily: "var(--font-mono)" }}
              label={{
                value: t("hydrograph.waterLevelAxis"),
                angle: -90,
                position: "insideLeft",
                fontSize: 12.5,
                fill: "#173B57",
                offset: 10,
              }}
              width={55}
            />

            {/* Uncertainty Band (§4.5: 8-15% opacity fill without thick border) */}
            <Area
              type="monotone"
              dataKey="upper"
              stroke="none"
              fill="rgba(40, 123, 181, 0.15)"
              activeDot={false}
              isAnimationActive={false}
              name={t("hydrograph.upperBound")}
            />
            <Area
              type="monotone"
              dataKey="lower"
              stroke="none"
              fill="#FFFFFF"
              activeDot={false}
              isAnimationActive={false}
              name={t("hydrograph.lowerBound")}
            />

            {/* Danger Level Reference Line (Amber Dashed at 13.20m) */}
            <ReferenceLine
              y={dangerLevel}
              stroke="#B7791F"
              strokeDasharray="6 4"
              strokeWidth={1.8}
              label={{
                value: `${t("hydrograph.dangerLabel")} ${formatNumber(dangerLevel.toFixed(2))}m`,
                position: "right",
                fontSize: 12,
                fill: "#B7791F",
                fontWeight: 700,
              }}
            />

            {/* Danger Crossing Point Indicator */}
            <ReferenceLine
              x="04-13 01:00"
              stroke="#B4232F"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              label={{
                value: lang === "en" ? "Danger Crossing (13.20m)" : "বিপদসীমা অতিক্রম (১৩.২০মি)",
                position: "insideBottomRight",
                fontSize: 12,
                fill: "#B4232F",
                fontWeight: 700,
              }}
            />

            {/* Current Slider Timestamp Cursor Indicator */}
            {currentTimeFormatted && (
              <ReferenceLine
                x={currentTimeFormatted}
                stroke="#287BB5"
                strokeWidth={2}
                strokeDasharray="4 2"
                label={{
                  value: `${currentTimeFormatted} UTC`,
                  position: "top",
                  fontSize: 12,
                  fill: "#287BB5",
                  fontWeight: 650,
                }}
              />
            )}

            {/* Modelled Hydrograph (Primary River Blue Solid Line) */}
            <Line
              type="monotone"
              dataKey="modelled"
              stroke="#287BB5"
              strokeWidth={2.8}
              dot={false}
              isAnimationActive={false}
              activeDot={{ r: 5, fill: "#287BB5", stroke: "#FFFFFF", strokeWidth: 2 }}
              name={t("hydrograph.modelledStage")}
            />

            {/* BWDB Observed Gauge (Deep Navy Dashed Line) */}
            <Line
              type="monotone"
              dataKey="observed"
              stroke="#173B57"
              strokeWidth={2}
              strokeDasharray="5 3"
              dot={false}
              isAnimationActive={false}
              activeDot={{ r: 4, fill: "#173B57", stroke: "#FFFFFF", strokeWidth: 2 }}
              name={t("hydrograph.bwdbObserved")}
              connectNulls={false}
            />

            {/* Baseline Water Stage (Grey Dotted Line) */}
            <Line
              type="monotone"
              dataKey="baseline"
              stroke="#64748B"
              strokeWidth={1.8}
              strokeDasharray="2 3"
              dot={false}
              isAnimationActive={false}
              activeDot={{ r: 3, fill: "#64748B", stroke: "#FFFFFF", strokeWidth: 1.5 }}
              name={t("hydrograph.rainfallBaseline")}
              connectNulls={false}
            />

            {/* Glassmorphic Chart Tooltip */}
            <Tooltip content={<CustomHydrographTooltip lang={lang} dangerLevel={dangerLevel} t={t} formatNumber={formatNumber} />} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* 3. Event Day Blocks — quick day-level navigation under the hydrograph */}
      {eventDays.length > 0 && (
        <div className="event-day-block">
          <div className="event-day-block-head">
            <div className="event-day-block-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>{t("hydrograph.dayBlockTitle")}</span>
            </div>
            <span className="event-day-block-hint">{t("hydrograph.dayBlockHint")}</span>
          </div>

          <div
            className="event-day-rail"
            ref={dayRailRef}
            role="group"
            aria-label={t("hydrograph.dayRailLabel")}
          >
            {eventDays.map((day) => {
              const isActive = day.key === activeDayKey;
              return (
                <button
                  key={day.key}
                  type="button"
                  className={`event-day-chip ${isActive ? "active" : ""}`}
                  data-active-day={isActive ? "true" : undefined}
                  aria-pressed={isActive}
                  aria-label={`${day.fullLabel} · 00:00 UTC`}
                  title={`${day.fullLabel} · 00:00 UTC`}
                  onClick={() => jumpToDay(day)}
                >
                  <span className="event-day-chip-weekday">{day.weekday}</span>
                  <span className="event-day-chip-day">{day.day}</span>
                  <span className="event-day-chip-month">{day.month}</span>
                </button>
              );
            })}
          </div>

          <div className="event-day-block-foot">
            <div className="event-day-block-selected" aria-live="polite">
              <span className="event-day-block-selected-label">{t("hydrograph.selectedDay")}</span>
              <strong className="event-day-block-selected-value">
                {activeDay ? activeDay.fullLabel : "—"}
              </strong>
              <span className="event-day-block-selected-time">{formatNumber("00:00")} UTC</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Timeline Scrubber & Replay Controller (§4.5 Timeline Scrubber) */}
      <div className="timeline-controller-card">
        <div className="timeline-controller-top">
          {/* Playback Button & Step Controls */}
          <div className="timeline-playback-controls">
            <button
              className="timeline-play-btn"
              onClick={() => setIsPlaying(!isPlaying)}
              title={isPlaying ? t("hydrograph.pauseAnimation") : t("hydrograph.playAnimation")}
              aria-label={isPlaying ? t("hydrograph.pauseAnimation") : t("hydrograph.playAnimation")}
            >
              {isPlaying ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <rect x="6" y="4" width="4" height="16" rx="1" />
                  <rect x="14" y="4" width="4" height="16" rx="1" />
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
            </button>

            {/* Unified, real-time custom time-skip control */}
            <div className="timeline-skip-control" role="group" aria-label={t("hydrograph.timeSkip")}>
              <span className="timeline-skip-label">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <polyline points="12 7 12 12 15.5 14" />
                </svg>
                <span>{t("hydrograph.skipBy")}</span>
              </span>

              <div className="timeline-skip-stepper">
                <button
                  type="button"
                  className="timeline-skip-arrow"
                  onClick={() => applyTimeSkip(-1)}
                  disabled={sliderIdx <= 0}
                  title={t("hydrograph.skipBackHours", { hours: effectiveSkipHours })}
                  aria-label={t("hydrograph.skipBackHours", { hours: effectiveSkipHours })}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                </button>

                <label className="timeline-skip-value" htmlFor="timeline-skip-hours">
                  <input
                    id="timeline-skip-hours"
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={Math.max(1, eventDataLength - 1)}
                    step={1}
                    value={skipHours}
                    aria-label={t("hydrograph.skipHours")}
                    onFocus={(event) => event.currentTarget.select()}
                    onChange={(event) => setSkipHours(event.target.value)}
                    onBlur={() => setSkipHours(String(effectiveSkipHours))}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter") return;
                      event.preventDefault();
                      applyTimeSkip(event.shiftKey ? -1 : 1);
                    }}
                  />
                  <span className="timeline-skip-unit" aria-hidden="true">
                    {t("hydrograph.hoursShort")}
                  </span>
                </label>

                <button
                  type="button"
                  className="timeline-skip-arrow"
                  onClick={() => applyTimeSkip(1)}
                  disabled={sliderIdx >= eventDataLength - 1}
                  title={t("hydrograph.skipForwardHours", { hours: effectiveSkipHours })}
                  aria-label={t("hydrograph.skipForwardHours", { hours: effectiveSkipHours })}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              </div>
            </div>

            <button
              className="btn-standard neu-inset"
              style={{ minHeight: "44px", minWidth: "44px", padding: "0 14px", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "6px" }}
              onClick={() => setSliderIdx(peakIdx)}
              title={t("hydrograph.jumpToPeak")}
              aria-label={t("hydrograph.jumpToPeak")}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <span>{lang === "en" ? "Peak" : "শীর্ষ"}</span>
            </button>

            {/* Speed Selector */}
            <div className="timeline-speed-selector" role="group" aria-label={t("hydrograph.playbackSpeed")}>
              {[1, 2, 5].map((speed) => (
                <button
                  key={speed}
                  className={`speed-btn ${playSpeed === speed ? "active" : ""}`}
                  onClick={() => setPlaySpeed(speed)}
                  aria-pressed={playSpeed === speed}
                  aria-label={`${speed}x ${t("hydrograph.playbackSpeed")}`}
                >
                  {formatNumber(speed)}x
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Tactile Range Scrubber Track (§4.5 & WCAG Keyboard Navigation) */}
        <div className="timeline-slider-track-wrap">
          <input
            type="range"
            className="timeline-scrubber-input"
            min={0}
            max={eventDataLength - 1}
            value={sliderIdx}
            aria-label={t("hydrograph.timelineScrubber")}
            aria-valuemin={0}
            aria-valuemax={eventDataLength - 1}
            aria-valuenow={sliderIdx}
            aria-valuetext={`${dateStr} ${timeStr} UTC, ${lang === "en" ? "Stage" : "পানি স্তর"}: ${current?.modelled_stage?.toFixed(2)}m`}
            onChange={(e) => {
              setIsPlaying(false);
              setSliderIdx(Number(e.target.value));
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowLeft") {
                e.preventDefault();
                setIsPlaying(false);
                setSliderIdx((i) => Math.max(0, i - 1));
              } else if (e.key === "ArrowRight") {
                e.preventDefault();
                setIsPlaying(false);
                setSliderIdx((i) => Math.min(eventDataLength - 1, i + 1));
              } else if (e.key === "PageDown") {
                e.preventDefault();
                setIsPlaying(false);
                setSliderIdx((i) => Math.max(0, i - 12));
              } else if (e.key === "PageUp") {
                e.preventDefault();
                setIsPlaying(false);
                setSliderIdx((i) => Math.min(eventDataLength - 1, i + 12));
              } else if (e.key === "Home") {
                e.preventDefault();
                setIsPlaying(false);
                setSliderIdx(0);
              } else if (e.key === "End") {
                e.preventDefault();
                setIsPlaying(false);
                setSliderIdx(eventDataLength - 1);
              }
            }}
          />
        </div>

        {/* Start / End Date Extents */}
        <div className="timeline-date-extents">
          <span>{startDateStr} ({lang === "en" ? "Event Start" : "শুরু"})</span>
          <span style={{ color: "var(--cyan-400)" }}>
            {lang === "en"
              ? `April ${selectedYear} Flash Flood Replay Event`
              : `এপ্রিল ${formatNumber(selectedYear)} পাহাড়ি ঢল সিমুলেশন ইভেন্ট`}
          </span>
          <span>{endDateStr} ({lang === "en" ? "Event End" : "সমাপ্তি"})</span>
        </div>
      </div>
    </section>
  );
}

function CustomHydrographTooltip({ active, payload, label, lang, dangerLevel, formatNumber }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="chart-tooltip-glass">
      <div className="tooltip-time-head" style={{ display: "flex", alignItems: "center", gap: "5px" }}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span>{label} UTC</span>
      </div>

      {payload.map((p, i) => {
        if (p.value == null) return null;
        const color = p.stroke || p.fill || "#35D8F2";
        const val = typeof p.value === "number" ? p.value.toFixed(2) : p.value;
        const formattedVal = formatNumber ? formatNumber(val) : val;
        const isRain = p.dataKey === "rainfall";

        return (
          <div key={i} className="tooltip-row-item">
            <span style={{ display: "flex", alignItems: "center" }}>
              <span className="tooltip-indicator-dot" style={{ background: color }} />
              <span style={{ color: "var(--text-secondary)" }}>{p.name}:</span>
            </span>
            <strong style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
              {formattedVal} {isRain ? (lang === "en" ? "mm/h" : "মিমি/ঘ") : "m PWD"}
            </strong>
          </div>
        );
      })}

      <div style={{ marginTop: 8, paddingTop: 6, borderTop: "1px solid var(--border-subtle)", fontSize: "12.5px", color: "var(--text-secondary)" }}>
        <span>{lang === "en" ? "Danger Level: " : "বিপদসীমা: "}</span>
        <strong style={{ color: "var(--red-critical)" }}>{formatNumber ? formatNumber(dangerLevel) : dangerLevel} m</strong>
      </div>
    </div>
  );
}
