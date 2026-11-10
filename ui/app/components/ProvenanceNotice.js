"use client";

import { usePathname } from "next/navigation";
import { useLocale } from "../hooks/useLocale";
import { useTelemetry } from "../context/TelemetryContext";

export default function ProvenanceNotice() {
  const { lang } = useLocale();
  const { metrics } = useTelemetry();
  const pathname = usePathname();

  const isTrends = pathname === "/trends";

  if (isTrends) {
    const noticeEn =
      "Primary Submission (Challenge Answer): Module 2 — Haor Rainfall Trend Explorer. Powered by 25 years (2001–2025, 1,525 daily granules) of authentic NASA GPM IMERG Final Run V07B observations. Computes cell-first PRCPTOT and R50mm indicators, Theil-Sen slope estimation, analytical 95% Sen-Kendall CI, and Hamed-Rao (1998) autocorrelation-corrected Mann-Kendall tests.";
    const noticeBn =
      "মূল সাবমিশন (নাসা চ্যালেঞ্জ উত্তর): মডিউল ২ — হাওর বৃষ্টিপাত ট্রেন্ড এক্সপ্লোরার। নাসা GPM IMERG ফাইনাল রান V07B-এর ২৫ বছরের (২০০১–২০২৫, ১,৫২৫টি দৈনিক গ্র্যানিউল) প্রকৃত উপাত্ত দ্বারা পরিচালিত। সেল-ফার্স্ট সূচক, থিল-সেন ঢাল, ৯৫% সেন-কেন্ডাল সিআই এবং অটো-কোরেলেশন সংশোধিত ম্যান-কেন্ডাল পরিসংখ্যান।";

    return (
      <aside
        className="provenance-notice real-mode"
        role="status"
        aria-live="polite"
        style={{
          borderLeft: "4px solid var(--green-500)",
          background: "linear-gradient(90deg, rgba(20,110,90,0.08) 0%, transparent 100%)",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", alignItems: "baseline" }}>
          <span style={{ fontWeight: 700, fontSize: "13px", color: "var(--text-primary)" }}>
            {lang === "en" ? "Data Provenance:" : "ডেটা উৎস:"}
          </span>
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: "9999px",
              background: "rgba(20,110,90,0.15)",
              color: "var(--green-500)",
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              fontFamily: "var(--font-mono)",
            }}
          >
            Tier 2 / VERIFIED REAL
          </span>
          <span style={{ fontSize: "12.5px", color: "var(--text-secondary)", fontWeight: 500 }}>
            {lang === "en" ? "Module 2: Earth System Trend Explorer" : "মডিউল ২: আর্থ সিস্টেম ট্রেন্ড এক্সপ্লোরার"}
          </span>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
            NASA GPM IMERG Final Run V07B (2001–2025 • 1,525 daily granules)
          </span>
        </div>
        <div style={{ marginTop: "6px", fontSize: "11.5px", lineHeight: 1.5, color: "var(--text-secondary)" }}>
          {lang === "bn" ? noticeBn : noticeEn}
        </div>
      </aside>
    );
  }

  // Module 1 routes (/, /dashboard, /forecast, /advisory)
  const isReal =
    Boolean(metrics?.real_hindcast) ||
    String(metrics?.provenance || "").startsWith("EXPLORATORY");

  const tier = isReal ? "Tier 3" : "—";
  const tierLabel = isReal
    ? (lang === "en" ? "Module 1: Retrospective Exploratory Hindcast" : "মডিউল ১: অনুবর্তী পরীক্ষামূলক হ্যান্ডকাস্ট")
    : (lang === "en" ? "Module 1: Synthetic Engineering Demo" : "মডিউল ১: সিন্থেটিক ইঞ্জিনিয়ারিং ডেমো");

  const sources = isReal
    ? (lang === "en"
        ? "NASA SWOT RiverSP v2.0 • GPM IMERG Early V07B • BWDB SW266 Kanaighat"
        : "NASA SWOT RiverSP v2.0 • GPM IMERG Early V07B • BWDB SW266 কানাইঘাট")
    : (lang === "en"
        ? "Project-generated fixtures (SWOT-shaped, IMERG-shaped, gauge-shaped)"
        : "প্রকল্প-উৎপন্ন ফিক্সচার (SWOT-সদৃশ, IMERG-সদৃশ, গেজ-সদৃশ)");

  const disclaimer = isReal
    ? (lang === "en"
        ? "Downstream Demonstrator: Literature-assumed hydraulics (Chow 1959; Arcement & Schneider 1989, n=0.033, N=52). No observational calibration. NSE/KGE omitted per sparse-gauge protocol (Trap T-H5). Threshold flags = retrospective state classification, not predictive warning. Operational lead time NOT established (Tier 4). Absolute PWD danger-level crossing unverified without geodetic leveling tie."
        : "কৃষি প্রদর্শন: সাহিত্য-অনুমান হাইড্রোলিক্স (Chow 1959; Arcement & Schneider 1989, n=০.০৩৩, N=৫২)। পর্যবেক্ষণ-ভিত্তিক ক্রমাঙ্কন নেই। বিরল গেজের কারণে NSE/KGE বাদ (Trap T-H5)। থ্রেশহোল্ড ফ্ল্যাগ = পরিস্থিতি শ্রেণিবিন্যাস, সতর্কতা নয়। সতর্কতার লিড টাইম প্রতিষ্ঠিত নয় (টিয়ার ৪)। PWD বিপদ সীমা জিওডেটিক টাই ছাড়া অপরীক্ষিত।")
    : (lang === "en"
        ? "Downstream Demonstrator: Offline synthetic fixture scenario. Not NASA/BWDB observations. Metrics do not establish forecast skill."
        : "কৃষি প্রদর্শন: অফলাইন সিন্থেটিক দৃশ্যকল্প। NASA/BWDB পর্যবেক্ষণ নয়। মেট্রিক পূর্বাভাস দক্ষতা প্রমাণ করে না।");

  return (
    <aside
      className={`provenance-notice ${isReal ? "real-mode" : "demo-mode"}`}
      role="status"
      aria-live="polite"
      style={{
        borderLeft: isReal ? "4px solid var(--green-500)" : "4px solid var(--amber-500)",
        background: isReal
          ? "linear-gradient(90deg, rgba(20,110,90,0.08) 0%, transparent 100%)"
          : "linear-gradient(90deg, rgba(180,120,0,0.08) 0%, transparent 100%)",
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", alignItems: "baseline" }}>
        <span style={{ fontWeight: 700, fontSize: "13px", color: "var(--text-primary)" }}>
          {lang === "en" ? "Data Provenance:" : "ডেটা উৎস:"}
        </span>

        <span
          style={{
            fontSize: "11px",
            fontWeight: 700,
            padding: "2px 8px",
            borderRadius: "9999px",
            background: isReal ? "rgba(20,110,90,0.15)" : "rgba(180,120,0,0.15)",
            color: isReal ? "var(--green-500)" : "var(--amber-500)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            fontFamily: "var(--font-mono)",
          }}
        >
          {tier}
        </span>

        <span style={{ fontSize: "12.5px", color: "var(--text-secondary)", fontWeight: 500 }}>
          {tierLabel}
        </span>

        <span style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
          {sources}
        </span>
      </div>

      <div
        style={{
          marginTop: "6px",
          fontSize: "11.5px",
          lineHeight: 1.5,
          color: "var(--text-secondary)",
        }}
      >
        {disclaimer}
      </div>
    </aside>
  );
}
