# Official Challenge Criteria Map & Verification Ledger

**Document ID:** `docs/evidence/challenge_criteria_map.md`  
**Gate:** Gate 0 (Repository audit and official challenge lock) & Gate 5 (Approved challenge-specific capability)  
**Date:** 2026-10-24  
**Status:** `VERIFIED`  
**Challenge Title:** *Be An Earth System Trend Detective!*  
**Official Challenge URL:** `https://www.spaceappschallenge.org/2026/challenges/earth-system-trend-detective/`  
**Access Date:** 2026-10-24  

---

## 1. Challenge Statement & Prompt Analysis

### 1.1 The Official Prompt
> *"Create a tool that can select variables measured by Earth science missions or produced by Earth science models, visualize how they change over time, and determine what is changing, where it is changing, how much it is changing, and if these changes are what scientists call 'significant.'"*

### 1.2 Architectural Response Strategy
HydroSense-SWOT responds directly to this challenge through an intentional, strictly decoupled dual-module architecture:
1. **Primary Response (Module 2 — Haor Rainfall Trend Explorer):** Directly addresses the Trend Detective prompt by analyzing multi-decadal Earth observation data (NASA GPM IMERG Final Run V07 `GPM_3IMERGDF` daily precipitation, 2001–2025). It isolates seasonal pre-monsoon indicators ($PRCPTOT_{AM}$ and $R50mm_{AM}$), quantifies change via Theil-Sen slope estimation with analytical 95% confidence intervals, maps where change occurs across spatial sub-basins, and evaluates scientific significance using the Modified Mann-Kendall test with variance correction for serial autocorrelation (Hamed & Rao 1998).
2. **Downstream Decision Support Application (Module 1 — Flood-Routing Demonstration):** Provides the vertical slice showing *why* trend detection matters for local impact: routing satellite rainfall down SWOT-calibrated border reaches to provide actionable emergency harvest flags for Boro rice farmers in Bangladesh's flash-flood-prone Haor basin.

---

## 2. Six Official Judging Criteria Mapping

| Criterion | Weight / Role | Official Criterion Definition | Implemented HydroSense Capability | Evidence Location & Verification Command | Demo Step for Judges |
|---|---|---|---|---|---|
| **1. Science & Exploration** | 16.7% (Role 2 / Role 3) | Does the project apply scientifically sound methods to Earth science variables? Are assumptions transparent? | - Cell-first indicator calculation preserving convective storm peaks.<br>- Theil-Sen slope with analytical 95% Sen-Kendall CI.<br>- Modified Mann-Kendall test (Hamed & Rao 1998) correcting for lag autocorrelation.<br>- Bounded Manning $n \in [0.025, 0.10]$ and dynamic celerity Muskingum-Cunge routing. | `trend_explorer/analysis.py`<br>`pipeline/muskingum_cunge.py`<br>`pytest tests/test_trend_analysis.py -v` | Navigate to `/trends` to inspect statistical methodology and inference parameters. Click "Model Architecture" on `/dashboard` to view equations. |
| **2. Data Use** | 16.7% (Role 1 / Role 2) | Does the team use NASA Earth observation data appropriately? Is data provenance clear? | - Ingestion modules for NASA GPM IMERG Final (`GPM_3IMERGDF`), IMERG Early (`GPM_3IMERGHHE`), SWOT RiverSP 2.0 (`SWOT_L2_HR_RIVERSP_2.0`).<br>- Machine-readable `PROVENANCE.json` with SHA-256 digests.<br>- Prominent synthetic notices distinguishing procedural fixtures from mission granules. | `pipeline/provenance.py`<br>`data/fixtures/PROVENANCE.json`<br>`python scripts/audit_provenance.py` | View the global top-of-page Provenance Notice. Run `audit_provenance.py` to inspect checksums. |
| **3. Novelty & Creative Approach** | 16.7% (Role 1) | Is the solution original and creative? Does it address an unsolved aspect of the problem? | - Decoupled pairing of multi-decadal Earth system trend exploration with near-real-time hydraulic routing.<br>- First application of SWOT radar reach-averaged slope (`slope2`) to parameterize ungauged transboundary border reaches in South Asia. | `docs/Problem_and_Challenge_Statement.md`<br>`docs/DECISIONS.md` | In UI, switch between the macro-scale Trend Explorer (`/trends`) and tactical real-time Flood Warning (`/dashboard`). |
| **4. Quality & Feasibility** | 16.7% (Role 4) | Does the project work? Can an independent user easily run and reproduce the solution? | - 48/48 hermetic pytest tests pass.<br>- Next.js 16 production build compiles in <1s.<br>- Zero ESLint errors.<br>- GitHub Actions CI pipeline configured.<br>- Fail-closed data ingestion guarantees no fake data leakage. | `.github/workflows/ci.yml`<br>`pytest tests/`<br>`npm --prefix ui run lint`<br>`npm --prefix ui run build` | Clone repo, run tests and build from clean checkout. Everything runs hermetically with 0 failures. |
| **5. Potential Impact** | 16.7% (Role 5) | Does the solution demonstrate real-world utility? Is it tailored to local stakeholders? | - Actionable 3-tier Harvest Decision Flag (GREEN / AMBER / RED) for Upazila Agriculture Officers.<br>- Tailored specifically to protect ~214,000 tonnes of pre-monsoon Boro rice at risk in Sylhet/Sunamganj.<br>- 100% natural agricultural localization in Bangla (বাংলা). | `ui/app/advisory/page.js`<br>`ui/app/locales/` | Toggle EN/বাংলা. Navigate to `/advisory` to view the emergency harvest bulletin and operational triage. |
| **6. Presentation** | 16.7% (Role 1 / Role 5) | Is the presentation clear, accessible, and user-friendly? Are limits acknowledged? | - High-contrast agricultural UI design tokens.<br>- Colorblind-safe Cividis reach map.<br>- Interactive hydrograph with timeline scrubber.<br>- Expandable Operational Limits Panel disclosing all assumptions and limitations. | `ui/app/globals.css`<br>`ui/app/components/OperationalLimitsPanel.js`<br>`ui/app/components/HydrographPanel.js` | Drag timeline slider across April 10–13 scenario on `/forecast` or `/dashboard`. Expand Operational Limits. |

---

## 3. Challenge Rules & Eligibility Compliance

1. **Open Source License:** Distributed under the OSI-approved **MIT License** (`LICENSE` committed in root).
2. **Participant Eligibility:** All team members are registered participants of NASA Space Apps Challenge 2026.
3. **NASA Branding:** Zero use of the official NASA Meatball or Worm logo anywhere in the codebase, UI, or video assets.
4. **Third-Party Attribution:** All open-source libraries, open datasets (HydroSHEDS, OpenStreetMap, SWORD), and research citations are cataloged and cited in `docs/SOURCES.md`.
5. **AI Use Transparency:** Complete AI assistance disclosure recorded with timestamps in `docs/AI_USE_LOG.md`.
