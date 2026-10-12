"use client";

import { useState } from "react";

export default function RiverMapPanel({
  reaches,
  riskFn,
  lang,
  selectedReachId,
  setSelectedReachId,
  currentStage,
  dangerLevel,
  currentGaugeLevel,
  onInspectReach,
}) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showFlowAnim, setShowFlowAnim] = useState(true);
  const [showSwotSwath, setShowSwotSwath] = useState(true);
  const [showTerrain, setShowTerrain] = useState(true);
  const [hoveredReach, setHoveredReach] = useState(null);

  const riskColor = (id) => {
    const level = riskFn(id);
    if (level === "RED") return "#FF647C";
    if (level === "AMBER") return "#FFC45C";
    return "#30E08A";
  };

  const riskGlow = (id) => {
    const level = riskFn(id);
    if (level === "RED") return "rgba(255, 100, 124, 0.5)";
    if (level === "AMBER") return "rgba(255, 196, 92, 0.4)";
    return "rgba(48, 224, 138, 0.35)";
  };

  // Schematic calibrated reach geometries with realistic meanders
  const riverPaths = [
    {
      id: "22211000011",
      name: "Surma Upper (Kanaighat)",
      d: "M 345,35 C 325,58 295,78 260,110 C 248,122 235,130 220,140",
      flowD: "M 345,35 C 325,58 295,78 260,110 C 248,122 235,130 220,140",
      gaugePos: { x: 260, y: 110 },
      labelPos: { x: 285, y: 92 },
      swotPass: "Pass 018",
    },
    {
      id: "22211000012",
      name: "Surma Mid (Sylhet)",
      d: "M 220,140 C 190,160 165,175 125,195 C 95,210 70,220 35,235",
      flowD: "M 220,140 C 190,160 165,175 125,195 C 95,210 70,220 35,235",
      labelPos: { x: 130, y: 180 },
      swotPass: "Pass 042",
    },
    {
      id: "22211000021",
      name: "Kushiyara Upper (Amalshid)",
      d: "M 355,55 C 335,78 300,105 265,135 C 245,152 225,165 195,178",
      flowD: "M 355,55 C 335,78 300,105 265,135 C 245,152 225,165 195,178",
      labelPos: { x: 300, y: 150 },
      swotPass: "Pass 018",
    },
    {
      id: "22211000022",
      name: "Kushiyara Mid (Sherpur)",
      d: "M 195,178 C 165,195 130,215 90,238 C 65,250 40,258 15,265",
      flowD: "M 195,178 C 165,195 130,215 90,238 C 65,250 40,258 15,265",
      labelPos: { x: 145, y: 228 },
      swotPass: "Pass 042",
    },
  ];

  const reachMap = {};
  if (reaches) {
    reaches.forEach((r) => {
      reachMap[r.reach_id] = r;
    });
  }

  const selectedReach = reachMap[selectedReachId];

  return (
    <section className="glass-panel card-padding map-card-container" aria-label="River Reach Geospatial Map">
      {/* Panel Header */}
      <div className="card-header-bar">
        <div className="card-title-group">
          <div className="card-icon" aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
              <line x1="8" y1="2" x2="8" y2="18" />
              <line x1="16" y1="6" x2="16" y2="22" />
            </svg>
          </div>
          <div>
            <div className="card-title">
              {lang === "en" ? "Surma–Kushiyara Hydrodynamic Network" : "সুরমা-কুশিয়ারা হাইড্রোডাইনামিক নেটওয়ার্ক"}
            </div>
          </div>
        </div>

        {/* Selected Reach Indicator Badge */}
        {selectedReach && (
          <div className="selected-reach-chip">
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: riskColor(selectedReach.reach_id) }} />
            <span>{lang === "en" ? selectedReach.name : selectedReach.name_bn}</span>
            <button
              onClick={() => onInspectReach(selectedReach)}
              style={{
                background: "transparent",
                border: "none",
                color: "var(--cyan-400)",
                cursor: "pointer",
                padding: "0 2px",
                display: "inline-flex",
                alignItems: "center",
              }}
              title="Inspect Manning n and hydraulic dimensions"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Map Viewport */}
      <div className="map-viewport">
        {/* Floating Tool Controls */}
        <div className="map-floating-toolbar" role="toolbar" aria-label="Map Visual Controls">
          <button
            className="map-tool-btn"
            onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.15))}
            title="Zoom In"
            aria-label="Zoom In"
          >
            +
          </button>
          <button
            className="map-tool-btn"
            onClick={() => setZoomLevel((z) => Math.max(0.85, z - 0.15))}
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            −
          </button>
          <button
            className="map-tool-btn"
            onClick={() => setZoomLevel(1)}
            title="Reset Map Orientation"
            aria-label="Reset Map Orientation"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
            </svg>
          </button>
          <button
            className={`map-tool-btn ${showFlowAnim ? "active" : ""}`}
            onClick={() => setShowFlowAnim(!showFlowAnim)}
            title={lang === "en" ? "Toggle River Flow Vector Motion" : "নদী प्रवाह অ্যানিমেশন চালু/বন্ধ"}
            aria-label="Toggle Flow Animation"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
              <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
            </svg>
          </button>
          <button
            className={`map-tool-btn ${showSwotSwath ? "active" : ""}`}
            onClick={() => setShowSwotSwath(!showSwotSwath)}
            title={lang === "en" ? "Toggle SWOT Orbital Swath (120km swath)" : "SWOT উপগ্রহ কক্ষপথ ওভারলে"}
            aria-label="Toggle SWOT Orbit Swath"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 7 9 3 5 7l4 4" />
              <path d="m17 11 4 4-4 4-4-4" />
              <path d="m8 12 4 4 6-6-4-4Z" />
              <path d="m16 8 3-3" />
              <path d="M9 21a6 6 0 0 0-6-6" />
            </svg>
          </button>
          <button
            className={`map-tool-btn ${showTerrain ? "active" : ""}`}
            onClick={() => setShowTerrain(!showTerrain)}
            title={lang === "en" ? "Toggle Meghalaya Topography Shading" : "পাহাড় ও হাওর ভূপ্রকৃতি ওভারলে"}
            aria-label="Toggle Terrain Shading"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
            </svg>
          </button>
        </div>

        {/* Scalable SVG Cartographic Presentation */}
        <svg
          className="map-svg-canvas"
          viewBox="0 0 460 300"
          preserveAspectRatio="xMidYMid meet"
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: "center center",
            transition: "transform 260ms var(--ease-out)",
          }}
          role="img"
          aria-label="Interactive river network showing Surma and Kushiyara reaches, BWDB Kanaighat gauge, and Haor wetlands"
        >
          <defs>
            {/* Ambient Cyan Glow Filter for Reaches */}
            <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* SWOT Ground Track Swath Pattern */}
            <linearGradient id="swotSwathGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#35D8F2" stopOpacity="0.08" />
              <stop offset="50%" stopColor="#8172FF" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#3185FF" stopOpacity="0.08" />
            </linearGradient>

            {/* Meghalaya Mountain Relief Gradient */}
            <linearGradient id="mountainGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a2d42" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#0c1724" stopOpacity="0.1" />
            </linearGradient>

            {/* Haor Depression Wetland Water Gradient */}
            <radialGradient id="haorWetlandGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#35D8F2" stopOpacity="0.12" />
              <stop offset="70%" stopColor="#122c42" stopOpacity="0.05" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background Cartographic Terrain relief */}
          {showTerrain && (
            <g className="map-terrain-layer" opacity="0.85">
              {/* Meghalaya Plateau Escarpment */}
              <polygon
                points="0,0 460,0 460,45 380,48 290,42 180,47 80,43 0,48"
                fill="url(#mountainGradient)"
              />
              <path
                d="M 20,25 Q 70,12 140,24 T 280,18 T 420,22"
                fill="none"
                stroke="rgba(126, 213, 255, 0.12)"
                strokeWidth="1.2"
                strokeDasharray="3 3"
              />
              <path
                d="M 10,38 Q 90,28 170,36 T 310,32 T 450,35"
                fill="none"
                stroke="rgba(126, 213, 255, 0.08)"
                strokeWidth="1"
              />

              {/* Haor Depressions (Tanguar / Hakaluki wetland basins) */}
              <ellipse cx="65" cy="225" rx="55" ry="35" fill="url(#haorWetlandGradient)" />
              <ellipse cx="140" cy="265" rx="45" ry="22" fill="url(#haorWetlandGradient)" />
              <text x="65" y="228" fontSize="12" fill="#94A3B8" fontWeight="600" textAnchor="middle">
                {lang === "en" ? "SUNAMGANJ HAOR BASIN" : "সুনামগঞ্জ হাওর অববাহিকা"}
              </text>
              <text x="140" y="268" fontSize="12" fill="#94A3B8" fontWeight="500" textAnchor="middle">
                {lang === "en" ? "Hakaluki Haor" : "হাকালুকি হাওর"}
              </text>
            </g>
          )}

          {/* International Border Demarcation Line */}
          <g className="map-border-layer">
            <line
              x1="0"
              y1="46"
              x2="460"
              y2="46"
              stroke="rgba(255, 196, 92, 0.35)"
              strokeWidth="1.2"
              strokeDasharray="5 4"
            />
            <text x="270" y="24" fontSize="12" fill="#CBD5E1" fontWeight="700" letterSpacing="0.08em">
              {lang === "en" ? "MEGHALAYA (INDIA)" : "মেঘালয় (ভারত)"}
            </text>
            <text x="40" y="24" fontSize="12" fill="#94A3B8" fontStyle="italic">
              {lang === "en" ? "Precipitation Source Catchment" : "বৃষ্টিপাত প্রবাহ উৎস"}
            </text>
            <text x="230" y="42" fontSize="12" fill="#FFC45C" opacity="0.9" textAnchor="middle">
              {lang === "en" ? "— International Border —" : "— আন্তর্জাতিক সীমান্ত —"}
            </text>
          </g>

          {/* NASA SWOT Satellite 120km Orbital Swath Footprint */}
          {showSwotSwath && (
            <g className="map-swot-swath-layer">
              <polygon
                points="170,0 380,0 260,300 50,300"
                fill="url(#swotSwathGradient)"
                stroke="rgba(53, 216, 242, 0.2)"
                strokeWidth="1"
                strokeDasharray="4 6"
              />
              <line
                x1="275"
                y1="0"
                x2="155"
                y2="300"
                stroke="rgba(129, 114, 255, 0.35)"
                strokeWidth="1.5"
                strokeDasharray="6 4"
              />
              <text x="245" y="15" fontSize="12" fill="#A5B4FC" fontWeight="600" opacity="0.95">
                SWOT KaRIn Ground Track (Pass 018)
              </text>
            </g>
          )}

          {/* River Reaches (Geometries & Interactive Click) */}
          <g className="map-river-reaches">
            {riverPaths.map((p) => {
              const r = reachMap[p.id];
              const isSelected = selectedReachId === p.id;
              const isHovered = hoveredReach === p.id;
              const color = riskColor(p.id);
              const width = r ? Math.max(3.5, r.width_mean_m / 35) : 4.5;
              const reachName = r ? (lang === "en" ? r.name : r.name_bn) : p.name;

              return (
                <g
                  key={p.id}
                  onClick={() => setSelectedReachId(p.id)}
                  onMouseEnter={() => setHoveredReach(p.id)}
                  onMouseLeave={() => setHoveredReach(null)}
                  style={{ cursor: "pointer" }}
                  tabIndex={0}
                  role="button"
                  aria-label={`River Reach ${reachName}, Status: ${riskFn(p.id)}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      setSelectedReachId(p.id);
                    }
                  }}
                >
                  {/* Outer Reach Soft Glow */}
                  <path
                    d={p.d}
                    fill="none"
                    stroke={isSelected ? "#74ECFF" : color}
                    strokeWidth={width + (isSelected ? 6 : isHovered ? 4 : 2)}
                    strokeOpacity={isSelected ? 0.45 : 0.25}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#cyanGlow)"
                  />

                  {/* Main Core River Stroke */}
                  <path
                    d={p.d}
                    className={`reach-path-base ${isSelected ? "reach-path-selected" : ""}`}
                    stroke={isSelected ? "#74ECFF" : color}
                    strokeWidth={width}
                  />

                  {/* Flow Vector Traveling Dash (Animates along flow vector) */}
                  {showFlowAnim && (
                    <path
                      d={p.flowD}
                      className="flow-animation-dash"
                      strokeWidth={Math.max(2, width - 2)}
                    />
                  )}

                  {/* Reach Title Label */}
                  <text
                    x={p.labelPos.x}
                    y={p.labelPos.y}
                    fontSize={isSelected ? "12" : "11"}
                    fontWeight={isSelected ? "750" : "600"}
                    fill={isSelected ? "#F2F7FF" : "#CBD5E1"}
                    letterSpacing="-0.01em"
                    pointerEvents="none"
                  >
                    {reachName}
                  </text>

                  {/* Secondary Manning roughness tag */}
                  <text
                    x={p.labelPos.x}
                    y={p.labelPos.y + 13}
                    fontSize="12"
                    fill="#94A3B8"
                    fontFamily="var(--font-mono)"
                    pointerEvents="none"
                  >
                    {r ? `SWOT n=${r.calibrated_n} · W=${r.width_mean_m}m` : ""}
                  </text>
                </g>
              );
            })}
          </g>

          {/* BWDB Kanaighat Gauge Station Marker (SW108) */}
          <g className="map-gauge-station">
            {/* Sonar Radar Pulse Rings (§4.3) */}
            <circle
              cx="260"
              cy="110"
              r="6"
              className="gauge-sonar-pulse-1"
              fill="none"
              stroke="#FFC45C"
            />
            <circle
              cx="260"
              cy="110"
              r="6"
              className="gauge-sonar-pulse-2"
              fill="none"
              stroke="#FFC45C"
            />

            {/* Gauge Dot Core */}
            <circle
              cx="260"
              cy="110"
              r="5.5"
              fill="#FFC45C"
              stroke="#050A12"
              strokeWidth="2"
              filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5))"
            />

            {/* Gauge Station Text Readout */}
            <rect
              x="272"
              y="98"
              width="160"
              height="34"
              rx="6"
              fill="rgba(5, 10, 18, 0.92)"
              stroke="rgba(255, 196, 92, 0.5)"
              strokeWidth="1"
            />
            <text x="278" y="113" fontSize="12" fill="#FFC45C" fontWeight="750">
              {lang === "en" ? "SW108 Kanaighat Gauge" : "SW১০৮ কানাইঘাট গেজ"}
            </text>
            <text x="278" y="125" fontSize="12" fill="#F2F7FF" fontFamily="var(--font-mono)">
              {currentGaugeLevel ? `${currentGaugeLevel.toFixed(2)} m PWD` : `Model: ${currentStage.toFixed(2)} m`}
              <tspan fill="#FF647C"> (Danger: {dangerLevel}m)</tspan>
            </text>
          </g>

          {/* Flow Direction Indicator */}
          <g transform="translate(60, 130)">
            <text x="0" y="0" fontSize="12" fill="#38BDF8" fontStyle="italic" fontWeight="600">
              {lang === "en" ? "Direction of Flow →" : "প্রবাহের দিক →"}
            </text>
          </g>
        </svg>
      </div>

      {/* Map Bottom Legend & Controls Bar */}
      <div className="map-bottom-legend">
        <div className="legend-swatches-row">
          <div className="swatch-group">
            <span className="swatch-line" style={{ background: "#30E08A" }} />
            <span>{lang === "en" ? "Safe (<80% Danger)" : "নিরাপদ"}</span>
          </div>
          <div className="swatch-group">
            <span className="swatch-line" style={{ background: "#FFC45C" }} />
            <span>{lang === "en" ? "Watch (80-100%)" : "সতর্কতা"}</span>
          </div>
          <div className="swatch-group">
            <span className="swatch-line" style={{ background: "#FF647C" }} />
            <span>{lang === "en" ? "Critical (>13.20m)" : "জরুরি"}</span>
          </div>
          <div className="swatch-group">
            <span className="swatch-dot" style={{ background: "#FFC45C" }} />
            <span>{lang === "en" ? "BWDB Gauge Station" : "BWDB গেজ স্টেশন"}</span>
          </div>
        </div>

        <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
          {lang === "en"
            ? "Click any river reach to inspect calibrated roughness (Manning n)"
            : "ক্যালিব্রেটেড প্যারামিটার দেখতে যেকোনো রিচে ক্লিক করুন"}
        </div>
      </div>
    </section>
  );
}
