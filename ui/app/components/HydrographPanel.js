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
            <div className="card-eyebrow">
              {lang === "en" ? "HYDROLOGIC ROUTING & SATELLITE HYETOGRAPH" : "হাইড্রোসিন্থেটিক রাউটিং এবং বৃষ্টিপাত গ্রাফ"}
            </div>
            <div className="card-title">
              {lang === "en"
                ? "Hydrograph — SW108 Kanaighat (Surma River Corridor)"
                : "হাইড্রোগ্রাফ — SW১০৮ কানাইঘাট (সুরমা নদী)"}
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="chart-header-actions">
          <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "11px", color: "var(--text-secondary)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "12px", height: "3px", background: "#35D8F2", borderRadius: "2px" }} />
              {lang === "en" ? "Modelled Stage" : "মডেল স্তর"}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "12px", height: "3px", background: "#FFC45C", borderTop: "2px dashed #FFC45C" }} />
              {lang === "en" ? "BWDB Observed" : "পর্যবেক্ষিত"}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "10px", height: "8px", background: "rgba(53, 216, 242, 0.2)", borderRadius: "2px" }} />
              {lang === "en" ? "±0.18m Uncertainty" : "±০.১৮ মি অনিশ্চয়তা"}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "10px", height: "8px", background: "rgba(77, 170, 223, 0.6)", borderRadius: "2px" }} />
              {lang === "en" ? "IMERG Rain (mm/h)" : "বৃষ্টি (মিমি/ঘ)"}
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "12px", height: "2px", background: "#FF647C", borderTop: "2px dashed #FF647C" }} />
              {lang === "en" ? "Danger (13.20m)" : "বিপদসীমা"}
            </span>
          </div>
        </div>
      </div>

      {/* 1. Rainfall Hyetograph (Inverted Bar Chart) */}
      <div style={{ width: "100%", height: 75, background: "rgba(6, 12, 22, 0.5)", borderRadius: "8px", padding: "4px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 2, right: 30, bottom: 0, left: 20 }}>
            <CartesianGrid stroke="rgba(159, 191, 224, 0.06)" vertical={false} />
            <XAxis dataKey="time" hide />
            <YAxis
              reversed
              domain={[0, "auto"]}
              tick={{ fontSize: 9.5, fill: "#71849C", fontFamily: "var(--font-mono)" }}
              label={{
                value: lang === "en" ? "Rain (mm/h)" : "বৃষ্টি (mm/h)",
                angle: -90,
                position: "insideLeft",
                fontSize: 9.5,
                fill: "#71849C",
                offset: 10,
              }}
              width={55}
            />
            <Bar dataKey="rainfall" fill="rgba(53, 216, 242, 0.55)" radius={[0, 0, 2, 2]} />
            {currentTimeFormatted && (
              <ReferenceLine x={currentTimeFormatted} stroke="#74ECFF" strokeWidth={1.5} strokeDasharray="3 3" />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* 2. Main Stage Hydrograph */}
      <div style={{ width: "100%", height: 320, background: "rgba(6, 12, 22, 0.6)", borderRadius: "8px", padding: "6px" }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 12, right: 30, bottom: 8, left: 20 }}>
            <CartesianGrid stroke="rgba(159, 191, 224, 0.08)" strokeDasharray="4 4" />
            <XAxis
              dataKey="time"
              tick={{ fontSize: 10, fill: "#71849C", fontFamily: "var(--font-mono)" }}
              interval={14}
            />
            <YAxis
              domain={["auto", "auto"]}
              tick={{ fontSize: 10.5, fill: "#71849C", fontFamily: "var(--font-mono)" }}
              label={{
                value: lang === "en" ? "Stage (m PWD)" : "পানি স্তর (m PWD)",
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

            {/* Danger Level Reference Line */}
            <ReferenceLine
              y={dangerLevel}
              stroke="#FF647C"
              strokeDasharray="6 4"
              strokeWidth={1.5}
              label={{
                value: lang === "en" ? `Danger ${dangerLevel}m` : `বিপদসীমা ${dangerLevel}m`,
                position: "right",
                fontSize: 10,
                fill: "#FF647C",
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

            {/* Observed Water Stage (Gold Dashed Line with Dots) */}
            <Line
              type="monotone"
              dataKey="observed"
              stroke="#FFC45C"
              strokeWidth={2}
              strokeDasharray="5 3"
              dot={false}
              activeDot={{ r: 4, fill: "#FFC45C", stroke: "#050A12", strokeWidth: 1.5 }}
              name={lang === "en" ? "BWDB Observed" : "BWDB পর্যবেক্ষণ"}
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
              {isPlaying ? "❚❚" : "▶"}
            </button>

            <button
              className="btn-standard neu-inset"
              style={{ height: "32px", padding: "0 10px", fontSize: "11px" }}
              onClick={() => setSliderIdx((i) => Math.max(0, i - 1))}
              title="Step Backward 1 hour"
            >
              -1h
            </button>
            <button
              className="btn-standard neu-inset"
              style={{ height: "32px", padding: "0 10px", fontSize: "11px" }}
              onClick={() => setSliderIdx((i) => Math.min(eventDataLength - 1, i + 1))}
              title="Step Forward 1 hour"
            >
              +1h
            </button>
            <button
              className="btn-standard neu-inset"
              style={{ height: "32px", padding: "0 10px", fontSize: "11px" }}
              onClick={() => setSliderIdx(peakIdx)}
              title="Jump Directly to Peak Water Level"
            >
              ⚡ Peak
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
            <span>🗓</span>
            <span>{dateStr} — {timeStr} UTC</span>
            <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
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
      <div className="tooltip-time-head">
        ⏱ {label} UTC
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
