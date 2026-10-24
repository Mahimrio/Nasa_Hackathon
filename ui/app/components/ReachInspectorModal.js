"use client";

import { useEffect, useRef } from "react";
import { useLocale } from "../hooks/useLocale";

export default function ReachInspectorModal({ reach, calibrationData, riskFn, onClose }) {
  const { lang, t, formatNumber } = useLocale();
  const closeBtnRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    closeBtnRef.current?.focus();
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!reach) return null;

  const cal = calibrationData ? calibrationData[reach.reach_id] : null;
  const currentRisk = riskFn ? riskFn(reach.reach_id) : "GREEN";

  const statusText =
    currentRisk === "RED"
      ? (lang === "en" ? "CRITICAL RISK (RED)" : "বিপজ্জনক অবস্থা (লাল)")
      : currentRisk === "AMBER"
      ? (lang === "en" ? "WARNING RISK (AMBER)" : "সতর্কতামূলক অবস্থা (হলুদ)")
      : (lang === "en" ? "NORMAL SAFE (GREEN)" : "স্বাভাবিক অবস্থা (সবুজ)");

  const reachLengthKm = (reach.length_m / 1000).toFixed(1);
  const nPasses = cal ? cal.n_valid_passes : 65;

  return (
    <div
      className="modal-overlay-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reach-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content-panel">
        <button
          ref={closeBtnRef}
          className="modal-close-btn"
          onClick={onClose}
          aria-label={t("inspector.closeBtn")}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "8px",
              background: "#EAF3F9",
              border: "1px solid rgba(40, 123, 181, 0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "var(--blue-primary)",
              flexShrink: 0,
            }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>
          <div>
            <h2
              id="reach-modal-title"
              style={{ fontSize: "18px", fontWeight: 700, color: "var(--text-primary)" }}
            >
              {lang === "en" ? reach.name : reach.name_bn || reach.name}
            </h2>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              {t("inspector.title")}
            </div>
          </div>
        </div>

        {/* Current Status Pill */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 14px",
            borderRadius: "var(--radius-pill)",
            background:
              currentRisk === "RED"
                ? "var(--red-bg)"
                : currentRisk === "AMBER"
                ? "var(--amber-bg)"
                : "var(--green-bg)",
            border: `1px solid ${
              currentRisk === "RED"
                ? "var(--red-400)"
                : currentRisk === "AMBER"
                ? "var(--amber-400)"
                : "var(--green-400)"
            }`,
            marginBottom: "20px",
          }}
        >
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background:
                currentRisk === "RED"
                  ? "var(--red-400)"
                  : currentRisk === "AMBER"
                  ? "var(--amber-400)"
                  : "var(--green-400)",
            }}
          />
          <span
            style={{
              fontSize: "12px",
              fontWeight: 700,
              color:
                currentRisk === "RED"
                  ? "var(--red-400)"
                  : currentRisk === "AMBER"
                  ? "var(--amber-400)"
                  : "var(--green-400)",
            }}
          >
            {t("inspector.statusLabel")} {statusText}
          </span>
        </div>

        {/* Hydraulic Parameters Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
            marginBottom: "20px",
          }}
        >
          <div
            className="param-row"
            style={{ flexDirection: "column", alignItems: "flex-start", padding: "10px 12px" }}
          >
            <span className="param-label">{t("inspector.reachId")}</span>
            <span className="param-value" style={{ fontSize: "14px" }}>
              {reach.reach_id}
            </span>
          </div>

          <div
            className="param-row"
            style={{ flexDirection: "column", alignItems: "flex-start", padding: "10px 12px" }}
          >
            <span className="param-label">{t("inspector.riverCorridor")}</span>
            <span className="param-value" style={{ fontSize: "14px", color: "var(--blue-primary)" }}>
              {reach.river === "Surma"
                ? (lang === "en" ? "Surma" : "সুরমা")
                : reach.river === "Kushiyara"
                ? (lang === "en" ? "Kushiyara" : "কুশিয়ারা")
                : reach.river}
            </span>
          </div>

          <div
            className="param-row"
            style={{ flexDirection: "column", alignItems: "flex-start", padding: "10px 12px" }}
          >
            <span className="param-label">{t("inspector.calibratedN")}</span>
            <span className="param-value" style={{ fontSize: "16px", color: "var(--blue-deep)" }}>
              {formatNumber(reach.calibrated_n ?? (cal ? cal.n : "0.0310"))}
            </span>
          </div>

          <div
            className="param-row"
            style={{ flexDirection: "column", alignItems: "flex-start", padding: "10px 12px" }}
          >
            <span className="param-label">{t("inspector.bedElevation")}</span>
            <span className="param-value" style={{ fontSize: "16px" }}>
              {formatNumber(reach.z_bed ?? (cal ? cal.z_bed : "6.82"))} {lang === "en" ? "m PWD" : "মি PWD"}
            </span>
          </div>

          <div
            className="param-row"
            style={{ flexDirection: "column", alignItems: "flex-start", padding: "10px 12px" }}
          >
            <span className="param-label">{t("inspector.meanWidth")}</span>
            <span className="param-value" style={{ fontSize: "14px" }}>
              {formatNumber(reach.width_mean_m)} {lang === "en" ? "m" : "মি"}
            </span>
          </div>

          <div
            className="param-row"
            style={{ flexDirection: "column", alignItems: "flex-start", padding: "10px 12px" }}
          >
            <span className="param-label">{t("inspector.reachLength")}</span>
            <span className="param-value" style={{ fontSize: "14px" }}>
              {formatNumber(reachLengthKm)} {lang === "en" ? "km" : "কিমি"}
            </span>
          </div>

          <div
            className="param-row"
            style={{ flexDirection: "column", alignItems: "flex-start", padding: "10px 12px" }}
          >
            <span className="param-label">{t("inspector.slopeQuality")}</span>
            <span className="param-value" style={{ color: "var(--green-400)" }}>
              {reach.slope_quality === "good" ? t("inspector.statusGood") : reach.slope_quality}
            </span>
          </div>

          <div
            className="param-row"
            style={{ flexDirection: "column", alignItems: "flex-start", padding: "10px 12px" }}
          >
            <span className="param-label">{t("inspector.swotPasses")}</span>
            <span className="param-value">
              {formatNumber(nPasses)} {t("inspector.passesCount")}
            </span>
          </div>
        </div>

        {reach.has_gauge && (
          <div
            style={{
              padding: "12px",
              borderRadius: "8px",
              background: "#FEF7EE",
              border: "1px solid rgba(183, 121, 31, 0.3)",
              marginBottom: "16px",
            }}
          >
            <div
              style={{
                color: "var(--amber-600, #B7791F)",
                fontWeight: 700,
                fontSize: "12.5px",
                marginBottom: "4px",
              }}
            >
              {(() => {
                const rawName = reach.gauge_station || "Kanaighat Gauge (SW266 / Model SW108)";
                const cleanName = rawName.includes("SW266") ? rawName : rawName.replace("SW108", "SW266 / Model SW108");
                return lang === "en"
                  ? `BWDB Station: ${cleanName} (Co-located Gauge)`
                  : `বাপাউবো স্টেশন: ${cleanName} (সংযুক্ত গেজ)`;
              })()}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-secondary)", lineHeight: "1.5" }}>
              {lang === "en" ? (
                <>
                  Scenario threshold: <strong>{reach.danger_level_m} m PWD</strong>. This synthetic demonstration does not assimilate BWDB observations or provide real-time validation.
                </>
              ) : (
                <>
                  বিপৎসীমা: <strong>{formatNumber(reach.danger_level_m)} মি PWD (১২.৭৫ মি MSL)</strong>। বাংলাদেশ পানি উন্নয়ন বোর্ডের (BWDB স্টেশন SW২৬৬) প্রত্যক্ষ গেজ পর্যবেক্ষণ সরাসরি এখানে যাচাইকরণের জন্য সমন্বিত।
                </>
              )}
            </div>
          </div>
        )}

        <button
          className="btn-standard btn-primary"
          style={{ width: "100%", justifyContent: "center" }}
          onClick={onClose}
        >
          {t("inspector.doneBtn")}
        </button>
      </div>
    </div>
  );
}
