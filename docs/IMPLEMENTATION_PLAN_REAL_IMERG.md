# Implementation Plan: Verified IMERG Trend Analysis

**Purpose:** Hand this document to an implementation agent (Antigravity, OpenCode, or another coding agent) to inspect, verify, and implement the real-data Trend Explorer path.

**Primary goal:** Deliver a reproducible, provenance-verified analysis of pre-monsoon NASA GPM IMERG Final precipitation for the declared Haor study area, make its findings visible in the Trend Explorer, and ensure every project claim matches the evidence.

**Challenge response:** NASA Space Apps 2026, “Be An Earth System Trend Detective!” The project must communicate what is changing, where, by how much, and whether the evidence supports a statistically significant trend.

**Data policy:** Existing generated files remain synthetic. Never overwrite, relabel, or mix synthetic fixtures with real observations. If acquisition or verification fails, stop and show the synthetic preview only as a preview.

---

## Instructions to the implementation agent

1. Read `docs/AGENTS.md`, `docs/DECISIONS.md`, this plan, and the current `README.md` before editing.
2. Inspect `git status --short` and the current diff before making any changes. The repository may contain uncommitted work. Preserve it; do not reset, clean, checkout over, or revert user changes. Work around existing changes and report conflicts before touching the affected lines.
3. Verify current NASA GES DISC / Earthdata Cloud instructions and the actual IMERG product metadata before changing endpoints or variable handling. Do not invent URLs, metadata, units, identifiers, or results.
4. Implement the plan in small phases. Keep Module 2 independent of Module 1's synthetic event fixtures and pipeline.
5. Never put Earthdata credentials in code, command output, logs, screenshots, provenance manifests, or version control. Do not request the user to paste credentials into chat.
6. Do not claim that real data were analyzed until real granules have been retrieved, validated, recorded in provenance, analyzed, and exported to the UI.
7. At completion, update the required project state files (`docs/AGENTS.md`, `docs/TASKS.md`, `docs/DECISIONS.md`, `README.md`, `docs/SOURCES.md`, and `docs/AI_USE_LOG.md`) to match what was actually implemented. Do not mark pending human or NASA access steps complete.
8. Run relevant tests and builds only after reading repository-specific instructions. Report commands and outcomes. A synthetic unit test is not evidence of real-data retrieval or scientific validity.

## Current repository facts to verify before implementation

The following were observed during plan preparation. Confirm they remain true before relying on them:

- `trend_explorer/ingest_imerg.py` contains the real-data ingestion path and currently hardcodes an old `gpm1.gesdisc.eosdis.nasa.gov` OPeNDAP base URL. NASA has published a migration to Earthdata Cloud; the agent must verify the supported current access method rather than blindly replacing the hostname.
- `trend_explorer/analysis.py` contains provenance checks and multi-zone analysis/export logic.
- `scripts/run_trend_analysis.py` invokes analysis and writes the result consumed by the web app.
- `ui/app/lib/normalizeTrends.js` fails closed on malformed or unknown output and recognizes verified versus synthetic status.
- `ui/app/trends/page.js` has an awaiting state and user-opt-in synthetic preview.
- `ui/app/components/TrendExplorerViewer.js` visualizes zone/indicator outputs.
- `ui/public/data/trend_summary.json` is a `SYNTHETIC_DEVELOPMENT_FIXTURE`, not an observed NASA result.
- `data/trends/` currently contains a provenance template, not an authenticated IMERG dataset or completed real-data manifest.
- `data/fixtures/` and Module 1 dashboard values are synthetic engineering fixtures. Keep their status explicit; do not treat their metrics as operational skill.
- Several submission files may contain older or conflicting claims. In particular, audit all `docs/VIDEO_SCRIPTS.md` sections, `docs/Problem_and_Challenge_Statement.md`, `PRODUCT.md`, `README.md`, `docs/SUBMISSION_CHECKLIST.md`, locale strings, and public JSON.

## Scope

### In scope

- NASA Earthdata authentication and current supported data access for GPM IMERG Final daily product `GPM_3IMERGDF`.
- Exact product/version/variable/unit/coordinate/fill-value verification using downloaded granules and authoritative NASA metadata.
- Resumable, spatially subsetted real-data retrieval for the predeclared study area and period.
- Strict dataset validation and reviewable per-granule plus final-dataset provenance.
- Cell-first PRCPTOT and R50mm calculations, completeness/QC handling, zone aggregation, trend estimates, uncertainty, autocorrelation handling, and multiplicity adjustment as specified by the existing design decisions.
- Real-result JSON export into the existing static UI path, with strict verified/synthetic/unavailable states.
- Correction of user-facing claims and handoff documentation to reflect actual status.
- Tests for unit behavior, failure modes, and data-to-UI integration using clearly synthetic test fixtures only.

### Out of scope unless the project owner explicitly expands scope

- Replacing the Module 1 flood-routing system with real-time operational forecasting.
- Making harvest recommendations from historical trend results.
- Claiming that rainfall trends prove flood frequency/severity is changing.
- Adding extra Earth science variables, products, or study regions to inflate scope.
- Generating synthetic data in `data/trends/` or fabricating real-data outputs for the demo.
- Publishing credentials, raw restricted files, or unnecessary full global IMERG granules in the repository.

## Phase 0 — Baseline audit and evidence inventory

Before coding:

1. Read the project instructions, architecture decisions, and all current diffs.
2. Inventory the actual files under `data/trends/`, `data/fixtures/`, `ui/public/data/`, and `docs/evidence/`. Do not print secrets or inspect credential values.
3. Run the current provenance audit (if present) and inspect the current synthetic preview JSON. Record whether the audit passes and exactly what it proves.
4. Trace the data path end to end:
   `NASA source → download/subset → staged NetCDF → final NetCDF + manifest → analysis JSON → normalizeTrends → /trends UI`.
5. Record all claims that say “real,” “NASA observations,” “examined,” “validated,” or give a trend direction/result. Mark each as supported, synthetic-only, planned, or unsupported.
6. Write a short baseline note in the implementation summary. Do not change scientific output during this phase.

**Gate 0 passes when:** the agent can identify every file and function involved in retrieval, analysis, export, and display; has preserved all pre-existing changes; and has a list of unsupported claims to correct later.

## Phase 1 — Verify current NASA access and product contract

Use primary NASA documentation and the current Earthdata tools. Relevant references:

- NASA GES DISC product: <https://disc.gsfc.nasa.gov/datasets/GPM_3IMERGDF_07/summary?keywords=imerg>
- NASA GES DISC Earthdata Cloud migration guidance: <https://github.com/nasa/gesdisc-tutorials/blob/main/user-guidance/GES_DISC_Migration_to_Earthdata_Website_and_Earthdata_Cloud.md>
- `earthaccess` authentication guide: <https://earthaccess.readthedocs.io/en/stable/user/howto/authenticate/>
- Product DOI: <https://doi.org/10.5067/GPM/IMERGDF/DAY/07>

The agent must:

1. Verify the current collection short name, version, DOI, temporal coverage, variable name, coordinates, units, fill values, and relevant metadata from NASA product documentation and an actual granule.
2. Verify whether GES DISC Earthdata Cloud supports the chosen request method for this collection. Prefer the project’s supported Earthdata client/catalog search and authenticated granule URLs over hand-constructed legacy directory paths. If using OPeNDAP, prove the exact current endpoint and constraint syntax with a real test request.
3. Remove dependence on the old host only after a real request proves the new path. Do not guess a cloud hostname or endpoint.
4. Use Earthdata credentials from the documented local environment or netrc mechanism. Keep the auth flow non-interactive for reproducible scripts, but provide a helpful message when credentials are missing or NASA access is not authorized.
5. Test one known granule first. Validate status code, content type/file signature, NetCDF readability, requested date, selected coordinates, expected variable, and nonempty valid precipitation values. Detect login HTML and error documents explicitly.
6. Check the repository requirements/environment to avoid adding an unnecessary dependency. If adding `earthaccess`, document its version and supported login behavior.

**Gate 1 passes when:** a real, authenticated IMERG Final daily granule has been obtained through NASA’s currently supported access route and independently inspected. A mocked request or local synthetic file does not pass this gate.

## Phase 2 — Build robust, resumable ingestion

Implement in `trend_explorer/ingest_imerg.py` or a narrowly scoped companion module. Keep output isolated under `data/trends/`.

### Retrieval behavior

- Preserve the declared study window unless the owner approves a scientific scope change. Current plan: April 1–May 31 seasons, 2001–2025, over the explicitly declared Sylhet/Haor zones.
- Verify NASA actually provides the full requested dates and years. Report the actual latest usable year; do not silently describe a truncated period as 2001–2025.
- Prefer server-side spatial subsetting if supported, and record the exact subset operation. Otherwise download only the necessary granules to a local ignored data directory, subset after retrieval, and do not commit raw source data unless project policy requires it.
- Keep annual or bounded-size chunks resumable. On rerun, reuse only chunks that pass both structural validation and checksum verification; otherwise quarantine/re-fetch them without silently trusting stale files.
- Apply conservative retries/backoff for transient HTTP errors and rate limits. Fail with a nonzero status and actionable message when authentication, authorization, network access, or a required granule fails.
- Never fill a missing date with 0, interpolate it, or call a partial season complete.
- Never write preview data or test fixtures into the production input directory.
- Make partial retrieval state explicit (`INCOMPLETE` / `FAILED`); do not produce a verified final dataset from incomplete chunks.

### Per-granule provenance

For every retrieved granule record, at minimum:

- Product short name, version, DOI, granule identifier, original NASA URL, acquisition date, access/retrieval timestamp in UTC.
- Requested study-area subset and exact processing steps.
- Source file size, SHA-256 checksum, validation outcome, and any QA/fill-value exclusions.
- Variable, units, coordinate convention, time coverage, and software/tool version.

### Final-dataset provenance

Create the final NetCDF and manifest atomically only after all required chunks pass. Include:

- Final file SHA-256 plus the list of source granule IDs/checksums.
- Dataset product/version/DOI, spatial bounds, years, season definition, variable and units.
- Completeness counts and processing history.
- A truthful provenance state such as `VERIFIED_REAL` only after validation succeeds.
- No credential values, cookies, tokens, or secret-bearing request URLs.

**Gate 2 passes when:** the full declared period is complete or the output clearly states the exact verified partial period and the analysis enforces the predeclared minimum. Provenance ties the final dataset to exact NASA granules and checksums. If full retrieval is impossible, stop at a partial-data state and report that limitation; do not manufacture a complete record.

## Phase 3 — Scientific and data-quality audit

Review `trend_explorer/analysis.py` against the product metadata and the project’s frozen decisions before changing formulas.

### Required checks

1. **Calendar completeness:** April 1–May 31 has 61 calendar days. Detect missing, duplicate, invalid, or out-of-season dates. Do not coerce a missing day into a dry day.
2. **Spatial coverage:** Verify all declared zones overlap the retrieved grid as expected. Report actual cells per zone and effective coverage; investigate empty or unexpectedly small zones.
3. **Precipitation validity:** Apply NASA fill-value/valid-range handling using product metadata. Confirm unit conversion and the daily product’s physical interpretation from its documentation. Avoid double scaling or treating a rate as an accumulation without justification.
4. **Indicator definition:** Freeze and document PRCPTOT’s wet-day threshold (if any) and R50mm’s `>= 50 mm/day` definition. Use the same definitions in code, export, charts, tooltips, docs, and pitch.
5. **Cell-first computation:** Calculate the indicators separately for each grid cell before area-weighting within each zone. Do not spatial-average daily precipitation before applying the R50 threshold.
6. **Area weighting:** Verify cell-area weights and zone-boundary convention. Ensure grid centers are assigned once and only once.
7. **Missing seasons:** Retain incompleteness in machine-readable output. Enforce the predeclared minimum complete-season count and do not quietly shorten the study period.
8. **Trend estimate and uncertainty:** Check Theil–Sen slope units and actual year deltas; validate confidence interval method and interpretation.
9. **Significance:** Verify the Mann–Kendall / Hamed–Rao autocorrelation implementation and the predeclared governance rule for when modified versus standard MK controls. Verify Holm–Bonferroni family membership and adjusted p-values across the stated zone/indicator tests. Do not alter thresholds after seeing output.
10. **Result language:** Distinguish estimate direction from statistical evidence. “No significant trend detected” is a valid result. Do not label a non-significant slope as proof of no change.
11. **Sensitivity and limitations:** Keep standard MK as a sensitivity if the existing design requires it. State limits including data period, spatial resolution, satellite precipitation uncertainty, multiple testing, spatial dependence, and the inability of rainfall trends alone to establish flood trends or predict individual events.

**Gate 3 passes when:** a reviewer can reproduce one zone-indicator result from the validated daily data; units, sample size, slope, confidence interval, raw/adjusted p-values, and governing test agree across code and output; and synthetic analysis remains distinctly marked as test-only.

## Phase 4 — Analysis export and strict UI state model

Use the existing static-JSON architecture unless repository decisions explicitly authorize a different runtime. The event demo must remain offline-capable.

### Data flow

1. `scripts/run_trend_analysis.py` accepts the verified NetCDF and its provenance manifest.
2. It writes a schema-versioned JSON output only after analysis validation succeeds.
3. `ui/public/data/trend_summary.json` is generated from that output; do not manually edit trend figures in the UI JSON.
4. `ui/app/lib/normalizeTrends.js` validates schema, status, provenance, period, units, zones, and finite numeric values.
5. `/trends` displays verified output only when the verified status and provenance contract pass. The user-opt-in preview remains visibly synthetic.

### UI requirements

- Show status at the point of interpretation: **Verified NASA result**, **Synthetic preview**, or **Data unavailable/incomplete**.
- Never show a synthetic series as the default result when verified input is absent. Keep preview behind explicit user action and label it in the banner, chart area, export/download, and screenshot/demo instructions.
- For verified data, show NASA product/version, DOI/source, study years, retrieval date, zone, indicator, units, complete/available seasons, slope, CI, raw and adjusted significance, governing test, and concise limitations.
- Put the verdict in plain language near the chart, for example: “Estimated increase of X mm per decade; adjusted test does not find a statistically significant trend for this zone.” Generate the sentence from JSON, never hand-code the current result.
- Accessible, bilingual labels must preserve scientific meaning in both English and Bangla. Avoid translating `p-value`, units, and indicator names inconsistently.
- A malformed or unknown status must show an error/unavailable state, never downgrade silently to a verified or synthetic status.
- Maintain responsive behavior, keyboard interaction, readable chart labels, and reduced-motion preferences.

**Gate 4 passes when:** replacing the output JSON with valid synthetic test output shows preview only after opt-in; a valid verified schema shows verified status; malformed/unknown provenance shows an error; and no synthetic data can be mistaken for a NASA finding.

## Phase 5 — Correct the whole submission package

Search and review claims in:

- `README.md`
- `PRODUCT.md`
- `docs/Problem_and_Challenge_Statement.md`
- `docs/VIDEO_SCRIPTS.md`
- `docs/SUBMISSION_CHECKLIST.md`
- `docs/SOURCES.md`
- `docs/DECISIONS.md`
- `docs/TASKS.md`
- `docs/AI_USE_LOG.md`
- `ui/app/locales/en.json` and `ui/app/locales/bn.json`
- `ui/public/data/*.json`

For each sentence with a data, model-performance, or completion claim, choose exactly one status: **verified real result**, **synthetic engineering demo**, **implemented but awaiting input**, **planned**, or **unsupported**. Remove or rewrite unsupported claims.

Specifically:

- Replace the “we examined 25 years of NASA data” wording unless a verified analysis actually ran on those data.
- Do not say the flood model was validated against observed BWDB data when the repository records those fixtures as synthetic.
- Do not claim the trend indicates increasing floods or predicts harvest/flood dates.
- Cite IMERG with NASA product name, DOI, version, and actual years retrieved.
- Keep challenge response focused on the Trend Explorer. Mention Module 1 only as local motivation and a separate synthetic engineering demonstration.
- Make the README’s run instructions, output paths, credentials guidance, and result states match the actual code.
- Do not mark checklist boxes, tests, data access, or recording steps complete without evidence.

**Gate 5 passes when:** a repository-wide search finds no unsupported “real/observed/validated/examined” claims, and each published number can be traced to a generated output or cited source.

## Phase 6 — Verification plan

Implement tests before relying on the pipeline. Use synthetic fixtures only in tests and temporary directories; never write test data to `data/trends/` or overwrite the demo preview.

### Unit tests

- NASA date/filename or granule metadata parsing (based on actual verified product metadata).
- Coordinate ordering and exact subset boundaries.
- Fill values, invalid ranges, units, and scaling.
- Missing, duplicate, and out-of-season dates.
- 61-day season completeness and minimum sample behavior.
- Cell-first PRCPTOT and R50 calculations with hand-checkable synthetic arrays.
- Zone membership, cosine-latitude weights, no duplicate cell assignment.
- Slope and CI with known synthetic series; MK/MMK branches and adjusted p-values.
- Provenance validation: wrong DOI/product/version, missing IDs, altered checksum, unknown status, and secret leakage.
- Retry/resume and atomic-write behavior.

### Integration tests

- Synthetic test dataset → analysis → schema JSON → UI normalizer.
- Verified-shaped test manifest → verified-shaped output, without calling the network.
- Missing credentials, unauthorized access, HTTP error/login HTML, corrupt NetCDF, missing granule, incomplete season, and checksum mismatch all fail closed.
- Assert real retrieval is an opt-in explicit command and never occurs as a side effect of tests, normal UI startup, or synthetic fixture generation.
- Assert Module 1 pipeline and fixtures are unchanged by Module 2 ingestion.

### Manual real-data acceptance

1. User runs the documented NASA-authenticated command locally.
2. The command retrieves or resumes the period and produces a manifest.
3. Provenance audit verifies every granule and the assembled dataset.
4. Analysis writes JSON with `VERIFIED_REAL` / `COMPUTED` only after checks pass.
5. UI loads that JSON and displays the exact same years, sample counts, statistics, and provenance.
6. Disconnect network and reload the demo: the static verified result remains available if bundled; otherwise an honest unavailable state appears. It must never switch to synthetic values without opt-in.

The agent must report which checks were actually run. Never report a manual real-data acceptance as passed if no real granule was fetched and inspected.

## Phase 7 — Final demo and judge delivery

### Recommended demo sequence (about 60 seconds)

1. **Question:** “Has April–May rainfall changed in the upstream Haor catchments?”
2. **Choose:** Show one indicator and one zone.
3. **Finding:** State the estimated slope and uncertainty, then the adjusted significance verdict.
4. **Evidence:** Point to the annual time series and show the NASA product, years, complete-season count, and verified provenance.
5. **Interpretation:** Explain one local planning use and say explicitly that rainfall trends alone do not predict individual floods.
6. **Limitation:** Name one important limitation without burying the finding.

If the data are still unavailable, substitute: “This is a synthetic interface preview. The real-data path is implemented but no verified result is available yet.” Demonstrate the preview only as a preview. Do not present its slope, p-value, or chart as a NASA observation.

### Final handoff artifact

The implementation agent must return:

- Files changed and why.
- Exact data source, product/version, retrieval method, years, and granule IDs (if real access completed).
- Provenance audit outcome and final dataset checksum (safe public metadata only).
- Analysis summary with definitions, units, sample counts, slope, interval, raw/adjusted p-values, and test used—or a clear statement that no real result was produced.
- Tests/build commands and actual outcomes.
- Remaining blockers and any manual user steps.
- A three-item pre-mortem: likeliest failure points and safeguards.

## Score-oriented priorities

These are work priorities, not promised judge scores:

1. **Validity:** real NASA granules, reproducible processing, correct units, transparent uncertainty, fail-closed provenance.
2. **Relevance:** make the Trend Explorer the core response to “what/where/how much/significant.”
3. **Presentation:** lead with one truthful finding; synchronize every line in the app, project description, and video.
4. **Impact:** connect the result to seasonal planning with a stakeholder-grounded use case; do not claim measured benefit without evaluation.
5. **Creativity:** explain the meaningful design choice—cell-first extreme-rain analysis across local zones—without unsupported “first/unique” claims.

## Likely failure points and safeguards

1. **NASA access endpoint/authentication fails.** Safeguard: verify current NASA access instructions and one real granule before bulk retrieval; keep resumable staging; preserve explicit unavailable state.
2. **Incomplete or misinterpreted data yield a convincing but wrong trend.** Safeguard: validate metadata, units, coordinates, date completeness, cell-first indicators, predeclared thresholds, and multiplicity before exporting.
3. **Synthetic preview is mistaken for a NASA finding.** Safeguard: separate files and statuses, require preview opt-in, propagate provenance to chart/export/copy, and correct every script and README claim.

## Definition of done

The work is complete only when the current access route has been verified; the analysis accepts only provenance-verified real data in production mode; the synthetic preview remains isolated and correctly labeled; a real result is reproducibly exported and displayed **or** the remaining NASA access blocker is clearly reported without invented results; the submission text matches that actual status; and the relevant tests/builds and provenance checks are reported with their real outcomes.
