"use client";

import { useLocale } from "../hooks/useLocale";

const DATA_SOURCES = [
  { name: "NASA SWOT", detail: "footer.swotDetails" },
  { name: "NASA GPM IMERG", detail: "footer.imergDetails" },
  { name: "BWDB", detail: "footer.gaugeDetails" },
];

export default function DashboardFooter() {
  const { t } = useLocale();

  return (
    <footer className="dashboard-footer" role="contentinfo">
      <div className="dashboard-footer-inner">
        <div className="footer-identity">
          <div className="footer-brand-lockup">
            <span className="footer-brand-mark" aria-hidden="true">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 3.25 5.9 11.3a4.8 4.8 0 0 0 3.83 7.7h4.54a4.8 4.8 0 0 0 3.83-7.7L12 3.25Z" />
                <path d="M8.1 14.7c1.05-.72 2.1-.72 3.15 0 1.06.72 2.12.72 3.18 0" />
              </svg>
            </span>
            <span className="footer-brand-copy">
              <strong>HydroSense-SWOT</strong>
              <span>{t("contextBar.title")}</span>
            </span>
          </div>
          <p className="footer-summary">{t("contextBar.subtitle")}</p>
        </div>

        <section className="footer-provenance" aria-labelledby="footer-provenance-title">
          <h2 id="footer-provenance-title">{t("footer.dataProvenance")}</h2>
          <ul className="footer-source-list">
            {DATA_SOURCES.map((source) => (
              <li className="footer-source-item" key={source.name}>
                <strong>{source.name}</strong>
                <span>{t(source.detail)}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="footer-meta">
          <span>{t("footer.challengeContext")}</span>
        </div>
      </div>
    </footer>
  );
}
