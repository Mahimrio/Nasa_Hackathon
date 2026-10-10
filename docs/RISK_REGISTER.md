# RISK REGISTER — HydroSense-SWOT

This risk register guards against the technical traps, vibe-coding errors, and hackathon failure modes cataloged in `SOLUTION_ARCHITECTURE.md v3.0` and `STEERING_GUIDE_FINAL.md`.

---

| # | Risk Description | Early Warning Sign | Built-in Safeguard | Owner | Status |
|---|---|---|---|---|---|
| **R-01** | **SWOT slope noise exceeding physical signal** (Surma slope $\approx 10^{-5}$) | Negative or absurdly large Manning discharge; unphysical $n$ values | Explicit filter: $\text{slope2} > 2 \times \text{slope\_u}$ and $\text{slope2} > 10^{-5}\text{ m/m}$. Unreliable reaches dropped or hatched on map. | R3 Hydrology | **ACTIVE / MITIGATED** |
| **R-02** | **Manning $n$ optimizer escaping physical boundaries** | Scipy returns $n < 0.025$ or $n > 0.10$ | Enforced `scipy.optimize.minimize_scalar(..., bounds=(0.025, 0.10), method='bounded')` with assertion test. | R3 Hydrology | **RESOLVED & TESTED** |
| **R-03** | **IMERG orographic precipitation overestimation** | Flash flood alert triggers too early or produces false positives | Stated transparently in Limits Panel; calibration against downstream gauge absorbs systematic bias; PBIAS reported. | R3 Hydrology | **MITIGATED** |
| **R-04** | **Timezone double-conversion (BST to UTC shifted twice)** | Timestamps shifted by 12 hours (`BST-12`); peak misaligned | Localize to UTC once at ingestion: `pd.to_datetime(..., utc=True)`. Assert all timestamps are timezone-aware. | R4 Data | **RESOLVED & TESTED** |
| **R-05** | **SWOT Reach ID float64 truncation** (11-digit integer truncated in CSV) | `22211000011` becomes `2.2211e+10`, dropping the last reach digit | Explicitly specify `dtype={'reach_id': str}` in all file readers. Never store reach IDs as floats. | R4 Data | **RESOLVED & TESTED** |
| **R-06** | **Sentinel fill values (`-999999.0`) treated as valid WSE** | Absurd negative depths; mean stage drops to negative hundreds | Custom sanitizer replacing all values $\le -9990.0$ with `np.nan` prior to any calculation. | R4 Data | **RESOLVED & TESTED** |
| **R-07** | **Venue WiFi outage during demo or judging** | Live API fails with timeout / 401 / 429 during presentation | Architecture enforces offline fixtures first (`data/fixtures/`). Pipeline operates 100% offline with zero live network reliance. | R5 Backend | **RESOLVED & TESTED** |
| **R-08** | **Team over-claiming SWOT as "real-time flood predictor"** | Presenter claims SWOT warns in real-time; judges penalize Validity | Permanent Limits Panel on UI states SWOT is 21-day orbit and provides offline geometry; lead time comes from IMERG rainfall routing. | R8 Storyteller | **MITIGATED IN SCRIPT** |
| **R-09** | **Over-precision on performance metrics signaling fake data** | Displaying metrics with 6 decimals (e.g. `NSE = 0.742918`) | Formatted explicitly to 2 decimal places (`f"{nse:.2f}"`) in all UI widgets and scripts. | R9 Compliance | **RESOLVED & TESTED** |
| **R-10** | **Uncited third-party data or missing license** | Judge checks repo, finds missing license or citations; nomination revoked | MIT License file in repo; comprehensive `SOURCES.md` claims ledger; References block on NASA project page. | R9 Compliance | **MITIGATED** |
