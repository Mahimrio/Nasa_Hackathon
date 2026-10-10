"use client";

export default function AdvisoryBulletinModal({ current, dateStr, timeStr, dangerLevel = 13.2, lang, onClose }) {
  if (!current) return null;

  const flag = current.harvest_flag;
  const stage = current.modelled_stage;
  const isDanger = stage >= dangerLevel;

  return (
    <div className="modal-overlay-backdrop" role="dialog" aria-modal="true" aria-labelledby="bulletin-title">
      <div className="modal-content-panel" style={{ maxWidth: "600px" }}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close advisory bulletin">
          ✕
        </button>

        {/* Official Header */}
        <div style={{ textAlign: "center", borderBottom: "1px solid rgba(177,221,255,0.12)", paddingBottom: "16px", marginBottom: "18px" }}>
          <div style={{ fontSize: "11px", letterSpacing: "0.08em", color: "var(--cyan-400)", fontWeight: 700, textTransform: "uppercase" }}>
            GOVERNMENT OF THE PEOPLE&apos;S REPUBLIC OF BANGLADESH · DAE / BWDB
          </div>
          <h2 id="bulletin-title" style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-primary)", marginTop: "4px" }}>
            {lang === "en"
              ? "Boro Rice Harvest Advisory & Flash Flood Early Warning Bulletin"
              : "বোরো ধান কর্তন পরামর্শ ও আগাম বন্যা সতর্কবার্তা বুলেটিন"}
          </h2>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)", marginTop: "6px" }}>
            Issued: {dateStr} at {timeStr} UTC · Target: Upazila Agriculture Officers (Sunamganj & Sylhet)
          </div>
        </div>

        {/* Flag Status Banner */}
        <div style={{
          padding: "14px 18px",
          borderRadius: "10px",
          background: flag === "RED" ? "var(--red-bg)" : flag === "AMBER" ? "var(--amber-bg)" : "var(--green-bg)",
          border: `1.5px solid ${flag === "RED" ? "var(--red-400)" : flag === "AMBER" ? "var(--amber-400)" : "var(--green-400)"}`,
          display: "flex",
          alignItems: "center",
          gap: "14px",
          marginBottom: "18px"
        }}>
          <span style={{ fontSize: "32px" }}>
            {flag === "RED" ? "⛔" : flag === "AMBER" ? "⚠" : "✓"}
          </span>
          <div>
            <div style={{ fontSize: "16px", fontWeight: 800, color: flag === "RED" ? "var(--red-400)" : flag === "AMBER" ? "var(--amber-400)" : "var(--green-400)" }}>
              {lang === "en" ? `OPERATIONAL FLAG: ${flag}` : `সতর্কবার্তা স্তর: ${flag === "RED" ? "জরুরি" : flag === "AMBER" ? "সতর্কতা" : "স্বাভাবিক"}`}
            </div>
            <div style={{ fontSize: "12.5px", color: "var(--text-primary)", marginTop: "2px" }}>
              {lang === "en" ? current.advisory_en : current.advisory_bn}
            </div>
          </div>
        </div>

        {/* Key Operational Numbers */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "18px" }}>
          <div className="param-row">
            <span className="param-label">{lang === "en" ? "Modelled River Stage" : "মডেল পানি স্তর"}</span>
            <span className="param-value" style={{ color: "var(--cyan-300)" }}>{stage.toFixed(2)} m PWD</span>
          </div>
          <div className="param-row">
            <span className="param-label">{lang === "en" ? "Danger Exceedance" : "বিপদসীমা অতিক্রম"}</span>
            <span className="param-value" style={{ color: isDanger ? "var(--red-400)" : "var(--green-400)" }}>
              {isDanger ? `+${(stage - dangerLevel).toFixed(2)} m (DANGER)` : `${(dangerLevel - stage).toFixed(2)} m (Safe)`}
            </span>
          </div>
          <div className="param-row">
            <span className="param-label">{lang === "en" ? "GPM Rain Intensity" : "মেঘালয় বৃষ্টিপাত"}</span>
            <span className="param-value">{current.imerg_map_mmh.toFixed(2)} mm/h</span>
          </div>
          <div className="param-row">
            <span className="param-label">{lang === "en" ? "Actionable Lead Time" : "আগাম সতর্কবার্তা"}</span>
            <span className="param-value" style={{ color: "var(--cyan-300)" }}>21.0 Hours</span>
          </div>
        </div>

        {/* Action Directives */}
        <div style={{ marginBottom: "20px" }}>
          <h4 style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-secondary)", marginBottom: "8px" }}>
            {lang === "en" ? "Standard Operational Directives" : "জরুরি করণীয় নির্দেশনা"}
          </h4>
          <ul style={{ paddingLeft: "18px", fontSize: "12px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            <li>{lang === "en" ? "Activate local Union Parishad loudspeaker flood announcements immediately." : "ইউনিয়ন পরিষদের মাধ্যমে মাইকিং করে কৃষকদের সতর্ক করুন।"}</li>
            <li>{lang === "en" ? "Prioritize harvesting Boro rice that has reached 80% physiological maturity." : "৮০% পরিপক্ব ধান অবিলম্বে কাটার পরামর্শ প্রদান করুন।"}</li>
            <li>{lang === "en" ? "Mobilize combine harvesters and community labor gangs to low-lying haor pockets." : "নিচু হাওর এলাকায় কম্বাইন হারভেস্টার ও অতিরিক্ত শ্রমিক নিয়োগ করুন।"}</li>
            <li>{lang === "en" ? "Inspect submersible embankment dykes for early seepage and erosion points." : "ডুবন্ত বাঁধের দুর্বল অংশ দ্রুত সংস্কারের জন্য পরিদর্শন করুন।"}</li>
          </ul>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className="btn-standard neu-inset"
            style={{ flex: 1, justifyContent: "center" }}
            onClick={() => window.print()}
          >
            🖨️ {lang === "en" ? "Print Official Bulletin" : "বুলেটিন প্রিন্ট করুন"}
          </button>
          <button
            className="btn-standard btn-primary"
            style={{ flex: 1, justifyContent: "center" }}
            onClick={onClose}
          >
            {lang === "en" ? "Close" : "বন্ধ করুন"}
          </button>
        </div>
      </div>
    </div>
  );
}
