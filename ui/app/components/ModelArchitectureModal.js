"use client";

import { useEffect, useRef } from "react";
import { useLocale } from "../hooks/useLocale";

export default function ModelArchitectureModal({ onClose }) {
  const { lang, t } = useLocale();
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

  return (
    <div
      className="modal-overlay-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="model-info-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-content-panel" style={{ maxWidth: "680px" }}>
        <button
          ref={closeBtnRef}
          className="modal-close-btn"
          onClick={onClose}
          aria-label={t("architecture.closeBtn")}
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
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
            </svg>
          </div>
          <div>
            <h2
              id="model-info-title"
              style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-primary)" }}
            >
              {t("architecture.title")}
            </h2>
            <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
              {t("architecture.subtitle")}
            </div>
          </div>
        </div>

        {/* 4 Tiers of Pipeline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "22px" }}>
          <div
            style={{
              padding: "12px 14px",
              borderRadius: "10px",
              background: "#F8FAFC",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <strong style={{ color: "var(--blue-deep)", fontSize: "13.5px" }}>
                {t("architecture.offlineTitle")}
              </strong>
              <span
                style={{
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {lang === "en" ? "Offline / 21-day orbit" : "অফলাইন / ২১ দিন কক্ষপথ"}
              </span>
            </div>
            <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
              {t("architecture.offlineText")}
            </p>
          </div>

          <div
            style={{
              padding: "12px 14px",
              borderRadius: "10px",
              background: "#F8FAFC",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <strong style={{ color: "var(--blue-primary)", fontSize: "13.5px" }}>
                {t("architecture.onlineTitle")}
              </strong>
              <span
                style={{
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {lang === "en" ? "Latency: ~4h" : "বিলম্বকাল: ~৪ ঘণ্টা"}
              </span>
            </div>
            <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
              {t("architecture.onlineText")}
            </p>
          </div>

          <div
            style={{
              padding: "12px 14px",
              borderRadius: "10px",
              background: "#F8FAFC",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <strong style={{ color: "#5B67CA", fontSize: "13.5px" }}>
                {t("architecture.routingTitle")}
              </strong>
              <span
                style={{
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {lang === "en" ? "~26h Travel Time" : "~২৬ ঘণ্টা তরঙ্গ গতি"}
              </span>
            </div>
            <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
              {t("architecture.routingText")}
            </p>
          </div>

          <div
            style={{
              padding: "12px 14px",
              borderRadius: "10px",
              background: "#F8FAFC",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <strong style={{ color: "var(--green-600)", fontSize: "13.5px" }}>
                {t("architecture.decisionTitle")}
              </strong>
              <span
                style={{
                  fontSize: "11px",
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {lang === "en" ? "Lead time: not established" : "অগ্রিম সময়: প্রতিষ্ঠিত নয়"}
              </span>
            </div>
            <p style={{ fontSize: "12.5px", color: "var(--text-secondary)", margin: 0, lineHeight: 1.6 }}>
              {t("architecture.decisionText")}
            </p>
          </div>
        </div>

        <button
          className="btn-standard btn-primary"
          style={{ width: "100%", justifyContent: "center" }}
          onClick={onClose}
        >
          {lang === "en" ? "Close" : "বুঝেছি (বন্ধ করুন)"}
        </button>
      </div>
    </div>
  );
}
