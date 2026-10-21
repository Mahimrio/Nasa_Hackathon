"use client";

import { useState, useEffect } from "react";
import { useLocale } from "../hooks/useLocale";
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
}) {
  const { lang, t, formatNumber } = useLocale();
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSpeed, setPlaySpeed] = useState(1); // 1x, 2x, 5x

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

  const currentTimeFormatted = current ? current.timestamp.slice(5, 16).replace("T", " ") : "";
  const reachDisplayName = selectedReach
    ? lang === "en"
      ? selectedReach.name
      : selectedReach.name_bn
    : (lang === "en" ? "SW108 Kanaighat" : "SW১০৮ কানাইঘাট");

  const corridorText = selectedReach?.river === "Kushiyara"
    ? t("hydrograph.corridorKushiyara")
    : t("hydrograph.corridorSurma");

  return (
    <section className="glass-panel card-padding hydrograph-panel" aria-label="Hydrologic Time-Series Analysis">
      {/* Screen Reader Chart Summary Alternative (§8 Accessibility) */}
      <div className="sr-only" role="region" aria-label="Hydrograph Accessible Summary">
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
        <div className="card-title-group">
          <div className="card-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <div>
            <div className="card-title">
              {t("hydrograph.title")} {reachDisplayName} {corridorText}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="chart-header-actions">
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "14px", fontSize: "12px", color: "var(--text-secondary)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "14px", height: "3px", background: "#35D8F2", borderRadius: "2px" }} />
              {t("hydrograph.modelledStage")}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "14px", height: "0px", borderTop: "2px dashed #F8FAFC" }} />
              {t("hydrograph.bwdbObserved")}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "14px", height: "0px", borderTop: "2px dotted #94A3B8" }} />
              {t("hydrograph.rainfallBaseline")}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "10px", height: "8px", background: "rgba(53, 216, 242, 0.2)", borderRadius: "2px" }} />
              {t("hydrograph.uncertaintyBand")}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "10px", height: "8px", background: "rgba(56, 189, 248, 0.6)", borderRadius: "2px" }} />
              {t("hydrograph.imergRain")}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "14px", height: "0px", borderTop: "2px dashed #FFC45C" }} />
              {t("hydrograph.dangerLevel")} ({formatNumber(dangerLevel.toFixed(2))}m)
            </span>
          </div>
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
              {lang === "en" ? "13 Apr 2026 · 01:00 UTC" : "১৩ এপ্রিল ২০২৬ · ০১:০০ UTC"}
            </strong>
          </span>
        </div>

        <div className="crossing-badge-lead">
          <span style={{ color: "var(--cyan-300)", fontWeight: 700 }}>
            {lang === "en" ? "Actionable Warning Lead:" : "কার্যকর সতর্কতা লিড:"} {formatNumber("22.0")} {lang === "en" ? "Hours" : "ঘণ্টা"}
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
            ({lang === "en" ? "Golden Harvest Window" : "বোরো ধান কর্তনের সুবর্ণ সময়"})
          </span>
        </div>
      </div>

      {/* 1. Rainfall Hyetograph (Inverted Bar Chart) */}
      <div style={{ width: "100%", height: 75, background: "transparent", padding: "4px 0" }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 2, right: 30, bottom: 0, left: 20 }}>
            <CartesianGrid stroke="rgba(159, 191, 224, 0.06)" vertical={false} />
            <XAxis dataKey="time" hide />
            <YAxis
              reversed
              domain={[0, "auto"]}
              tick={{ fontSize: 10, fill: "#94A3B8", fontFamily: "var(--font-mono)" }}
              label={{
                value: t("hydrograph.rainAxis"),
                angle: -90,
                position: "insideLeft",
                fontSize: 10,
                fill: "#94A3B8",
                offset: 10,
              }}
              width={55}
            />
            <Bar dataKey="rainfall" fill="rgba(56, 189, 248, 0.55)" radius={[0, 0, 2, 2]} />
            {currentTimeFormatted && (
              <ReferenceLine x={currentTimeFormatted} stroke="#38BDF8" strokeWidth={1.5} strokeDasharray="3 3" />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* 2. Main Stage Hydrograph */}
      <div style={{ width: "100%", height: 320, background: "transparent", padding: "6px 0" }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 12, right: 30, bottom: 8, left: 20 }}>
            <CartesianGrid stroke="rgba(159, 191, 224, 0.08)" strokeDasharray="4 4" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: "#94A3B8", fontFamily: "var(--font-mono)" }}
              interval={14}
            />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fontSize: 10.5, fill: "#71849C", fontFamily: "var(--font-mono)" }}
              label={{
                value: t("hydrograph.waterLevelAxis"),
                angle: -90,
                position: "insideLeft",
                fontSize: 11,
                fill: "#A9BAD0",
                offset: 10,
              }}
              width={55}
            />

            {/* Uncertainty Band (§4.5: 8-15% opacity fill without thick border) */}
            <Area
              type="monotone"
              dataKey="upper"
              stroke="none"
              fill="rgba(53, 216, 242, 0.14)"
              activeDot={false}
              isAnimationActive={false}
              name={t("hydrograph.upperBound")}
            />
            <Area
              type="monotone"
              dataKey="lower"
              stroke="none"
              fill="#060c16"
              activeDot={false}
              isAnimationActive={false}
              name={t("hydrograph.lowerBound")}
            />

            {/* Danger Level Reference Line (Amber Dashed at 13.20m) */}
            <ReferenceLine
              y={dangerLevel}
              stroke="#FFC45C"
              strokeDasharray="6 4"
              strokeWidth={1.8}
              label={{
                value: `${t("hydrograph.dangerLabel")} ${formatNumber(dangerLevel.toFixed(2))}m`,
                position: "right",
                fontSize: 10,
                fill: "#FFC45C",
                fontWeight: 700,
              }}
            />

            {/* Danger Crossing Point Indicator */}
            <ReferenceLine
              x="04-13 01:00"
              stroke="#FF647C"
              strokeWidth={1.5}
              strokeDasharray="3 3"
              label={{
                value: lang === "en" ? "Danger Crossing (13.20m)" : "বিপদসীমা অতিক্রম (১৩.২০মি)",
                position: "insideBottomRight",
                fontSize: 9.5,
                fill: "#FF647C",
                fontWeight: 700,
              }}
            />

            {/* Current Slider Timestamp Cursor Indicator */}
            {currentTimeFormatted && (
              <ReferenceLine
                x={currentTimeFormatted}
                stroke="#38BDF8"
                strokeWidth={2}
                strokeDasharray="4 2"
                label={{
                  value: `${currentTimeFormatted} UTC`,
                  position: "top",
                  fontSize: 10,
                  fill: "#38BDF8",
                  fontWeight: 600,
                }}
              />
            )}

            {/* Modelled Hydrograph (Cyan Solid Line with Soft Ambient Glow) */}
            <Line
              type="monotone"
              dataKey="modelled"
              stroke="#38BDF8"
              strokeWidth={2.8}
              dot={false}
              isAnimationActive={false}
              activeDot={{ r: 5, fill: "#38BDF8", stroke: "#050A12", strokeWidth: 2 }}
              name={t("hydrograph.modelledStage")}
            />

            {/* BWDB Observed Gauge (White Dashed Line) */}
            <Line
              type="monotone"
              dataKey="observed"
              stroke="#F8FAFC"
              strokeWidth={2}
              strokeDasharray="5 3"
              dot={false}
              isAnimationActive={false}
              activeDot={{ r: 4, fill: "#F8FAFC", stroke: "#050A12", strokeWidth: 2 }}
              name={t("hydrograph.bwdbObserved")}
              connectNulls={false}
            />

            {/* Baseline Water Stage (Grey Dotted Line) */}
            <Line
              type="monotone"
              dataKey="baseline"
              stroke="#94A3B8"
              strokeWidth={1.8}
              strokeDasharray="2 3"
              dot={false}
              isAnimationActive={false}
              activeDot={{ r: 3, fill: "#94A3B8", stroke: "#050A12", strokeWidth: 1.5 }}
              name={t("hydrograph.rainfallBaseline")}
              connectNulls={false}
            />

            {/* Glassmorphic Chart Tooltip */}
            <Tooltip content={<CustomHydrographTooltip lang={lang} dangerLevel={dangerLevel} t={t} formatNumber={formatNumber} />} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* 3. Timeline Scrubber & Replay Controller (§4.5 Timeline Scrubber) */}
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

            <button
              className="btn-standard neu-inset"
              style={{ minHeight: "44px", minWidth: "44px", padding: "0 14px", fontSize: "13px" }}
              onClick={() => setSliderIdx((i) => Math.max(0, i - 1))}
              title={t("hydrograph.stepBackward")}
              aria-label={t("hydrograph.stepBackward")}
            >
              -1h
            </button>
            <button
              className="btn-standard neu-inset"
              style={{ minHeight: "44px", minWidth: "44px", padding: "0 14px", fontSize: "13px" }}
              onClick={() => setSliderIdx((i) => Math.min(eventDataLength - 1, i + 1))}
              title={t("hydrograph.stepForward")}
              aria-label={t("hydrograph.stepForward")}
            >
              +1h
            </button>
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

          {/* Current Date & UTC Readout */}
          <div className="timeline-current-timestamp-badge">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>{dateStr} — {timeStr} UTC</span>
            <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              ({lang === "en" ? "Step" : "পর্যায়"} {formatNumber(sliderIdx + 1)}/{formatNumber(eventDataLength)})
            </span>
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
            {lang === "en" ? "April 2026 Flash Flood Replay Event" : "এপ্রিল ২০২৬ পাহাড়ি ঢল সিমুলেশন ইভেন্ট"}
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

      <div style={{ marginTop: 6, paddingTop: 4, borderTop: "1px solid rgba(177,221,255,0.1)", fontSize: "10.5px", color: "var(--text-muted)" }}>
        <span>{lang === "en" ? "Danger Level: " : "বিপদসীমা: "}</span>
        <strong style={{ color: "#FF647C" }}>{formatNumber ? formatNumber(dangerLevel) : dangerLevel} m</strong>
      </div>
    </div>
  );
}
