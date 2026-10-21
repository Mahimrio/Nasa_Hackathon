"use client";

import { useLocale } from "../hooks/useLocale";

export default function PageContextBar({
  reaches,
  selectedReachId,
  setSelectedReachId,
  onJumpToSlider,
  peakIdx,
  eventDataLength,
}) {
  const { lang, t } = useLocale();

  return (
    <section className="page-context-strip" aria-label="Dashboard Context">
      <div className="page-title-block">
        <h1 className="page-title">
          {t("contextBar.title")}
          <span className="brand-badge" style={{ fontSize: "12px", padding: "3px 8px" }}>
            {t("contextBar.haorBasinBadge")}
          </span>
        </h1>
        <p className="page-subtitle">
          {t("contextBar.subtitle")}
        </p>
      </div>

      <div className="context-controls-block">
        {/* Quick Event Navigation Presets */}
        <div className="quick-preset-chips" role="group" aria-label="Event Timeline Presets">
          <span style={{ fontSize: "12px", color: "var(--text-secondary)", paddingLeft: "6px" }}>
            {t("contextBar.jumpToLabel")}
          </span>
          <button
            className="preset-chip"
            onClick={() => onJumpToSlider(0)}
            title="April 1, 2026 — Pre-event baseline stage"
          >
            {t("contextBar.jumpStart")}
          </button>
          <button
            className="preset-chip"
            onClick={() => onJumpToSlider(Math.max(0, peakIdx - 72))}
            title="Heavy Meghalaya orographic rainfall onset"
          >
            {t("contextBar.jumpRainOnset")}
          </button>
          <button
            className="preset-chip active"
            onClick={() => onJumpToSlider(peakIdx)}
            title="Flood Wave Peak Stage at Kanaighat"
            style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden="true">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span>{t("contextBar.jumpPeak")}</span>
          </button>
          <button
            className="preset-chip"
            onClick={() => onJumpToSlider(Math.min(eventDataLength - 1, peakIdx + 96))}
            title="Falling limb recession"
          >
            {t("contextBar.jumpRecession")}
          </button>
        </div>

        {/* Selected Reach Selector */}
        {reaches && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <label htmlFor="reach-selector" className="sr-only">
              {t("contextBar.reachSelectAria")}
            </label>
            <select
              id="reach-selector"
              className="btn-standard neu-inset"
              value={selectedReachId}
              onChange={(e) => setSelectedReachId(e.target.value)}
              style={{
                fontSize: "12px",
                padding: "6px 12px",
                borderRadius: "var(--radius-pill)",
                cursor: "pointer",
                maxWidth: "240px",
              }}
              aria-label={t("contextBar.reachSelectAria")}
            >
              {reaches.map((r) => (
                <option key={r.reach_id} value={r.reach_id}>
                  {lang === "en" ? r.name : r.name_bn}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </section>
  );
}
