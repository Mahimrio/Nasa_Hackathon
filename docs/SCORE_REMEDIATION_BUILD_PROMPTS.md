# Score Remediation Build Plan ? Six-Role 8+ Readiness Gate

**Project:** HydroSense-SWOT
**Status:** implementation specification; no application-code changes are included in this document
**Current internal baseline:** 3.5/10 under the six roles shown in the supplied rubric; this is a prior estimate, not an official score
**Target:** pass an evidence-based internal review above 8/10
**Score guarantee:** none. Judges control their rubric and may weigh criteria differently.

## 1. How to use this plan

This plan is designed to close the gaps that currently keep the project below an 8. It does not promise that completing a checklist earns a particular NASA score. A task is complete only when its acceptance evidence exists and an independent reviewer can reproduce or inspect it.

Use the six roles in the supplied image and equal weighting for internal scoring because no official weights were provided. Do not reuse the old predicted scores or score-per-hour claims. Those values were subjective, used a seven-perspective rubric, and included assumptions that are not yet verified.

**Internal 8+ rule:** do not describe the project as ?8+ ready? unless all six role gates in Section 3 pass, each role receives at least 8.2 from an independent reviewer using the same rubric, and the six-role mean is above 8.0. A failed or unverified gate means the result is below the 8+ target regardless of feature count.

## 2. Verified starting point and blockers

The following findings were checked against the repository during preparation of this revision. Re-run the checks before implementation because files and source data can change.

| Finding | Evidence | Why it blocks an 8+ claim |
|---|---|---|
| Current fixtures are synthetic, while fixture source comments and the generated README describe NASA/GPM and BWDB observations. | scripts/generate_fixtures.py, data/fixtures/README.md, docs/SYNTHETIC_DATA.md | Data provenance and scientific validation are not credible until labels and data paths are truthful. |
| The generator's --mode real path still creates synthetic SWOT event, IMERG rainfall, and gauge files. | scripts/generate_fixtures.py real-mode branch | A successful command is not proof that the whole dataset is real. |
| The trend explorer is planned, not implemented. | docs/TASKS.md, docs/DECISIONS.md | It is a core capability if the selected challenge requires trend detection. |
| Validation compares the simulation with itself as the baseline. | pipeline/validation_report.py, compare_model_vs_baseline call | Baseline skill claims must be withdrawn until the comparison is independent and rerun. |
| Lead time is passed as a fixed step count in the pipeline. | pipeline/run_pipeline.py | A displayed warning lead must follow a documented trigger and physical time alignment. |
| Pipeline and UI metric exports have differed. | Pipeline output versus ui/public/data/metrics_summary.json | Judges must see one reproducible value and its provenance. |
| The test suite has passed, but a recent run rewrote tracked generated outputs. | python -m pytest tests/ -q from the prior review | Tests must be hermetic and leave the repository unchanged. |
| The latest recorded lint run failed on a React hook rule in ui/app/context/TelemetryContext.js. | Prior review of npm run lint | A release-ready build requires the current lint result to be green or a documented, reviewed exception. |

No claim in this table should be presented as a new measurement. Attach the dated command output to the final evidence package.

## 3. Six-role score gates

These are internal readiness targets. The reviewer must score the evidence, not the ambition in this file.

| Role | Minimum evidence required for 8+ readiness |
|---|---|
| 1. NASA Space Apps judge | The selected official challenge is locked from the published challenge statement. Every required question maps to a working screen, computation, and demo moment. NASA data use is demonstrated through actual source records, not logos or product-shaped fixtures. |
| 2. Earth science & NASA data scientist | Every real-data claim has product/station IDs, dates, units, quality filtering, and source links. Synthetic data are isolated and labeled. Scientific assumptions, uncertainty, and independent validation are explicit. |
| 3. Statistical trend analysis specialist | The trend pipeline runs on verified NASA data; estimates, confidence intervals, autocorrelation handling, multiple-testing control, field significance, and detection power are correct and reproducible. Null findings are shown honestly. |
| 4. Senior software engineer & QA auditor | A clean checkout installs, runs, tests, lints, and builds from documented commands. Tests do not mutate tracked outputs. Schemas protect the JSON boundary; CI and browser smoke checks pass; displayed metrics match exports. |
| 5. Human impact & UX evaluator | Intended users can complete key tasks in English and Bengali, understand what is observed versus synthetic, and interpret uncertainty. Accessibility is checked. Any impact or harvest-loss claim has a cited source or is clearly marked as a scenario assumption. |
| 6. Independent red-team judge | Reviewers cannot find an unresolved critical/high-severity contradiction in the challenge fit, data provenance, validation, units/datum, lead-time definition, uncertainty, or user claims. Findings and fixes are recorded. |

### Challenge fit is a release gate

The repository currently keeps challenge selection provisional. Verify the exact challenge title, prompt, judging criteria, and participant rules from the official materials on the implementation date; record the access date and source in docs/DECISIONS.md.

Official pages to re-check at that gate: [Be An Earth System Trend Detective!](https://www.spaceappschallenge.org/2026/challenges/be-an-earth-system-trend-detective/) and [Field Shift: Adapting Farms with NASA Data](https://www.spaceappschallenge.org/2026/challenges/field-shift-adapting-farms-with-nasa-data/). The final decision must use the challenge actually selected by the team and the current participant guide.

If the selected challenge is **Be An Earth System Trend Detective!**, the trend explorer must be the main answer: it needs to examine NASA Earth variables over time, show what and where they change, quantify change, and assess significance. The flood-warning dashboard can be supporting context, but it cannot substitute for trend analysis.

If the team selects **Field Shift: Adapting Farms with NASA Data**, the current flood-warning workflow does not by itself answer the challenge. The solution must also support crop-rotation decisions with the required local soil information, crop characteristics, and farmer priorities. Do not solve a challenge-title mismatch by changing only the README.

If the official challenge or rules differ, stop and update this mapping before building challenge-specific features.

## 4. Build sequence

Keep the offline demo, synthetic test fixtures, and product scope already recorded in docs/DECISIONS.md. This plan does not authorize live API requirements during judging or a new operational warning service.

### Gate 0 ? Fresh audit and challenge lock

**Prompt:** Review the current repository, published official challenge materials, and the six-role rubric. Record the exact challenge statement and judging criteria; map each criterion to an implemented capability, evidence artifact, and demo step. Identify unsupported or pending requirements. Do not change the challenge decision until the team lead approves the mapping.

**Pass:** The map has a source link and access date for every challenge claim. No criterion is marked ?answered? based only on planned work. The selected challenge is approved in docs/DECISIONS.md.

### Gate 1 ? Provenance and truthful claims

**Prompt:** Implement docs/SYNTHETIC_DATA.md. Correct generator docstrings, NetCDF attributes, CSV labels, and generated data/fixtures/README.md. Add a machine-readable manifest produced by the generator. Make real ingestion fail closed per file; never mix generated gauge/rainfall/event data under a whole-dataset ?real? label. Surface provenance in UI cards, charts, JSON exports, presentation scripts, and the data download path. Put fixture generation behind a configurable output directory so tests can use temporary paths.

**Pass:** Manifest covers every data file and includes provenance type, source or generator, version/seed, units, time coverage, processing steps, and file hash. Tests verify manifest completeness and that synthetic outputs are labeled synthetic. No current UI or documentation calls a synthetic value observed or forecast skill.

### Gate 2 ? Real source data and independent scientific evaluation

**Prompt:** For the chosen challenge, download and cache the required NASA source data with collection/version, product IDs, spatial/temporal query, granule or asset IDs, access date, units, QA decisions, and hashes. Keep cached real data separate from synthetic fixtures. For Module 1 claims, obtain independently observed gauge data and rainfall forcing or withdraw the performance claim. Split calibration and evaluation by event/time before fitting. Evaluate more than one independent event when source coverage allows; never tune on the reported holdout.

**Pass:** A reviewer can reproduce the source selection from the recorded IDs and run command. Real and synthetic rows never share an unlabeled series. If independent observations cannot be obtained, the model remains a synthetic demonstration and no observed-skill claim is made.

### Gate 3 ? Repair the Module 1 validation chain

**Prompt:** Fix the baseline self-comparison in pipeline/validation_report.py. Use a genuinely separate baseline series. Replace fixed lead steps with a documented time-based definition derived from the actual routing horizon. Audit gauge station identity, stage datum, rainfall interval convention, unit conversion, resampling tolerance, and model/test period separation. Recompute every metric from one pipeline function and export the result once.

**Pass:** Unit tests prove the baseline and model inputs are distinct; a hand-check reproduces selected metrics; pipeline report and UI JSON match exactly; first threshold transition and observed crossing are timestamped and independently inspectable. Any worse-than-baseline or negative result remains visible.

### Gate 4 ? Ship the trend-analysis module when required by the chosen challenge

**Prompt:** Implement the approved rainfall-first trend explorer on real NASA GPM IMERG Final Run V07 daily data, following the current project decision on products, seasons, and cell-first indicators. Record collection version, granule IDs, source coverage, missing-data handling, and exclusions. Calculate Sen's slope and confidence interval; handle serial dependence with a documented Modified Mann-Kendall method; report effect size as well as p-value.

For grid-wide claims, control multiplicity and test field significance. Do not shuffle individual year labels and call the result valid when the data have temporal dependence. Use a null/resampling design that preserves relevant temporal dependence and spatial covariance, calibrate its false-positive rate with simulation, and document the assumptions. Run a power analysis and show the minimum detectable trend. If the coverage or power is insufficient, display ?insufficient evidence? or ?no significant trend,? not a colored trend claim.

**Pass:** A clean command builds the trend JSON from the recorded real data; maps and charts agree with the output; tests cover missing seasons, null results, autocorrelation, multiplicity, field significance, and injected known trends. Synthetic series may appear only in isolated tests, never in production trend results.

### Gate 5 ? One source of truth for displayed values

**Prompt:** Remove metric literals and timestamp literals from UI components. Export typed/schema-validated JSON with provenance, source rows, time range, method, units, and computation version. Have the UI render these values without recomputing them. Validate required fields at load time and show an explicit data/error state when validation fails.

**Pass:** A scripted comparison confirms every displayed metric and date matches the export for both synthetic demo mode and any real-data mode. No stale generated file can silently override a current result.

### Gate 6 ? Reproducibility, CI, and release QA

**Prompt:** Make tests hermetic. Any test that writes an artifact must write under a temporary directory. Add CI for Python tests, lint, production build, JSON schema checks, and UI smoke routes. Pin or lock dependencies. Add a clean-checkout runbook and verify offline demo operation using the intended cached data.

**Pass:** From a clean clone, documented setup and run commands succeed; tests leave git status clean; CI is green; production routes load; browser smoke checks pass at desktop and mobile widths in English and Bengali; no console errors or broken chart states remain. Record the exact commands and versions.

### Gate 7 ? User impact and accessible interaction

**Prompt:** Run task-based sessions with intended users or the closest reachable, clearly described user group. Test whether participants can identify the situation, time horizon, recommended next step, data source, synthetic/real status, and uncertainty. Test the core tasks in English and Bengali on mobile. Check keyboard operation, semantic labels, contrast, reduced motion, screen-reader text alternatives for maps/charts, and visible non-color status cues. Obtain consent before recording or quoting participants.

**Pass:** Store the test script, anonymized findings, task success and misunderstanding counts, and changes made. Report sample size and limits. Do not claim validated local impact from a small convenience sample. Cite any yield-loss or economic-impact figure; otherwise label it an illustrative scenario and keep it out of headline claims.

### Gate 8 ? Independent red-team review

**Prompt:** Ask reviewers who did not implement the model to attack the challenge mapping, each scientific headline, data provenance, observation/model independence, station/datum, lead-time definition, uncertainty band, trend method, accessibility, and decision recommendation. Require every claim to point to source data, code, and a reproducing command. Fix or explicitly withdraw each high-severity claim.

**Pass:** The red-team log includes issue, severity, evidence, disposition, owner, and retest. No unresolved critical/high issue remains. ?We disclosed it? does not count as a fix for a claim that is still false or unsafe.

### Gate 9 ? Judge rehearsal and evidence package

**Prompt:** Prepare a short, working demo that follows the published challenge's own question. Demonstrate a real source record, the analysis, uncertainty, a result (including a null result if applicable), and the user-facing explanation. Rehearse from a clean checkout with the network disabled after required data have been cached. Prepare a claim ledger linking every number in the video and README to its source and command.

**Pass:** A reviewer unfamiliar with the repository can run the demo, find the evidence in under five minutes, and explain what the result does and does not show.

## 5. Score evidence package

Keep a release folder under docs/evidence/ or an equivalent approved location with:

- Official challenge statement, judging criteria, link, access date, and criterion-to-feature map.
- Data inventory with product/station IDs, version, granule IDs, licenses, access dates, file hashes, units, QA, and provenance.
- Exact setup, test, lint, build, pipeline, and demo commands with captured output.
- Calibration/evaluation split and holdout results; baseline definition; metric calculation source; uncertainty method.
- Trend method, confidence intervals, autocorrelation and multiplicity handling, field-significance design, power result, and null cases.
- UI screenshots/video for desktop and mobile in English and Bengali; accessibility findings.
- Anonymized user-test report and limits on inference.
- Independent red-team findings and closure evidence.
- Final six-role scorecard with named reviewers, evidence links, and unresolved limitations.

A claim without a source or reproduction path is removed from the pitch and README.

## 6. Internal scorecard

Use the rubric in the supplied image. Reviewers assign 0?10 based only on evidence. Do not fill in scores before Gates 0?9 pass.

| Role | Reviewer score | Evidence link | Open blocker |
|---|---:|---|---|
| NASA Space Apps judge | pending | pending | pending |
| Earth science & NASA data scientist | pending | pending | pending |
| Statistical trend analysis specialist | pending | pending | pending |
| Senior software engineer & QA auditor | pending | pending | pending |
| Human impact & UX evaluator | pending | pending | pending |
| Independent red-team judge | pending | pending | pending |
| **Equal-weight mean** | **pending** | | |

**8+ sign-off:** all six reviewers score at least 8.2, the equal-weight mean is above 8.0, all gates pass, and there is no unresolved critical/high red-team finding. If these conditions are not met, report the actual score and keep the 8+ target marked incomplete.

## 7. Stop conditions and honest fallback

- If official challenge fit is not confirmed, do not claim alignment.
- If NASA source access fails, retain offline synthetic fixtures, label them, and withdraw real-data claims.
- If independent gauge observations are unavailable, do not report the flood model's synthetic score as validation.
- If trend coverage or statistical power is inadequate, show the uncertainty or null result; do not tune the period or grid to obtain significance.
- If user testing cannot be arranged, report UX as unvalidated and do not claim more than demonstrated usability.
- If a critical QA or red-team gate fails, do not publish ?8+ ready.?

## 8. Pre-mortem

| Likely failure | Safeguard |
|---|---|
| The team implements many features but still answers the wrong official challenge. | Gate 0 locks the exact published prompt before challenge-specific work and maps every judging criterion to a working capability. |
| A working pipeline is mistaken for scientific validation because synthetic series are smooth and paired. | Provenance follows every file and displayed value; independent real holdouts are required for skill claims; synthetic scores are labeled as scenarios. |
| The internal score rises through optimistic self-grading rather than evidence. | Six reviewers use the supplied role rubric after all gates pass; no prompt has an additive score claim; unresolved high-severity findings block 8+ sign-off. |

## 9. Change control

This is a documentation plan, not authorization to change application code or the frozen product scope. Implement code work only through the project's approved work-order process. Preserve the current challenge decision as provisional until the team verifies the official materials and approves a mapping. Update docs/TASKS.md, docs/DECISIONS.md, docs/AGENTS.md, and README.md when an approved scope or architecture decision changes.

**Document review date:** 2026-10-24
**AI contribution:** this revised plan and the companion synthetic-data disclosure were prepared with AI assistance and must be recorded in docs/AI_USE_LOG.md.
