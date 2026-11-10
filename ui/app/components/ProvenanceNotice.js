"use client";

import { useLocale } from "../hooks/useLocale";
import { useTelemetry } from "../context/TelemetryContext";

export default function ProvenanceNotice() {
  const { lang } = useLocale();
  const { metrics } = useTelemetry();

  const isReal =
    Boolean(metrics?.real_hindcast) ||
    String(metrics?.provenance || "").startsWith("EXPLORATORY");

  const tier = isReal ? "Tier 3" : "—";
  const tierLabel = isReal
    ? (lang === "en" ? "Retrospective Exploratory Hindcast" : "অনুবর্তী পরীক্ষামূলক হ্যান্ডকাস্ট")
    : (lang === "en" ? "Synthetic Engineering Demo" : "সিন্থেটিক ইঞ্জিনিয়ারিং ডেমো");

  const sources = isReal
    ? (lang === "en"
        ? "NASA SWOT RiverSP v2.0 • GPM IMERG Early V07B • BWDB SW266 Kanaighat"
        : "NASA SWOT RiverSP v2.0 • GPM IMERG Early V07B • BWDB SW266 কানাইঘাট")
    : (lang === "en"
        ? "Project-generated fixtures (SWOT-shaped, IMERG-shaped, gauge-shaped)"
        : "প্রকল্প-উৎপন্ন ফিক্সচার (SWOT-সদৃশ, IMERG-সদৃশ, গেজ-সদৃশ)");

  const disclaimer = isReal
    ? (lang === "en"
        ? "Literature-assumed hydraulics (Chow 1959; Arcement & Schneider 1989). No observational calibration. NSE/KGE omitted: sparse daily gauge cannot support continuous skill scores. Threshold flags = retrospective state classification, not predictive warning. Absolute PWD danger-level crossing unverified without geodetic leveling tie."
        : "সাহিত্য-অনুমান হাইড্রোলিক্স (Chow 1959; Arcement & Schneider 1989)। পর্যবেক্ষণ-ভিত্তিক ক্রমাঙ্কন নেই। নিরবচ্ছিন্ন গেজের অভাবে NSE/KGE বাদ। থ্রেশহোল্ড ফ্ল্যাগ = চলচ্চিত্র পরিস্থিতি শ্রেণিবিন্যাস, সতর্কতা নয়। PWD বিপদ সীমা জিওডেটিক টাই ছাড়া অপরীক্ষিত।")
    : (lang === "en"
        ? "Not NASA/BWDB/FFWC observations. Metrics do not establish forecast skill."
        : "NASA/BWDB/FFWC পর্যবেক্ষণ নয়। মেট্রিক পূর্বাভাস দক্ষতা প্রমাণ করে না।");

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