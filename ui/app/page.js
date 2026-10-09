"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, ComposedChart, Bar,
} from "recharts";

/* ================================================================
   HydroSense-SWOT Dashboard
   Tier 4 User Delivery Interface per SOLUTION_ARCHITECTURE.md v3.0
   ================================================================ */

// ---- FLAG ICONS (text + icon, never color alone — §4.3) ----
const FLAG_CONFIG = {
  GREEN: { icon: "✓", color: "#22c55e", label: "NORMAL", labelBn: "স্বাভাবিক" },
  AMBER: { icon: "⚠", color: "#f59e0b", label: "WATCH",  labelBn: "সতর্কতা" },
  RED:   { icon: "⛔", color: "#ef4444", label: "CRITICAL", labelBn: "জরুরি" },
};

export default function DashboardPage() {
  const [eventData, setEventData]       = useState(null);
  const [gaugeData, setGaugeData]       = useState(null);
  const [metrics, setMetrics]           = useState(null);
  const [reachMeta, setReachMeta]       = useState(null);
  const [calibration, setCalibration]   = useState(null);
  const [sliderIdx, setSliderIdx]       = useState(0);
  const [lang, setLang]                 = useState("en");
  const [loading, setLoading]           = useState(true);

  // ---- DATA LOADING ----
  useEffect(() => {
    Promise.all([
      fetch("/data/event_timeseries.json").then(r => r.json()),
      fetch("/data/gauge_observations.json").then(r => r.json()),
      fetch("/data/metrics_summary.json").then(r => r.json()),
      fetch("/data/reach_metadata.json").then(r => r.json()),
      fetch("/data/calibration_summary.json").then(r => r.json()),
    ]).then(([ev, ga, met, rm, cal]) => {
      setEventData(ev);
      setGaugeData(ga);
      setMetrics(met);
      setReachMeta(rm);
      setCalibration(cal);
      // Default slider to peak date (driven from DATA, not hardcoded — Trap B10)
      const peakIdx = ev.reduce((best, d, i) =>
        d.modelled_stage > ev[best].modelled_stage ? i : best, 0);
      setSliderIdx(Math.max(0, peakIdx - 48)); // Start ~1 day before peak
      setLoading(false);
    }).catch(err => {
      console.error("Failed to load data:", err);
      setLoading(false);
    });
  }, []);

  // ---- CURRENT SNAPSHOT ----
  const current = useMemo(() => {
    if (!eventData || sliderIdx >= eventData.length) return null;
    return eventData[sliderIdx];
  }, [eventData, sliderIdx]);

  // ---- CHART DATA (show ±3 days around slider) ----
  const chartWindow = useMemo(() => {
    if (!eventData || !gaugeData) return [];
    const windowSize = 144; // 144 hourly points ≈ 6 days
    const start = Math.max(0, sliderIdx - 72);
    const end = Math.min(eventData.length, start + windowSize);
    const sliced = eventData.slice(start, end);

    // Merge gauge observations by timestamp
    const gaugeMap = {};
    gaugeData.forEach(g => { gaugeMap[g.timestamp] = g.water_level_m; });

    return sliced.map(d => ({
      time: d.timestamp.slice(5, 16).replace("T", " "),
      timestamp: d.timestamp,
      modelled: d.modelled_stage,
      lower: d.stage_lower,
      upper: d.stage_upper,
      observed: gaugeMap[d.timestamp] ?? null,
      rainfall: d.imerg_map_mmh,
      flag: d.harvest_flag,
    }));
  }, [eventData, gaugeData, sliderIdx]);

  // ---- GAUGE VALUE AT CURRENT TIMESTAMP ----
  const currentGaugeLevel = useMemo(() => {
    if (!gaugeData || !current) return null;
    const match = gaugeData.find(g => g.timestamp === current.timestamp);
    return match ? match.water_level_m : null;
  }, [gaugeData, current]);

  // ---- FLAG HISTORY (for reach map coloring) ----
  const reachRiskLevel = useCallback((reachId) => {
    if (!current) return "GREEN";
    // Primary reach has direct flag; others derived from stage ratio
    if (reachId === "22211000011") return current.harvest_flag;
    // Secondary reaches: approximate from future_stage
    if (current.future_stage >= 13.20) return "RED";
    if (current.future_stage >= 13.20 * 0.80) return "AMBER";
    return "GREEN";
  }, [current]);

  // ---- LOADING STATE ----
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <div className="loading-text">Loading HydroSense pipeline data…</div>
      </div>
    );
  }

  if (!eventData || !current) {
    return (
      <div className="loading-screen">
        <div className="loading-text" style={{ color: "#ef4444" }}>
          Error: Could not load pipeline data. Run `python scripts/export_json.py` first.
        </div>
      </div>
    );
  }

  const flagConf = FLAG_CONFIG[current.harvest_flag] || FLAG_CONFIG.GREEN;
  const dangerLevel = 13.20;
  const dateStr = new Date(current.timestamp).toLocaleDateString("en-GB", {
    year: "numeric", month: "short", day: "numeric",
  });
  const timeStr = new Date(current.timestamp).toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit", timeZone: "UTC",
  });

  return (
    <>
      {/* ======== HEADER ======== */}
      <header className="app-header" role="banner">
        <div className="app-logo">
          <div className="app-logo-icon" aria-hidden="true">💧</div>
          <span className="app-logo-text">HydroSense</span>
          <span className="app-logo-sub">SWOT</span>
        </div>

        <div className="header-controls">
          <div className="lang-toggle" role="radiogroup" aria-label="Language">
            <button
              className={`lang-btn ${lang === "en" ? "active" : ""}`}
              onClick={() => setLang("en")}
              role="radio"
              aria-checked={lang === "en"}
            >EN</button>
            <button
              className={`lang-btn ${lang === "bn" ? "active" : ""}`}
              onClick={() => setLang("bn")}
              role="radio"
              aria-checked={lang === "bn"}
            >বাংলা</button>
          </div>
          <div className="data-badge">
            {lang === "en" ? `Data: ${dateStr}` : `তারিখ: ${dateStr}`}
          </div>
        </div>
      </header>

      {/* ======== DASHBOARD GRID ======== */}
      <main className="dashboard" role="main">

        {/* ---- REACH MAP ---- */}
        <section className="dashboard-map card" aria-label="River reach map">
          <div className="card-header">
            <span className="card-title">
              {lang === "en" ? "Surma–Kushiyara Reaches" : "সুরমা-কুশিয়ারা রিচ"}
            </span>
            <span className="card-title" style={{ color: "var(--text-muted)", fontSize: "0.65rem" }}>
              {lang === "en" ? "(*) = SWOT overpass" : "(*) = SWOT ওভারপাস"}
            </span>
          </div>
          <ReachMapSVG reaches={reachMeta} riskFn={reachRiskLevel} lang={lang} />
          <div className="reach-legend">
            <div className="legend-item">
              <span className="legend-swatch" style={{ background: "#22c55e" }} />
              {lang === "en" ? "Safe" : "নিরাপদ"}
            </div>
            <div className="legend-item">
              <span className="legend-swatch" style={{ background: "#f59e0b" }} />
              {lang === "en" ? "Watch" : "সতর্কতা"}
            </div>
            <div className="legend-item">
              <span className="legend-swatch" style={{ background: "#ef4444" }} />
              {lang === "en" ? "Critical" : "জরুরি"}
            </div>
            <div className="legend-item">
              <span className="legend-swatch" style={{ background: "#e8c547" }} />
              {lang === "en" ? "Gauge" : "গেজ"}
            </div>
          </div>
        </section>

        {/* ---- HARVEST FLAG CARD ---- */}
        <section className={`dashboard-flag card flag-card flag-${current.harvest_flag}`}
                 aria-label={`Harvest flag: ${flagConf.label}`}
                 aria-live="polite">
          <div className="card-title" style={{ width: "100%", textAlign: "center" }}>
            {lang === "en" ? "Harvest Decision" : "ফসল কাটার সিদ্ধান্ত"}
          </div>
          <div className="flag-icon-wrapper" role="img"
               aria-label={`${flagConf.label} — ${lang === "en" ? current.advisory_en : current.advisory_bn}`}>
            <span>{flagConf.icon}</span>
          </div>
          <div className="flag-label">
            {lang === "en" ? flagConf.label : flagConf.labelBn}
          </div>
          <p className="flag-advisory">
            {lang === "en" ? current.advisory_en : current.advisory_bn}
          </p>
          <div className="flag-meta">
            <div className="flag-meta-row">
              <span className="flag-meta-label">
                {lang === "en" ? "Modelled Stage" : "মডেল স্তর"}
              </span>
              <span className="flag-meta-value">{current.modelled_stage} m</span>
            </div>
            <div className="flag-meta-row">
              <span className="flag-meta-label">
                {lang === "en" ? "Danger Level" : "বিপদসীমা"}
              </span>
              <span className="flag-meta-value">{dangerLevel} m</span>
            </div>
            {currentGaugeLevel && (
              <div className="flag-meta-row">
                <span className="flag-meta-label">
                  {lang === "en" ? "Observed (BWDB)" : "পর্যবেক্ষিত (BWDB)"}
                </span>
                <span className="flag-meta-value">{currentGaugeLevel} m</span>
              </div>
            )}
            <div className="flag-meta-row">
              <span className="flag-meta-label">
                {lang === "en" ? "Travel Time" : "ভ্রমণ সময়"}
              </span>
              <span className="flag-meta-value">~26 h</span>
            </div>
            <div className="flag-meta-row">
              <span className="flag-meta-label">
                {lang === "en" ? "IMERG Time" : "IMERG সময়"}
              </span>
              <span className="flag-meta-value">{timeStr} UTC</span>
            </div>
            {metrics && (
              <div className="flag-meta-row">
                <span className="flag-meta-label">
                  {lang === "en" ? "SWOT Geom" : "SWOT জ্যামিতি"}
                </span>
                <span className="flag-meta-value">{metrics.swot_last_geometry_date}</span>
              </div>
            )}
          </div>
        </section>

        {/* ---- HYDROGRAPH + SLIDER ---- */}
        <section className="dashboard-chart card" aria-label="Hydrograph">
          <div className="card-header">
            <span className="card-title">
              {lang === "en"
                ? "Hydrograph — Kanaighat (Surma)"
                : "হাইড্রোগ্রাফ — কানাইঘাট (সুরমা)"}
            </span>
            <span className="card-title" style={{ fontFamily: "var(--font-mono)", color: "var(--text-accent)" }}>
              {dateStr} {timeStr} UTC
            </span>
          </div>

          {/* Rainfall (inverted bar) */}
          <div style={{ width: "100%", height: 70 }}>
            <ResponsiveContainer>
              <ComposedChart data={chartWindow} margin={{ top: 5, right: 20, bottom: 0, left: 20 }}>
                <CartesianGrid stroke="rgba(100,140,180,0.06)" vertical={false} />
                <XAxis dataKey="time" tick={false} axisLine={false} />
                <YAxis reversed domain={[0, "auto"]} tick={{ fontSize: 10, fill: "#5a6a8a" }}
                       label={{ value: "mm/h", angle: -90, position: "insideLeft", fontSize: 10, fill: "#5a6a8a" }}
                       width={45} />
                <Bar dataKey="rainfall" fill="rgba(77,170,223,0.5)" radius={[2, 2, 0, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* Stage hydrograph */}
          <div style={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <ComposedChart data={chartWindow} margin={{ top: 5, right: 20, bottom: 5, left: 20 }}>
                <CartesianGrid stroke="rgba(100,140,180,0.06)" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: "#5a6a8a" }} interval={11} />
                <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10, fill: "#5a6a8a" }}
                       label={{ value: lang === "en" ? "Level (m PWD)" : "স্তর (m PWD)",
                                angle: -90, position: "insideLeft", fontSize: 11, fill: "#8b9cc0" }}
                       width={55} />

                {/* Uncertainty band */}
                <Area type="monotone" dataKey="upper" stroke="none" fill="rgba(77,170,223,0.12)"
                      activeDot={false} isAnimationActive={false} />
                <Area type="monotone" dataKey="lower" stroke="none" fill="var(--bg-primary)"
                      activeDot={false} isAnimationActive={false} />

                {/* Danger level */}
                <ReferenceLine y={dangerLevel} stroke="#ff5c5c" strokeDasharray="8 4" strokeWidth={1.5}
                  label={{ value: lang === "en" ? `Danger ${dangerLevel}m` : `বিপদসীমা ${dangerLevel}m`,
                           position: "right", fontSize: 10, fill: "#ff5c5c" }} />

                {/* Modelled (solid) */}
                <Line type="monotone" dataKey="modelled" stroke="#4daadf" strokeWidth={2.5}
                      dot={false} activeDot={{ r: 4, fill: "#4daadf" }}
                      name={lang === "en" ? "Modelled" : "মডেলকৃত"} />

                {/* Observed (dashed) */}
                <Line type="monotone" dataKey="observed" stroke="#e8c547" strokeWidth={2}
                      strokeDasharray="6 3" dot={false}
                      activeDot={{ r: 4, fill: "#e8c547" }}
                      name={lang === "en" ? "Observed (BWDB)" : "পর্যবেক্ষিত (BWDB)"}
                      connectNulls={false} />

                <Tooltip content={<ChartTooltip lang={lang} />} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          {/* TIME SLIDER (dates driven from data — Trap B10) */}
          <div className="slider-container">
            <div className="slider-current">
              {dateStr} — {timeStr} UTC
            </div>
            <input
              type="range"
              className="time-slider"
              min={0}
              max={eventData.length - 1}
              value={sliderIdx}
              onChange={e => setSliderIdx(Number(e.target.value))}
              aria-label="Event timeline slider"
            />
            <div className="slider-labels">
              <span className="slider-date">
                {new Date(eventData[0].timestamp).toLocaleDateString("en-GB", { month: "short", day: "numeric" })}
              </span>
              <span className="slider-date">
                {new Date(eventData[eventData.length - 1].timestamp).toLocaleDateString("en-GB", { month: "short", day: "numeric" })}
              </span>
            </div>
          </div>
        </section>

        {/* ---- METRICS BAR ---- */}
        {metrics && (
          <section className="dashboard-metrics card" aria-label="Validation metrics">
            <div className="card-header">
              <span className="card-title">
                {lang === "en"
                  ? "Scientific Validation — April 2026 Replay"
                  : "বৈজ্ঞানিক মূল্যায়ন — এপ্রিল ২০২৬ পুনরায়"}
              </span>
              <span className="card-title" style={{ color: "var(--text-muted)", fontSize: "0.6rem" }}>
                {metrics.calibration_period} → {metrics.test_period}
              </span>
            </div>
            <div className="metrics-grid">
              <MetricCard label="NSE" value={metrics.formatted.nse}
                          sub={lang === "en" ? "Nash-Sutcliffe" : "ন্যাশ-সাটক্লিফ"} />
              <MetricCard label="KGE" value={metrics.formatted.kge}
                          sub={lang === "en" ? "Kling-Gupta" : "ক্লিং-গুপ্তা"} />
              <MetricCard label="PBIAS" value={metrics.formatted.pbias}
                          sub={lang === "en" ? "Percent Bias" : "শতাংশ পক্ষপাত"} />
              <MetricCard label={lang === "en" ? "TIMING" : "সময়"} value={metrics.formatted.timing_error}
                          sub={lang === "en" ? "Peak Error" : "শীর্ষ ত্রুটি"} />
              <MetricCard label={lang === "en" ? "LEAD" : "সতর্কতা"} value={metrics.formatted.lead_time}
                          sub={lang === "en" ? "Warning Advance" : "আগাম সতর্কতা"} accent />
            </div>
          </section>
        )}

        {/* ---- LIMITS PANEL (always visible — §4.1, Trap C3) ---- */}
        <section className="dashboard-limits card limits-panel" aria-label="Operational limits">
          <div className="card-header">
            <span className="card-title" style={{ color: "var(--flag-amber)" }}>
              {lang === "en" ? "⚠ Operational Limits" : "⚠ অপারেশনাল সীমাবদ্ধতা"}
            </span>
          </div>
          <ul className="limits-list">
            <li>{lang === "en"
              ? "SWOT resolves rivers wider than ~100 m. Narrow Meghalaya headwaters are not resolved."
              : "SWOT ~১০০ মিটারের বেশি প্রশস্ত নদী দেখতে পায়। মেঘালয়ের সরু উৎসনদী দেখা যায় না।"}</li>
            <li>{lang === "en"
              ? "Low-slope reaches where slope uncertainty exceeds signal are excluded (hatched on map)."
              : "যেসব রিচে ঢালের অনিশ্চয়তা সংকেতের চেয়ে বেশি, সেগুলো বাদ দেওয়া হয়েছে।"}</li>
            <li>{lang === "en"
              ? "IMERG may overestimate intense orographic rain over Meghalaya; calibration corrects implicitly."
              : "IMERG মেঘালয়ের ওপর তীব্র পার্বত্য বৃষ্টি বেশি দেখাতে পারে; ক্রমাঙ্কন সংশোধন করে।"}</li>
            <li>{lang === "en"
              ? "Routing models rising limb only — inundation extent is not modelled."
              : "রাউটিং শুধু উত্থান পর্ব মডেল করে — প্লাবন বিস্তার মডেল করা হয়নি।"}</li>
            <li>{lang === "en"
              ? `Lead time: ~22–30 h from observed rain to flag. NSE: ${metrics?.formatted.nse} KGE: ${metrics?.formatted.kge} Timing: ${metrics?.formatted.timing_error}`
              : `সতর্কতা সময়: বৃষ্টি থেকে পতাকা পর্যন্ত ~২২-৩০ ঘণ্টা। NSE: ${metrics?.formatted.nse} KGE: ${metrics?.formatted.kge}`}</li>
            <li>{lang === "en"
              ? "SWOT does not act as a live gauge (21-day orbit). Channel geometry is calibrated offline."
              : "SWOT সরাসরি গেজ নয় (২১ দিনের কক্ষপথ)। চ্যানেল জ্যামিতি অফলাইনে ক্রমাঙ্কিত।"}</li>
          </ul>
        </section>
      </main>

      {/* ======== FOOTER ======== */}
      <footer style={{
        textAlign: "center", padding: "24px", fontSize: "0.7rem",
        color: "var(--text-muted)", borderTop: "1px solid var(--border-subtle)"
      }}>
        HydroSense-SWOT · NASA Space Apps 2026 · Data: SWOT L2 HR RiverSP 2.0 + GPM IMERG Early Run V07 + BWDB Kanaighat
      </footer>
    </>
  );
}

/* ================================================================
   SUB-COMPONENTS
   ================================================================ */

function MetricCard({ label, value, sub, accent }) {
  return (
    <div className="metric-item" style={accent ? { borderColor: "var(--data-model)" } : {}}>
      <div className="metric-value" style={accent ? { color: "var(--data-model)" } : {}}>
        {value}
      </div>
      <div className="metric-label">{label}</div>
      <div style={{ fontSize: "0.6rem", color: "var(--text-muted)", marginTop: 2 }}>{sub}</div>
    </div>
  );
}

function ChartTooltip({ active, payload, label, lang }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
      {payload.map((p, i) => (
        p.value != null && (
          <div key={i} className="chart-tooltip-row">
            <span className="chart-tooltip-dot" style={{ background: p.stroke || p.fill }} />
            <span>{p.name}: <strong>{typeof p.value === "number" ? p.value.toFixed(2) : p.value}</strong> m</span>
          </div>
        )
      ))}
    </div>
  );
}

/* ---- SCHEMATIC REACH MAP (SVG) ---- */
function ReachMapSVG({ reaches, riskFn, lang }) {
  if (!reaches) return null;

  const riskColor = (id) => {
    const level = riskFn(id);
    if (level === "RED") return "#ef4444";
    if (level === "AMBER") return "#f59e0b";
    return "#22c55e";
  };

  // Schematic reach paths (approximate river corridor)
  const paths = [
    { id: "22211000011", d: "M 320,40 C 300,70 270,90 240,120", label: { x: 330, y: 35 } },
    { id: "22211000012", d: "M 240,120 C 210,150 180,170 140,200", label: { x: 125, y: 210 } },
    { id: "22211000021", d: "M 310,55 C 290,85 260,110 230,140", label: { x: 340, y: 100 } },
    { id: "22211000022", d: "M 230,140 C 200,170 170,190 130,220", label: { x: 115, y: 235 } },
  ];

  const reachMap = {};
  reaches.forEach(r => { reachMap[r.reach_id] = r; });

  return (
    <svg className="reach-map-svg" viewBox="0 0 420 270" preserveAspectRatio="xMidYMid meet">
      {/* Background labels */}
      <text x="350" y="18" fontSize="9" fill="#5a6a8a" fontWeight="600">
        {lang === "en" ? "MEGHALAYA (INDIA)" : "মেঘালয় (ভারত)"}
      </text>
      <text x="30" y="260" fontSize="9" fill="#5a6a8a" fontWeight="600">
        {lang === "en" ? "SUNAMGANJ / SYLHET" : "সুনামগঞ্জ / সিলেট"}
      </text>
      <line x1="10" y1="30" x2="410" y2="30" stroke="rgba(100,140,180,0.15)" strokeDasharray="4 4" />
      <text x="200" y="26" fontSize="8" fill="#5a6a8a" textAnchor="middle">
        {lang === "en" ? "— Border —" : "— সীমান্ত —"}
      </text>

      {/* River flow direction arrow */}
      <text x="50" y="160" fontSize="9" fill="#5a6a8a" fontStyle="italic">
        {lang === "en" ? "Flow →" : "প্রবাহ →"}
      </text>

      {/* Reach paths */}
      {paths.map(p => {
        const r = reachMap[p.id];
        const name = r ? (lang === "en" ? r.name : r.name_bn) : p.id;
        return (
          <g key={p.id}>
            <path
              d={p.d}
              className="reach-path"
              stroke={riskColor(p.id)}
              strokeWidth={r ? Math.max(3, r.width_mean_m / 40) : 4}
            />
            <text x={p.label.x} y={p.label.y} className="reach-label" fontSize="9">
              {name}
            </text>
            {/* SWOT overpass marker */}
            <text x={p.label.x + 2} y={p.label.y + 11} fontSize="7" fill="#5a6a8a">
              {r ? `n=${r.calibrated_n}` : ""}
            </text>
          </g>
        );
      })}

      {/* Gauge station dot (Kanaighat) */}
      <circle cx="240" cy="120" r="6" className="reach-gauge-dot" />
      <text x="250" y="118" fontSize="8" fill="#e8c547" fontWeight="600">
        {lang === "en" ? "Kanaighat Gauge" : "কানাইঘাট গেজ"}
      </text>
    </svg>
  );
}
