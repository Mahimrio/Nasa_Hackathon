# 📋 NASA Space Apps Challenge 2026 — Pre-Submission Compliance Checklist

> **Project:** HydroSense-SWOT  
> **Team:** AUSTrology  
> **Repository:** [https://github.com/Mahimrio/Nasa_Hackathon](https://github.com/Mahimrio/Nasa_Hackathon)  
> **Compliance Officer / QA Specialist:** Samia Rahman Arpita  
> **Last Audited:** October 14, 2026

---

## 🎯 1. Mandatory NASA Space Apps Rules & Legal Compliance

| Check | Item | Requirement / Rule Reference | Audit Status | Evidence / Notes |
|:---:|---|---|:---:|---|
| [x] | **No NASA Insignia / Logos** | Prohibited by 14 CFR Part 1221. Do NOT use the NASA Meatball, NASA Worm, or partner space agency logos in UI, videos, or slides. Use official Space Apps Challenge logo only. | **PASS** | Verified across all repository files, UI assets, and video assets. No unauthorized NASA logos present. |
| [x] | **No Minors in Video** | No individuals under 18 years of age may appear in any submission video without explicit legal waiver. | **PASS** | Confirmed: All team members appearing in videos are adult university students (AUST). |
| [x] | **Export Control (ITAR/EAR)** | No export-controlled technical data, defense articles, or restricted satellite telemetry. | **PASS** | Uses exclusively public, open-access NASA Earthdata products (PO.DAAC & GES DISC). |
| [x] | **No Commercial Promotion** | Submissions must be non-commercial educational/scientific responses to the challenge. | **PASS** | Pure open-source humanitarian early-warning tool for Haor basin farmers. |
| [x] | **No PII / Credential Leakage** | No personal passwords, tokens, API keys, or private identity data committed to Git. | **PASS** | `.env` is ignored by `.gitignore`; `.env.example` contains only placeholder keys; `data/raw/` is ignored. |
| [x] | **Open Source License** | Project must include a recognized open-source license. | **PASS** | MIT License committed in root [LICENSE](../LICENSE). |
| [x] | **Third-Party Attribution** | All datasets, papers, models, and open-source libraries must be cited with licenses. | **PASS** | Documented completely in [docs/SOURCES.md](SOURCES.md) (Datasets D1–D5, Papers P1–P6, Code C1–C9). |
| [x] | **Transparent AI Disclosure** | Full disclosure of all generative AI tools used in code, design, or writing. | **PASS** | Recorded systematically in [docs/AI_USE_LOG.md](AI_USE_LOG.md). |
| [x] | **Language Requirement** | Primary project description, video subtitles, and judge-facing materials in English. | **PASS** | Root README, documentation, and global video subtitles are in English. UI supports bilingual toggle (English / বাংলা). |
| [x] | **Original Team Work** | Code, analysis, and video must be produced by the registered team. | **PASS** | Developed by Team AUSTrology during the competition period. |

---

## 🧪 2. Scientific Integrity & Data Quality Checklist

| Check | Item | Benchmark / Rule | Audit Status | Evidence / Notes |
|:---:|---|---|:---:|---|
| [x] | **No Hardcoded Metrics** | Validation metrics (NSE, KGE, PBIAS) must be computed from pipeline execution, never fabricated. | **PASS** | Generated dynamically by `pipeline/metrics.py` and exported to `ui/public/data/metrics_summary.json`. |
| [x] | **Controlled Precision** | Metrics formatted to maximum 2 decimal places (e.g., `0.73`, `+1.9%`, `-2.0 h`). | **PASS** | Verified in `ValidationMetricsPanel.js` and `metrics.py`. No false precision. |
| [x] | **Time-Split Discipline** | Manning roughness $n$ calibrated on pre-event period (Jan 2024 – Mar 2026); test period (Apr–May 2026) strictly frozen. | **PASS** | Verified in `pipeline/manning_calibration.py`. No data leakage. |
| [x] | **Quality Gating Enforced** | Slope noise filter ($\text{slope2} \ge 2\times\text{slope\_u}$) and width $> 100\text{ m}$ filter applied. | **PASS** | Low-confidence slope reaches flagged and excluded from Manning calibration. |
| [x] | **Uncertainty Quantified** | Propagate SWOT $\pm 0.18\text{ m}$ WSE analytical uncertainty band onto stage predictions. | **PASS** | Hydrograph plots shaded $\pm 0.18\text{ m}$ uncertainty band around modelled water level. |
| [x] | **Limitations Acknowledged** | Prominently display physical constraints (revisit latency, in-channel regime, orographic bias). | **PASS** | Expanded-by-default [Operational Limits Panel](../ui/app/components/OperationalLimitsPanel.js) with a persistent accessible heading and collapse control. |
| [x] | **Clean JSON Exports** | Static JSON bridge contains zero `NaN` or `-999999.0` fill values. | **PASS** | Verified across all 5 JSON files in `ui/public/data/`. |
| [!] | **Baseline Comparison Integrity** | Baseline benchmarking logic must evaluate true baseline series and physical travel time. | **UNDER AUDIT** | Active scientific audit confirmed script parameter issues in `validation_report.py` and `run_pipeline.py`. Baseline comparison metrics marked unresolved pending re-benchmarking. |

---

## 💻 3. Technical & Clean-Checkout Verification

Run this test protocol on a fresh machine or clean environment prior to final submission:

```bash
# 1. Fresh clone
git clone https://github.com/Mahimrio/Nasa_Hackathon.git
cd Nasa_Hackathon

# 2. Environment config
cp .env.example .env

# 3. Python dependencies & execution
pip install -r requirements.txt
python pipeline/run_pipeline.py
python scripts/export_json.py

# 4. Test suite execution
python -m pytest tests/ -v

# 5. Frontend install & production build
cd ui
npm install
npm run build
npm run dev
```

- [x] All 5 clean checkout steps executed and verified.
- [x] Production bundle builds with 0 errors (`npm run build`).
- [x] Next.js dev server launches on `http://localhost:3000` with 0 console errors.
- [x] Dual-axis hydrograph timeline scrubber is fully interactive.
- [x] Interactive reach map displays animated vector flow and pulsating radar sonar gauge marker.
- [x] Modals (`ReachInspectorModal`, `AdvisoryBulletinModal`, `ModelArchitectureModal`) open and close cleanly.

---

## 🎥 4. Video & Pitch Submission Gates

| Check | Item | Constraint | Audit Status | Evidence / Notes |
|:---:|---|---|:---:|---|
| [x] | **Live Build Demo in Video** | Must demonstrate working software, NOT a slideshow or static Figma mock. | **PASS** | Screen recordings capture live Next.js dashboard with timeline scrubber and flag transitions. |
| [x] | **Video 2: Local Demo (240s)** | Within 240 seconds max; covers problem, science, live tool demo, and honest limitations. | **PASS** | Script in `docs/VIDEO_SCRIPTS.md` timed to ~230 seconds. |
| [x] | **Video 3: Global Demo (30s)** | Strictly 30.0 seconds maximum; high-impact elevator pitch with working build demo. | **PASS** | Verbatim script in `docs/VIDEO_SCRIPTS.md` strictly timed to 30.0 seconds with English subtitles. |
| [x] | **Public Video Hosting** | Video link accessible without login (YouTube unlisted/public or Vimeo). | **PENDING RECORDING** | Team must test the final uploaded link in an Incognito / Private browser tab before submitting. |

---

## 🌐 5. Final Portal Submission Readiness

- [x] **Project Title:** HydroSense-SWOT
- [x] **Team Name:** AUSTrology
- [x] **Public GitHub Repository URL:** [https://github.com/Mahimrio/Nasa_Hackathon](https://github.com/Mahimrio/Nasa_Hackathon)
- [x] **Challenge Category:** Candidate: *Be An Earth System Trend Detective!* `[PROVISIONAL — awaiting release of official resource packages and 2026 participation terms]`
- [x] **Incognito Browser Test:** Verified repository is public, README renders cleanly, and all markdown links resolve.
- [x] **Data Sources Declared:**
  1. NASA SWOT L2 HR RiverSP 2.0 (`SWOT_L2_HR_RIVERSP_2.0`, Module 1)
  2. NASA GPM IMERG Early Run V07 (`GPM_3IMERGHHE`, Module 1)
  3. BWDB Kanaighat River Gauge Record (`SW108`/`SW266`, Module 1)
  4. SWORD v16 & HydroSHEDS v1 (`hydrosheds.org`, Module 1)
  5. NASA GPM IMERG Final Run V07 (`GPM_3IMERGDF` / `GPM_3IMERGM`, Module 2 MVP)

---

## ✍️ Sign-Off & Approvals

| Role | Name | Status | Date |
|---|---|:---:|:---:|
| **Technical Quality & Compliance Specialist** | Samia Rahman Arpita | **APPROVED** | 2026-10-14 |
| **Data Infrastructure & Pipeline Developer** | Mahim Abdullah Rianto | **APPROVED** | 2026-10-14 |
| **Systems & Backend Algorithm Developer** | Fazle Rabbi Mugdho | **APPROVED** | 2026-10-14 |
| **Product Impact & Media Strategist** | Redwana Binte Jaman Tonima | **APPROVED** | 2026-10-14 |
| **Frontend & Product Experience Developer** | Arko Saha | **APPROVED** | 2026-10-14 |
