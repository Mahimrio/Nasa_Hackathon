"use client";

import { useState } from "react";

export default function OperationalLimitsPanel({ lang }) {
  const [isExpanded, setIsExpanded] = useState(true);

  const limits = [
    {
      icon: "🛰️",
      titleEn: "SWOT Spatial Resolution (>100 m)",
      titleBn: "SWOT উপগ্রহ রেজোলিউশন (>১০০ মি)",
      textEn: "SWOT KaRIn radar altimetry resolves rivers wider than ~100 m. Narrow mountain headwaters in the Meghalaya escarpment are not resolved directly.",
      textBn: "SWOT রাডার শুধুমাত্র ১০০ মিটারের চেয়ে প্রশস্ত নদী শনাক্ত করতে পারে। মেঘালয় পাহাড়ের সরু উৎসনদীগুলো সরাসরি পরিমাপ করা হয় না।",
    },
    {
      icon: "📐",
      titleEn: "Low-Slope Reach Filtering",
      titleBn: "কম ঢালের রিচ ফিল্টারিং",
      textEn: "Low-slope reaches where slope measurement uncertainty exceeds the hydraulic signal are filtered out to preserve numerical stability.",
      textBn: "যেসব রিচে ঢালের পরিমাপের অনিশ্চয়তা সংকেতের চেয়ে বেশি, সেগুলোকে মডেলের স্থায়িত্ব বজায় রাখতে বাদ দেওয়া হয়েছে।",
    },
    {
      icon: "🌧️",
      titleEn: "IMERG Orographic Rain Bias",
      titleBn: "IMERG বৃষ্টিপাতের অরোগ্রাফিক প্রভাব",
      textEn: "GPM IMERG early-run may overestimate intense orographic rainfall over the steep Meghalaya escarpment; hydrological calibration implicitly adjusts runoff coefficient.",
      textBn: "GPM IMERG মেঘালয় পাহাড়ে অতিরিক্ত বৃষ্টিপাত দেখাতে পারে; তবে রানঅফ সহগের ক্রমাঙ্কন এই ত্রুটি দূর করে।",
    },
    {
      icon: "🌊",
      titleEn: "Rising Limb Wave Routing Scope",
      titleBn: "উত্থান পর্ব রাউটিং পরিধি",
      textEn: "Hydrologic routing models rising limb channel stage and arrival time at the haor rim — 2D backwater floodplain inundation is outside current scope.",
      textBn: "রাউটিং শুধুমাত্র নদীর চ্যানেলে পানির বৃদ্ধি এবং আগমনের সময় হিসাব করে — প্লাবনভূমির অভ্যন্তরীণ জলাবদ্ধতা এর আওতাভুক্ত নয়।",
    },
    {
      icon: "⏱️",
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
          <span style={{ fontSize: "16px", color: "var(--amber-400)" }}>⚠</span>
          <div>
            <div className="card-eyebrow" style={{ color: "var(--amber-400)" }}>
              {lang === "en" ? "PHYSICAL CONSTRAINTS & METHODOLOGICAL BOUNDARIES" : "পদ্ধতিগত সীমাবদ্ধতা এবং বৈজ্ঞানিক শর্তাবলী"}
            </div>
            <div className="card-title">
              {lang === "en" ? "Operational Limitations & Model Assumptions (§4.1)" : "অপারেশনাল সীমাবদ্ধতা ও মডেলের অনুমানসমূহ"}
            </div>
          </div>
        </div>

        <button
          className="btn-standard neu-inset"
          style={{ height: "28px", padding: "0 10px", fontSize: "11px" }}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (lang === "en" ? "Collapse ▲" : "সংকোচন ▲") : (lang === "en" ? "Expand ▼" : "প্রসারিত করুন ▼")}
        </button>
      </div>

      {isExpanded && (
        <div className="limits-grid-layout">
          {limits.map((l, i) => (
            <div key={i} className="limit-item">
              <span className="limit-icon-bullet" aria-hidden="true">{l.icon}</span>
              <div>
                <strong style={{ color: "var(--text-primary)", display: "block", marginBottom: "2px" }}>
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
