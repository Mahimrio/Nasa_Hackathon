"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Polyline,
  Polygon,
  Marker,
  Circle,
  Popup,
  Tooltip,
  ScaleControl,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { maplibreGL } from "@maplibre/maplibre-gl-leaflet";
import { setWorkerUrl } from "maplibre-gl";
import "leaflet/dist/leaflet.css";
import "maplibre-gl/dist/maplibre-gl.css";
import { getCividisColor } from "./RiverMapPanel";

// Surma-Kushiyara Haor corridor coordinates (centered to balance Meghalaya, rivers, and gauge)
const DEFAULT_CENTER = [24.98, 92.08];
const DEFAULT_ZOOM = 9.5;
const OPENFREEMAP_LIBERTY_URL = "https://tiles.openfreemap.org/styles/liberty";
const OPENFREEMAP_POSITRON_URL = "https://tiles.openfreemap.org/styles/positron";

// Configure MapLibre worker in Next.js environment (served from public/)
if (typeof window !== "undefined") {
  try {
    setWorkerUrl("/maplibre-gl-worker.mjs");
  } catch (e) {
    // Ignore if already registered
  }
}

// MapLibre GL vector basemap layer for Leaflet
function MapLibreGlLayer({ styleUrl }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    let glLayer = null;
    try {
      glLayer = maplibreGL({
        style: styleUrl,
        attribution:
          '<a href="https://openfreemap.org" target="_blank" rel="noopener noreferrer">OpenFreeMap</a> © <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener noreferrer">OpenMapTiles</a> Data © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
        interactive: false,
        pane: "tilePane",
      });
      glLayer.addTo(map);
    } catch (err) {
      console.error("MapLibre GL Leaflet layer error:", err);
    }

    return () => {
      if (glLayer && map) {
        try {
          map.removeLayer(glLayer);
        } catch (e) {
          // ignore layer removal errors
        }
      }
    };
  }, [map, styleUrl]);

  return null;
}

// Bridge component to expose map instance to parent for smooth location flying
function MapInstanceBridge({ onMapReady }) {
  const map = useMap();
  useEffect(() => {
    if (map && onMapReady) {
      onMapReady(map);
    }
  }, [map, onMapReady]);
  return null;
}

// Controller to smoothly pan to selected reach and ensure proper map sizing
function MapController({ selectedCoords }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    if (selectedCoords && selectedCoords.length) {
      const bounds = L.latLngBounds(selectedCoords);
      map.panTo(bounds.getCenter(), { animate: true, duration: 0.8 });
    }
  }, [selectedCoords, map]);

  useEffect(() => {
    if (!map) return;
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);

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
  setShowFlowAnim = () => {},
  showSwotSwath = true,
  setShowSwotSwath = () => {},
  showTerrain = true,
  setShowTerrain = () => {},
  showSubbasins = true,
  setShowSubbasins = () => {},
  showRainfallOverlay = true,
  setShowRainfallOverlay = () => {},
}) {
  const [geoData, setGeoData] = useState(null);
  const [hoveredReachId, setHoveredReachId] = useState(null);
  const [basemapType, setBasemapType] = useState("liberty"); // "liberty" (colorful default) | "positron" (clean light) | "satellite"
  const [isOffline, setIsOffline] = useState(false);

  // Dropdown menus state: 'basemap' | 'layers' | 'focus' | null
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownToolbarRef = useRef(null);

  // Accordion state for all 4 layer options in the layer dropdown
  const [expandedLayers, setExpandedLayers] = useState({
    flow: false,
    swot: false,
    basins: false,
    rainfall: false,
  });

  const toggleLayerAccordion = (key, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setExpandedLayers((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // My Location state
  const [mapInstance, setMapInstance] = useState(null);
  const [userLocation, setUserLocation] = useState(null); // { lat, lng, accuracy, timestamp }
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const userMarkerRef = useRef(null);
  const kanaighatMarkerRef = useRef(null);
  const [activeHighlight, setActiveHighlight] = useState(null);

  // Close dropdowns on outside click or Escape key
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownToolbarRef.current && !dropdownToolbarRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") setOpenDropdown(null);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const toggleDropdown = (name) => {
    setOpenDropdown((prev) => (prev === name ? null : name));
  };

  useEffect(() => {
    const handleNetChange = () => {
      if (typeof navigator !== "undefined") {
        setIsOffline(!navigator.onLine);
      }
    };
    handleNetChange();
    window.addEventListener("online", handleNetChange);
    window.addEventListener("offline", handleNetChange);
    return () => {
      window.removeEventListener("online", handleNetChange);
      window.removeEventListener("offline", handleNetChange);
    };
  }, []);

  // Fetch geographic polylines and sub-basin polygons
  useEffect(() => {
    fetch(`/data/reach_geometries.json?t=${Date.now()}`, { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setGeoData(data))
      .catch((err) => console.error("Failed to load reach_geometries.json:", err));
  }, []);

  // High-contrast, CVD-safe risk colors optimized for colorful and light basemaps
  const getRiskColors = (level) => {
    switch (level) {
      case "RED":
        return {
          stroke: "#DC2626", // Crisp crimson red
          glow: "rgba(220, 38, 38, 0.32)",
          fill: "rgba(239, 68, 68, 0.20)",
        };
      case "AMBER":
        return {
          stroke: "#D97706", // Deep vivid amber/gold
          glow: "rgba(217, 119, 6, 0.30)",
          fill: "rgba(245, 158, 11, 0.18)",
        };
      case "GREEN":
      default:
        return {
          stroke: "#059669", // Rich emerald green
          glow: "rgba(5, 150, 105, 0.28)",
          fill: "rgba(16, 185, 129, 0.12)",
        };
    }
  };

  const getReachColor = (reachId) => {
    const level = riskFn(reachId);
    return getRiskColors(level).stroke;
  };

  // Sonar gauge icon at Kanaighat SW108
  const sonarGaugeIcon = useMemo(() => {
    const stageDisplay = currentGaugeLevel != null
      ? `${currentGaugeLevel.toFixed(2)}m`
      : `${currentStage.toFixed(2)}m`;
    const isDanger = currentStage >= dangerLevel;
    const isAmber = currentStage >= dangerLevel * 0.8;
    const statusColor = isDanger ? "#DC2626" : isAmber ? "#D97706" : "#059669";

    const tagTitle = lang === "en" ? "Official BWDB SW266 · Model SW108" : "সরকারি বাপাউবো SW২৬৬ · মডেল SW১০৮";

    return L.divIcon({
      className: "leaflet-gauge-marker-container",
      html: `
        <div class="leaflet-sonar-pin">
          <div class="leaflet-sonar-ring ring-1" style="border-color: ${statusColor}"></div>
          <div class="leaflet-sonar-ring ring-2" style="border-color: ${statusColor}"></div>
          <div class="leaflet-sonar-core" style="background: ${statusColor}; border: 2px solid #FFFFFF;"></div>
          <div class="leaflet-gauge-label">
            <span class="station-tag" title="${tagTitle}">SW266</span>
            <span class="station-val">${stageDisplay}</span>
          </div>
        </div>
      `,
      iconSize: [110, 36],
      iconAnchor: [12, 12],
    });
  }, [currentGaugeLevel, currentStage, dangerLevel, lang]);

  // Selected reach coordinates for map controller
  const selectedReachCoords = useMemo(() => {
    if (!geoData || !geoData.reaches) return null;
    const found = geoData.reaches.find((r) => r.reach_id === selectedReachId);
    return found ? found.coordinates : null;
  }, [geoData, selectedReachId]);

  // Distinct blue location marker with pulsing ripple wave
  const userLocationIcon = useMemo(() => {
    return L.divIcon({
      className: "leaflet-user-location-container",
      html: `
        <div class="user-location-pin">
          <div class="user-location-pulse"></div>
          <div class="user-location-core"></div>
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -16],
    });
  }, []);

  // Programmatically pan & focus on one of the four key geographic features
  const focusHighlight = (featureKey) => {
    if (!mapInstance) return;
    setActiveHighlight(featureKey);
    switch (featureKey) {
      case "kanaighat": {
        const kLat = geoData?.gauge_stations?.[0]?.lat || 24.9980;
        const kLon = geoData?.gauge_stations?.[0]?.lon || 92.2594;
        mapInstance.flyTo([kLat, kLon], 13.5, { animate: true, duration: 1.0 });
        if (kanaighatMarkerRef.current) {
          kanaighatMarkerRef.current.openPopup();
        }
        break;
      }
      case "surma": {
        mapInstance.flyTo([25.01, 92.15], 11, { animate: true, duration: 1.0 });
        setSelectedReachId("22211000011");
        const sReach = reaches?.find((r) => r.reach_id === "22211000011");
        if (onInspectReach && sReach) onInspectReach(sReach);
        break;
      }
      case "kushiyara": {
        mapInstance.flyTo([24.87, 92.15], 10.5, { animate: true, duration: 1.0 });
        setSelectedReachId("22211000021");
        const kshReach = reaches?.find((r) => r.reach_id === "22211000021");
        if (onInspectReach && kshReach) onInspectReach(kshReach);
        break;
      }
      case "meghalaya": {
        mapInstance.flyTo([25.18, 92.30], 10.2, { animate: true, duration: 1.0 });
        break;
      }
      default:
        break;
    }
  };



  // Browser Geolocation Handler (On-demand only, client-side only)
  const handleLocateMe = () => {
    if (typeof window === "undefined" || !navigator.geolocation) {
      setLocationError(
        lang === "en"
          ? "Geolocation is not supported by your browser."
          : "আপনার ব্রাউজারে অবস্থান নির্ণয় সুবিধা সমর্থিত নয়।"
      );
      return;
    }

    if (locating) return;

    // If location is already known, smoothly re-center and open popup immediately
    if (userLocation && mapInstance) {
      mapInstance.flyTo([userLocation.lat, userLocation.lng], 14, {
        animate: true,
        duration: 1.0,
      });
      if (userMarkerRef.current) {
        userMarkerRef.current.openPopup();
      }
    }

    setLocating(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const newLoc = {
          lat: latitude,
          lng: longitude,
          accuracy: accuracy || 50,
          timestamp: position.timestamp || Date.now(),
        };
        setUserLocation(newLoc);
        setLocating(false);

        if (mapInstance) {
          const targetZoom = accuracy && accuracy < 300 ? 14 : 12;
          mapInstance.flyTo([latitude, longitude], targetZoom, {
            animate: true,
            duration: 1.2,
          });
        }
      },
      (err) => {
        setLocating(false);
        let errorMsg = "";
        switch (err.code) {
          case 1: // PERMISSION_DENIED
            errorMsg =
              lang === "en"
                ? "Location permission denied. Please allow location access in your browser."
                : "লোকেশন অনুমতি প্রত্যাখ্যাত হয়েছে। ব্রাউজার সেটিংসে অনুমতি দিন।";
            break;
          case 2: // POSITION_UNAVAILABLE
            errorMsg =
              lang === "en"
                ? "Location information unavailable. Check network or GPS connection."
                : "লোকেশন তথ্য পাওয়া যায়নি। নেটওয়ার্ক বা জিপিএস চেক করুন।";
            break;
          case 3: // TIMEOUT
            errorMsg =
              lang === "en"
                ? "Location request timed out. Please try again."
                : "অবস্থান অনুসন্ধানের সময় শেষ হয়েছে। আবার চেষ্টা করুন।";
            break;
          default:
            errorMsg =
              lang === "en"
                ? "Unable to determine your current location."
                : "বর্তমান অবস্থান নির্ণয় করা যায়নি।";
            break;
        }
        setLocationError(errorMsg);
        setTimeout(() => {
          setLocationError(null);
        }, 7000);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  };

  // Automatically open location popup when coordinates are acquired or updated
  useEffect(() => {
    if (userLocation && userMarkerRef.current) {
      const timer = setTimeout(() => {
        if (userMarkerRef.current) {
          userMarkerRef.current.openPopup();
        }
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [userLocation]);

  return (
    <div
      className="interactive-leaflet-wrapper"
      style={{
        width: "100%",
        height: "100%",
        minHeight: "580px",
        position: "relative",
        background: "#f4f6f9",
      }}
    >
      {/* Offline Mode Alert Badge */}
      {isOffline && (
        <div
          style={{
            position: "absolute",
            top: "12px",
            left: "50px",
            zIndex: 1000,
            background: "rgba(14, 27, 45, 0.94)",
            border: "1px solid rgba(255, 196, 92, 0.4)",
            borderRadius: "var(--radius-pill)",
            padding: "4px 12px",
            fontSize: "11px",
            color: "var(--amber-400)",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            backdropFilter: "blur(8px)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}
        >
          <span>⚡</span>
          <span>
            {lang === "en"
              ? "Offline Mode · Cached SWOT Telemetry Active"
              : "অফলাইন মোড · লোকাল সোয়াট ডেটা সক্রিয়"}
          </span>
        </div>
      )}

      {/* Floating "My Location" Button directly below zoom controls */}
      <button
        type="button"
        onClick={handleLocateMe}
        disabled={locating}
        className={`leaflet-location-btn ${userLocation ? "active" : ""} ${locating ? "locating" : ""}`}
        style={{
          position: "absolute",
          top: "108px",
          left: "12px",
          zIndex: 1000,
        }}
        title={
          lang === "en"
            ? locating
              ? "Acquiring your location..."
              : userLocation
              ? "Re-center on My Location"
              : "Find My Current Location"
            : locating
            ? "অবস্থান খোঁজা হচ্ছে..."
            : userLocation
            ? "আমার অবস্থানে পুনরায় যান"
            : "আমার বর্তমান অবস্থান খুঁজুন"
        }
        aria-label={lang === "en" ? "Find my current location" : "আমার বর্তমান অবস্থান খুঁজুন"}
      >
        {locating ? (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            style={{ animation: "spin 1s linear infinite" }}
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
        ) : (
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="3" />
            <circle cx="12" cy="12" r="8" />
            <line x1="12" y1="2" x2="12" y2="5" />
            <line x1="12" y1="19" x2="12" y2="22" />
            <line x1="2" y1="12" x2="5" y2="12" />
            <line x1="19" y1="12" x2="22" y2="12" />
          </svg>
        )}
      </button>

      {/* Location Error Toast */}
      {locationError && (
        <div
          style={{
            position: "absolute",
            top: "108px",
            left: "64px",
            zIndex: 1050,
            background: "#FFFFFF",
            border: "1px solid var(--glass-stroke-red, #B4232F)",
            borderRadius: "var(--radius-sm)",
            padding: "8px 12px",
            fontSize: "11px",
            color: "var(--text-primary)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            boxShadow: "0 8px 24px rgba(23, 59, 87, 0.15)",
            backdropFilter: "blur(10px)",
            maxWidth: "320px",
            animation: "fadeIn 0.2s ease-out",
          }}
        >
          <span style={{ color: "#B4232F", fontSize: "14px" }}>⚠️</span>
          <span style={{ lineHeight: "1.4" }}>{locationError}</span>
          <button
            type="button"
            onClick={() => setLocationError(null)}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--text-secondary)",
              cursor: "pointer",
              padding: "0 2px",
              marginLeft: "auto",
              fontSize: "14px",
              lineHeight: 1,
            }}
            title={lang === "en" ? "Dismiss" : "বাতিল করুন"}
          >
            ✕
          </button>
        </div>
      )}

      {/* Floating Modern Map Dropdown Toolbar (Basemap, Layers & Overlays, Quick Focus) */}
      <div className="map-dropdown-toolbar" ref={dropdownToolbarRef} role="toolbar" aria-label={lang === "en" ? "Map Controls" : "মানচিত্র নিয়ন্ত্রণ"}>
        {/* Dropdown 1: Basemap Selection */}
        <div className="map-dropdown-container">
          <button
            type="button"
            className={`map-dropdown-trigger ${openDropdown === "basemap" ? "active" : ""}`}
            onClick={() => toggleDropdown("basemap")}
            aria-expanded={openDropdown === "basemap"}
            aria-haspopup="menu"
            title={lang === "en" ? "Select Map Basemap Style" : "বেসম্যাপ ধরন নির্বাচন করুন"}
          >
            <span>{basemapType === "satellite" ? "🛰️" : basemapType === "positron" ? "📄" : "🗺️"}</span>
            <span>
              {basemapType === "satellite"
                ? (lang === "en" ? "Satellite" : "উপগ্রহ")
                : basemapType === "positron"
                ? (lang === "en" ? "Light" : "হালকা")
                : (lang === "en" ? "Colorful" : "রঙিন")}
            </span>
            <svg className="dropdown-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {openDropdown === "basemap" && (
            <div className="map-dropdown-menu" role="menu" style={{ minWidth: "210px" }}>
              <div className="map-dropdown-menu-header">
                <span>{lang === "en" ? "Basemap Style" : "বেসম্যাপ স্টাইল"}</span>
              </div>
              <button
                type="button"
                role="menuitem"
                className={`map-dropdown-item ${basemapType === "liberty" ? "active" : ""}`}
                onClick={() => {
                  setBasemapType("liberty");
                  setOpenDropdown(null);
                }}
              >
                <div className="dropdown-item-left">
                  <span>🗺️</span>
                  <div className="dropdown-item-info">
                    <span className="dropdown-item-title">{lang === "en" ? "Colorful" : "রঙিন টপোগ্রাফিক"}</span>
                    <span className="dropdown-item-sub">OpenFreeMap Liberty</span>
                  </div>
                </div>
                {basemapType === "liberty" && <span style={{ color: "var(--blue-primary)", fontWeight: 800 }}>✓</span>}
              </button>
              <button
                type="button"
                role="menuitem"
                className={`map-dropdown-item ${basemapType === "positron" ? "active" : ""}`}
                onClick={() => {
                  setBasemapType("positron");
                  setOpenDropdown(null);
                }}
              >
                <div className="dropdown-item-left">
                  <span>📄</span>
                  <div className="dropdown-item-info">
                    <span className="dropdown-item-title">{lang === "en" ? "Light Grayscale" : "হালকা মিনিমালিস্ট"}</span>
                    <span className="dropdown-item-sub">OpenFreeMap Positron</span>
                  </div>
                </div>
                {basemapType === "positron" && <span style={{ color: "var(--blue-primary)", fontWeight: 800 }}>✓</span>}
              </button>
              <button
                type="button"
                role="menuitem"
                className={`map-dropdown-item ${basemapType === "satellite" ? "active" : ""}`}
                onClick={() => {
                  setBasemapType("satellite");
                  setOpenDropdown(null);
                }}
              >
                <div className="dropdown-item-left">
                  <span>🛰️</span>
                  <div className="dropdown-item-info">
                    <span className="dropdown-item-title">{lang === "en" ? "Satellite" : "উপগ্রহ ছবি"}</span>
                    <span className="dropdown-item-sub">Esri World Imagery</span>
                  </div>
                </div>
                {basemapType === "satellite" && <span style={{ color: "var(--blue-primary)", fontWeight: 800 }}>✓</span>}
              </button>
            </div>
          )}
        </div>

        {/* Dropdown 2: Layers & Overlays */}
        <div className="map-dropdown-container">
          <button
            type="button"
            className={`map-dropdown-trigger ${openDropdown === "layers" ? "active" : ""}`}
            onClick={() => toggleDropdown("layers")}
            aria-expanded={openDropdown === "layers"}
            aria-haspopup="menu"
            title={lang === "en" ? "Toggle Map Layers & Overlays" : "মানচিত্র লেয়ার অন/অফ করুন"}
          >
            <span>⚡</span>
            <span>{lang === "en" ? "Layers" : "লেয়ার"}</span>
            <span className="map-dropdown-badge">
              {[showFlowAnim, showSwotSwath, showSubbasins, showRainfallOverlay].filter(Boolean).length}
            </span>
            <svg className="dropdown-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {openDropdown === "layers" && (
            <div className="map-dropdown-menu map-layers-menu" role="menu" style={{ minWidth: "320px", maxWidth: "380px" }}>
              <div className="map-dropdown-menu-header">
                <span>{lang === "en" ? "Map Layers & Overlays" : "মানচিত্র লেয়ার ও ওভারলে"}</span>
                <span style={{ fontSize: "12px", color: "var(--blue-primary)", fontWeight: 700 }}>
                  {[showFlowAnim, showSwotSwath, showSubbasins, showRainfallOverlay].filter(Boolean).length}/4 {lang === "en" ? "Active" : "সক্রিয়"}
                </span>
              </div>

              {/* Layer 1: River Flow Motion (Toggle Down Accordion) */}
              <div className={`map-layer-accordion ${expandedLayers.flow ? "expanded" : ""}`}>
                <div className="map-layer-row">
                  <button
                    type="button"
                    className="map-layer-toggle-btn"
                    onClick={() => setShowFlowAnim(!showFlowAnim)}
                    title={lang === "en" ? "Toggle river flow motion on/off" : "নদী প্রবাহ মোশন অন/অফ করুন"}
                  >
                    <span className="layer-icon" aria-hidden="true">🌊</span>
                    <div className="layer-title-box">
                      <span className="dropdown-item-title">{lang === "en" ? "River Flow Motion" : "নদী প্রবাহ মোশন"}</span>
                      <span className="dropdown-item-sub">{lang === "en" ? "Surma & Kushiyara velocity vectors" : "প্রবাহের গতিবেগ ভেক্টর"}</span>
                    </div>
                    <div className={`dropdown-switch ${showFlowAnim ? "on" : ""}`} aria-hidden="true">
                      <div className="dropdown-switch-handle" />
                    </div>
                  </button>
                  <button
                    type="button"
                    className={`layer-disclosure-btn ${expandedLayers.flow ? "active" : ""}`}
                    onClick={(e) => toggleLayerAccordion("flow", e)}
                    aria-expanded={expandedLayers.flow}
                    title={lang === "en" ? "Toggle layer details down" : "লেয়ার বিস্তারিত দেখুন"}
                  >
                    <svg className={`accordion-chevron ${expandedLayers.flow ? "expanded" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                </div>
                {expandedLayers.flow && (
                  <div className="map-layer-accordion-body">
                    <div className="layer-detail-desc">
                      {lang === "en"
                        ? "Calculated 1D hydrodynamic routing vector particles following high-resolution OSM/SWORD meander polylines."
                        : "উচ্চ-রেজোলিউশন সুরমা ও কুশিয়ারা নদীর বক্ররেখা বরাবর ক্যালিব্রেটেড ১ডি হাইড্রোডাইনামিক প্রবাহ অ্যানিমেশন।"}
                    </div>
                    <div className="layer-detail-stats">
                      <div className="layer-stat-item">
                        <span className="stat-name">{lang === "en" ? "Routing Speed:" : "প্রবাহ বেগ:"}</span>
                        <strong className="stat-val">1.4 m/s (5.0 km/h)</strong>
                      </div>
                      <div className="layer-stat-item">
                        <span className="stat-name">{lang === "en" ? "Active Channel:" : "সক্রিয় রুট:"}</span>
                        <strong className="stat-val">{lang === "en" ? "Surma (SW108 / SW266)" : "সুরমা (SW১০৮ / SW২৬৬)"}</strong>
                      </div>
                      <div className="layer-stat-item">
                        <span className="stat-name">{lang === "en" ? "Transit Lag:" : "ট্রানজিট সময়:"}</span>
                        <strong className="stat-val">~22.5 {lang === "en" ? "hours" : "ঘণ্টা"}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Layer 2: SWOT Satellite Swaths (Toggle Down Accordion) */}
              <div className={`map-layer-accordion ${expandedLayers.swot ? "expanded" : ""}`}>
                <div className="map-layer-row">
                  <button
                    type="button"
                    className="map-layer-toggle-btn"
                    onClick={() => setShowSwotSwath(!showSwotSwath)}
                    title={lang === "en" ? "Toggle SWOT Swaths on/off" : "SWOT কক্ষপথ অন/অফ করুন"}
                  >
                    <span className="layer-icon" aria-hidden="true">🛰️</span>
                    <div className="layer-title-box">
                      <span className="dropdown-item-title">{lang === "en" ? "SWOT Satellite Swaths" : "SWOT উপগ্রহ কক্ষপথ"}</span>
                      <span className="dropdown-item-sub">{lang === "en" ? "Pass 018 & 042 KaRIn tracks" : "পাস ০১৮ ও ০৪২ ট্র‍্যাক"}</span>
                    </div>
                    <div className={`dropdown-switch ${showSwotSwath ? "on" : ""}`} aria-hidden="true">
                      <div className="dropdown-switch-handle" />
                    </div>
                  </button>
                  <button
                    type="button"
                    className={`layer-disclosure-btn ${expandedLayers.swot ? "active" : ""}`}
                    onClick={(e) => toggleLayerAccordion("swot", e)}
                    aria-expanded={expandedLayers.swot}
                    title={lang === "en" ? "Toggle layer details down" : "লেয়ার বিস্তারিত দেখুন"}
                  >
                    <svg className={`accordion-chevron ${expandedLayers.swot ? "expanded" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                </div>
                {expandedLayers.swot && (
                  <div className="map-layer-accordion-body">
                    <div className="layer-detail-desc">
                      {lang === "en"
                        ? "NASA/CNES Ka-band Radar Interferometer (KaRIn) orbital swathes providing 120km swath coverage and water surface elevations."
                        : "নাসা ও সিএনইএস-এর কা-ব্যান্ড রাডার ইন্টারফেরোমিটার (KaRIn) ১২০ কিমি প্রশস্ত উপগ্রহ ট্র‍্যাক ও পানির উচ্চতা পরিমাপ।"}
                    </div>
                    <div className="layer-detail-stats">
                      <div className="layer-stat-item">
                        <span className="stat-name">{lang === "en" ? "Orbit Repeat:" : "রিভিজিট সাইকেল:"}</span>
                        <strong className="stat-val">21 {lang === "en" ? "days" : "দিন"}</strong>
                      </div>
                      <div className="layer-stat-item">
                        <span className="stat-name">{lang === "en" ? "Ground Tracks:" : "কক্ষপথ ট্র্যাক:"}</span>
                        <strong className="stat-val">Pass 018 & Pass 042</strong>
                      </div>
                      <div className="layer-stat-item">
                        <span className="stat-name">{lang === "en" ? "Instrument:" : "যন্ত্রপাতি:"}</span>
                        <strong className="stat-val">KaRIn (120 km swath)</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Layer 3: HydroSHEDS Basins (Toggle Down Accordion) */}
              <div className={`map-layer-accordion ${expandedLayers.basins ? "expanded" : ""}`}>
                <div className="map-layer-row">
                  <button
                    type="button"
                    className="map-layer-toggle-btn"
                    onClick={() => setShowSubbasins(!showSubbasins)}
                    title={lang === "en" ? "Toggle Basins on/off" : "অববাহিকা অন/অফ করুন"}
                  >
                    <span className="layer-icon" aria-hidden="true">⛰️</span>
                    <div className="layer-title-box">
                      <span className="dropdown-item-title">{lang === "en" ? "HydroSHEDS Basins" : "হাইড্রোশেডস অববাহিকা"}</span>
                      <span className="dropdown-item-sub">{lang === "en" ? "Meghalaya runoff catchment" : "মেঘালয় উজানের ক্যাচমেন্ট"}</span>
                    </div>
                    <div className={`dropdown-switch ${showSubbasins ? "on" : ""}`} aria-hidden="true">
                      <div className="dropdown-switch-handle" />
                    </div>
                  </button>
                  <button
                    type="button"
                    className={`layer-disclosure-btn ${expandedLayers.basins ? "active" : ""}`}
                    onClick={(e) => toggleLayerAccordion("basins", e)}
                    aria-expanded={expandedLayers.basins}
                    title={lang === "en" ? "Toggle layer details down" : "লেয়ার বিস্তারিত দেখুন"}
                  >
                    <svg className={`accordion-chevron ${expandedLayers.basins ? "expanded" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                </div>
                {expandedLayers.basins && (
                  <div className="map-layer-accordion-body">
                    <div className="layer-detail-desc">
                      {lang === "en"
                        ? "Delineated watershed boundary of the southern Meghalaya plateau where orographic rainfall is funneled directly into the Surma basin."
                        : "দক্ষিণ মেঘালয় পর্বতমালার পানি নিষ্কাশন সীমানা, যেখানকার বৃষ্টিপাত সরাসরি সুরমা অববাহিকায় প্রবেশ করে।"}
                    </div>
                    <div className="layer-detail-stats">
                      <div className="layer-stat-item">
                        <span className="stat-name">{lang === "en" ? "Drainage Area:" : "ক্যাচমেন্ট আয়তন:"}</span>
                        <strong className="stat-val">1,840 km²</strong>
                      </div>
                      <div className="layer-stat-item">
                        <span className="stat-name">{lang === "en" ? "Dataset:" : "উৎস ডেটাসেট:"}</span>
                        <strong className="stat-val">HydroSHEDS v1.0 (L8)</strong>
                      </div>
                      <div className="layer-stat-item">
                        <span className="stat-name">{lang === "en" ? "Flood Genesis:" : "বন্যা উৎপত্তি:"}</span>
                        <strong className="stat-val">{lang === "en" ? "Orographic Flash Runoff" : "পাহাড়ি তাৎক্ষণিক ঢল"}</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Layer 4: IMERG Rainfall Heatmap (Toggle Down Accordion) */}
              <div className={`map-layer-accordion ${expandedLayers.rainfall ? "expanded" : ""}`}>
                <div className="map-layer-row">
                  <button
                    type="button"
                    className="map-layer-toggle-btn"
                    onClick={() => setShowRainfallOverlay(!showRainfallOverlay)}
                    title={lang === "en" ? "Toggle Rainfall layer on/off" : "বৃষ্টিপাত ওভারলে অন/অফ করুন"}
                  >
                    <span className="layer-icon" aria-hidden="true">🌧️</span>
                    <div className="layer-title-box">
                      <span className="dropdown-item-title">{lang === "en" ? "IMERG Rainfall Heatmap" : "আইমার্জ বৃষ্টিপাত ওভারলে"}</span>
                      <span className="dropdown-item-sub">{lang === "en" ? "NASA GPM convective plume" : "নাসা জিপিএম প্রাক-বৃষ্টিপাত"}</span>
                    </div>
                    <div className={`dropdown-switch ${showRainfallOverlay ? "on" : ""}`} aria-hidden="true">
                      <div className="dropdown-switch-handle" />
                    </div>
                  </button>
                  <button
                    type="button"
                    className={`layer-disclosure-btn ${expandedLayers.rainfall ? "active" : ""}`}
                    onClick={(e) => toggleLayerAccordion("rainfall", e)}
                    aria-expanded={expandedLayers.rainfall}
                    title={lang === "en" ? "Toggle layer details down" : "লেয়ার বিস্তারিত দেখুন"}
                  >
                    <svg className={`accordion-chevron ${expandedLayers.rainfall ? "expanded" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                </div>
                {expandedLayers.rainfall && (
                  <div className="map-layer-accordion-body">
                    <div className="layer-detail-desc">
                      {lang === "en"
                        ? "NASA Global Precipitation Measurement (GPM) IMERG Early Run near-real-time satellite precipitation plume driving hydraulic routing."
                        : "নাসা জিপিএম আইমার্জ প্রাক-বৃষ্টিপাত উপগ্রহ মানচিত্র যা নদীর প্রবাহ মডেল পরিচালনায় ব্যবহৃত হয়।"}
                    </div>
                    <div className="layer-detail-stats">
                      <div className="layer-stat-item">
                        <span className="stat-name">{lang === "en" ? "Latency:" : "সময় ব্যবধান:"}</span>
                        <strong className="stat-val">~4 {lang === "en" ? "hours Early Run" : "ঘণ্টা আর্লি রান"}</strong>
                      </div>
                      <div className="layer-stat-item">
                        <span className="stat-name">{lang === "en" ? "Grid Resolution:" : "রেজোলিউশন:"}</span>
                        <strong className="stat-val">0.1° (~10 km)</strong>
                      </div>
                      <div className="layer-stat-item">
                        <span className="stat-name">{lang === "en" ? "Current Rate:" : "বর্তমান মাত্রা:"}</span>
                        <strong className="stat-val" style={{ color: currentRainfall > 15 ? "#B4232F" : currentRainfall > 5 ? "#B7791F" : "#287BB5" }}>
                          {currentRainfall.toFixed(1)} mm/h
                        </strong>
                      </div>
                    </div>
                    <div className="layer-legend-bar">
                      <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontWeight: 600 }}>{lang === "en" ? "Scale:" : "স্কেল:"}</span>
                      <span className="threshold-chip light">&lt;5 mm/h {lang === "en" ? "Light" : "হালকা"}</span>
                      <span className="threshold-chip mod">5-15 mm/h {lang === "en" ? "Watch" : "সতর্কতা"}</span>
                      <span className="threshold-chip heavy">&gt;15 mm/h {lang === "en" ? "Heavy" : "ভারী"}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Dropdown 3: Geographic Focus Quick Jump */}
        <div className="map-dropdown-container">
          <button
            type="button"
            className={`map-dropdown-trigger ${openDropdown === "focus" ? "active" : ""}`}
            onClick={() => toggleDropdown("focus")}
            aria-expanded={openDropdown === "focus"}
            aria-haspopup="menu"
            title={lang === "en" ? "Fly to Key Geographic Landmarks" : "প্রধান ভৌগোলিক অবস্থানে যান"}
          >
            <span>🧭</span>
            <span>{lang === "en" ? "Quick Focus" : "দ্রুত সন্ধান"}</span>
            <svg className="dropdown-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
          {openDropdown === "focus" && (
            <div className="map-dropdown-menu" role="menu" style={{ minWidth: "260px" }}>
              <div className="map-dropdown-menu-header">
                <span>{lang === "en" ? "4 Key Geographic Features" : "৪টি প্রধান ভৌগোলিক বৈশিষ্ট্য"}</span>
              </div>
              <button
                type="button"
                className="map-dropdown-item"
                onClick={() => {
                  focusHighlight("kanaighat");
                  setOpenDropdown(null);
                }}
              >
                <div className="dropdown-item-left">
                  <span style={{ fontSize: "14px" }}>📍</span>
                  <div className="dropdown-item-info">
                    <span className="dropdown-item-title">{lang === "en" ? "Kanaighat Gauge (SW266)" : "কানাইঘাট গেজ (SW২৬৬)"}</span>
                    <span className="dropdown-item-sub">{lang === "en" ? "Validation Station · 24.9980°N, 92.2594°E" : "সুরমা যাচাইকরণ গেজ (SW১০৮)"}</span>
                  </div>
                </div>
              </button>
              <button
                type="button"
                className="map-dropdown-item"
                onClick={() => {
                  focusHighlight("surma");
                  setOpenDropdown(null);
                }}
              >
                <div className="dropdown-item-left">
                  <span style={{ fontSize: "14px" }}>🌊</span>
                  <div className="dropdown-item-info">
                    <span className="dropdown-item-title">{lang === "en" ? "Surma River Corridor" : "সুরমা নদী করিডোর"}</span>
                    <span className="dropdown-item-sub">{lang === "en" ? "Operational SWOT Reaches" : "সক্রিয় হাইড্রোলিক রুট"}</span>
                  </div>
                </div>
              </button>
              <button
                type="button"
                className="map-dropdown-item"
                onClick={() => {
                  focusHighlight("kushiyara");
                  setOpenDropdown(null);
                }}
              >
                <div className="dropdown-item-left">
                  <span style={{ fontSize: "14px" }}>〰️</span>
                  <div className="dropdown-item-info">
                    <span className="dropdown-item-title">{lang === "en" ? "Kushiyara River" : "কুশিয়ারা নদী"}</span>
                    <span className="dropdown-item-sub">{lang === "en" ? "Regional Hydrologic Context" : "আঞ্চলিক ড্রেনেজ প্রসঙ্গ"}</span>
                  </div>
                </div>
              </button>
              <button
                type="button"
                className="map-dropdown-item"
                onClick={() => {
                  focusHighlight("meghalaya");
                  setOpenDropdown(null);
                }}
              >
                <div className="dropdown-item-left">
                  <span style={{ fontSize: "14px" }}>🌧️</span>
                  <div className="dropdown-item-info">
                    <span className="dropdown-item-title">{lang === "en" ? "Meghalaya Escarpment" : "মেঘালয় পর্বত ঢাল"}</span>
                    <span className="dropdown-item-sub">{lang === "en" ? "Upstream Runoff Catchment" : "উজানের পাহাড়ি ঢল অববাহিকা"}</span>
                  </div>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        zoomSnap={0.5}
        preferCanvas={true}
        scrollWheelZoom={true}
        style={{
          width: "100%",
          height: "100%",
          minHeight: "580px",
          background: "#f4f6f9",
          borderRadius: "12px",
        }}
        attributionControl={false}
      >
        <MapInstanceBridge onMapReady={setMapInstance} />
        <MapController selectedCoords={selectedReachCoords} />

        {/* Dynamic Basemap Vector / Satellite Tiles */}
        {basemapType === "satellite" ? (
          <TileLayer
            key="esri-satellite"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            maxZoom={18}
          />
        ) : (
          <MapLibreGlLayer
            key={basemapType}
            styleUrl={
              basemapType === "positron"
                ? OPENFREEMAP_POSITRON_URL
                : OPENFREEMAP_LIBERTY_URL
            }
          />
        )}

        {/* Scale bar control */}
        <ScaleControl position="bottomleft" imperial={false} />

        {/* HydroSHEDS Sub-Basin Boundaries (Feature D: Meghalaya Upstream Catchment) */}
        {showSubbasins &&
          geoData?.subbasins?.map((basin) => {
            const isMeghalaya = basin.id === "upper_surma_meghalaya";
            const basinColor = isMeghalaya ? "#0284C7" : "#059669";
            return (
              <Polygon
                key={basin.id}
                positions={basin.coordinates}
                pathOptions={{
                  color: basinColor,
                  weight: isMeghalaya ? 2.2 : 1.8,
                  dashArray: isMeghalaya ? "6, 6" : "5, 6",
                  fillColor: basinColor,
                  fillOpacity: isMeghalaya ? 0.08 : (showTerrain ? 0.04 : 0.02),
                }}
              >
                <Popup className="map-glass-popup" autoPan={true}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: "240px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>
                      <span style={{ fontSize: "16px" }}>🌧️</span>
                      <div>
                        <strong style={{ fontSize: "14px", color: "var(--text-primary)", display: "block" }}>
                          {isMeghalaya
                            ? (lang === "en" ? "Meghalaya Upstream Catchment" : "মেঘালয় উজানের ক্যাচমেন্ট")
                            : (lang === "en" ? basin.name : basin.name_bn)}
                        </strong>
                        <span style={{ fontSize: "12px", color: "var(--blue-primary)", fontWeight: 650 }}>
                          {isMeghalaya
                            ? (lang === "en" ? "Feature D · Orographic Runoff Source" : "বৈশিষ্ট্য ৪ · পাহাড়ি ঢল উৎস")
                            : (lang === "en" ? "Transboundary Drainage" : "আন্তঃসীমান্ত ড্রেনেজ")}
                        </span>
                      </div>
                    </div>
                    <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                      {lang === "en" ? "Delineated Area: " : "মোট অববাহিকা আয়তন: "}
                      <strong style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>{basin.area_km2} km²</strong>
                    </div>
                    <div style={{ fontSize: "12.5px", color: "var(--text-secondary)", lineHeight: "1.45" }}>
                      {isMeghalaya
                        ? (lang === "en"
                            ? "Role: Receives convective pre-monsoon precipitation observed by NASA GPM IMERG Early Run; tributary lag to Kanaighat provides 22.5h advance flood warning."
                            : "ভূমিকা: নাসা আইমার্জ আর্লি রান উপগ্রহ বৃষ্টিপাত এই অববাহিকায় পতিত হয়ে সুরমা নদী দিয়ে কানাইঘাটে পৌঁছাতে ২২.৫ ঘণ্টা সময় নেয়।")
                        : (lang === "en"
                            ? "Barak Headwaters catchment discharging toward Amalshid border."
                            : "বরাক হেডওয়াটার্স ক্যাচমেন্ট যা আমলশীদ সীমান্তে পতিত হয়।")}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--blue-deep)", fontStyle: "italic", borderTop: "1px solid var(--border-subtle)", paddingTop: "4px" }}>
                      {isMeghalaya
                        ? (lang === "en"
                            ? "Provenance: HydroSHEDS v1.0 Watershed Boundary (EPSG:4326)"
                            : "উৎস: হাইড্রোশেডস ১.০ অববাহিকা সীমানা (EPSG:4326)")
                        : "HydroSHEDS v1.0 (EPSG:4326)"}
                    </div>
                  </div>
                </Popup>
                <Tooltip sticky className="map-glass-tooltip">
                  <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--blue-primary)" }}>
                    {isMeghalaya
                      ? (lang === "en" ? "🌧️ Meghalaya Upstream Catchment (Feature D)" : "🌧️ মেঘালয় উজানের ক্যাচমেন্ট")
                      : (lang === "en" ? basin.name : basin.name_bn)}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--text-primary)",
                      fontFamily: "var(--font-mono)",
                      marginTop: "2px",
                    }}
                  >
                    {lang === "en"
                      ? `Area: ${basin.area_km2} km² · HydroSHEDS v1 Delineation`
                      : `আয়তন: ${basin.area_km2} বর্গকিমি`}
                  </div>
                  <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "2px" }}>
                    {isMeghalaya
                      ? (lang === "en"
                          ? "Runoff source for Surma corridor · GPM IMERG Early Run driving"
                          : "সুরমা নদীর ঢল উৎস · নাসা জিপিএম আইমার্জ ডেটা")
                      : ""}
                  </div>
                </Tooltip>
              </Polygon>
            );
          })}

        {/* Indo-Bangladesh Border / Meghalaya Escarpment Ridge */}
        {geoData?.meghalaya_border && (
          <Polyline
            positions={geoData.meghalaya_border}
            pathOptions={{
              color: "#B45309",
              weight: 2.2,
              dashArray: "6, 8",
              opacity: 0.9,
            }}
          >
            <Tooltip sticky className="map-glass-tooltip">
              <div style={{ fontSize: "13px", fontWeight: 750, color: "#B45309" }}>
                {lang === "en"
                  ? "⛰️ Meghalaya Escarpment Ridge"
                  : "⛰️ মেঘালয় খাড়া পর্বত ঢাল"}
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-primary)", fontWeight: 600, marginTop: "2px" }}>
                {lang === "en"
                  ? "🇮🇳 India / 🇧🇩 Bangladesh Border Line"
                  : "🇮🇳 ভারত / 🇧🇩 বাংলাদেশ সীমান্ত"}
              </div>
              <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "2px" }}>
                {lang === "en"
                  ? "Steep Convective Runoff Zone (NASA GPM IMERG)"
                  : "তীব্র পাহাড়ি ঢল উৎস (নাসা জিপিএম আইমার্জ)"}
              </div>
            </Tooltip>
          </Polyline>
        )}

        {/* IMERG Early Run Precipitation Heatmap Plume Overlay */}
        {showRainfallOverlay && currentRainfall > 0.1 && (
          <Polygon
            positions={[
              [25.10, 91.60],
              [25.18, 91.85],
              [25.26, 92.05],
              [25.32, 92.25],
              [25.35, 92.45],
              [25.28, 92.65],
              [25.18, 92.60],
              [25.12, 92.40],
              [25.07, 92.15],
              [25.04, 91.85],
              [25.06, 91.65],
            ]}
            pathOptions={{
              color:
                currentRainfall > 15
                  ? "#DC2626"
                  : currentRainfall > 5
                  ? "#D97706"
                  : "#0284C7",
              weight: 1.5,
              dashArray: "4, 6",
              fillColor:
                currentRainfall > 15
                  ? "#EF4444"
                  : currentRainfall > 5
                  ? "#F59E0B"
                  : "#38BDF8",
              fillOpacity: Math.min(0.18, 0.04 + (currentRainfall / 40) * 0.12),
            }}
          >
            <Tooltip sticky className="map-glass-tooltip">
              <div
                style={{
                  fontSize: "13px",
                  fontWeight: 700,
                  color:
                    currentRainfall > 15
                      ? "#DC2626"
                      : currentRainfall > 5
                      ? "#D97706"
                      : "#0284C7",
                }}
              >
                {lang === "en"
                  ? "NASA GPM IMERG Early Run Plume"
                  : "নাসা জিপিএম আইমার্জ প্রাক-বৃষ্টিপাত বলয়"}
              </div>
              <div
                style={{
                  fontSize: "12.5px",
                  fontFamily: "var(--font-mono)",
                  color: "var(--text-primary)",
                  marginTop: "2px",
                }}
              >
                {lang === "en"
                  ? `Rainfall: ${currentRainfall.toFixed(1)} mm/h`
                  : `বৃষ্টিপাত: ${currentRainfall.toFixed(1)} মিমি/ঘণ্টা`}
              </div>
              <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "2px" }}>
                {lang === "en"
                  ? "Latency ~4h | 0.1° resolution"
                  : "লেটেন্সি ~৪ ঘণ্টা | ০.১° রেজোলিউশন"}
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
                color: "#4F46E5",
                weight: 1.8,
                dashArray: "4, 6",
                opacity: 0.65,
              }}
            >
              <Tooltip sticky className="map-glass-tooltip">
                <span
                  style={{
                    fontSize: "12.5px",
                    fontWeight: 600,
                    color: "var(--blue-deep)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
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
                color: "#4F46E5",
                weight: 1.8,
                dashArray: "4, 6",
                opacity: 0.65,
              }}
            >
              <Tooltip sticky className="map-glass-tooltip">
                <span
                  style={{
                    fontSize: "12.5px",
                    fontWeight: 600,
                    color: "var(--blue-deep)",
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  SWOT KaRIn Ground Track (Pass 042 — Kushiyara corridor)
                </span>
              </Tooltip>
            </Polyline>
          </>
        )}

        {/* SWOT Calibrated Reaches Polylines (Feature B: Surma & Feature C: Kushiyara) */}
        {geoData?.reaches?.map((reach) => {
          const isSelected = reach.reach_id === selectedReachId;
          const isHovered = reach.reach_id === hoveredReachId;
          const isSurma = reach.river_name === "Surma";
          const riskLevel = riskFn(reach.reach_id);
          const reachColor = getReachColor(reach.reach_id);
          const meta =
            reaches?.find((r) => r.reach_id === reach.reach_id) || reach;

          // Kushiyara is distinguished visually as regional context (distinct slate-cyan stroke & dash)
          const primaryStroke = isSelected
            ? "#0284C7"
            : isSurma
            ? reachColor
            : "#0EA5E9";
          const haloStroke = isSelected
            ? "#0284C7"
            : isSurma
            ? reachColor
            : "rgba(14, 165, 233, 0.35)";

          return (
            <div key={reach.reach_id}>
              {/* Outer halo / translucent glow polyline */}
              <Polyline
                positions={reach.coordinates}
                pathOptions={{
                  color: haloStroke,
                  weight: isSelected ? 15 : (isSurma ? 11 : 8),
                  opacity: isSelected ? 0.45 : (isSurma ? 0.28 : 0.18),
                  lineCap: "round",
                  lineJoin: "round",
                }}
              />

              {/* Core interactive river polyline */}
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
                  color: primaryStroke,
                  weight: isSelected ? 6.5 : (isSurma ? 5.0 : 3.8),
                  dashArray: isSurma ? undefined : "10, 6",
                  opacity: 1.0,
                  lineCap: "round",
                  lineJoin: "round",
                  className: showFlowAnim ? "leaflet-flow-path" : "",
                }}
              >
                <Tooltip sticky className="map-glass-tooltip">
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "4px",
                      minWidth: "210px",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "8px",
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 750,
                          fontSize: "14px",
                          color: "var(--text-primary)",
                        }}
                      >
                        {isSurma ? "🌊 " : "〰️ "}
                        {lang === "en" ? reach.reach_name : reach.reach_name_bn}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 700,
                          padding: "2px 8px",
                          borderRadius: "4px",
                          color: "#FFFFFF",
                          background:
                            isSurma
                              ? (riskLevel === "RED"
                                ? "#B4232F"
                                : riskLevel === "AMBER"
                                ? "#B7791F"
                                : "#34805A")
                              : "#287BB5",
                        }}
                      >
                        {isSurma ? riskLevel : (lang === "en" ? "CONTEXT" : "প্রসঙ্গ")}
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 650,
                        color: isSurma ? "var(--blue-primary)" : "var(--text-muted)",
                      }}
                    >
                      {isSurma
                        ? (lang === "en" ? "Feature B · Operational Routing Corridor" : "বৈশিষ্ট্য ২ · সক্রিয় হাইড্রোলিক রুট")
                        : (lang === "en" ? "Feature C · Regional Hydrologic Context" : "বৈশিষ্ট্য ৩ · আঞ্চলিক ড্রেনেজ প্রসঙ্গ")}
                    </div>
                    <div
                      style={{
                        fontSize: "12.5px",
                        fontFamily: "var(--font-mono)",
                        color: "var(--blue-deep)",
                        fontWeight: 600,
                      }}
                    >
                      Reach ID: {reach.reach_id} ({reach.river_name})
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {lang === "en"
                        ? "Calibrated Manning n: "
                        : "ম্যানিং n: "}
                      <strong
                        style={{
                          color: "var(--text-primary)",
                          fontFamily: "var(--font-mono)",
                        }}
                      >
                        {meta.calibrated_n ?? "0.0294"}
                      </strong>
                    </div>
                    <div
                      style={{
                        fontSize: "13px",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {lang === "en" ? "Mean Width: " : "গড় প্রস্থ: "}
                      <span
                        style={{
                          color: "var(--text-primary)",
                          fontFamily: "var(--font-mono)",
                          fontWeight: 600,
                        }}
                      >
                        {reach.width_mean_m}m
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: "12px",
                        color: isSurma ? "var(--blue-deep)" : "var(--text-secondary)",
                        lineHeight: "1.4",
                        borderTop: "1px solid var(--border-subtle)",
                        paddingTop: "5px",
                      }}
                    >
                      {isSurma
                        ? (lang === "en"
                            ? "Active routing channel: Directly connects upstream rainfall to SW108 validation gauge (22.5h lead time)."
                            : "সক্রিয় হাইড্রোলিক রুট: মেঘালয়ের বৃষ্টিপাত সরাসরি SW১০৮ গেজে পৌঁছে দেয় (২২.৫ ঘণ্টা লিড টাইম)।")
                        : (lang === "en"
                            ? "Barak south distributary: Parameterized in SWORD v16 for regional hydraulic context (non-operational for Surma forecasts)."
                            : "বরাক দক্ষিণ শাখা: আঞ্চলিক ড্রেনেজ কাঠামোর অংশ (সুরমা পূর্বাভাসে সরাসরি মডেলড নয়)।")}
                    </div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        fontStyle: "italic",
                      }}
                    >
                      {reach.swot_pass} · SWORD v16
                    </div>
                  </div>
                </Tooltip>
              </Polyline>
            </div>
          );
        })}

        {/* Feature A: Kanaighat SW108 Gauge Marker (Verified BWDB Station) */}
        {(() => {
          const station = geoData?.gauge_stations?.[0] || {
            station_id: "SW108",
            name: "Kanaighat Gauge",
            name_bn: "কানাইঘাট গেজ স্টেশন",
            river: "Surma",
            lat: 24.9980,
            lon: 92.2594,
            danger_level_m: 13.20,
            warning_level_m: 12.20,
            datum: "PWD",
          };
          const pos = [station.lat, station.lon];

          return (
            <Marker
              ref={kanaighatMarkerRef}
              position={pos}
              icon={sonarGaugeIcon}
              eventHandlers={{
                click: () => {
                  setSelectedReachId("22211000011");
                  const kReach = reaches?.find((r) => r.reach_id === "22211000011");
                  if (onInspectReach && kReach) onInspectReach(kReach);
                },
              }}
            >
              <Popup className="map-glass-popup" autoPan={true}>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", minWidth: "260px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "6px" }}>
                    <span style={{ fontSize: "16px" }}>📍</span>
                    <div>
                      <strong style={{ fontSize: "14px", color: "var(--text-primary)", display: "block" }}>
                        {lang === "en" ? "Kanaighat Gauge (BWDB SW266 / Model SW108)" : "কানাইঘাট গেজ স্টেশন (বাপাউবো SW২৬৬ / মডেল SW১০৮)"}
                      </strong>
                      <span style={{ fontSize: "12px", color: "var(--amber-600, #B7791F)", fontWeight: 650 }}>
                        {lang === "en" ? "Feature A · Surma River Validation Station" : "বৈশিষ্ট্য ১ · সুরমা নদী যাচাইকরণ গেজ"}
                      </span>
                    </div>
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--blue-deep)", background: "#EAF3F9", padding: "6px 8px", borderRadius: "6px", border: "1px solid rgba(40, 123, 181, 0.25)" }}>
                    <div><strong>{lang === "en" ? "Official BWDB/FFWC Catalog ID:" : "সরকারি বাপাউবো/এফএফডব্লিউসি আইডি:"}</strong> SW266</div>
                    <div><strong>{lang === "en" ? "Internal Pipeline / Heritage Alias:" : "অভ্যন্তরীণ মডেল কোড:"}</strong> SW108</div>
                  </div>
                  <div style={{ fontSize: "12.5px", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
                    {station.lat.toFixed(4)}° N, {station.lon.toFixed(4)}° E · Surma Channel
                  </div>
                  <div style={{ fontSize: "13px", display: "flex", justifyContent: "space-between", color: "var(--text-primary)" }}>
                    <span>{lang === "en" ? "Danger Level:" : "বিপদসীমা:"}</span>
                    <strong style={{ color: "#B4232F", fontFamily: "var(--font-mono)" }}>
                      13.20 m PWD <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 400 }}>(12.75 m MSL)</span>
                    </strong>
                  </div>
                  <div style={{ fontSize: "13px", display: "flex", justifyContent: "space-between", color: "var(--text-primary)" }}>
                    <span>{lang === "en" ? "Stage Readout:" : "বর্তমান স্তর:"}</span>
                    <strong style={{ color: currentStage >= dangerLevel ? "#B4232F" : "#B7791F", fontFamily: "var(--font-mono)", fontSize: "13.5px" }}>
                      {currentGaugeLevel != null ? `${currentGaugeLevel.toFixed(2)} m (Obs)` : `${currentStage.toFixed(2)} m (Mod)`}
                    </strong>
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.45", borderTop: "1px solid var(--border-subtle)", paddingTop: "5px" }}>
                    {lang === "en"
                      ? "Vertical Datum: PWD datum is +0.45m relative to MSL/SOB in Sylhet (13.20m PWD = 12.75m MSL danger level). SW108 is the legacy pipeline alias for official BWDB SW266."
                      : "ভার্টিক্যাল ডেটাম: সিলেটে পিডব্লিউডি ডেটাম এমএসএল থেকে +০.৪৫মি শিফটে থাকে (১৩.২০মি PWD = ১২.৭৫মি MSL বিপদসীমা)। SW১০৮ হলো বাপাউবো SW২৬৬-এর হেরিটেজ কোড।"}
                  </div>
                  <div style={{ fontSize: "11.5px", color: "var(--blue-primary)", fontStyle: "italic", display: "flex", alignItems: "center", gap: "4px" }}>
                    <span>✓</span>
                    <span>{lang === "en" ? "Status: VERIFIED (BWDB/FFWC Directory)" : "স্ট্যাটাস: যাচাইকৃত (বাপাউবো/এফএফডব্লিউসি)"}</span>
                  </div>
                </div>
              </Popup>
              <Tooltip sticky className="map-glass-tooltip">
                <div style={{ fontWeight: 700, fontSize: "13.5px", color: "var(--blue-primary)" }}>
                  {lang === "en" ? "BWDB Kanaighat Gauge (SW266 / Model SW108)" : "বিডব্লিউডিবি কানাইঘাট গেজ (SW২৬৬ / মডেল SW১০৮)"}
                </div>
                <div style={{ fontSize: "12.5px", fontFamily: "var(--font-mono)", color: "var(--text-primary)", marginTop: "2px" }}>
                  {currentGaugeLevel != null ? `Observed: ${currentGaugeLevel.toFixed(2)} m PWD (equiv. ${(currentGaugeLevel - 0.45).toFixed(2)} m MSL)` : `Modelled: ${currentStage.toFixed(2)} m PWD`}
                  <span style={{ color: currentStage >= dangerLevel ? "#B4232F" : "#B7791F", fontWeight: 700 }}>
                    {" "} (Danger: 13.20m PWD / 12.75m MSL)
                  </span>
                </div>
                <div style={{ fontSize: "11.5px", color: "var(--text-secondary)", marginTop: "2px" }}>
                  Surma River · Lat {station.lat.toFixed(4)}° N, Lon {station.lon.toFixed(4)}° E · Verified Station
                </div>
              </Tooltip>
            </Marker>
          );
        })()}

        {/* User Current Location Marker & Accuracy Radius */}
        {userLocation && (
          <>
            <Circle
              center={[userLocation.lat, userLocation.lng]}
              radius={userLocation.accuracy}
              pathOptions={{
                color: "#2563EB",
                weight: 1.5,
                dashArray: "4, 6",
                fillColor: "#3B82F6",
                fillOpacity: 0.12,
              }}
            />
            <Marker
              ref={userMarkerRef}
              position={[userLocation.lat, userLocation.lng]}
              icon={userLocationIcon}
            >
              <Popup className="user-location-glass-popup" autoPan={true}>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                    minWidth: "210px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      borderBottom: "1px solid var(--border-subtle)",
                      paddingBottom: "5px",
                    }}
                  >
                    <span style={{ fontSize: "15px" }}>📍</span>
                    <strong style={{ fontSize: "13.5px", color: "var(--text-primary)" }}>
                      {lang === "en"
                        ? "Your Current Location"
                        : "আপনার বর্তমান অবস্থান"}
                    </strong>
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--text-secondary)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {userLocation.lat.toFixed(5)}° N, {userLocation.lng.toFixed(5)}° E
                  </div>
                  <div style={{ fontSize: "12.5px", color: "var(--blue-primary)" }}>
                    {lang === "en" ? "Reported Accuracy: " : "আনুমানিক নির্ভুলতা: "}
                    <strong style={{ fontFamily: "var(--font-mono)", color: "var(--text-primary)" }}>
                      ±{Math.round(userLocation.accuracy)} m
                    </strong>
                  </div>
                  <div
                    style={{
                      fontSize: "11.5px",
                      color: "var(--text-secondary)",
                      fontStyle: "italic",
                      marginTop: "2px",
                    }}
                  >
                    {userLocation.lat >= 24.2 &&
                    userLocation.lat <= 25.4 &&
                    userLocation.lng >= 91.0 &&
                    userLocation.lng <= 92.8
                      ? lang === "en"
                        ? "🌊 Inside Haor Basin Early Warning Zone"
                        : "🌊 হাওর অববাহিকা সতর্কীকরণ অঞ্চলের মধ্যে"
                      : lang === "en"
                      ? "🌐 Outside Surma-Kushiyara Basin"
                      : "🌐 সুরমা-কুশিয়ারা অববাহিকার বাইরে"}
                  </div>
                </div>
              </Popup>
            </Marker>
          </>
        )}
      </MapContainer>

      {/* Unobtrusive OpenFreeMap Attribution Pill */}
      <div
        style={{
          position: "absolute",
          bottom: "6px",
          right: "8px",
          zIndex: 900,
          fontSize: "10px",
          color: "#475569",
          background: "rgba(255, 255, 255, 0.82)",
          backdropFilter: "blur(6px)",
          padding: "2px 8px",
          borderRadius: "4px",
          border: "1px solid rgba(0, 0, 0, 0.08)",
          pointerEvents: "auto",
        }}
      >
        <a
          href="https://openfreemap.org"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#334155", textDecoration: "none", fontWeight: 600 }}
        >
          OpenFreeMap
        </a>{" "}
        ·{" "}
        <a
          href="https://www.openmaptiles.org/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#64748B", textDecoration: "none" }}
        >
          © OpenMapTiles
        </a>{" "}
        ·{" "}
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: "#64748B", textDecoration: "none" }}
        >
          © OSM
        </a>
      </div>
    </div>
  );
}
