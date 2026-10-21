"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useLocale } from "../hooks/useLocale";
import { useTelemetry } from "../context/TelemetryContext";
import AppHeader from "../components/AppHeader";
import PageContextBar from "../components/PageContextBar";
import HarvestAdvisorySection from "../components/HarvestAdvisorySection";
import DashboardSkeleton from "../components/DashboardSkeleton";
import ErrorBoundary from "../components/ErrorBoundary";

// Code-split heavy interactive modals so they are loaded on-demand only
const ReachInspectorModal = dynamic(
  () => import("../components/ReachInspectorModal"),
  { ssr: false }
);
const AdvisoryBulletinModal = dynamic(
  () => import("../components/AdvisoryBulletinModal"),
  { ssr: false }
);
const ModelArchitectureModal = dynamic(
  () => import("../components/ModelArchitectureModal"),
  { ssr: false }
);

export default function AdvisoryPage() {
  const { lang, setLang, t, formatNumber } = useLocale();
  const {
    eventData,
    metrics,
    calibration,
    reachMeta,
    sliderIdx,
    setSliderIdx,
    peakIdx,
    current,
    selectedReachId,
    setSelectedReachId,
    selectedReach,
    reachRiskLevel,
    dangerLevel,
    dateStr,
    timeStr,
    inspectingReach,
    setInspectingReach,
    showBulletin,
    setShowBulletin,
    showModelInfo,
    setShowModelInfo,
    loading,
    fetchData,
  } = useTelemetry();

  if (loading) {
    return (
      <>
        <AppHeader
          currentDateStr="-- --- 2026"
          currentTimeStr="--:--"
          onOpenBulletin={() => {}}
          onOpenModelInfo={() => {}}
        />
        <DashboardSkeleton lang={lang} />
      </>
    );
  }

  if (!eventData || !current) {
    return (
      <div className="loading-screen-wrap" role="alert">
        <div className="loading-headline" style={{ color: "var(--red-400)", marginTop: "12px" }}>
          {lang === "en" ? "Failed to Load Pipeline Datasets" : "টেলিম্যাট্রি ডেটাসেট লোড করা যায়নি"}
        </div>
        <button
          className="btn-standard btn-primary"
          onClick={fetchData}
          style={{ minHeight: "44px", padding: "0 22px", fontSize: "13px", fontWeight: 700 }}
        >
          {lang === "en" ? "Retry Loading Telemetry" : "পুনরায় চেষ্টা করুন"}
        </button>
      </div>
    );
  }

  return (
    <ErrorBoundary lang={lang} onRetry={fetchData}>
      {/* Skip to Main Content */}
      <a href="#main-content" className="skip-to-content">
        {lang === "en" ? "Skip to Main Content" : "মূল বিষয়বস্তুতে যান"}
      </a>

      {/* Top Application Bar with Route Navigation */}
      <AppHeader
        currentDateStr={dateStr}
        currentTimeStr={timeStr}
        onOpenBulletin={() => setShowBulletin(true)}
        onOpenModelInfo={() => setShowModelInfo(true)}
      />

      {/* Main Advisory Page Container (§3. Harvest Advisory — Decide What to Do) */}
      <main id="main-content" className="dashboard-shell" role="main" tabIndex="-1">
        {/* Context Strip & Quick Timeline Jumps */}
        <PageContextBar
          reaches={reachMeta}
          selectedReachId={selectedReachId}
          setSelectedReachId={setSelectedReachId}
          onJumpToSlider={(idx) => setSliderIdx(idx)}
          peakIdx={peakIdx}
          eventDataLength={eventData.length}
        />

        {/* Executive Page Overview Header */}
        <div className="glass-panel" style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span className="brand-badge" style={{ fontSize: "11px", background: "rgba(255, 196, 92, 0.15)", color: "var(--amber-400)" }}>
                {lang === "en" ? "STAGE 3 OF 3" : "ধাপ ৩ / ৩"}
              </span>
              <h1 style={{ fontSize: "20px", fontWeight: 800, color: "var(--text-primary)", margin: 0 }}>
                {lang === "en" ? "Harvest Advisory — Decide What to Do" : "ফসল কর্তন পরামর্শ — কী সিদ্ধান্ত নেবেন ও করণীয়"}
              </h1>
            </div>
            <p style={{ fontSize: "12.5px", color: "var(--text-muted)", marginTop: "4px", margin: 0 }}>
              {lang === "en"
                ? "Civil defense directives, location-specific Boro rice harvest advisories, golden window countdown, and field checklists."
                : "উপজেলা কৃষি সম্প্রসারণ অধিদপ্তর (DAE) ও কৃষকদের জন্য এলাকা-ভিত্তিক সুস্পষ্ট সুপারিশ, সতর্কবার্তা সময়সীমা ও করণীয়।"}
            </p>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <Link
              href="/forecast"
              className="btn-standard neu-inset"
              style={{ minHeight: "40px", padding: "0 14px", fontSize: "12px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <span>⬅</span>
              <span>{lang === "en" ? "2. Forecast & Analysis" : "২. পূর্বাভাস ও বিশ্লেষণ"}</span>
            </Link>

            <Link
              href="/dashboard"
              className="btn-standard neu-inset"
              style={{ minHeight: "40px", padding: "0 14px", fontSize: "12px", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <span>{lang === "en" ? "1. Live Dashboard" : "১. লাইভ ড্যাশবোর্ড"}</span>
            </Link>
          </div>
        </div>

        {/* 1. Main Harvest Advisory & Action Section */}
        <HarvestAdvisorySection
          current={current}
          dangerLevel={dangerLevel}
          metrics={metrics}
          selectedReach={selectedReach}
          onOpenBulletin={() => setShowBulletin(true)}
        />

        {/* 2. Reach-Specific Hydraulic Warning Telemetry Table */}
        {reachMeta && (
          <section className="glass-panel card-padding dashboard-full-row" aria-label="Reach Telemetry Table">
            <div className="card-header-bar">
              <div className="card-title-group">
                <div className="card-icon" style={{ color: "var(--cyan-400)" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" />
                    <line x1="3" y1="12" x2="3.01" y2="12" />
                    <line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                </div>
                <div>
                  <h3 className="card-title">{t("bulletin.reachTableTitle")}</h3>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    {lang === "en"
                      ? "Synchronized cross-reach warning telemetry across Surma and Kushiyara corridors"
                      : "সুরমা ও কুশিয়ারা করিডোরের সকল রিচের সমন্বিত হাইড্রোলিক টেলিমেট্রি"}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--glass-stroke)", textAlign: "left", color: "var(--text-muted)" }}>
                    <th style={{ padding: "10px 12px" }}>{t("bulletin.colReach")}</th>
                    <th style={{ padding: "10px 12px" }}>{t("bulletin.colCorridor")}</th>
                    <th style={{ padding: "10px 12px" }}>{t("bulletin.colStage")}</th>
                    <th style={{ padding: "10px 12px" }}>{t("bulletin.colDanger")}</th>
                    <th style={{ padding: "10px 12px" }}>{t("bulletin.colStatus")}</th>
                    <th style={{ padding: "10px 12px" }}>{t("bulletin.colAction")}</th>
                  </tr>
                </thead>
                <tbody>
                  {reachMeta.map((r) => {
                    const rRisk = reachRiskLevel(r.reach_id);
                    const isRed = rRisk === "RED";
                    const isAmber = rRisk === "AMBER";
                    const rColor = isRed ? "var(--red-400)" : isAmber ? "var(--amber-400)" : "var(--green-400)";
                    const rStage = r.reach_id === "22211000011" ? current.modelled_stage : (current.modelled_stage - 0.45);

                    return (
                      <tr
                        key={r.reach_id}
                        style={{
                          borderBottom: "1px solid rgba(177,221,255,0.06)",
                          background: selectedReachId === r.reach_id ? "rgba(56, 189, 248, 0.08)" : "transparent",
                          cursor: "pointer",
                        }}
                        onClick={() => setSelectedReachId(r.reach_id)}
                      >
                        <td style={{ padding: "12px", fontWeight: 700, color: "var(--text-primary)" }}>
                          {lang === "en" ? r.name : r.name_bn}
                          <span style={{ display: "block", fontSize: "11px", color: "var(--text-dim)", fontFamily: "var(--font-mono)" }}>
                            SWORD: {r.reach_id}
                          </span>
                        </td>
                        <td style={{ padding: "12px", color: "var(--cyan-300)" }}>{r.river}</td>
                        <td style={{ padding: "12px", fontFamily: "var(--font-mono)" }}>{formatNumber(rStage.toFixed(2))} m</td>
                        <td style={{ padding: "12px", fontFamily: "var(--font-mono)", color: "var(--red-400)" }}>{formatNumber(dangerLevel.toFixed(2))} m</td>
                        <td style={{ padding: "12px" }}>
                          <span
                            style={{
                              padding: "3px 8px",
                              borderRadius: "4px",
                              fontSize: "11px",
                              fontWeight: 700,
                              background: `${rColor}22`,
                              color: rColor,
                              border: `1px solid ${rColor}44`,
                            }}
                          >
                            {rRisk}
                          </span>
                        </td>
                        <td style={{ padding: "12px", color: "var(--text-secondary)" }}>
                          {isRed
                            ? (lang === "en" ? "Immediate Emergency Harvest" : "অবিলম্বে জরুরি কর্তন")
                            : isAmber
                            ? (lang === "en" ? "Ready Combine Harvesters" : "যন্ত্রপাতি প্রস্তুত রাখুন")
                            : (lang === "en" ? "Standard Monitoring" : "নিয়মিত পর্যবেক্ষণ")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Pathway Navigation Footer */}
        <div className="journey-pathway-banner" aria-label="Next Steps in User Journey">
          <Link href="/forecast" className="pathway-card neu-raised">
            <div>
              <div className="pathway-title">
                {lang === "en" ? "⬅ Return to 2. Forecast & Analysis" : "⬅ ২. পূর্বাভাস ও বিশ্লেষণে ফিরে যান"}
              </div>
              <div className="pathway-desc">
                {lang === "en"
                  ? "Re-inspect hydrograph curves, danger crossing timing, and validation skill scores."
                  : "হাইড্রোগ্রাফের পানি স্তর বক্ররেখা, বিপদসীমা অতিক্রম ও বৈজ্ঞানিক দক্ষতা স্কোর দেখুন।"}
              </div>
            </div>
            <div className="pathway-arrow" aria-hidden="true">
              ⬅
            </div>
          </Link>

          <Link href="/dashboard" className="pathway-card neu-raised">
            <div>
              <div className="pathway-title">
                {lang === "en" ? "Return to 1. Risk Dashboard ➔" : "১. মূল ঝুঁকি ড্যাশবোর্ডে ফিরে যান ➔"}
              </div>
              <div className="pathway-desc">
                {lang === "en"
                  ? "View live river reach map, current harvest flag, and 5-second risk triage."
                  : "লাইভ নদী মানচিত্র, সার্বিক ফসল কর্তন সংকেত এবং ৫-সেকেন্ড ট্রায়াজ দেখুন।"}
              </div>
            </div>
            <div className="pathway-arrow" aria-hidden="true">
              ➔
            </div>
          </Link>
        </div>
      </main>

      {/* Global Application Footer */}
      <footer className="dashboard-footer" role="contentinfo">
        <div>
          {lang === "en"
            ? "HydroSense-SWOT · NASA Space Apps Challenge 2026 · Tier 4 User Delivery Interface"
            : "হাইড্রোসেন্স-SWOT · নাসা স্পেস অ্যাপস চ্যালেঞ্জ ২০২৬ · টিয়ার ৪ ইন্টারফেস"}
        </div>
        <div className="footer-citations">
          <span>
            {lang === "en"
              ? "NASA SWOT L2 HR RiverSP 2.0 (KaRIn Altimetry)"
              : "নাসা SWOT L2 HR RiverSP 2.0 (KaRIn অলটিমেট্রি)"}
          </span>
          <span>•</span>
          <span>
            {lang === "en"
              ? "GPM IMERG Early Run V07 (0.1° Half-Hourly)"
              : "GPM IMERG আর্লি রান V07 (০.১° আধা-ঘণ্টা)"}
          </span>
          <span>•</span>
          <span>
            {lang === "en"
              ? "BWDB SW108 Kanaighat Hydrometric Gauge"
              : "বাপাউবো SW১০৮ কানাইঘাট হাইড্রোগ্রাফিক গেজ"}
          </span>
        </div>
      </footer>

      {/* Interactive Modals */}
      {inspectingReach && (
        <ReachInspectorModal
          reach={inspectingReach}
          calibrationData={calibration}
          riskFn={reachRiskLevel}
          lang={lang}
          onClose={() => setInspectingReach(null)}
        />
      )}

      {showBulletin && (
        <AdvisoryBulletinModal
          current={current}
          dateStr={dateStr}
          timeStr={timeStr}
          dangerLevel={dangerLevel}
          lang={lang}
          onClose={() => setShowBulletin(false)}
        />
      )}

      {showModelInfo && (
        <ModelArchitectureModal lang={lang} onClose={() => setShowModelInfo(false)} />
      )}
    </ErrorBoundary>
  );
}
