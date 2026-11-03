"use client";

import { useLocale } from "../hooks/useLocale";
import HydroSenseLogo from "./HydroSenseLogo";

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
              <HydroSenseLogo />
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
