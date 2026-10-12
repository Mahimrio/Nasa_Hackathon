"use client";

import { useState } from "react";

export default function OperationalLimitsPanel({ lang }) {
  const [isExpanded, setIsExpanded] = useState(true);

  const limits = [
    {
      id: "swot-res",
      titleEn: "SWOT Spatial Resolution (>100 m)",
      titleBn: "SWOT উপগ্রহ রেজোলিউশন (>১০০ মি)",
      textEn: "SWOT KaRIn radar altimetry resolves rivers wider than ~100 m. Narrow mountain headwaters in the Meghalaya escarpment are not resolved directly.",
      textBn: "SWOT রাডার শুধুমাত্র ১০০ মিটারের চেয়ে প্রশস্ত নদী শনাক্ত করতে পারে। মেঘালয় পাহাড়ের সরু উৎসনদীগুলো সরাসরি পরিমাপ করা হয় না।",
    },
    {
      id: "low-slope",
      titleEn: "Low-Slope Reach Filtering",
      titleBn: "কম ঢালের রিচ ফিল্টারিং",
      textEn: "Low-slope reaches where slope measurement uncertainty exceeds the hydraulic signal are filtered out to preserve numerical stability.",
      textBn: "যেসব রিচে ঢালের পরিমাপের অনিশ্চয়তা সংকেতের চেয়ে বেশি, সেগুলোকে মডেলের স্থায়িত্ব বজায় রাখতে বাদ দেওয়া হয়েছে।",
    },
    {
      id: "imerg-bias",
      titleEn: "IMERG Orographic Rain Bias",
      titleBn: "IMERG বৃষ্টিপাতের অরোগ্রাফিক প্রভাব",
      textEn: "GPM IMERG early-run may overestimate intense orographic rainfall over the steep Meghalaya escarpment; hydrological calibration implicitly adjusts runoff coefficient.",
      textBn: "GPM IMERG মেঘালয় পাহাড়ে অতিরিক্ত বৃষ্টিপাত দেখাতে পারে; তবে রানঅফ সহগের ক্রমাঙ্কন এই ত্রুটি দূর করে।",
    },
    {
      id: "wave-routing",
      titleEn: "Rising Limb Wave Routing Scope",
      titleBn: "উত্থান পর্ব রাউটিং পরিধি",
      textEn: "Hydrologic routing models rising limb channel stage and arrival time at the haor rim — 2D backwater floodplain inundation is outside current scope.",
      textBn: "রাউটিং শুধুমাত্র নদীর চ্যানেলে পানির বৃদ্ধি এবং আগমনের সময় হিসাব করে — প্লাবনভূমির অভ্যন্তরীণ জলাবদ্ধতা এর আওতাভুক্ত নয়।",
    },
    {
      id: "repeat-period",
      titleEn: "21-Day Orbital Periodicity",
      titleBn: "২১ দিনের কক্ষপথ চক্র",
      textEn: "SWOT functions as a channel geometry and roughness calibrator, not a continuous live streaming gauge. Cross-section parameters are updated offline.",
      textBn: "SWOT সরাসরি লাইভ গেজ নয় (২১ দিনের কক্ষপথ)। এর মাধ্যমে চ্যানেলের জ্যামিতি ও রুক্ষতা (n) অফলাইনে নিখুঁত করা হয়।",
    },
  ];

  return (
    <section className="glass-panel card-padding dashboard-full-row operational-limits-card" aria-label="Operational Limits and Model Assumptions">
      <div className="card-header-bar" style={{ marginBottom: isExpanded ? "var(--space-3)" : 0, paddingBottom: isExpanded ? "var(--space-2)" : 0 }}>
        <div className="card-title-group">
          <div className="card-icon" style={{ background: "rgba(255, 196, 92, 0.15)", borderColor: "rgba(255, 196, 92, 0.35)", color: "var(--amber-400)" }} aria-hidden="true">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <div className="card-title" style={{ fontSize: "16px" }}>
              {lang === "en" ? "Operational Limitations & Methodological Assumptions" : "পদ্ধতিগত সীমাবদ্ধতা ও মডেলের অনুমানসমূহ"}
            </div>
          </div>
        </div>

        <button
          className="btn-standard neu-inset"
          style={{ height: "30px", padding: "0 12px", fontSize: "12px" }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (lang === "en" ? "Collapse" : "সংকোচন") : (lang === "en" ? "Expand" : "প্রসারিত")}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 200ms" }}>
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {isExpanded && (
        <div className="limits-grid-layout">
          {limits.map((l) => (
            <div key={l.id} className="limit-item">
              <span className="limit-icon-bullet" aria-hidden="true">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
              </span>
              <div>
                <strong style={{ color: "var(--text-primary)", display: "block", marginBottom: "3px", fontSize: "13px" }}>
                  {lang === "en" ? l.titleEn : l.titleBn}
                </strong>
                <span>{lang === "en" ? l.textEn : l.textBn}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
