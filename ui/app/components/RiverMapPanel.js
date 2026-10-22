"use client";

import { useState } from "react";
import { useLocale } from "../hooks/useLocale";
import InteractiveMap from "./InteractiveMap";

/**
 * CVD-Safe Cividis Colormap Interpolator
 * Optimized for normal vision, deuteranomaly, and protanomaly.
 * Ramps continuously from deep navy (#00204d) at low ratio to vivid gold (#fde725) at danger crest.
 */
export function getCividisColor(ratio) {
  // Normalize ratio in [0.50, 1.05]
  const t = Math.min(1, Math.max(0, (ratio - 0.50) / (1.05 - 0.50)));
  const cividisRamps = [
    { t: 0.0, r: 0, g: 32, b: 77 }, // #00204d (deep navy)
    { t: 0.25, r: 44, g: 73, b: 114 }, // #2c4972 (slate blue)
    { t: 0.5, r: 92, g: 104, b: 118 }, // #5c6876 (muted slate)
    { t: 0.75, r: 168, g: 153, b: 92 }, // #a8995c (warm olive/amber)
    { t: 1.0, r: 253, g: 231, b: 37 }, // #fde725 (vivid yellow/gold)
  ];
  let lower = cividisRamps[0];
  let upper = cividisRamps[cividisRamps.length - 1];
  for (let i = 0; i < cividisRamps.length - 1; i++) {
    if (t >= cividisRamps[i].t && t <= cividisRamps[i + 1].t) {
      lower = cividisRamps[i];
      upper = cividisRamps[i + 1];
      break;
    }
  }
  const span = upper.t - lower.t;
  const f = span > 0 ? (t - lower.t) / span : 0;
  const red = Math.round(lower.r + f * (upper.r - lower.r));
  const green = Math.round(lower.g + f * (upper.g - lower.g));
  const blue = Math.round(lower.b + f * (upper.b - lower.b));
  return `rgb(${red}, ${green}, ${blue})`;
}

export default function RiverMapPanel({
  reaches,
  riskFn,
  lang: propLang,
  selectedReachId,
  setSelectedReachId,
  currentStage,
  dangerLevel,
  currentGaugeLevel,
  currentRainfall = 0,
  onInspectReach,
}) {
  const { lang: ctxLang } = useLocale();
  const lang = propLang || ctxLang || "bn";
  const [viewMode, setViewMode] = useState("geographic");

  const [zoomLevel, setZoomLevel] = useState(1);
  const [showFlowAnim, setShowFlowAnim] = useState(true);
  const [showSwotSwath, setShowSwotSwath] = useState(true);
  const [showTerrain, setShowTerrain] = useState(true);
  const [showSubbasins, setShowSubbasins] = useState(true);
  const [showRainfallOverlay, setShowRainfallOverlay] = useState(true);
  const [hoveredReach, setHoveredReach] = useState(null);

  const riskColor = (id) => {
    const level = riskFn(id);
    if (level === "RED") return "#FF647C";
    if (level === "AMBER") return "#FFC45C";
    return "#30E08A";
  };

  const getReachCividis = (reachId) => {
    const stageRatio = currentStage / dangerLevel;
    const level = riskFn(reachId);
    let ratio = stageRatio;
    if (level === "AMBER" && ratio < 0.82) ratio = 0.85;
    if (level === "RED" && ratio < 0.98) ratio = 1.02;
    return getCividisColor(ratio);
  };

  // Transboundary Barak River inflow and bifurcated hydrodynamic reach geometries (800x390 coordinate space)
  const barakInflowPath = "M 790,155 C 730,153 675,155 620,155";

  const riverPaths = [
    {
      id: "22211000011",
      name: "Surma Upper (Kanaighat)",
      name_bn: "সুরমা উচ্চ (কানাইঘাট)",
      d: "M 620,155 C 550,115 470,82 380,85 C 330,86 280,98 230,115",
      flowD: "M 620,155 C 550,115 470,82 380,85 C 330,86 280,98 230,115",
      gaugePos: { x: 380, y: 85 },
      labelPos: { x: 385, y: 122 },
      swotPass: "SWOT Pass 018* (14-Apr)",
      chevrons: [
        { x: 510, y: 102, rot: 205 },
        { x: 310, y: 92, rot: 195 },
      ],
    },
    {
      id: "22211000012",
      name: "Surma Mid (Sylhet)",
      name_bn: "সুরমা মধ্য (সিলেট)",
      d: "M 230,115 C 180,130 130,140 70,145",
      flowD: "M 230,115 C 180,130 130,140 70,145",
      gaugePos: null,
      labelPos: { x: 95, y: 80 },
      swotPass: "SWOT Pass 018* (14-Apr)",
      chevrons: [
        { x: 170, y: 128, rot: 195 },
        { x: 105, y: 142, rot: 185 },
      ],
    },
    {
      id: "22211000021",
      name: "Kushiyara Upper (Amalshid)",
      name_bn: "কুশিয়ারা উচ্চ (আমলশীদ)",
      d: "M 620,155 C 550,210 460,240 370,250 C 310,256 260,260 210,265",
      flowD: "M 620,155 C 550,210 460,240 370,250 C 310,256 260,260 210,265",
      gaugePos: null,
      labelPos: { x: 360, y: 288 },
      swotPass: "SWOT Pass 042* (16-Apr)",
      chevrons: [
        { x: 510, y: 205, rot: 150 },
        { x: 290, y: 258, rot: 175 },
      ],
    },
    {
      id: "22211000022",
      name: "Kushiyara Mid (Sherpur)",
      name_bn: "কুশিয়ারা মধ্য (শেরপুর)",
      d: "M 210,265 C 160,275 120,300 70,335",
      flowD: "M 210,265 C 160,275 120,300 70,335",
      gaugePos: null,
      labelPos: { x: 95, y: 232 },
      swotPass: "SWOT Pass 042* (16-Apr)",
      chevrons: [
        { x: 160, y: 282, rot: 155 },
        { x: 100, y: 318, rot: 145 },
      ],
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
    <section className="glass-panel card-padding map-card-container" aria-label={lang === "en" ? "River Reach Geospatial Map" : "নদী রিচ ভৌগোলিক মানচিত্র"}>
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

        {/* View Mode Segmented Switch (§4.1 / P7) */}
        <div
          role="radiogroup"
          aria-label={lang === "en" ? "Map display mode" : "মানচিত্র প্রদর্শনের ধরন"}
          style={{
            display: "inline-flex",
            background: "var(--surface-850)",
            borderRadius: "var(--radius-pill)",
            padding: "3px",
            border: "1px solid var(--border-subtle)",
            gap: "3px",
          }}
        >
          <button
            type="button"
            role="radio"
            aria-checked={viewMode === "geographic"}
            style={{
              padding: "4px 12px",
              fontSize: "11px",
              fontWeight: 600,
              borderRadius: "var(--radius-pill)",
              border: "none",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              background: viewMode === "geographic" ? "var(--blue-primary)" : "transparent",
              color: viewMode === "geographic" ? "#FFFFFF" : "var(--text-secondary)",
              transition: "all var(--motion-fast)",
            }}
            onClick={() => setViewMode("geographic")}
            title={lang === "en" ? "Geographic GIS Map with real SWOT reaches & satellite basemap" : "ভৌগোলিক GIS মানচিত্র (স্যাটেলাইট বেসম্যাপ)"}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/></svg>
            <span>{lang === "en" ? "Geographic GIS" : "ভৌগোলিক GIS"}</span>
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={viewMode === "schematic"}
            style={{
              padding: "4px 12px",
              fontSize: "11px",
              fontWeight: 600,
              borderRadius: "var(--radius-pill)",
              border: "none",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "5px",
              background: viewMode === "schematic" ? "var(--blue-primary)" : "transparent",
              color: viewMode === "schematic" ? "#FFFFFF" : "var(--text-secondary)",
              transition: "all var(--motion-fast)",
            }}
            onClick={() => setViewMode("schematic")}
            title={lang === "en" ? "Hydraulic flow schematic diagram" : "হাইড্রোলিক প্রবাহ স্কিম্যাটিক"}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/></svg>
            <span>{lang === "en" ? "Hydraulic Flow" : "হাইড্রোলিক প্রবাহ"}</span>
          </button>
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
              title={lang === "en" ? "Inspect Manning n and hydraulic dimensions" : "ম্যানিং n ও হাইড্রোলিক পরিমাপ নিরীক্ষণ"}
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
        {/* Floating Tool Controls for Hydraulic Flow Schematic Mode */}
        {viewMode === "schematic" && (
          <div className="map-floating-toolbar" role="toolbar" aria-label={lang === "en" ? "Map Visual Controls" : "মানচিত্র নিয়ন্ত্রণ"}>
            <button
              className="map-tool-btn"
              onClick={() => setZoomLevel((z) => Math.min(1.4, z + 0.15))}
              title={lang === "en" ? "Zoom In" : "বড় করুন"}
              aria-label={lang === "en" ? "Zoom In" : "বড় করুন"}
            >
              +
            </button>
            <button
              className="map-tool-btn"
              onClick={() => setZoomLevel((z) => Math.max(0.85, z - 0.15))}
              title={lang === "en" ? "Zoom Out" : "ছোট করুন"}
              aria-label={lang === "en" ? "Zoom Out" : "ছোট করুন"}
            >
              −
            </button>
            <button
              className="map-tool-btn"
              onClick={() => setZoomLevel(1)}
              title={lang === "en" ? "Reset Map Orientation" : "মানচিত্র রিসেট করুন"}
              aria-label={lang === "en" ? "Reset Map Orientation" : "মানচিত্র রিসেট করুন"}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            </button>
            <button
              className={`map-tool-btn ${showFlowAnim ? "active" : ""}`}
              onClick={() => setShowFlowAnim(!showFlowAnim)}
              title={lang === "en" ? "Toggle River Flow Vector Motion" : "নদী প্রবাহ অ্যানিমেশন চালু/বন্ধ"}
              aria-label={lang === "en" ? "Toggle Flow Animation" : "প্রবাহ অ্যানিমেশন পরিবর্তন"}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
                <path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1" />
              </svg>
            </button>
            <button
              className={`map-tool-btn ${showSwotSwath ? "active" : ""}`}
              onClick={() => setShowSwotSwath(!showSwotSwath)}
              title={lang === "en" ? "Toggle SWOT Orbital Swaths" : "SWOT উপগ্রহ কক্ষপথ ওভারলে"}
              aria-label={lang === "en" ? "Toggle SWOT Orbit Swath" : "SWOT উপগ্রহ বলয় পরিবর্তন"}
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
              aria-label={lang === "en" ? "Toggle Terrain Shading" : "ভূপ্রকৃতি শেডিং পরিবর্তন"}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
              </svg>
            </button>
          </div>
        )}

        {viewMode === "geographic" ? (
          <InteractiveMap
            reaches={reaches}
            riskFn={riskFn}
            lang={lang}
            selectedReachId={selectedReachId}
            setSelectedReachId={setSelectedReachId}
            currentStage={currentStage}
            dangerLevel={dangerLevel}
            currentGaugeLevel={currentGaugeLevel}
            currentRainfall={currentRainfall}
            onInspectReach={onInspectReach}
            showFlowAnim={showFlowAnim}
            setShowFlowAnim={setShowFlowAnim}
            showSwotSwath={showSwotSwath}
            setShowSwotSwath={setShowSwotSwath}
            showTerrain={showTerrain}
            setShowTerrain={setShowTerrain}
            showSubbasins={showSubbasins}
            setShowSubbasins={setShowSubbasins}
            showRainfallOverlay={showRainfallOverlay}
            setShowRainfallOverlay={setShowRainfallOverlay}
          />
        ) : (
          /* Scalable SVG Cartographic Presentation (§4.1 / P7) */
          <svg
            className="map-svg-canvas"
            viewBox="0 0 800 390"
            preserveAspectRatio="xMidYMid meet"
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: "center center",
              transition: "transform 260ms var(--ease-out)",
            }}
            role="img"
            aria-label={lang === "en" ? "Interactive river network showing Surma and Kushiyara reaches, BWDB Kanaighat gauge, and Haor wetlands" : "সুরমা ও কুশিয়ারা নদী রিচ, বাপাউবো কানাইঘাট গেজ এবং হাওর জলাভূমির ইন্টারঅ্যাক্টিভ মানচিত্র"}
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
                <stop offset="0%" stopColor="#35D8F2" stopOpacity="0.15" />
                <stop offset="65%" stopColor="#122c42" stopOpacity="0.06" />
                <stop offset="100%" stopColor="transparent" stopOpacity="0" />
              </radialGradient>

              {/* SVG Hatching Pattern for Slope-Uncertain Reaches */}
              <pattern id="uncertainHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <line x1="0" y1="0" x2="0" y2="8" stroke="#FFC45C" strokeWidth="2.5" strokeOpacity="0.85" />
              </pattern>
            </defs>

            {/* Background Cartographic Terrain relief */}
            {showTerrain && (
              <g className="map-terrain-layer" opacity="0.85">
                {/* Meghalaya Plateau Escarpment */}
                <polygon
                  points="0,0 800,0 800,38 560,34 380,38 180,32 0,38"
                  fill="url(#mountainGradient)"
                />
                <path
                  d="M 10,22 Q 200,10 400,18 T 790,16"
                  fill="none"
                  stroke="rgba(126, 213, 255, 0.12)"
                  strokeWidth="1.2"
                  strokeDasharray="3 3"
                />

                {/* Haor Depressions (Sunamganj Haor Basin & Hakaluki Haor wetland sinks) */}
                <ellipse cx="70" cy="145" rx="58" ry="32" fill="url(#haorWetlandGradient)" />
                <ellipse cx="70" cy="145" rx="44" ry="22" fill="none" stroke="rgba(40, 123, 181, 0.25)" strokeWidth="1" strokeDasharray="4 4" />
                <text x="70" y="142" fontSize="10.5" fill="#175A85" fontWeight="700" textAnchor="middle">
                  {lang === "en" ? "SUNAMGANJ HAOR BASIN" : "সুনামগঞ্জ হাওর অববাহিকা"}
                </text>
                <text x="70" y="155" fontSize="9" fill="#566B7C" textAnchor="middle">
                  {lang === "en" ? "Flood Retention Sink" : "বন্যা ধারণ অববাহিকা"}
                </text>

                <ellipse cx="70" cy="335" rx="58" ry="28" fill="url(#haorWetlandGradient)" />
                <ellipse cx="70" cy="335" rx="42" ry="19" fill="none" stroke="rgba(40, 123, 181, 0.25)" strokeWidth="1" strokeDasharray="4 4" />
                <text x="70" y="332" fontSize="10.5" fill="#175A85" fontWeight="700" textAnchor="middle">
                  {lang === "en" ? "HAKALUKI HAOR" : "হাকালুকি হাওর"}
                </text>
                <text x="70" y="345" fontSize="9" fill="#566B7C" textAnchor="middle">
                  {lang === "en" ? "Depression Sink" : "প্রাকৃতিক জলাভূমি"}
                </text>
              </g>
            )}

            {/* International Border Demarcation Line */}
            <g className="map-border-layer">
              <line
                x1="0"
                y1="44"
                x2="800"
                y2="44"
                stroke="rgba(255, 196, 92, 0.35)"
                strokeWidth="1.2"
                strokeDasharray="6 5"
              />
              <text x="685" y="24" fontSize="11" fill="#173B57" fontWeight="700" letterSpacing="0.08em">
                {lang === "en" ? "MEGHALAYA (INDIA)" : "মেঘালয় (ভারত)"}
              </text>
              <text x="50" y="24" fontSize="10.5" fill="#566B7C" fontStyle="italic">
                {lang === "en" ? "Precipitation Source Catchment" : "বৃষ্টিপাত প্রবাহ উৎস"}
              </text>
              <text x="140" y="44" fontSize="10.5" fill="#B7791F" opacity="0.9" textAnchor="middle">
                {lang === "en" ? "— International Border —" : "— আন্তর্জাতিক সীমান্ত —"}
              </text>
            </g>

            {/* NASA SWOT Satellite 120km Orbital Swath Footprint */}
            {showSwotSwath && (
              <g className="map-swot-swath-layer">
                <polygon
                  points="420,0 650,0 490,390 260,390"
                  fill="url(#swotSwathGradient)"
                  stroke="rgba(53, 216, 242, 0.2)"
                  strokeWidth="1"
                  strokeDasharray="4 6"
                />
                <line
                  x1="535"
                  y1="0"
                  x2="375"
                  y2="390"
                  stroke="rgba(129, 114, 255, 0.35)"
                  strokeWidth="1.5"
                  strokeDasharray="6 4"
                />
                <text x="550" y="65" fontSize="10.5" fill="#A5B4FC" fontWeight="600" opacity="0.95">
                  SWOT KaRIn Ground Track (Pass 018)
                </text>
              </g>
            )}

            {/* Transboundary Barak River Inflow (From India Border into Amalshid) */}
            <g className="map-barak-inflow">
              <path
                d={barakInflowPath}
                fill="none"
                stroke="#06121f"
                strokeWidth="15"
                strokeLinecap="round"
                opacity="0.8"
              />
              <path
                d={barakInflowPath}
                fill="none"
                stroke="#2563EB"
                strokeWidth="6"
                strokeLinecap="round"
              />
              {showFlowAnim && (
                <path
                  d={barakInflowPath}
                  className="flow-animation-dash-primary"
                  strokeWidth="3.2"
                />
              )}
              {/* Barak Flow Direction Chevrons */}
              <polygon points="740,151 732,155 740,159" fill="#38BDF8" opacity="0.85" />
              <polygon points="670,151 662,155 670,159" fill="#38BDF8" opacity="0.85" />
              {/* Inflow Label Capsule */}
              <rect
                x="665"
                y="122"
                width="120"
                height="20"
                rx="4"
                fill="#FFFFFF"
                stroke="var(--border-subtle)"
              />
              <text x="725" y="136" fontSize="10" fill="#173B57" textAnchor="middle" fontWeight="600">
                {lang === "en" ? "Barak River Inflow →" : "বরাক নদী প্রবাহ →"}
              </text>
            </g>

            {/* Amalshid Bifurcation Node (§4.1 Physical Confluence / Split) */}
            <g className="map-bifurcation-node">
              <circle
                cx="620"
                cy="155"
                r="7"
                className="hydraulic-confluence-pulse"
                fill="none"
                stroke="#35D8F2"
                strokeWidth="1.5"
              />
              <circle
                cx="620"
                cy="155"
                r="14"
                className="hydraulic-confluence-pulse"
                style={{ animationDelay: "1.1s" }}
                fill="none"
                stroke="#FFC45C"
                strokeWidth="1"
              />
              <circle
                cx="620"
                cy="155"
                r="5.5"
                fill="#35D8F2"
                stroke="#050A12"
                strokeWidth="2"
              />
              {/* Bifurcation Node Capsule (Positioned neatly in the fork) */}
              <rect
                x="535"
                y="172"
                width="170"
                height="20"
                rx="4"
                fill="#FFFFFF"
                stroke="var(--border-subtle)"
              />
              <text x="620" y="186" fontSize="10.5" fill="#173B57" textAnchor="middle" fontWeight="700">
                {lang === "en" ? "Amalshid Bifurcation Node" : "আমলশীদ বিভাজন পয়েন্ট"}
              </text>
            </g>

            {/* River Reaches (Geometries, Multi-Layer Flow & Interactive Inspection) */}
            <g className="map-river-reaches">
              {riverPaths.map((p) => {
                const r = reachMap[p.id];
                const isSelected = selectedReachId === p.id;
                const isHovered = hoveredReach === p.id;
                const cividisStroke = getReachCividis(p.id);
                const isUncertainSlope = r?.slope_quality === "uncertain";
                const width = r ? Math.max(4.2, r.width_mean_m / 30) : 5.8;
                const reachName = r ? (lang === "en" ? r.name : r.name_bn) : p.name;

                return (
                  <g
                    key={p.id}
                    onClick={() => {
                      setSelectedReachId(p.id);
                      if (onInspectReach && r) {
                        onInspectReach(r);
                      }
                    }}
                    onMouseEnter={() => setHoveredReach(p.id)}
                    onMouseLeave={() => setHoveredReach(null)}
                    style={{ cursor: "pointer" }}
                    tabIndex={0}
                    role="button"
                    aria-label={`River Reach ${reachName}, Status: ${riskFn(p.id)}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setSelectedReachId(p.id);
                        if (onInspectReach && r) {
                          onInspectReach(r);
                        }
                      }
                    }}
                  >
                    {/* Layer 1: Dark Riverbed Trench Underlay */}
                    <path
                      d={p.d}
                      fill="none"
                      stroke="#06121f"
                      strokeWidth={width + 9}
                      strokeLinecap="round"
                      opacity="0.8"
                    />

                    {/* Layer 2: Outer Reach Soft Glow with Cividis/Cyan Tint */}
                    <path
                      d={p.d}
                      fill="none"
                      stroke={isSelected ? "#74ECFF" : cividisStroke}
                      strokeWidth={width + (isSelected ? 6 : isHovered ? 4 : 2)}
                      strokeOpacity={isSelected ? 0.6 : 0.25}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      filter="url(#cyanGlow)"
                    />

                    {/* Layer 3: Main Core River Stroke (Cividis Colormap) */}
                    <path
                      d={p.d}
                      className={`reach-path-base ${isSelected ? "reach-path-selected" : ""}`}
                      stroke={isSelected ? "#74ECFF" : cividisStroke}
                      strokeWidth={width}
                    />

                    {/* Layer 4: Slope Uncertainty Hatched Overlay Pattern */}
                    {isUncertainSlope && (
                      <path
                        d={p.d}
                        fill="none"
                        stroke="url(#uncertainHatch)"
                        strokeWidth={width + 3}
                        strokeLinecap="round"
                        pointerEvents="none"
                      />
                    )}

                    {/* Layer 5: High-Speed Primary Flow Stream */}
                    {showFlowAnim && (
                      <path
                        d={p.flowD}
                        className="flow-animation-dash-primary"
                        strokeWidth={Math.max(2.5, width - 2)}
                      />
                    )}

                    {/* Layer 6: Secondary Shimmer Current */}
                    {showFlowAnim && (
                      <path
                        d={p.flowD}
                        className="flow-animation-dash-secondary"
                        strokeWidth={Math.max(1.2, (width - 2) * 0.55)}
                      />
                    )}

                    {/* Layer 7: Directional Hydrodynamic Chevrons */}
                    {p.chevrons?.map((ch, idx) => (
                      <polygon
                        key={idx}
                        points="-4,-3 3,0 -4,3"
                        fill="#38BDF8"
                        opacity="0.85"
                        transform={`translate(${ch.x}, ${ch.y}) rotate(${ch.rot})`}
                      />
                    ))}

                    {/* Layer 8: Glassmorphic Capsule for Reach Labels (Anti-Collision) */}
                    <rect
                      x={p.labelPos.x - 6}
                      y={p.labelPos.y - 12}
                      width={lang === "en" ? 172 : 185}
                      height={30}
                      rx="5"
                      fill="rgba(5, 10, 18, 0.9)"
                      stroke={isSelected ? "rgba(116, 236, 255, 0.65)" : "rgba(53, 216, 242, 0.2)"}
                      strokeWidth="1"
                    />

                    {/* Reach Title Label */}
                    <text
                      x={p.labelPos.x}
                      y={p.labelPos.y}
                      fontSize={isSelected ? "11.5" : "11"}
                      fontWeight={isSelected ? "750" : "600"}
                      fill={isSelected ? "#74ECFF" : "#F2F7FF"}
                      letterSpacing="-0.01em"
                      pointerEvents="none"
                    >
                      {reachName}
                    </text>

                    {/* Secondary Manning roughness tag with SWOT pass asterisk */}
                    <text
                      x={p.labelPos.x}
                      y={p.labelPos.y + 13}
                      fontSize="10"
                      fill="var(--text-secondary)"
                      fontFamily="var(--font-mono)"
                      pointerEvents="none"
                    >
                      {r
                        ? `${p.swotPass} · n=${r.calibrated_n} · W=${r.width_mean_m}m${isUncertainSlope ? " ⚠" : ""}`
                        : ""}
                    </text>
                  </g>
                );
              })}
            </g>

            {/* BWDB Kanaighat Gauge Station Marker (SW108) with Elevated Anti-Collision HUD Badge */}
            <g className="map-gauge-station">
              {/* Sonar Radar Pulse Rings (§4.3) centered on (380, 85) */}
              <circle
                cx="380"
                cy="85"
                r="6"
                className="gauge-sonar-pulse-1"
                fill="none"
                stroke="#FFC45C"
              />
              <circle
                cx="380"
                cy="85"
                r="6"
                className="gauge-sonar-pulse-2"
                fill="none"
                stroke="#FFC45C"
              />

              {/* Gauge Dot Core on River Channel */}
              <circle
                cx="380"
                cy="85"
                r="5.5"
                fill="#FFC45C"
                stroke="#050A12"
                strokeWidth="2"
                filter="drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5))"
              />

              {/* Vertical Dashed Leader Beacon connecting River Sensor to Elevated Badge */}
              <line
                x1="380"
                y1="42"
                x2="380"
                y2="85"
                stroke="#FFC45C"
                strokeWidth="1.2"
                strokeDasharray="3 3"
              />

              {/* Gauge Station Elevated Readout Badge (Safely centered above river, starting at x=275) */}
              <rect
                x="275"
                y="8"
                width="210"
                height="34"
                rx="6"
                fill="#FFFFFF"
                stroke="#B7791F"
                strokeWidth="1.2"
              />
              <circle cx="288" cy="22" r="4" fill="#B7791F" />
              <text x="298" y="21" fontSize="11.5" fill="#B7791F" fontWeight="750">
                {lang === "en" ? "Kanaighat Gauge (SW266 / SW108)" : "কানাইঘাট গেজ (SW২৬৬ / SW১০৮)"}
              </text>
              <text x="298" y="34" fontSize="11" fill="#173B57" fontFamily="var(--font-mono)">
                {currentGaugeLevel ? `${currentGaugeLevel.toFixed(2)} m PWD` : `Model: ${currentStage.toFixed(2)} m`}
                <tspan fill="#B4232F"> (Danger: {dangerLevel}m PWD)</tspan>
              </text>
            </g>

            {/* Hydrodynamic Basin Flow Vector Indicator (Top-Left HUD) */}
            <g transform="translate(14, 10)">
              <rect
                x="0"
                y="0"
                width="225"
                height="22"
                rx="11"
                fill="#FFFFFF"
                stroke="var(--border-subtle)"
              />
              <circle cx="12" cy="11" r="3.5" fill="#287BB5" />
              <text x="22" y="14.5" fontSize="10" fill="#287BB5" fontWeight="600">
                {lang === "en" ? "Barak Inflow ➔ Amalshid ➔ Haors" : "বরাক প্রবাহ ➔ আমলশীদ ➔ হাওর"}
              </text>
            </g>
          </svg>
        )}
      </div>

      {/* Map Bottom Legend & Controls Bar */}
      <div className="map-bottom-legend">
        <div className="legend-swatches-row" style={{ flexWrap: "wrap", gap: "16px" }}>
          {/* Cividis Colorbar Gradient Swatch */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary)" }}>
              {lang === "en" ? "Cividis Ratio:" : "সিভিডিস অনুপাত:"}
            </span>
            <div
              style={{
                width: "90px",
                height: "9px",
                borderRadius: "4px",
                background: "linear-gradient(90deg, #00204d 0%, #2c4972 25%, #5c6876 50%, #a8995c 75%, #fde725 100%)",
                border: "1px solid rgba(23, 59, 87, 0.15)",
              }}
              title={lang === "en" ? "CVD-safe Cividis colormap: Safe base flow to critical crest" : "বর্ণান্ধতা-বান্ধব সিভিডিস কালারম্যাপ: নিরাপদ স্তর থেকে বিপদসীমা"}
            />
            <span style={{ fontSize: "13px", fontFamily: "var(--font-mono)", color: "var(--text-muted)", fontWeight: 600 }}>
              0.50 → 1.05+
            </span>
          </div>

          {/* Geographic Highlights Swatches */}
          <div className="swatch-group">
            <span className="swatch-dot" style={{ background: "#B7791F", boxShadow: "0 0 6px rgba(183, 121, 31, 0.4)" }} />
            <span style={{ fontSize: "13.5px", fontWeight: 650, color: "var(--text-primary)" }}>
              {lang === "en" ? "📍 Kanaighat Gauge (SW266 / SW108)" : "📍 কানাইঘাট গেজ (SW২৬৬ / SW১০৮)"}
            </span>
          </div>

          <div className="swatch-group">
            <span style={{ width: "16px", height: "4px", borderRadius: "2px", background: "var(--blue-primary)" }} />
            <span style={{ fontSize: "13.5px", fontWeight: 650, color: "var(--blue-primary)" }}>
              {lang === "en" ? "🌊 Surma River (Operational)" : "🌊 সুরমা নদী (অপারেশনাল)"}
            </span>
          </div>

          <div className="swatch-group">
            <span style={{ width: "16px", height: "3px", borderRadius: "2px", background: "var(--text-muted)", borderTop: "1px dashed var(--border-subtle)" }} />
            <span style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
              {lang === "en" ? "〰️ Kushiyara River (Context)" : "〰️ কুশিয়ারা নদী (প্রসঙ্গ)"}
            </span>
          </div>

          <div className="swatch-group">
            <span style={{ width: "12px", height: "12px", borderRadius: "3px", border: "1.5px dashed var(--blue-deep)", background: "rgba(40, 123, 181, 0.15)" }} />
            <span style={{ fontSize: "13px", color: "var(--blue-deep)", fontWeight: 600 }}>
              {lang === "en" ? "🌧️ Meghalaya Catchment" : "🌧️ মেঘালয় ক্যাচমেন্ট"}
            </span>
          </div>

          <div style={{ fontSize: "12.5px", color: "var(--text-muted)", fontStyle: "italic" }}>
            {lang === "en" ? "* SWOT KaRIn overpass / SWORD v16" : "* SWOT উপগ্রহ / SWORD v16"}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <span style={{ fontSize: "13.5px", color: "var(--text-secondary)" }}>
            {lang === "en"
              ? "Click any reach on the map or inspect calibrated parameters:"
              : "মানচিত্রে ক্লিক করুন বা ক্যালিব্রেটেড প্যারামিটার দেখুন:"}
          </span>
          <button
            className="btn-standard"
            style={{ fontSize: "13px", fontWeight: 650, padding: "6px 14px", minHeight: "36px", display: "inline-flex", alignItems: "center", gap: "6px" }}
            onClick={() => {
              const sel = reaches?.find((x) => x.reach_id === selectedReachId) || reaches?.[0];
              if (onInspectReach && sel) onInspectReach(sel);
            }}
            title={lang === "en" ? "Inspect Reach Hydraulic Parameters" : "রিচের হাইড্রোলিক প্যারামিটার দেখুন"}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <span>{lang === "en" ? "Inspect Parameters" : "প্যারামিটার দেখুন"}</span>
          </button>
        </div>
      </div>
    </section>
  );
}
