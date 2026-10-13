"use client";

import { useState, useEffect } from "react";
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
  lang,
  peakIdx,
  selectedReach,
}) {
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
    : "SW108 Kanaighat";

  return (
    <section className="glass-panel card-padding hydrograph-panel" aria-label="Hydrologic Time-Series Analysis">
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
              {lang === "en"
                ? `Hydrograph — ${reachDisplayName} (Surma River Corridor)`
                : `হাইড্রোগ্রাফ — ${reachDisplayName} (সুরমা নদী)`}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="chart-header-actions">
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "14px", fontSize: "12px", color: "var(--text-secondary)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "14px", height: "3px", background: "#35D8F2", borderRadius: "2px" }} />
              {lang === "en" ? "Modelled Stage" : "মডেল স্তর"}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "14px", height: "0px", borderTop: "2px dashed #F8FAFC" }} />
              {lang === "en" ? "BWDB Observed" : "পর্যবেক্ষিত"}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "14px", height: "0px", borderTop: "2px dotted #94A3B8" }} />
              {lang === "en" ? "Rainfall Baseline" : "বেসলাইন"}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "10px", height: "8px", background: "rgba(53, 216, 242, 0.2)", borderRadius: "2px" }} />
              {lang === "en" ? "±0.18m Uncertainty" : "±০.১৮ মি অনিশ্চয়তা"}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "10px", height: "8px", background: "rgba(56, 189, 248, 0.6)", borderRadius: "2px" }} />
              {lang === "en" ? "IMERG Rain (mm/h)" : "বৃষ্টি (মিমি/ঘ)"}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "14px", height: "0px", borderTop: "2px dashed #FFC45C" }} />
              {lang === "en" ? `Danger (${dangerLevel.toFixed(2)}m)` : `বিপদসীমা (${dangerLevel.toFixed(2)}m)`}
            </span>
          </div>
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
                value: lang === "en" ? "Rain (mm/h)" : "বৃষ্টি (mm/h)",
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
                value: lang === "en" ? "Water Level (m PWD)" : "পানির স্তর (m PWD)",
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
              name={lang === "en" ? "Upper 95% Bound" : "ঊর্ধ্ব সীমা"}
            />
            <Area
              type="monotone"
              dataKey="lower"
              stroke="none"
              fill="#060c16"
              activeDot={false}
              isAnimationActive={false}
              name={lang === "en" ? "Lower 95% Bound" : "নিম্ন সীমা"}
            />

            {/* Danger Level Reference Line (Amber Dashed at 13.20m) */}
            <ReferenceLine
              y={dangerLevel}
              stroke="#FFC45C"
              strokeDasharray="6 4"
              strokeWidth={1.8}
              label={{
                value: lang === "en" ? `Danger ${dangerLevel.toFixed(2)}m` : `বিপদসীমা ${dangerLevel.toFixed(2)}m`,
                position: "right",
                fontSize: 10,
                fill: "#FFC45C",
                fontWeight: 700,
              }}
            />

            {/* Active Current Time Cursor */}
            {currentTimeFormatted && (
              <ReferenceLine
                x={currentTimeFormatted}
                stroke="#35D8F2"
                strokeWidth={2}
                label={{
                  value: "▲ Current",
                  position: "top",
                  fontSize: 9.5,
                  fill: "#35D8F2",
                  fontWeight: 700,
                }}
              />
            )}

            {/* Modelled Water Stage (Cyan Solid Line with Soft Glow) */}
            <Line
              type="monotone"
              dataKey="modelled"
              stroke="#35D8F2"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 5, fill: "#35D8F2", stroke: "#F2F7FF", strokeWidth: 2 }}
              name={lang === "en" ? "Modelled Stage" : "মডেল স্তর"}
            />

            {/* Observed Water Stage (White Dashed Line with Soft Points) */}
            <Line
              type="monotone"
              dataKey="observed"
              stroke="#F8FAFC"
              strokeWidth={2}
              strokeDasharray="5 3"
              dot={false}
              activeDot={{ r: 4, fill: "#F8FAFC", stroke: "#050A12", strokeWidth: 1.5 }}
              name={lang === "en" ? "BWDB Observed" : "BWDB পর্যবেক্ষণ"}
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
              activeDot={{ r: 3, fill: "#94A3B8", stroke: "#050A12", strokeWidth: 1.5 }}
              name={lang === "en" ? "Rainfall Baseline" : "বৃষ্টি বেসলাইন"}
              connectNulls={false}
            />

            {/* Glassmorphic Chart Tooltip */}
            <Tooltip content={<CustomHydrographTooltip lang={lang} dangerLevel={dangerLevel} />} />
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
              title={isPlaying ? "Pause Replay" : "Play Flood Simulation Replay"}
              aria-label={isPlaying ? "Pause Timeline Replay" : "Start Timeline Replay"}
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
              style={{ height: "32px", padding: "0 10px", fontSize: "12px" }}
              onClick={() => setSliderIdx((i) => Math.max(0, i - 1))}
              title="Step Backward 1 hour"
            >
              -1h
            </button>
            <button
              className="btn-standard neu-inset"
              style={{ height: "32px", padding: "0 10px", fontSize: "12px" }}
              onClick={() => setSliderIdx((i) => Math.min(eventDataLength - 1, i + 1))}
              title="Step Forward 1 hour"
            >
              +1h
            </button>
            <button
              className="btn-standard neu-inset"
              style={{ height: "32px", padding: "0 10px", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}
              onClick={() => setSliderIdx(peakIdx)}
              title="Jump Directly to Peak Water Level"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
              </svg>
              <span>Peak</span>
            </button>

            {/* Speed Selector */}
            <div className="timeline-speed-selector">
              {[1, 2, 5].map((speed) => (
                <button
                  key={speed}
                  className={`speed-btn ${playSpeed === speed ? "active" : ""}`}
                  onClick={() => setPlaySpeed(speed)}
                >
                  {speed}x
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
              (Step {sliderIdx + 1}/{eventDataLength})
            </span>
          </div>
        </div>

        {/* Tactile Range Scrubber Track */}
        <div className="timeline-slider-track-wrap">
          <input
            type="range"
            className="timeline-scrubber-input"
            min={0}
            max={eventDataLength - 1}
            value={sliderIdx}
            onChange={(e) => {
              setIsPlaying(false);
              setSliderIdx(Number(e.target.value));
            }}
            aria-label="Event timeline scrubber"
          />
        </div>

        {/* Start / End Date Extents */}
        <div className="timeline-date-extents">
          <span>{startDateStr} (Event Start)</span>
          <span style={{ color: "var(--cyan-400)" }}>April 2026 Flash Flood Replay Event</span>
          <span>{endDateStr} (Event End)</span>
        </div>
      </div>
    </section>
  );
}

function CustomHydrographTooltip({ active, payload, label, lang, dangerLevel }) {
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
        const isRain = p.dataKey === "rainfall";

        return (
          <div key={i} className="tooltip-row-item">
            <span style={{ display: "flex", alignItems: "center" }}>
              <span className="tooltip-indicator-dot" style={{ background: color }} />
              <span style={{ color: "var(--text-secondary)" }}>{p.name}:</span>
            </span>
            <strong style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
              {val} {isRain ? "mm/h" : "m PWD"}
            </strong>
          </div>
        );
      })}

      <div style={{ marginTop: 6, paddingTop: 4, borderTop: "1px solid rgba(177,221,255,0.1)", fontSize: "10.5px", color: "var(--text-muted)" }}>
        <span>Danger Level: </span>
        <strong style={{ color: "#FF647C" }}>{dangerLevel} m</strong>
      </div>
    </div>
  );
}
