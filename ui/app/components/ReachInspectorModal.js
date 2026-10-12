"use client";

export default function ReachInspectorModal({ reach, calibrationData, riskFn, lang, onClose }) {
  if (!reach) return null;

  const cal = calibrationData ? calibrationData[reach.reach_id] : null;
  const currentRisk = riskFn ? riskFn(reach.reach_id) : "GREEN";

  return (
    <div className="modal-overlay-backdrop" role="dialog" aria-modal="true" aria-labelledby="reach-modal-title">
      <div className="modal-content-panel">
        <button className="modal-close-btn" onClick={onClose} aria-label="Close reach inspector">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <div style={{
            width: "40px",
            height: "40px",
            borderRadius: "8px",
            background: "rgba(56, 189, 248, 0.12)",
            border: "1px solid rgba(56, 189, 248, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--cyan-400)",
            flexShrink: 0
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>
          <div>
            <h2 id="reach-modal-title" style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}>
              {lang === "en" ? reach.name : reach.name_bn}
            </h2>
          </div>
        </div>

        {/* Current Status Pill */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          padding: "6px 14px",
          borderRadius: "var(--radius-pill)",
          background: currentRisk === "RED" ? "var(--red-bg)" : currentRisk === "AMBER" ? "var(--amber-bg)" : "var(--green-bg)",
          border: `1px solid ${currentRisk === "RED" ? "var(--red-400)" : currentRisk === "AMBER" ? "var(--amber-400)" : "var(--green-400)"}`,
          marginBottom: "20px"
        }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: currentRisk === "RED" ? "var(--red-400)" : currentRisk === "AMBER" ? "var(--amber-400)" : "var(--green-400)" }} />
          <span style={{ fontSize: "12px", fontWeight: 700, color: currentRisk === "RED" ? "var(--red-400)" : currentRisk === "AMBER" ? "var(--amber-400)" : "var(--green-400)" }}>
            {lang === "en" ? `CURRENT STATUS: ${currentRisk}` : `বর্তমান অবস্থা: ${currentRisk}`}
          </span>
        </div>

        {/* Hydraulic Parameters Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
          <div className="param-row" style={{ flexDirection: "column", alignItems: "flex-start", padding: "10px 12px" }}>
            <span className="param-label">{lang === "en" ? "Reach SWORD ID" : "রিচ আইডি"}</span>
            <span className="param-value" style={{ fontSize: "14px" }}>{reach.reach_id}</span>
          </div>

          <div className="param-row" style={{ flexDirection: "column", alignItems: "flex-start", padding: "10px 12px" }}>
            <span className="param-label">{lang === "en" ? "River Corridor" : "নদী করিডোর"}</span>
            <span className="param-value" style={{ fontSize: "14px", color: "var(--cyan-300)" }}>{reach.river}</span>
          </div>

          <div className="param-row" style={{ flexDirection: "column", alignItems: "flex-start", padding: "10px 12px" }}>
            <span className="param-label">{lang === "en" ? "Calibrated Manning n" : "ক্যালিব্রেটেড ম্যানিং n"}</span>
            <span className="param-value" style={{ fontSize: "16px", color: "var(--cyan-300)" }}>
              {reach.calibrated_n ?? (cal ? cal.n : "0.0310")}
            </span>
          </div>

          <div className="param-row" style={{ flexDirection: "column", alignItems: "flex-start", padding: "10px 12px" }}>
            <span className="param-label">{lang === "en" ? "Bed Elevation (z_bed)" : "নদীর তলদেশের উচ্চতা"}</span>
            <span className="param-value" style={{ fontSize: "16px" }}>
              {reach.z_bed ?? (cal ? cal.z_bed : "6.82")} m PWD
            </span>
          </div>

          <div className="param-row" style={{ flexDirection: "column", alignItems: "flex-start", padding: "10px 12px" }}>
            <span className="param-label">{lang === "en" ? "Mean Channel Width (W)" : "গড় নদী প্রশস্ততা"}</span>
            <span className="param-value" style={{ fontSize: "14px" }}>{reach.width_mean_m} m</span>
          </div>

          <div className="param-row" style={{ flexDirection: "column", alignItems: "flex-start", padding: "10px 12px" }}>
            <span className="param-label">{lang === "en" ? "Reach Length (L)" : "রিচ দৈর্ঘ্য"}</span>
            <span className="param-value" style={{ fontSize: "14px" }}>{(reach.length_m / 1000).toFixed(1)} km</span>
          </div>

          <div className="param-row" style={{ flexDirection: "column", alignItems: "flex-start", padding: "10px 12px" }}>
            <span className="param-label">{lang === "en" ? "Slope Quality" : "ঢালের গুণমান"}</span>
            <span className="param-value" style={{ color: "var(--green-400)" }}>{reach.slope_quality}</span>
          </div>

          <div className="param-row" style={{ flexDirection: "column", alignItems: "flex-start", padding: "10px 12px" }}>
            <span className="param-label">{lang === "en" ? "SWOT Overpass Passes" : "SWOT ওভারপাস সংখ্যা"}</span>
            <span className="param-value">{cal ? `${cal.n_valid_passes} passes` : "65 passes"}</span>
          </div>
        </div>

        {reach.has_gauge && (
          <div style={{
            padding: "12px",
            borderRadius: "8px",
            background: "rgba(255, 196, 92, 0.08)",
            border: "1px solid rgba(255, 196, 92, 0.25)",
            marginBottom: "16px"
          }}>
            <div style={{ color: "var(--amber-400)", fontWeight: 700, fontSize: "12.5px", marginBottom: "4px" }}>
              BWDB Station: {reach.gauge_station} (Co-located Gauge)
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
              Danger Level: <strong>{reach.danger_level_m} m PWD</strong>. Direct stage observations from Bangladesh Water Development Board (BWDB) are assimilated here for real-time validation.
            </div>
          </div>
        )}

        <button
          className="btn-standard btn-primary"
          style={{ width: "100%", justifyContent: "center" }}
          onClick={onClose}
        >
          {lang === "en" ? "Done Inspecting" : "সম্পন্ন"}
        </button>
      </div>
    </div>
  );
}
