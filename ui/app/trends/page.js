"use client";

import { useEffect, useState } from "react";

import DashboardFooter from "../components/DashboardFooter";
import { useLocale } from "../hooks/useLocale";

export default function TrendsPage() {
  const { lang } = useLocale();
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    fetch("/data/trend_summary.json").then((r) => {
      if (!r.ok) throw new Error("No verified trend analysis is available.");
      return r.json();
    }).then(setResult).catch((err) => setError(err.message));
  }, []);
  const title = lang === "bn" ? "বৃষ্টিপাত প্রবণতা অনুসন্ধান" : "Rainfall Trend Explorer";
  return (
    <>

      <main className="dashboard-shell" id="main-content">
        <section className="glass-panel card-padding" aria-labelledby="trend-title">
          <h1 id="trend-title" className="card-title">{title}</h1>
          <p>This module analyzes verified NASA GPM IMERG Final daily data only. It computes cell-first April–May precipitation total and days ≥50 mm, then reports Theil–Sen slopes and modified Mann–Kendall inference.</p>
          {!result && (
            <div className="trend-awaiting">
              <svg className="trend-awaiting-visual" viewBox="0 0 104 104" aria-hidden="true" focusable="false">
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
              <p className="trend-awaiting-copy">
                <strong>{lang === "bn" ? "যাচাইকৃত ইনপুটের অপেক্ষায়" : "Awaiting verified input"}</strong>
                {lang === "bn"
                  ? "NASA GPM IMERG Final V07 · দৈনিক · ১৯৯৮–২০২৫ · এপ্রিল–মে"
                  : "NASA GPM IMERG Final V07 · daily · 1998–2025 · April–May"}
              </p>
            </div>
          )}
          {error && <p role="alert"><strong>{lang === "bn" ? "তথ্য অনুপলব্ধ:" : "Data unavailable:"}</strong> {error} Upload or ingest a provenance-verified REAL IMERG Final extract; no synthetic trend result is shown.</p>}
          {result && <pre aria-label="Trend analysis result">{JSON.stringify(result, null, 2)}</pre>}
          <p>Trend findings describe historical change only. They do not predict individual floods or validate the flood-warning model.</p>
        </section>
      </main>
      <DashboardFooter />
    </>
  );
}
