# Public Claims Ledger, Limitations Register & Negative-Results Report

**Document ID:** `docs/evidence/claims_ledger_and_limitations.md`  
**Gate:** Gate 1, Gate 4, Gate 8 (Public claims bounded by evidence)  
**Date:** 2026-10-24  
**Status:** `VERIFIED`  

---

## 1. Public Claims Ledger (Audit & Disposition)

Every numerical figure and performance assertion appearing in project documentation, README, and video scripts was audited against reproducible code outputs:

| Claimed Assertion | Original Location | Stated Number / Claim | Current Audit Finding | Claim Disposition |
|---|---|---|---|---|
| **April 2026 Boro Rice Loss** | Problem Statement & Pitch | ~214,000 tonnes lost; ~230,000 farmers affected | Secondary citation (Think Global Health / Daily Star). Historical disaster context. | **RETAIN AS CONTEXTUAL MOTIVATION** (Citing primary press sources). |
| **2017 Sunamganj Crop Damage** | Problem Statement & Pitch | 149,224 ha affected in Sunamganj | Peer-reviewed citation (J. Environ. Sci. & Nat. Resour. 2019). | **VERIFIED** (Cited in `docs/SOURCES.md`). |
| **Model NSE Performance** | README & Dashboard | NSE `0.74` | Computed directly from synthetic fixture simulation (`tests/test_validation_real.py`). | **RE-LABELED AS SYNTHETIC SCENARIO ONLY** (Never cited as real-world forecast skill). |
| **Model KGE Performance** | README & Dashboard | KGE `0.69` | Computed directly from synthetic fixture simulation. | **RE-LABELED AS SYNTHETIC SCENARIO ONLY**. |
| **Model PBIAS Performance** | README & Dashboard | PBIAS `+1.7%` | Computed directly from synthetic fixture simulation. | **RE-LABELED AS SYNTHETIC SCENARIO ONLY**. |
| **Warning Lead Time** | README & Dashboard | Prior claim: ~22.5h lead time | Re-evaluated. Without an operational NWP forecast feed, retrospective hindcasts cannot prove operational lead time. | **WITHDRAWN; REPLACED WITH N/A** (Disclosed transparently as requiring operational forecast feed). |
| **Baseline NSE Comparison** | README & Dashboard | Baseline NSE `-0.14` | Recomputed directly using 6h unrouted rolling accumulation benchmark on identical holdout samples. | **VERIFIED ON FIXTURE DATA**. |
| **SWOT Continuous Monitoring** | Pitch Drafts | "SWOT tracks rivers continuously" | Factually false. SWOT has a 21-day orbit cycle and ~2 passes per cycle in the tropics. | **WITHDRAWN** (SWOT is strictly used for offline geometry calibration). |
| **2D Floodplain Inundation** | Project Ideation | "Predicts 2D embankment overtopping" | Unimplemented and out of scope. 1D channel stage routing cannot model 2D hydrodynamic flow. | **EXCLUDED FROM SCOPE** (Disclosed in Scope OUT). |

---

## 2. Permanent Scientific Limitations Register

The following fundamental physical and operational limitations are documented in the code, exports, and UI:

1. **Synthetic Offline Fixtures:** The checked-in NetCDF and CSV files are procedurally generated test cases. They are not NASA or BWDB observations and cannot validate forecast accuracy.
2. **Offline Parameterization Only:** SWOT RiverSP satellite measurements parameterize channel geometry ($W$, $y$, $S_0$) and effective roughness ($n$) offline. SWOT cannot provide real-time river gauging.
3. **No 2D Floodplain Hydrodynamics:** The Muskingum-Cunge engine models 1D river corridor routing. It does not model complex backwater hydraulics, embankment breaching geomechanics, or 2D haor floodplain inundation.
4. **Rainfall Trend Decoupling:** Climatological rainfall trends detected in Module 2 provide historical climatological context. They do not predict individual storm events, do not forecast flood crests, and do not improve real-time routing accuracy.
5. **Advisory Decision Support Only:** The Harvest Decision Flag (GREEN / AMBER / RED) is an advisory tool for Upazila Agriculture Officers. It is not an official government evacuation order.

---

## 3. Negative and Null Results Report

In scientific modeling, reporting null findings and parameter limits is essential for credibility:
1. **Unconstrained Manning Roughness Failure:** Without bounding $n \in [0.025, 0.100]$, least-squares optimization on noisy SWOT slopes produced unphysical values ($n < 0.015$ or $n > 0.14$), proving that unconstrained optimization fails on alluvial border rivers.
2. **Single-Reach Instability:** Attempting to route flood waves across the entire 140 km corridor in a single Muskingum step produced negative routing coefficients ($C_0 < 0$), causing spurious premature drops in water level before rising. Discretizing into 4 sub-reaches was strictly required to restore stability.
3. **Low-Flow Roughness Overestimation:** Calibrating roughness across all seasonal passes including low-flow dry seasons ($WSE \le z_{\text{bed}} + 0.5\text{m}$) overestimated effective flood roughness by $>35\%$, demonstrating that stage-dependent filtering is mandatory in alluvial regimes.
