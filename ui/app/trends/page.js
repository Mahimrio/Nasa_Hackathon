"use client";

import { useEffect, useState } from "react";
import AppHeader from "../components/AppHeader";
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
      <AppHeader currentDateStr="—" currentTimeStr="—" onOpenBulletin={() => {}} onOpenModelInfo={() => {}} />
      <main className="dashboard-shell" id="main-content">
        <section className="glass-panel card-padding" aria-labelledby="trend-title">
          <h1 id="trend-title" className="card-title">{title}</h1>
          <p>This module analyzes verified NASA GPM IMERG Final daily data only. It computes cell-first April–May precipitation total and days ≥50 mm, then reports Theil–Sen slopes and modified Mann–Kendall inference.</p>
          {error && <p role="alert"><strong>{lang === "bn" ? "তথ্য অনুপলব্ধ:" : "Data unavailable:"}</strong> {error} Upload or ingest a provenance-verified REAL IMERG Final extract; no synthetic trend result is shown.</p>}
          {result && <pre aria-label="Trend analysis result">{JSON.stringify(result, null, 2)}</pre>}
          <p>Trend findings describe historical change only. They do not predict individual floods or validate the flood-warning model.</p>
        </section>
      </main>
      <DashboardFooter />
    </>
  );
}
