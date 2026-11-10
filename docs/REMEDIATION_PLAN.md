# Remediation Plan — Closing the Low-Score Gaps

**Status:** `PROPOSED` · **Created:** 2026-11-10 · **Scope:** Module 1 scientific integrity, front-end QA, CI honesty, submission framing
**Target outcome:** raise the audit score from **6.3/10 → 8.0+** without adding scope.
**Principle:** most fixes are *deletions* and *disclosures*, not new features. Where a claim cannot be supported, the fix is to stop making it, not to model around it.

---

## 0. Correction to the previous audit

One earlier finding is **no longer true** and must not be repeated:

| Previously reported | Current verified state |
|---|---|
| `data/processed/calibration_results.json` stale: 2 reaches, n=0.025 at bound, z_bed 9.5 m, 8 passes, RMSE 637 | **Regenerated.** 4 reaches, n=0.0301–0.0321, z_bed 4.89–6.88 m, 65–71 passes, RMSE 451.84–498.68, and it now self-labels `"provenance": "SYNTHETIC_DEMO"` |

The `SYNTHETIC_DEMO` tag is a genuine improvement — keep it, and make it machine-enforced (see T-4.3).

---

## 1. Findings register

Severity: **S1** = ends the Q&A / blocks credibility · **S2** = erodes trust when found · **S3** = polish.

| ID | Sev | Finding | Evidence (file:line) | Current status |
|---|---|---|---|---|
| **F-1** | S1 | Calibration target is a hardcoded constant, in two modules | `pipeline/manning_calibration.py:220`, `pipeline/calibration_diagnostics.py:87` | Open |
| **F-2** | S1 | Calibration is not an inference — it is a unit conversion (see §2.1) | Derived from `Q ∝ 1/n` + constant target | Open |
| **F-3** | S1 | Bed elevation = minimum observed WSE, not a datum | `manning_calibration.py:193`, `:310` | Open |
| **F-4** | S1 | Routing coefficients are non-physical (C1 = −0.268); Δt outside the Muskingum validity window | `muskingum_cunge.py:51–61`, defaults at `:86–89` | Open |
| **F-5** | S1 | Docstring claims Courant ≈ 1; actual = **0.0771** (13× off) | `muskingum_cunge.py:15`, `:104` | Open |
| **F-6** | S1 | `metrics.py` docstring asserts "real BWDB gauge observations"; the gauge is synthetic | `pipeline/metrics.py:6` | Open |
| **F-7** | S2 | CI is cited as evidence for UI build/lint it never runs | `.github/workflows/ci.yml` vs `docs/evidence/challenge_criteria_map.md:32` | Open |
| **F-8** | S2 | Zero front-end tests; no test runner; no type checking | `ui/package.json:5–10` (scripts: dev/build/start/lint only) | Open |
| **F-9** | S2 | "Six official judging criteria @16.7%" is unverifiable and matches no Space Apps rubric I can confirm | `challenge_criteria_map.md:25–34` | **Unverified claim** |
| **F-10** | S2 | Fixture comment says "21-day orbit", code uses `freq="11D"` | `scripts/generate_fixtures.py:37–38` | Open |
| **F-11** | S2 | `validation_report.md` says baseline fired "15 hours before"; run prints −36.5 h | `pipeline/run_pipeline.py:352` vs report | Open |
| **F-12** | S2 | Lead time clamped to ≥ 0, hiding a late warning; empty flags return `0.0` not `None` | `metrics.py:200–210` | Open |
| **F-13** | S2 | `/dashboard` is a 36-byte re-export of `/` | `ui/app/dashboard/page.js` | Open |
| **F-14** | S3 | Gilbert (1987) CI lower bound off by one rank position | `trend_explorer/analysis.py:417–422` | Open |
| **F-15** | S3 | `|ρ_k| > 1.96/√n` lag gate is ad hoc and undisclosed as such | `analysis.py:91`, `:481` | Open |
| **F-16** | S3 | Three different bed elevations coexist (5.80 default / 6.88 calibrated / 9.5 old) | `muskingum_cunge.py:141`, artifacts | Partially resolved |
| **F-17** | S3 | 8 npm vulnerabilities (7 moderate, 1 high) | `npm audit` | Open |
| **F-18** | S3 | Doc drift: test counts 40/48/70/71 vs actual 89; i18n 252/261 vs actual 358 | `docs/AGENTS.md:§3`, `challenge_criteria_map.md:32` | Open |
| **F-19** | S3 | Superlative novelty claim with no supporting citation search | `challenge_criteria_map.md:31` ("first application of SWOT slope2…") | **Unverified claim** |

---

## 2. Why the S1 findings are S1 (the reasoning the fix must respect)

### 2.1 F-2: the calibration cannot produce information

Manning in the code is `Q = (1/n) · W · d^(5/3) · S^(1/2)` with `d = WSE − z_bed`.
The objective is `Σ wᵢ (Qᵢ(n) − 750)²`. Since `Q ∝ 1/n` and the target is a **constant**, the minimiser is the unique `n` satisfying `mean(Q) ≈ 750`:

```
n* ≈ mean( W · d^(5/3) · √S ) / 750
```

No observation of discharge enters. `n*` is therefore a **scale factor between SWOT geometry and an assumed flow**, not a roughness estimate. Consequences a reviewer will draw immediately:

1. A different assumed target yields a different "calibrated" `n` — monotonically, `n* ∝ 1/target`.
2. That is exactly why an earlier run pinned `n = 0.025` at the lower bound: a larger assumed target pushed `n*` below the physical floor.
3. `RMSE = 452 m³/s` is not validation error. It is **the scatter of the model's own Manning estimates around an invented constant**.

**Demonstration test (must be added):** sweep `target_q ∈ {400, 750, 1200}`; if `n*` scales as `1/target` (and it will), identifiability is zero. This one test is the most persuasive artefact you can put in front of a hydrologist, because it *proves* you understand your own model.

### 2.2 F-4/F-5: the routing runs outside its validity region

With shipped defaults (`v_mean = 0.90`, `n_reaches = 4`, `L = 140 km`, `X = 0.25`, `Δt = 1800 s`):

```
c  = (5/3)·0.90              = 1.500 m/s
dx = 140000/4                = 35 000 m
C  = c·Δt/dx                 = 0.0771        (docstring claims ≈ 1)
K  = (L/c)/4                 = 6.48 h
valid window: 2KX ≤ Δt ≤ 2K(1−X)  →  3.24 h ≤ 0.50 h ≤ 9.72 h   ✗
C1 = −0.268, C2 = +0.366, C3 = +0.902        (C1 < 0 is non-physical)
```

Negative `C1` means outflow *decreases* when current inflow *increases*. The scheme is stable enough to return smooth numbers, which is worse than crashing: numerical diffusion damps the peak, the peak determines when stage crosses 13.20 m, and therefore **the RED flag time is a solver artefact**. You cannot defend "−7.5 h" while this is true.

---

## 3. Fix designs

### T-1 — Refuse to calibrate without observed discharge (closes F-1, F-2)

**File:** `pipeline/manning_calibration.py`

Replace the `else` branch at `:218–220` with a fail-closed return. Do **not** substitute another constant.

```python
# 6. Target discharge reference — fail closed if no observation exists
if gauge_q_target is None:
    logger.warning(
        "Reach %s: no observed discharge target supplied. "
        "Refusing to calibrate; returning literature prior.", reach_id_str
    )
    return {
        "reach_id": reach_id_str,
        "n_calibrated": None,
        "n_effective": float(LITERATURE_N),          # 0.033
        "n_literature": float(LITERATURE_N),
        "calibration_method": "literature_prior",
        "calibration_status": "NOT_CALIBRATED",
        "z_bed_m": float(round(z_bed, 2)),
        "z_bed_source": "min_wse_lower_bound",
        "mean_slope2": float(round(float(np.mean(slope2_valid)), 7)),
        "mean_width_m": float(round(float(np.mean(width_valid)), 1)),
        "n_valid_passes": int(valid_count),
        "rmse_m3s": None,
        "provenance": "NO_OBSERVED_DISCHARGE",
    }
```

Add one resolver used by every caller, so `None` can never leak into arithmetic:

```python
def resolve_n(res: dict) -> float:
    """Single source of truth for the effective roughness used in routing."""
    if res.get("n_calibrated") is not None:
        return float(res["n_calibrated"])
    if res.get("n_effective") is not None:
        return float(res["n_effective"])
    return float(LITERATURE_N)
```

**Call sites to update:** `muskingum_cunge.py:140`, `calibration_diagnostics.py:86–87`, `run_pipeline.py:202`, `:222`.

**Real (non-blocking) upgrade path:** if `data/real/` work yields SWOT RiverSP discharge (`dschg_c` / `dschg_g` / `dschg_u` — **verify names against the RiverSP product DSD before wiring**), pass it as `gauge_q_target`. That is a genuine calibration and re-enables the flag.

### T-2 — Derive the sub-reach count from hydraulics (closes F-4, F-5)

**File:** `pipeline/muskingum_cunge.py`

Replace the hardcoded `n_reaches = 4` default with a derivation, and add a hard validity guard.

```python
def compute_subreach_count(
    total_length_m: float,
    celerity_mps: float,
    dt_sec: float,
    x_weight: float = 0.25,
    minimum: int = 4,
) -> int:
    """Choose N so the scheme stays inside the Muskingum validity region.

    - Courant criterion (Cunge 1969; Ponce & Theurer 1982): c·dt/dx ≈ 1
    - Coefficient non-negativity: dt >= 2·K_sub·X
    """
    n_courant = int(np.ceil(total_length_m / (celerity_mps * dt_sec)))
    k_total = total_length_m / celerity_mps
    n_validity = int(np.ceil(2.0 * k_total * x_weight / dt_sec)) + 1
    return max(minimum, n_courant, n_validity)


def validate_routing_regime(k_sec, x_weight, dt_sec, celerity_mps, dx_m):
    """Raise if the Muskingum scheme is outside its physical validity region."""
    cour = celerity_mps * dt_sec / dx_m
    lo, hi = 2.0 * k_sec * x_weight, 2.0 * k_sec * (1.0 - x_weight)
    if not (lo <= dt_sec <= hi):
        raise ValueError(
            f"Muskingum invalid: need {lo:.0f}s <= dt {dt_sec:.0f}s <= {hi:.0f}s "
            f"(K={k_sec:.0f}s, X={x_weight}). Increase sub-reach count."
        )
    c1, c2, c3 = compute_routing_coefficients(k_sec, x_weight, dt_sec)
    if min(c1, c2, c3) < -1e-9:
        raise ValueError(f"Non-physical routing coefficient: C1={c1:.4f}, C2={c2:.4f}, C3={c3:.4f}")
    if not (0.5 <= cour <= 1.5):
        logger.warning("Courant number %.3f outside target band [0.5, 1.5]", cour)
```

With the shipped defaults this yields `N = 52`, `dx = 2692 m`, `C = 1.003`, `C1 = 0.201 / C2 = 0.601 / C3 = 0.198`. Verified by hand.

**This changes the headline numbers.** That is expected and correct. Re-run, publish the new value, and state that the old 0.73 was produced outside the scheme's validity region. That sentence is worth more than the 0.73 ever was.

### T-3 — Stop calling `min(wse)` a datum (closes F-3)

**File:** `pipeline/manning_calibration.py:192–193`

Keep the estimator (there is no independent bed reference in the repo yet) but label it truthfully and quantify the exposure.

```python
# 3. Bed reference — LOWER BOUND ONLY. The true bed is <= min(WSE).
z_ref = float(np.min(wse_valid))
z_bed = z_ref
z_bed_source = "min_wse_lower_bound"
z_bed_bias_direction = "stage_overestimated"   # by an unknown amount
```

Then a sensitivity script (§4, T-5) reports NSE across `z_bed ∈ {−0.25, 0, +0.25}` m. If the spread is wide, that *is* the finding, and reporting it is the fix.

> True correction requires an independent bed (survey, DEM/bathymetry, or joint `(n, z_bed)` estimation against observed stage). Do not fabricate one. Joint estimation without an observed stage series is under-determined — say so in the limits panel.

### T-4 — Make honesty machine-enforced (closes F-6, F-10, F-11, F-12, F-13)

**T-4.1** `pipeline/metrics.py:6` — replace "real BWDB gauge observations" with "gauge observations supplied by the caller (synthetic fixtures in demo mode; BWDB when real ingestion is active)".

**T-4.2** `metrics.py:187–210` — preserve the sign and stop conflating absence with zero:

```python
def compute_warning_lead_time(...) -> Optional[float]:
    if df_flags.empty:
        return None                      # no warning issued  !=  zero lead
    flags = df_flags.sort_values("timestamp")   # never trust input order
    red = flags[flags[flag_col] == "RED"]
    if red.empty:
        return None
    obs = df_obs.sort_values("timestamp")
    exceed = obs[obs[obs_col] >= danger_level_m]
    if exceed.empty:
        return None                      # never crossed -> not defined
    return float((exceed.iloc[0]["timestamp"] - red.iloc[0]["timestamp"]).total_seconds() / 3600.0)
```

Negative = late. Render "36.5 h late" in the UI, not "0 h".

**T-4.3** `scripts/generate_fixtures.py:37–38` — align comment and code:

```python
dates = pd.date_range("2020-01-10", "2026-03-25", freq="21D", tz="UTC")  # SWOT science phase repeat
```

Then add a guard test that fails CI if an artefact tagged `SYNTHETIC_DEMO` is surfaced as a performance claim:

```python
def test_no_synthetic_metric_published_as_performance():
    summary = json.load(open("ui/public/data/metrics_summary.json"))
    prov = json.load(open("data/processed/calibration_results.json"))
    synthetic = any(v.get("provenance") == "SYNTHETIC_DEMO" for v in prov.values())
    if synthetic:
        assert summary.get("label") in {"DEMONSTRATION — SYNTHETIC", "SYNTHETIC_DEMO"}
```

**T-4.4** `ui/app/dashboard/page.js` — either build a real dashboard or make the alias explicit:

```js
import { redirect } from "next/navigation";
export default function Page() { redirect("/"); }
```

**T-4.5** `pipeline/run_pipeline.py:349–360` — delete `lead_gain_h = None` dead code; regenerate `data/processed/validation_report.md` from the run so prose and output cannot diverge again.

### T-5 — Publish the ablation (the highest-return artefact in the project)

**New:** `scripts/sensitivity_ablation.py` → `data/processed/ablation.json` → rendered on `/dashboard`.

| Variant | What it proves |
|---|---|
| Literature `n = 0.033`, corrected routing | baseline physical model |
| Calibrated `n` (if a real target exists) | whether calibration adds skill |
| `z_bed ± 0.25 m` | datum sensitivity |
| 2-parameter linear reservoir + lag | whether physics beats a bucket |
| Rainfall-only threshold | whether routing beats nothing |

Acceptance: the table appears in the UI with a one-line interpretation written by you, including the case where **the physics loses**. That sentence is the single strongest trust signal available.

### T-6 — Fix the Gilbert CI index (closes F-14)

**File:** `trend_explorer/analysis.py:417–422`

```python
m1 = max(1, math.floor((n_prime - half_width) / 2.0))
m2 = min(n_prime, math.ceil((n_prime + half_width) / 2.0) + 1)
idx_low = min(n_prime - 1, max(0, m1))        # was: m1 - 1
idx_high = min(n_prime - 1, max(0, m2 - 1))
```

Regression test against a hand-computed 5-point series. Regenerate `trend_summary.json`; the CI will shift slightly and that shift should be mentioned in the changelog.

### T-7 — Front-end QA + CI honesty (closes F-7, F-8)

**`ui/package.json`:**

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "test": "vitest run --coverage",
  "typecheck": "tsc --noEmit"
}
```

- Add `vitest`, `@vitest/coverage-v8`, `@testing-library/react`, `jsdom`, `typescript`, `@types/react`.
- Convert **`ui/app/lib/normalizeTrends.js`** (717 lines of pure logic, highest silent-failure risk) to TypeScript first. Do not attempt a big-bang conversion of the 1,666-line map component.
- Minimum 12 tests: `normalizeTrends` (6), `viewTransition`/`navDirection` (2), one component render (2), one error-boundary path (1), one a11y assertion (1).

**`.github/workflows/ci.yml` — add a `ui` job:**

```yaml
  ui-build-and-test:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: ui } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'npm', cache-dependency-path: ui/package-lock.json }
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm test
      - run: npm run build
```

Then **delete the false evidence citation** at `challenge_criteria_map.md:32` and replace it with the job name that actually performs it.

### T-8 — Submission framing (closes F-9, F-19; the cheapest large win)

**`README.md`** — replace the dual-equal-module framing with:

> **Primary submission (challenge answer):** Module 2 — Earth System Trend Explorer.
> **Secondary demonstration (not validated):** Module 1 — flood routing / harvest advisory. It is a downstream illustration of why the trend matters, and its performance metrics are explicitly marked `SYNTHETIC_DEMO` until BWDB observations are ingested.

Specific edits:
1. Mark `challenge_criteria_map.md` §2 as **`UNVERIFIED — published rubric could not be retrieved`** unless you can produce a screenshot/PDF of the official page with an access date. Do not assert six criteria at 16.7% if you cannot source it.
2. Delete or source the "first application of SWOT `slope2`…" claim.
3. Correct every test count to **89** and every i18n count to **358** in `docs/AGENTS.md`, `docs/TASKS.md`, `challenge_criteria_map.md`, `MODULE_2_BUILD_PROMPTS.md`.
4. Update `docs/EXECUTION_EVIDENCE.md`, which still labels `ui/public/data/*` as SYNTHETIC while `trend_summary.json` is `VERIFIED_REAL`.

### T-9 — Dependency hygiene (closes F-17)

`npm audit fix` (non-breaking), re-run `lint`/`build`/`test`, commit the lockfile. Document any remaining advisory with a reason.

### T-10 — Module 2 statistical disclosure (closes F-15, plus power)

In `docs/` and the limits panel, add: (a) the `1.96/√n` gate is a heuristic, not a Hamed–Rao prescription; (b) **power**: with n = 25 seasons, report the minimum detectable Sen slope at 80% power; (c) field significance was not assessed. Three sentences. No code required, though a power curve is a nice addition.

---

## 4. Phased execution

Dependencies: **P0 → P1 → P2**, then P3 and P4 in parallel. P5 is optional and independent.

### P0 — Stop the bleeding (≈2 h, no science risk)
| Task | Closes | Acceptance |
|---|---|---|
| P0.1 Rewrite `metrics.py` docstring (T-4.1) | F-6 | `grep -n "real BWDB" pipeline/metrics.py` → empty |
| P0.2 Fix lead-time sign + `None` semantics (T-4.2) | F-12 | new unit test passes; late warning returns negative |
| P0.3 Mark rubric claim `UNVERIFIED`; correct test/i18n counts (T-8.1, T-8.3) | F-9, F-18 | counts match `pytest --collect-only -q` and `node` key count |
| P0.4 Regenerate `validation_report.md` from the run (T-4.5) | F-11 | printed timestamps match report text |
| P0.5 Reframe README (T-8) | — | Module 1 labelled demonstration |

**Exit gate:** no document in the repo claims a number that a single command contradicts.

### P1 — Routing correctness (≈3 h)
| Task | Closes | Acceptance |
|---|---|---|
| P1.1 `compute_subreach_count` + `validate_routing_regime` (T-2) | F-4, F-5 | `N = 52`, `C = 1.003`, `C1 = 0.201`, all coefficients in [0,1] |
| P1.2 Update docstrings to the computed values, not hand-typed ones | F-5 | docstring numbers match runtime |
| P1.3 New `tests/test_routing_regime.py` | F-4 | 4 tests: sum-to-1, non-negativity, validity window, Courant band |
| P1.4 Re-run pipeline; record the new metrics as the new baseline | — | `ablation.json` regenerated |

**Exit gate:** routing cannot produce a negative coefficient without raising.

### P2 — Calibration integrity (≈4 h)
| Task | Closes | Acceptance |
|---|---|---|
| P2.1 Fail-closed branch + `resolve_n` (T-1) | F-1 | `grep -rn "750.0" pipeline/` → only in tests/changelog |
| P2.2 Update all 4 call sites | F-1 | `pytest` green; no `TypeError` on `None` |
| P2.3 `z_bed_source` labelling (T-3) | F-3 | JSON contains `z_bed_source` + `z_bed_bias_direction` |
| P2.4 Identifiability test (target sweep 400/750/1200) | F-2 | `n*` monotone in `1/target`; assertion documented |
| P2.5 `scripts/sensitivity_ablation.py` + UI table (T-5) | — | table renders on `/dashboard` |

**Exit gate:** you can answer "what did you calibrate against?" without hesitating, and the answer is either a dataset or "we didn't."

### P3 — QA + CI (≈4 h, parallel with P2)
| Task | Closes | Acceptance |
|---|---|---|
| P3.1 Add vitest + tests | F-8 | ≥12 tests, `npm test` exit 0 |
| P3.2 `normalizeTrends` → TS | F-8 | `tsc --noEmit` exit 0 |
| P3.3 CI `ui` job (T-7) | F-7 | job green on push; citation in docs points at it |
| P3.4 `npm audit fix` (T-9) | F-17 | vulnerabilities ↓; build still green |

**Exit gate:** a clean clone passes CI without a human touching it.

### P4 — Statistics + docs sync (≈2 h)
| Task | Closes | Acceptance |
|---|---|---|
| P4.1 Gilbert index fix + regression test (T-6) | F-14 | hand-computed bounds match |
| P4.2 Regenerate `trend_summary.json` | — | SHA + `generated_at_utc` diff only |
| P4.3 Disclose lag gate, power, field significance (T-10) | F-15 | 3 sentences present in docs + UI |
| P4.4 Sync `TASKS.md`, `DECISIONS.md`, `EXECUTION_EVIDENCE.md` | F-18 | no stale provenance labels |

### P5 — Real data (1–2 days, optional, largest upside)
Ingest BWDB stage for Surma at Kanaighat/Sylhet (May–June 2024), and SWOT RiverSP discharge. Replace the synthetic gauge, re-run, and only then may the word "calibrated" appear again. Your existing `docs/evidence/module1_feasibility_report.md` shows all three gates passed, and `scripts/ingest_swot_real.py` already exists — this is integration, not new research.

---

## 5. New tests (definition of done)

```
tests/test_routing_regime.py        # 4  coefficients, validity window, Courant
tests/test_calibration_refusal.py   # 2  no target -> NOT_CALIBRATED, no 750 fallback
tests/test_identifiability.py       # 1  n* ∝ 1/target sweep
tests/test_metrics_lead_sign.py     # 3  late<0, none-empty, sorted-input
tests/test_gilbert_ci.py            # 2  hand-computed bounds, index convention
tests/test_fixture_provenance.py    # 2  21-day cadence, synthetic never published as performance
ui/**/*.test.ts(x)                  # 12 vitest
```

Target: **89 → ~103 Python tests**, plus 12 front-end tests where there were zero.

---

## 6. Six-hour triage (if the deadline is real)

Do only these, in this order. Each is independently shippable.

1. **P0.1** docstring (5 min) — removes the most quotable contradiction in the repo.
2. **P0.3** mark rubric claim `UNVERIFIED` and fix counts (15 min) — removes two "you fabricated evidence" attacks.
3. **P2.1** fail-closed calibration (45 min) — removes the fatal question.
4. **P1.1** derived sub-reach count (60 min) — makes the routing defensible.
5. **P0.2** lead-time sign (20 min) — removes a silently misleading metric.
6. **P0.5** README reframe (30 min) — moves challenge fit from 6.0 → ~8.5 with no code.
7. **T-5** ablation table in the UI (2 h) — converts your biggest weakness into your best evidence.

Result: roughly **7.8/10** on the audit scale, with zero new science claimed.

---

## 7. Risk register

| Risk | Likelihood | Mitigation |
|---|---|---|
| Corrected routing changes NSE materially, and the new number is worse | High | Publish it with the ablation. A worse-but-honest number scores higher than a better-but-invalid one. |
| `n_calibrated = None` propagates into routing arithmetic | Medium | `resolve_n()` as the single accessor + a test that asserts no `None` reaches `invert_manning_to_stage`. |
| TS migration overruns | Medium | Scope to `normalizeTrends.js` only; everything else stays JS with `// @ts-check` optional. |
| Removing the 750 target leaves Module 1 with no calibration story | Certain | That *is* the honest story: "literature prior, pending BWDB discharge". Say it in the limits panel. |
| Regenerated `trend_summary.json` breaks UI expectations | Low | `normalizeTrends` already tolerant; add a schema assertion test. |

---

## 8. Definition of done

- [ ] No hardcoded discharge target anywhere in `pipeline/`.
- [ ] `validate_routing_regime` cannot be bypassed; coefficients proven in [0,1].
- [ ] Every published metric carries a machine-readable provenance label.
- [ ] `npm test` exists, passes, and runs in CI alongside lint and build.
- [ ] One document, one number: test counts and key counts agree everywhere.
- [ ] The ablation table is visible to judges, including the cases where physics loses.
- [ ] README names Module 2 as the submission and Module 1 as a demonstration.
