"use client";

export default function PageContextBar({
  lang,
  reaches,
  selectedReachId,
  setSelectedReachId,
  onJumpToSlider,
  peakIdx,
  eventDataLength,
}) {
  return (
    <section className="page-context-strip" aria-label="Dashboard Context">
      <div className="page-title-block">
        <h1 className="page-title">
          {lang === "en" ? (
            <>
              Surma–Kushiyara River Intelligence
              <span className="brand-badge" style={{ fontSize: "12px", padding: "3px 8px" }}>
                HAOR BASIN
              </span>
            </>
          ) : (
            <>
              সুরমা-কুশিয়ারা নদী মনিটরিং
              <span className="brand-badge" style={{ fontSize: "12px", padding: "3px 8px" }}>
                হাওর অববাহিকা
              </span>
            </>
          )}
        </h1>
        <p className="page-subtitle">
          {lang === "en"
            ? "Coupled NASA SWOT (Surface Water and Ocean Topography) orbital Manning roughness calibration with GPM IMERG early-run precipitation routing to guide Boro rice flash flood harvest decisions in Sylhet & Sunamganj."
            : "সিলেট ও সুনামগঞ্জের বোরো ধান রক্ষায় নাসা SWOT উপগ্রহের চ্যানেলের রুক্ষতা এবং GPM IMERG বৃষ্টিপাত মডেলিংয়ের সমন্বয়ে আগাম বন্যা পূর্বাভাস।"}
        </p>
      </div>

      <div className="context-controls-block">
        {/* Quick Event Navigation Presets */}
        <div className="quick-preset-chips" role="group" aria-label="Event Timeline Presets">
          <span style={{ fontSize: "12px", color: "var(--text-secondary)", paddingLeft: "6px" }}>
            {lang === "en" ? "Jump:" : "দ্রুত যান:"}
          </span>
          <button
            className="preset-chip"
            onClick={() => onJumpToSlider(0)}
            title="April 1, 2026 — Pre-event baseline stage"
          >
            {lang === "en" ? "Apr 1 (Start)" : "১ এপ্রিল (শুরু)"}
          </button>
          <button
            className="preset-chip"
            onClick={() => onJumpToSlider(Math.max(0, peakIdx - 72))}
            title="Heavy Meghalaya orographic rainfall onset"
          >
            {lang === "en" ? "Rain Onset" : "ভারী বৃষ্টি শুরু"}
          </button>
          <button
            className="preset-chip active"
            onClick={() => onJumpToSlider(peakIdx)}
            title="Flood Wave Peak Stage at Kanaighat"
            style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span>{lang === "en" ? "Flood Peak (13.4m)" : "শীর্ষ বন্যা (১৩.৪ মি)"}</span>
          </button>
          <button
            className="preset-chip"
            onClick={() => onJumpToSlider(Math.min(eventDataLength - 1, peakIdx + 96))}
            title="Falling limb recession"
          >
            {lang === "en" ? "Recession" : "পানি হ্রাস"}
          </button>
        </div>

        {/* Selected Reach Selector */}
        {reaches && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <label htmlFor="reach-selector" className="sr-only">
              {lang === "en" ? "Select river reach" : "নদী রিচ নির্বাচন করুন"}
            </label>
            <select
              id="reach-selector"
              className="btn-standard neu-inset"
              value={selectedReachId}
              onChange={(e) => setSelectedReachId(e.target.value)}
              style={{
                background: "rgba(10, 20, 34, 0.8)",
                border: "1px solid var(--glass-stroke)",
                color: "var(--text-primary)",
                padding: "6px 12px",
                borderRadius: "var(--radius-sm)",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              {reaches.map((r) => (
                <option key={r.reach_id} value={r.reach_id} style={{ background: "#08111F" }}>
                  {lang === "en" ? r.name : r.name_bn} {r.has_gauge ? "(Gauge Station)" : ""}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </section>
  );
}
