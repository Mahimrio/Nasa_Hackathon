# Leakage Prevention, Causal Flag Logic & Lead-Time Audit

**Document ID:** `docs/evidence/leakage_prevention_and_lead_time_trace.md`  
**Gate:** Gate 4 (Leakage-free evaluation and forecast verification) & `SYNTHETIC_DATA.md` Requirement 7  
**Date:** 2026-10-24  
**Status:** `VERIFIED`  
**Audit Findings:** Prior hindsight look-ahead flaw resolved; future lookahead strictly rejected in code.  

---

## 1. Audit of the Prior Lookahead Defect & Resolution

### 1.1 The Prior Defect
In earlier revisions of `pipeline/harvest_flag.py`, harvest decision flags were evaluated by scanning forward into the modeled stage series using a rolling lookahead window:
```python
# DEFECTIVE LEGACY IMPLEMENTATION:
# Scanning into future modeled stages generated from the entire rainfall dataset
future_window = df['modelled_stage'].iloc[i : i + lead_steps]
if future_window.max() >= danger_level:
    flag = "RED"
```
Because the modeled stage series was computed by routing the entire multi-week rainfall timeseries, scanning ahead into future modeled values allowed information from future rainfall to influence current flags. For an operational decision tool, this represents severe **hindsight leakage**.

### 1.2 The Corrected Causal Formulation
In `pipeline/harvest_flag.py`, future lookahead was eliminated:
1. `lead_steps > 0` now raises an explicit `ValueError`:
   ```python
   if lead_steps > 0:
       raise ValueError("Future look-ahead is not permitted for operational hazard flags. "
                        "Flags must evaluate current causal state or issue-time forecast products.")
   ```
2. Operational flags evaluate strictly current-state modeled water surface elevation ($WSE_t$):
   - **`GREEN`**: Current modeled stage $WSE_t < 11.50\text{ m PWD}$ (Normal condition).
   - **`AMBER`**: Current modeled stage $11.50\text{ m} \le WSE_t < 13.20\text{ m PWD}$ (Approaching danger level; alert agriculture extension).
   - **`RED`**: Current modeled stage $WSE_t \ge 13.20\text{ m PWD}$ (Danger level breached; initiate emergency harvesting).
3. The resulting flags are strictly causal and tagged with attribute:
   ```python
   df.attrs["forecast_status"] = "retrospective causal classification (no future look-ahead)"
   ```

*Test Verification:* Verified in `tests/test_provenance_and_leakage.py::test_operational_flags_reject_future_lookahead_and_are_causal`.

---

## 2. Lead Time Interpretation & Disclosure Policy

In `pipeline/metrics.py`, lead time computation was audited:
- Lead time is mathematically defined as:
  $$\text{Lead Time} = t_{\text{observed danger breach}} - t_{\text{observable alert trigger}}$$
- In an operational setting, this requires an **issue-time forecast product** issued at time $t$ predicting future states $t + \Delta t$.
- In the absence of an operational issue-time numerical weather prediction (NWP) feed, computing a lead time from a retrospective hindcast produces a misleading measure of warning skill.
- Therefore, in all public metric exports (`ui/public/data/metrics_summary.json`), `lead_time_h` is explicitly assigned **`null`** and formatted as **`"N/A"`**.
- The `warning_lead_status` field is set to `"operational forecast required"`.

---

## 3. Timeline Event Trace (April 2026 Scenario Replay)

The table below traces the causal progression during the April 10–14 peak scenario in the synthetic test fixture:

| UTC Timestamp | 30-min Rainfall Pulse | Simulated Stage ($WSE_t$) | Observed Stage ($WSE_{\text{obs}, t}$) | Causal Harvest Flag | Operational Advisory Status |
|---|---|---|---|---|---|
| `2026-04-11 12:00Z` | $1.2\text{ mm/hr}$ | $7.85\text{ m}$ | $7.72\text{ m}$ | **GREEN** | Normal monitoring |
| `2026-04-12 06:00Z` | $38.0\text{ mm/hr}$ (Storm center) | $8.40\text{ m}$ | $7.95\text{ m}$ | **GREEN** | Heavy rain detected in Meghalaya |
| `2026-04-12 18:00Z` | $4.5\text{ mm/hr}$ | $11.65\text{ m}$ | $10.80\text{ m}$ | **AMBER** | Flood surge entering corridor; caution advised |
| `2026-04-13 08:00Z` | $0.2\text{ mm/hr}$ | $13.25\text{ m}$ | $13.10\text{ m}$ | **RED** | Danger level ($13.20\text{m}$) breached; emergency cut triggered |
| `2026-04-13 14:00Z` | $0.0\text{ mm/hr}$ | $13.80\text{ m}$ (Peak) | $13.95\text{ m}$ (Peak) | **RED** | Peak flood crest; field embankments inundated |
| `2026-04-14 06:00Z` | $0.0\text{ mm/hr}$ | $12.40\text{ m}$ | $12.85\text{ m}$ | **AMBER** | Flood recession in progress |

At no point in this sequence does the flag logic inspect data after the current row's timestamp.
