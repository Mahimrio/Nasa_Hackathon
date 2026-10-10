"use client";

export default function ModelArchitectureModal({ lang, onClose }) {
  return (
    <div className="modal-overlay-backdrop" role="dialog" aria-modal="true" aria-labelledby="model-info-title">
      <div className="modal-content-panel" style={{ maxWidth: "680px" }}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close model info">
          ✕
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <span style={{ fontSize: "28px" }}>💧</span>
          <div>
            <div className="card-eyebrow" style={{ color: "var(--cyan-400)" }}>
              {lang === "en" ? "HYDROLOGIC ROUTING & SATELLITE PIPELINE ARCHITECTURE" : "হাইড্রোসিন্থেটিক রাউটিং ও উপগ্রহ পাইপলাইন"}
            </div>
            <h2 id="model-info-title" style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-primary)" }}>
              {lang === "en" ? "HydroSense-SWOT Scientific Architecture" : "হাইড্রোসেন্স-SWOT বৈজ্ঞানিক স্থাপত্য"}
            </h2>
          </div>
        </div>

        <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "20px" }}>
          {lang === "en"
            ? "HydroSense couples NASA SWOT KaRIn radar altimetry with GPM IMERG satellite precipitation to deliver actionable flash flood early warnings for Boro rice farmers in the Haor basin of northeastern Bangladesh."
            : "হাইড্রোসেন্স নাসা SWOT উপগ্রহের রাডার আল্টিমেট্রি এবং GPM IMERG বৃষ্টিপাত ডেটার সমন্বয়ে হাওর অঞ্চলের বোরো ধান রক্ষায় আগাম সতর্কবার্তা প্রদান করে।"}
        </p>

        {/* 4 Tiers of Pipeline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "22px" }}>
          <div style={{ padding: "12px 14px", borderRadius: "10px", background: "rgba(14,27,45,0.7)", border: "1px solid var(--glass-stroke)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <strong style={{ color: "var(--cyan-300)", fontSize: "13px" }}>
                Tier 1: SWOT River Roughness Calibration
              </strong>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>Offline / 21-day orbit</span>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>
              Calibrates Manning&apos;s roughness coefficient (n) and bed elevation (z_bed) for each SWORD reach using SWOT L2 HR RiverSP water surface elevation (WSE), width (W), and longitudinal slope.
            </p>
          </div>

          <div style={{ padding: "12px 14px", borderRadius: "10px", background: "rgba(14,27,45,0.7)", border: "1px solid var(--glass-stroke)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <strong style={{ color: "var(--blue-500)", fontSize: "13px" }}>
                Tier 2: IMERG Catchment Precipitation Inflow
              </strong>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>30-min latency: ~4h</span>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>
              Integrates GPM IMERG Early Run half-hourly precipitation over the 185 km² upper Meghalaya catchment into boundary hydrograph inflow Q via SCS-CN calibrated runoff coefficients.
            </p>
          </div>

          <div style={{ padding: "12px 14px", borderRadius: "10px", background: "rgba(14,27,45,0.7)", border: "1px solid var(--glass-stroke)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <strong style={{ color: "var(--violet-500)", fontSize: "13px" }}>
                Tier 3: Muskingum-Cunge Flood Wave Routing
              </strong>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>~26h Travel Time</span>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>
              Physically-based variable-parameter flood routing through the Surma-Kushiyara river network, tracking wave attenuation, celerity, and stage hydrographs down to the Haor rim.
            </p>
          </div>

          <div style={{ padding: "12px 14px", borderRadius: "10px", background: "rgba(14,27,45,0.7)", border: "1px solid var(--glass-stroke)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <strong style={{ color: "var(--green-400)", fontSize: "13px" }}>
                Tier 4: Early Warning & Harvest Advisory Engine
              </strong>
              <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>Lead time: 21.0h</span>
            </div>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", margin: 0 }}>
              Evaluates future stage vs 13.20m PWD danger level with ±0.18m uncertainty bands, triggering actionable GREEN / AMBER / RED flags with bilingual operational guidance.
            </p>
          </div>
        </div>

        <button
          className="btn-standard btn-primary"
          style={{ width: "100%", justifyContent: "center" }}
          onClick={onClose}
        >
          {lang === "en" ? "Got It" : "বুঝেছি"}
        </button>
      </div>
    </div>
  );
}
