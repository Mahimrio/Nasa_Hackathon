"use client";

import { useState } from "react";
import { useLocale } from "../hooks/useLocale";

export default function OperationalLimitsPanel({ metrics }) {
  const { lang, t, formatNumber } = useLocale();
  const [isExpanded, setIsExpanded] = useState(true);

  const nseVal = formatNumber(metrics?.formatted?.nse ?? "0.74");
  const baseNseVal = formatNumber(metrics?.baseline?.formatted?.nse ?? "-0.15");
  const kgeVal = formatNumber(metrics?.formatted?.kge ?? "0.68");
  const timingVal = formatNumber(metrics?.formatted?.timing_error ?? "-2.0 h");
  const leadVal = formatNumber(metrics?.formatted?.lead_time ?? "22.0 h");

  const rawItems = t("limits.items");
  const limits = Array.isArray(rawItems)
    ? rawItems.map((l) => {
        if (l.id === "computed-perf") {
          return {
            ...l,
            title:
              lang === "bn"
                ? `গণনাকৃত বৈজ্ঞানিক কার্যকারিতা (NSE ${nseVal} · লিড ${leadVal})`
                : `Computed Scientific Performance (NSE ${nseVal} · KGE ${kgeVal} · Lead ${leadVal})`,
            text: (l.text || "")
              .replace("{nse}", nseVal)
              .replace("{baseNse}", baseNseVal)
              .replace("{kge}", kgeVal)
              .replace("{timing}", timingVal)
              .replace("{lead}", leadVal),
          };
        }
        return l;
      })
    : [];

  return (
    <section
      className="glass-panel card-padding dashboard-full-row operational-limits-card"
      aria-label={t("limits.title")}
    >
      <div
        className="card-header-bar limits-card-header"
        style={{
          marginBottom: isExpanded ? "var(--space-3)" : 0,
          paddingBottom: isExpanded ? "var(--space-2)" : 0,
        }}
      >
        <div className="card-title-group">
          <div
            className="card-icon"
            style={{
              background: "rgba(255, 196, 92, 0.15)",
              borderColor: "rgba(255, 196, 92, 0.35)",
              color: "var(--amber-400)",
            }}
            aria-hidden="true"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          </div>
          <div>
            <div className="card-title" style={{ fontSize: "16px" }}>
              {t("limits.title")}
            </div>
          </div>
        </div>

        <button
          type="button"
          className="limits-toggle-button"
          onClick={() => setIsExpanded((expanded) => !expanded)}
          aria-expanded={isExpanded}
          aria-controls="operational-limits-grid"
          aria-label={isExpanded ? t("limits.collapseAria") : t("limits.expandAria")}
        >
          <span>{isExpanded ? t("limits.collapse") : t("limits.expand")}</span>
          <span className="limits-toggle-visual" aria-hidden="true">
            <svg
              className={`limits-toggle-state-icon ${isExpanded ? "is-current" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3.5" y="4" width="17" height="16" rx="2.5" />
              <path d="M4 8.5h16" />
              <path d="m9 15 3-3 3 3" />
            </svg>
            <svg
              className={`limits-toggle-state-icon ${!isExpanded ? "is-current" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3.5" y="4" width="17" height="16" rx="2.5" />
              <path d="M4 8.5h16" />
              <path d="m9 12 3 3 3-3" />
            </svg>
          </span>
        </button>
      </div>

      <div
        id="operational-limits-grid"
        className={`limits-disclosure ${isExpanded ? "is-open" : "is-closed"}`}
        role="region"
        aria-label={t("limits.title")}
        aria-hidden={!isExpanded}
      >
        <div className="limits-disclosure-inner" inert={!isExpanded}>
          <div className="limits-grid-layout">
            {limits.map((l) => (
              <div key={l.id} className="limit-item">
                <span className="limit-icon-bullet" aria-hidden="true">
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </span>
                <div>
                  <strong
                    style={{
                      color: "var(--text-primary)",
                      display: "block",
                      marginBottom: "3px",
                      fontSize: "13px",
                    }}
                  >
                    {l.title}
                  </strong>
                  <span>{l.text}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

