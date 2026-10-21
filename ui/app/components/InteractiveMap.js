"use client";

import dynamic from "next/dynamic";

// Dynamic import with SSR disabled to prevent Leaflet window errors on server
const InteractiveMapLeaflet = dynamic(
  () => import("./InteractiveMapLeaflet"),
  {
    ssr: false,
    loading: () => (
      <div
        className="map-loading-placeholder"
        style={{
          width: "100%",
          height: "100%",
          minHeight: "420px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(5, 10, 18, 0.95)",
          borderRadius: "12px",
          border: "1px solid rgba(177, 221, 255, 0.12)",
          gap: "12px",
        }}
      >
        <div
          className="map-spinner"
          style={{
            width: "36px",
            height: "36px",
            border: "3px solid rgba(53, 216, 242, 0.2)",
            borderTopColor: "var(--cyan-primary)",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <span style={{ fontSize: "12px", color: "var(--text-secondary)", fontFamily: "var(--font-mono)" }}>
          Loading GIS Telemetry & SWOT Reaches...
        </span>
      </div>
    ),
  }
);

export default function InteractiveMap(props) {
  return <InteractiveMapLeaflet {...props} />;
}
