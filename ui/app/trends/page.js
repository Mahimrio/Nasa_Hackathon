"use client";

import { useEffect, useState } from "react";

import DashboardFooter from "../components/DashboardFooter";
import TrendExplorerViewer from "../components/TrendExplorerViewer";
import { useLocale } from "../hooks/useLocale";
import { fetchTrends, TREND_STATUS } from "../lib/normalizeTrends";

function OrbitVisual() {
  return (
    <svg
      className="trend-awaiting-visual"
      viewBox="0 0 104 104"
      aria-hidden="true"
      focusable="false"
    >
      <ellipse className="orbit-path" cx="52" cy="52" rx="44" ry="44" />
      <circle className="earth" cx="52" cy="52" r="20" />
      <path className="drop" d="M46 76 q2 -4 4 0 a2 2 0 0 1 -4 0z" />
      <path className="drop" d="M53 79 q2 -4 4 0 a2 2 0 0 1 -4 0z" />
      <path className="drop" d="M60 76 q2 -4 4 0 a2 2 0 0 1 -4 0z" />
      <g className="orbit">
        <rect className="sat" x="49" y="4" width="6" height="6" rx="1" />
        <rect className="sat" x="41" y="5.5" width="6" height="3" rx="0.5" opacity="0.7" />
        <rect className="sat" x="57" y="5.5" width="6" height="3" rx="0.5" opacity="0.7" />
      </g>
    </svg>
  );
}

export default function TrendsPage() {
  const { t } = useLocale();
  const [trendData, setTrendData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [previewEnabled, setPreviewEnabled] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    let active = true;

    fetchTrends({ signal: controller.signal })
      .then((normalized) => {
        if (active) setTrendData(normalized);
      })
      .catch((fetchError) => {
        if (!active || fetchError?.name === "AbortError") return;
        setError("trend_summary_unavailable");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  const isVerified = trendData?.status === TREND_STATUS.VERIFIED;
  const isDevelopment = trendData?.status === TREND_STATUS.DEVELOPMENT;
  const isInvalid = trendData?.status === TREND_STATUS.INVALID;
  const showViewer = isVerified || (isDevelopment && previewEnabled);
  const showError = Boolean(error) || isInvalid;

  return (
    <>
      <main className="dashboard-shell" id="main-content">
        <section
          className="glass-panel card-padding trend-hero"
          aria-labelledby="trend-title"
        >
          <span className="trend-eyebrow">{t("trends.eyebrow")}</span>
          <h1 id="trend-title" className="card-title trend-title">
            {t("trends.title")}
          </h1>
          <p className="trend-subtitle">{t("trends.subtitle")}</p>
          <p className="trend-intro">{t("trends.intro")}</p>

          {loading && (
            <p className="trend-loading" role="status">
              {t("trends.loading")}
            </p>
          )}

          {!loading && !showViewer && (
            <div className="trend-awaiting-state">
              <div className="trend-awaiting">
                <OrbitVisual />
                <p className="trend-awaiting-copy">
                  <strong>{t("trends.awaitingTitle")}</strong>
                  {t("trends.awaitingDetail")}
                </p>
              </div>

              <p className="trend-awaiting-body">{t("trends.awaitingBody")}</p>

              {isDevelopment && (
                <div className="trend-awaiting-actions">
                  <button
                    type="button"
                    className="btn-standard btn-primary trend-preview-btn"
                    onClick={() => setPreviewEnabled(true)}
                  >
                    {t("trends.previewButton")}
                  </button>
                  <span className="trend-awaiting-hint">
                    {t("trends.previewHint")}
                  </span>
                </div>
              )}

              {showError && (
                <p role="alert" className="trend-error">
                  <strong>{t("trends.dataUnavailable")}</strong>{" "}
                  {t("trends.dataUnavailableBody")}
                </p>
              )}
            </div>
          )}

          {showViewer && isVerified && (
            <div className="trend-notice trend-notice--verified" role="status">
              <span className="trend-notice-badge">{t("trends.verifiedBadge")}</span>
              <div>
                <strong className="trend-notice-title">
                  {t("trends.verifiedTitle")}
                </strong>
                <p className="trend-notice-body">{t("trends.verifiedBody")}</p>
              </div>
            </div>
          )}

          {showViewer && isDevelopment && (
            <div className="trend-notice trend-notice--synthetic" role="status">
              <span className="trend-notice-badge">{t("trends.previewBadge")}</span>
              <div className="trend-notice-copy">
                <strong className="trend-notice-title">
                  {t("trends.syntheticNoticeTitle")}
                </strong>
                <p className="trend-notice-body">{t("trends.syntheticNoticeBody")}</p>
              </div>
              <button
                type="button"
                className="btn-standard trend-exit-preview"
                onClick={() => setPreviewEnabled(false)}
              >
                {t("trends.previewExit")}
              </button>
            </div>
          )}
        </section>

        {showViewer && <TrendExplorerViewer data={trendData} />}
      </main>

      <DashboardFooter />
    </>
  );
}
