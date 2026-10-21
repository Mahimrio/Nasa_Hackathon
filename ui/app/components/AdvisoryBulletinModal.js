"use client";

import { useEffect, useRef } from "react";
import { useLocale } from "../hooks/useLocale";

export default function AdvisoryBulletinModal({
  current,
  dateStr,
  timeStr,
  dangerLevel = 13.2,
  onClose,
}) {
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

  if (!current) return null;

  const flag = current.harvest_flag;
  const stage = current.modelled_stage;
  const isDanger = stage >= dangerLevel;

  const flagTitle =
    flag === "RED"
      ? (lang === "en" ? "OPERATIONAL FLAG: RED (HARVEST IMMEDIATELY)" : "জরুরি সংকেত: লাল (অবিলম্বে ফসল কর্তন)")
      : flag === "AMBER"
      ? (lang === "en" ? "OPERATIONAL FLAG: AMBER (PREPARE MACHINERY)" : "সতর্কতামূলক সংকেত: হলুদ (যন্ত্রপাতি প্রস্তুত)")
      : (lang === "en" ? "OPERATIONAL FLAG: GREEN (NORMAL MONITORING)" : "স্বাভাবিক সংকেত: সবুজ (নিয়মিত পর্যবেক্ষণ)");

  const stageFormatted = formatNumber(stage.toFixed(2));
  const diffVal = Math.abs(stage - dangerLevel).toFixed(2);
  const diffFormatted = formatNumber(diffVal);
  const rainFormatted = formatNumber(current.imerg_map_mmh.toFixed(2));

  return (
    <div
      className="modal-overlay-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bulletin-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content-panel" style={{ maxWidth: "620px" }}>
        <button
          ref={closeBtnRef}
          className="modal-close-btn"
          onClick={onClose}
          aria-label={t("bulletin.closeBtn")}
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

        {/* Official Header */}
        <div
          style={{
            textAlign: "center",
            borderBottom: "1px solid rgba(177,221,255,0.12)",
            paddingBottom: "16px",
            marginBottom: "18px",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              letterSpacing: "0.08em",
              color: "var(--cyan-400)",
              fontWeight: 700,
              textTransform: "uppercase",
            }}
          >
            {lang === "en"
              ? "GOVERNMENT OF THE PEOPLE'S REPUBLIC OF BANGLADESH · DAE / BWDB"
              : "গণপ্রজাতন্ত্রী বাংলাদেশ সরকার · কৃষি সম্প্রসারণ অধিদপ্তর ও পানি উন্নয়ন বোর্ড"}
          </div>
          <h2
            id="bulletin-title"
            style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-primary)", marginTop: "4px" }}
          >
            {t("bulletin.title")}
          </h2>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "12px",
              color: "var(--text-muted)",
              marginTop: "6px",
            }}
          >
            {lang === "en"
              ? `Issued: ${dateStr} at ${timeStr} UTC · Target: Upazila Agriculture Officers (Sunamganj & Sylhet)`
              : `ইস্যু তারিখ: ${formatNumber(dateStr)} সময়: ${formatNumber(timeStr)} UTC · প্রাপক: উপজেলা কৃষি অফিসার (সুনামগঞ্জ ও সিলেট)`}
          </div>
        </div>

        {/* Flag Status Banner */}
        <div
          style={{
            padding: "14px 18px",
            borderRadius: "10px",
            background:
              flag === "RED" ? "var(--red-bg)" : flag === "AMBER" ? "var(--amber-bg)" : "var(--green-bg)",
            border: `1.5px solid ${
              flag === "RED" ? "var(--red-400)" : flag === "AMBER" ? "var(--amber-400)" : "var(--green-400)"
            }`,
            display: "flex",
            alignItems: "center",
            gap: "14px",
            marginBottom: "18px",
          }}
        >
          <div
            style={{
              flexShrink: 0,
              color:
                flag === "RED" ? "var(--red-400)" : flag === "AMBER" ? "var(--amber-400)" : "var(--green-400)",
            }}
          >
            {flag === "RED" ? (
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
              </svg>
            ) : flag === "AMBER" ? (
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            ) : (
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
          <div>
            <div
              style={{
                fontSize: "15px",
                fontWeight: 800,
                color:
                  flag === "RED" ? "var(--red-400)" : flag === "AMBER" ? "var(--amber-400)" : "var(--green-400)",
              }}
            >
              {flagTitle}
            </div>
            <div style={{ fontSize: "12.5px", color: "var(--text-primary)", marginTop: "2px" }}>
              {lang === "en" ? current.advisory_en : current.advisory_bn}
            </div>
          </div>
        </div>

        {/* Key Operational Numbers */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "18px" }}>
          <div className="param-row">
            <span className="param-label">
              {lang === "en" ? "Modelled River Stage" : "মডেল পানি স্তর"}
            </span>
            <span className="param-value" style={{ color: "var(--cyan-300)" }}>
              {stageFormatted} {lang === "en" ? "m PWD" : "মি PWD"}
            </span>
          </div>
          <div className="param-row">
            <span className="param-label">
              {lang === "en" ? "Danger Exceedance" : "বিপদসীমা অতিক্রম"}
            </span>
            <span className="param-value" style={{ color: isDanger ? "var(--red-400)" : "var(--green-400)" }}>
              {isDanger
                ? (lang === "en" ? `+${diffFormatted} m (DANGER)` : `+${diffFormatted} মি (বিপজ্জনক)`)
                : (lang === "en" ? `${diffFormatted} m (Safe)` : `${diffFormatted} মি (নিরাপদ)`)}
            </span>
          </div>
          <div className="param-row">
            <span className="param-label">
              {lang === "en" ? "GPM Rain Intensity" : "মেঘালয় বৃষ্টিপাত"}
            </span>
            <span className="param-value">
              {rainFormatted} {lang === "en" ? "mm/h" : "মিমি/ঘণ্টা"}
            </span>
          </div>
          <div className="param-row">
            <span className="param-label">
              {lang === "en" ? "Actionable Lead Time" : "আগাম সতর্কবার্তা সময়"}
            </span>
            <span className="param-value" style={{ color: "var(--cyan-300)" }}>
              {formatNumber("22.0")} {lang === "en" ? "Hours" : "ঘণ্টা"}
            </span>
          </div>
        </div>

        {/* Action Directives */}
        <div style={{ marginBottom: "20px" }}>
          <h4
            style={{
              fontSize: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "var(--text-secondary)",
              marginBottom: "8px",
            }}
          >
            {t("bulletin.recommendedActions")}
          </h4>
          <ul
            style={{
              paddingLeft: "18px",
              fontSize: "12.5px",
              color: "var(--text-secondary)",
              lineHeight: 1.7,
            }}
          >
            <li>
              {lang === "en"
                ? "Activate local Union Parishad loudspeaker flood announcements immediately."
                : "ইউনিয়ন পরিষদের মাধ্যমে মাইকিং করে কৃষকদের জরুরি সতর্কবার্তা প্রচার করুন।"}
            </li>
            <li>
              {lang === "en"
                ? "Prioritize harvesting Boro rice that has reached 80% physiological maturity."
                : "৮০% পরিপক্ব বোরো ধান অগ্রাধিকার ভিত্তিতে দ্রুত কাটার পরামর্শ প্রদান করুন।"}
            </li>
            <li>
              {lang === "en"
                ? "Mobilize combine harvesters and community labor gangs to low-lying haor pockets."
                : "নিচু হাওর এলাকায় কম্বাইন হারভেস্টার ও দ্রুত ধান কাটার দল মোতায়েন করুন।"}
            </li>
            <li>
              {lang === "en"
                ? "Inspect submersible embankment dykes for early seepage and erosion points."
                : "ডুবন্ত ফসলরক্ষা বাঁধের দুর্বল অংশ দ্রুত সংস্কার ও পরিদর্শনের ব্যবস্থা নিন।"}
            </li>
          </ul>
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            className="btn-standard neu-inset"
            style={{
              flex: 1,
              justifyContent: "center",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
            onClick={() => window.print()}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <polyline points="6 9 6 2 18 2 18 9" />
              <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
            <span>{t("bulletin.printBtn")}</span>
          </button>
          <button
            className="btn-standard btn-primary"
            style={{ flex: 1, justifyContent: "center" }}
            onClick={onClose}
          >
            {t("bulletin.closeBtn")}
          </button>
        </div>
      </div>
    </div>
  );
}

