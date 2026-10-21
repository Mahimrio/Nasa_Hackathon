"use client";

import { useEffect, useState, useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Polygon,
  Marker,
  Tooltip,
  ScaleControl,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { getCividisColor } from "./RiverMapPanel";

// Center on Surma-Kushiyara Haor corridor
const DEFAULT_CENTER = [24.96, 92.05];
const DEFAULT_ZOOM = 10;

// Helper component to adjust bounds or fly to selected reach
function MapController({ selectedCoords, zoomLevel }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    if (selectedCoords && selectedCoords.length) {
      const bounds = L.latLngBounds(selectedCoords);
      map.panTo(bounds.getCenter(), { animate: true, duration: 0.8 });
    }
  }, [selectedCoords, map]);

  return null;
}

export default function InteractiveMapLeaflet({
  reaches = [],
  riskFn = () => "GREEN",
  lang = "en",
  selectedReachId = "22211000011",
  setSelectedReachId = () => {},
  currentStage = 10.5,
  dangerLevel = 13.2,
  currentGaugeLevel = null,
  currentRainfall = 0,
  onInspectReach = () => {},
  showFlowAnim = true,
  showSwotSwath = true,
  showTerrain = true,
  showSubbasins = true,
  showRainfallOverlay = true,
}) {
  const [geoData, setGeoData] = useState(null);
  const [hoveredReachId, setHoveredReachId] = useState(null);

  // Fetch geographic polylines and sub-basin polygons
  useEffect(() => {
    fetch("/data/reach_geometries.json")
      .then((res) => res.json())
      .then((data) => setGeoData(data))
      .catch((err) => console.error("Failed to load reach_geometries.json:", err));
  }, []);

  // Compute Cividis color for reach
  const getReachColor = (reachId) => {
    const stageRatio = currentStage / dangerLevel;
    const level = riskFn(reachId);
    let ratio = stageRatio;
    if (level === "AMBER" && ratio < 0.82) ratio = 0.85;
    if (level === "RED" && ratio < 0.98) ratio = 1.02;
    return getCividisColor(ratio);
  };

  // Sonar gauge icon at Kanaighat SW108
  const sonarGaugeIcon = useMemo(() => {
    const stageDisplay = currentGaugeLevel != null
      ? `${currentGaugeLevel.toFixed(2)}m`
      : `${currentStage.toFixed(2)}m`;
    const isDanger = currentStage >= dangerLevel;
    const isAmber = currentStage >= dangerLevel * 0.8;
    const statusColor = isDanger ? "#EF4444" : isAmber ? "#F59E0B" : "#10B981";

    return L.divIcon({
      className: "leaflet-gauge-marker-container",
      html: `
        <div class="leaflet-sonar-pin">
          <div class="leaflet-sonar-ring ring-1" style="border-color: ${statusColor}"></div>
          <div class="leaflet-sonar-ring ring-2" style="border-color: ${statusColor}"></div>
          <div class="leaflet-sonar-core" style="background: ${statusColor}"></div>
          <div class="leaflet-gauge-label">
            <span class="station-tag">SW108</span>
            <span class="station-val">${stageDisplay}</span>
          </div>
        </div>
      `,
      iconSize: [110, 36],
      iconAnchor: [12, 12],
    });
  }, [currentGaugeLevel, currentStage, dangerLevel]);

  // Selected reach coordinates for map controller
  const selectedReachCoords = useMemo(() => {
    if (!geoData || !geoData.reaches) return null;
    const found = geoData.reaches.find((r) => r.reach_id === selectedReachId);
    return found ? found.coordinates : null;
  }, [geoData, selectedReachId]);

  return (
    <div className="interactive-leaflet-wrapper" style={{ width: "100%", height: "100%", minHeight: "420px", position: "relative" }}>
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        preferCanvas={true}
        scrollWheelZoom={true}
        style={{ width: "100%", height: "100%", minHeight: "420px", background: "#050A12", borderRadius: "12px" }}
        attributionControl={false}
      >
        <MapController selectedCoords={selectedReachCoords} />

        {/* CartoDB Dark Matter Basemap */}
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
          maxZoom={19}
        />

        {/* Scale bar control */}
        <ScaleControl position="bottomleft" imperial={false} />

        {/* HydroSHEDS Sub-Basin Boundaries */}
        {showSubbasins && geoData?.subbasins?.map((basin) => (
          <Polygon
            key={basin.id}
            positions={basin.coordinates}
            pathOptions={{
              color: basin.id === "upper_surma_meghalaya" ? "#35D8F2" : "#10B981",
              weight: 1.5,
              dashArray: "4, 6",
              fillColor: basin.id === "upper_surma_meghalaya" ? "#35D8F2" : "#10B981",
              fillOpacity: showTerrain ? 0.07 : 0.03,
            }}
          >
            <Tooltip sticky className="map-glass-tooltip">
              <div style={{ fontSize: "11px", fontWeight: 600 }}>
                {lang === "en" ? basin.name : basin.name_bn}
              </div>
              <div style={{ fontSize: "10px", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                {lang === "en" ? `Area: ${basin.area_km2} km² (HydroSHEDS v1)` : `আয়তন: ${basin.area_km2} বর্গকিমি`}
              </div>
            </Tooltip>
          </Polygon>
        ))}

        {/* Indo-Bangladesh Border / Meghalaya Escarpment Ridge */}
        {geoData?.meghalaya_border && (
          <Polyline
            positions={geoData.meghalaya_border}
            pathOptions={{
              color: "#F59E0B",
              weight: 2,
              dashArray: "6, 8",
              opacity: 0.85,
            }}
          >
            <Tooltip sticky className="map-glass-tooltip">
              <div style={{ fontSize: "11px", fontWeight: 600, color: "#F59E0B" }}>
                {lang === "en" ? "🇮🇳 India / 🇧🇩 Bangladesh Border" : "🇮🇳 ভারত / 🇧🇩 বাংলাদেশ সীমান্ত"}
              </div>
              <div style={{ fontSize: "10px", color: "var(--text-secondary)" }}>
                {lang === "en" ? "Meghalaya Escarpment (Steep Convective Runoff Zone)" : "মেঘালয় খাড়া ঢাল (তীব্র পাহাড়ি ঢল উৎস)"}
              </div>
            </Tooltip>
          </Polyline>
        )}

        {/* IMERG Early Run Precipitation Heatmap Plume Overlay */}
        {showRainfallOverlay && currentRainfall > 0.1 && (
          <Polygon
            positions={[
              [25.08, 91.50],
              [25.15, 91.75],
              [25.32, 92.15],
              [25.36, 92.45],
              [25.28, 92.65],
              [25.16, 92.55],
              [25.04, 92.25],
              [25.02, 91.80],
            ]}
            pathOptions={{
              color: currentRainfall > 15 ? "#EF4444" : currentRainfall > 5 ? "#F59E0B" : "#38BDF8",
              weight: 1,
              dashArray: "2, 4",
              fillColor: currentRainfall > 15 ? "#EF4444" : currentRainfall > 5 ? "#F59E0B" : "#38BDF8",
              fillOpacity: Math.min(0.55, 0.12 + (currentRainfall / 30) * 0.40),
            }}
          >
            <Tooltip sticky className="map-glass-tooltip">
              <div style={{ fontSize: "11px", fontWeight: 600, color: "#38BDF8" }}>
                {lang === "en" ? "NASA GPM IMERG Early Run Plume" : "নাসা জিপিএম আইমার্জ প্রাক-বৃষ্টিপাত বলয়"}
              </div>
              <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "#F8FAFC" }}>
                {lang === "en" ? `Rainfall: ${currentRainfall.toFixed(1)} mm/h` : `বৃষ্টিপাত: ${currentRainfall.toFixed(1)} মিমি/ঘণ্টা`}
              </div>
              <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                {lang === "en" ? "Latency ~4h | 0.1° resolution" : "লেটেন্সি ~৪ ঘণ্টা | ০.১° রেজোলিউশন"}
              </div>
            </Tooltip>
          </Polygon>
        )}

        {/* SWOT Orbital Ground Tracks (Swaths) */}
        {showSwotSwath && (
          <>
            {/* Ground Track 1 (Pass 018) */}
            <Polyline
              positions={[
                [25.38, 92.12],
                [24.58, 92.36],
              ]}
              pathOptions={{
                color: "rgba(53, 216, 242, 0.35)",
                weight: 1.5,
                dashArray: "3, 6",
              }}
            >
              <Tooltip sticky className="map-glass-tooltip">
                <span style={{ fontSize: "10px", color: "var(--cyan-primary)", fontFamily: "var(--font-mono)" }}>
                  SWOT KaRIn Ground Track (Pass 018 — Kanaighat corridor)
                </span>
              </Tooltip>
            </Polyline>

            {/* Ground Track 2 (Pass 042) */}
            <Polyline
              positions={[
                [25.30, 91.80],
                [24.50, 92.05],
              ]}
              pathOptions={{
                color: "rgba(53, 216, 242, 0.35)",
                weight: 1.5,
                dashArray: "3, 6",
              }}
            >
              <Tooltip sticky className="map-glass-tooltip">
                <span style={{ fontSize: "10px", color: "var(--cyan-primary)", fontFamily: "var(--font-mono)" }}>
                  SWOT KaRIn Ground Track (Pass 042 — Kushiyara corridor)
                </span>
              </Tooltip>
            </Polyline>
          </>
        )}

        {/* SWOT Calibrated Reaches Polylines */}
        {geoData?.reaches?.map((reach) => {
          const isSelected = reach.reach_id === selectedReachId;
          const isHovered = reach.reach_id === hoveredReachId;
          const reachColor = getReachColor(reach.reach_id);
          const meta = reaches?.find((r) => r.reach_id === reach.reach_id) || reach;

          return (
            <div key={reach.reach_id}>
              {/* Outer blurred glow polyline */}
              <Polyline
                positions={reach.coordinates}
                pathOptions={{
                  color: reachColor,
                  weight: isSelected ? 12 : 7,
                  opacity: isSelected ? 0.5 : 0.22,
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />

              {/* Core interactive polyline */}
              <Polyline
                positions={reach.coordinates}
                eventHandlers={{
                  click: () => {
                    setSelectedReachId(reach.reach_id);
                    if (onInspectReach) onInspectReach(meta);
                  },
                  mouseover: () => setHoveredReachId(reach.reach_id),
                  mouseout: () => setHoveredReachId(null),
                }}
                pathOptions={{
                  color: reachColor,
                  weight: isSelected ? 5.5 : 3.5,
                  opacity: 0.95,
                  lineCap: "round",
                  lineJoin: "round",
                  className: showFlowAnim ? "leaflet-flow-path" : "",
                }}
              >
                <Tooltip sticky className="map-glass-tooltip">
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <div style={{ fontWeight: 700, fontSize: "12px", color: "var(--text-primary)" }}>
                      {lang === "en" ? reach.reach_name : reach.reach_name_bn}
                    </div>
                    <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "var(--cyan-primary)" }}>
                      Reach ID: {reach.reach_id} ({reach.river_name})
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                      {lang === "en" ? "Calibrated Manning n: " : "ম্যানিং n: "}
                      <strong style={{ color: "#F8FAFC", fontFamily: "var(--font-mono)" }}>
                        {meta.calibrated_n ?? "0.0294"}
                      </strong>
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                      {lang === "en" ? "Mean Width: " : "গড় প্রস্থ: "}
                      <span style={{ color: "#F8FAFC", fontFamily: "var(--font-mono)" }}>
                        {reach.width_mean_m}m
                      </span>
                    </div>
                    <div style={{ fontSize: "10px", color: "var(--text-muted)", fontStyle: "italic", marginTop: "2px" }}>
                      {reach.swot_pass}
                    </div>
                    <div style={{ fontSize: "10px", color: "var(--cyan-primary)", marginTop: "2px" }}>
                      {lang === "en" ? "👆 Click to inspect parameters" : "👆 বিস্তারিত দেখতে ক্লিক করুন"}
                    </div>
                  </div>
                </Tooltip>
              </Polyline>
            </div>
          );
        })}

        {/* Kanaighat SW108 Gauge Marker */}
        <Marker
          position={[25.060, 92.228]}
          icon={sonarGaugeIcon}
          eventHandlers={{
            click: () => {
              setSelectedReachId("22211000011");
              const kReach = reaches?.find((r) => r.reach_id === "22211000011");
              if (onInspectReach && kReach) onInspectReach(kReach);
            },
          }}
        >
          <Tooltip sticky className="map-glass-tooltip">
            <div style={{ fontWeight: 700, fontSize: "12px", color: "#FFC45C" }}>
              {lang === "en" ? "BWDB Kanaighat Gauge Station (SW108)" : "বিডব্লিউডিবি কানাইঘাট গেজ স্টেশন (SW১০৮)"}
            </div>
            <div style={{ fontSize: "11px", fontFamily: "var(--font-mono)", color: "#F8FAFC" }}>
              {currentGaugeLevel != null
                ? `Observed: ${currentGaugeLevel.toFixed(2)} m PWD`
                : `Modelled: ${currentStage.toFixed(2)} m PWD`}
              <span style={{ color: "#EF4444" }}> (Danger: {dangerLevel}m)</span>
            </div>
            <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>
              Datum: PWD | Station SW108 | Surma River
            </div>
          </Tooltip>
        </Marker>
      </MapContainer>
    </div>
  );
}
