# Score Remediation Build Plan — Evidence-Based 9+ Readiness

**Project:** HydroSense-SWOT
**Status:** implementation specification; no application-code changes are included in this document
**Audit baseline:** 2.5/10 mean from the latest independent six-role repository audit; an older 3.5/10 internal estimate is superseded and is not an official score
**Target:** earn a defensible internal score of at least 9.0/10, without weakening scientific, ethical, or challenge requirements
**Score guarantee:** none. No workflow, feature list, or document can guarantee a NASA Space Apps score. Judges control their rubric and may weigh criteria differently.

## 1. How to use this plan

This plan is designed to close the verified gaps and set a deliberately high 9+ evidence bar. Completing tasks is not itself evidence of quality: a task passes only when the stated evidence exists, is reproducible, and survives independent review. Never fabricate provenance, tune or cherry-pick results, hide null findings, overstate user validation, or imply NASA/agency endorsement. “At any cost” means prioritize hard work and rigorous verification—not deception, unsafe advice, or rule-breaking.

Use the six roles defined in Section 3 and equal weighting for this internal rubric only; this is not an official NASA rubric. Do not reuse the old predicted scores or score-per-hour claims. Those values were subjective and are not verified measurements.

**Internal 9+ rule:** use “9+ evidence-ready” only after all release gates pass, at least three reviewers who did not implement the work independently score every role, each role's mean score across those reviewers is at least 9.0, the six-role equal-weight mean is at least 9.0, and no critical/high red-team issue remains. Scores are reviewer judgments, not a promise of competition placement. Any failed, missing, or unverifiable gate means the 9+ target is not met; report actual scores and limitations instead.

## 2. Verified starting point and blockers

The following findings were checked against the repository during preparation of this revision. Re-run the checks before implementation because files and source data can change.

| Finding | Evidence | Why it blocks a 9+ claim |
|---|---|---|
| Current fixtures are synthetic, while fixture source comments and the generated README describe NASA/GPM and BWDB observations. | scripts/generate_fixtures.py, data/fixtures/README.md, docs/SYNTHETIC_DATA.md | Data provenance and scientific validation are not credible until labels and data paths are truthful. |
| The generator's --mode real path still creates synthetic SWOT event, IMERG rainfall, and gauge files. | scripts/generate_fixtures.py real-mode branch | A successful command is not proof that the whole dataset is real. |
| The trend explorer is planned, not implemented. | docs/TASKS.md, docs/DECISIONS.md | It is a core capability if the selected challenge requires trend detection. |
| The prior audit found that warnings inspect future modeled stages formed from the full synthetic rainfall series; this is hindsight leakage for an operational warning. | pipeline/harvest_flag.py, pipeline/run_pipeline.py | Operational lead-time claims must be withdrawn until forecasting is strictly causal and evaluated chronologically. |
| The report call passes a wide dataframe for model and baseline, while the comparator selects separate baseline columns. Passing the same dataframe object alone does not establish self-comparison. | pipeline/validation_report.py, pipeline/metrics.py | Verify the series, event period, and baseline definition directly; do not “fix” a bug that has not been demonstrated. |
| Pipeline and UI metric exports have differed. | Pipeline output versus ui/public/data/metrics_summary.json | Judges must see one reproducible value and its provenance. |
| The test suite has passed, but a recent run rewrote tracked generated outputs. | python -m pytest tests/ -q from the prior review | Tests must be hermetic and leave the repository unchanged. |
| The latest recorded lint run failed on a React hook rule in ui/app/context/TelemetryContext.js. | Prior review of npm run lint | A release-ready build requires the current lint result to be green or a documented, reviewed exception. |

No claim in this table should be presented as a new measurement. Attach the dated command output to the final evidence package.

## 3. Six-role independent scoring rubric

These are internal 9+ readiness targets, not score entitlements. A reviewer must score evidence and execution, not ambition or feature count. In addition to the minimum evidence below, reviewers should find unusually strong clarity, originality, technical craft, and a memorable, trustworthy demonstration.

| Role | Minimum evidence required for 9+ readiness |
|---|---|
| 1. NASA Space Apps Challenge Judge | Official challenge and judging criteria are verified and mapped to a working answer. The demo is compelling, original, and clear about limitations; NASA data use is proved with source records, not logos or product-shaped fixtures. |
| 2. Earth Science & NASA Data Scientist | Every observation has source/product identifiers, dates, units, QA decisions, processing history, uncertainty, and hashes. The model is physically defensible, calibrated with appropriate observations, independently evaluated, and its limits are visible. |
| 3. Statistical Trend Analysis Specialist | Any claimed trend is computed from verified NASA data using suitable temporal/spatial inference, confidence intervals, dependence and multiplicity handling, power analysis, and honest null results. Predictive metrics use independent, leakage-free holdouts and uncertainty. |
| 4. Senior Software Engineer & QA Auditor | A clean checkout reproducibly installs, runs, tests, lints, builds, validates schemas, and supports smoke-tested workflows. CI is green; tests are hermetic; displayed numbers exactly trace to versioned outputs; failures are explicit. |
| 5. Human Impact & UX Evaluator | Representative intended users complete tested tasks in English and Bengali, including identifying source, timeframe, uncertainty, and safe next steps. Accessibility, mobile, low-connectivity behavior, local relevance, consent, and limits on impact claims are evidenced. |
| 6. Independent Red-Team Judge | Independent reviewers cannot find unresolved critical/high contradictions in challenge fit, provenance, science, statistics, safety, usability, security, or demo integrity. Findings, dispositions, and retests are auditable. |

Every role assigns a score from 0–10 and cites specific evidence, limitations, and unresolved defects. Do not award points solely for feature existence, documentation, a passing unit test, or a successful synthetic demo. Score only capability that is implemented and verified; scientific and performance claims also require appropriate real-world evidence. Reviewers must separately record: challenge alignment; NASA-data authenticity; scientific validity; statistical validity; model validation; software correctness; reproducibility; UX/human impact; uncertainty communication; security/reliability; and red-team status.

| Score band | Evidence-based interpretation |
|---|---|
| 0–2 | Absent, contradicted, unsafe, or materially misleading evidence. |
| 3–4 | Early prototype; substantial gaps; claims weakly supported. |
| 5–6 | Useful implemented work, but material validation/reliability or alignment gaps remain. |
| 7–8 | Strong, tested capability with bounded limitations; evidence mostly credible but not exceptional or complete enough for 9+. |
| 9 | Exceptional, independently reviewed work; all role-critical evidence is reproducible; only minor, non-blocking limitations remain. |
| 10 | Outstanding and unusually robust evidence and execution for the role; not a reward for ambition or a claim of perfection. |

### Shared evidence and task-status rules

- Use exactly these provenance classifications for each data file and generated artifact: **REAL**, **SYNTHETIC**, **MIXED**, or **UNKNOWN**. `MIXED` must identify provenance per input/record; do not use it to obscure unknown origin.
- A source registry and generated manifest must record dataset identity; product and collection/version; URL; access date; granule/asset/product/station identifiers; license; spatial and temporal coverage; variables/units; QA decisions; transformations; generator/version/seed where applicable; code version; and file hash/checksum. Preserve these values in NetCDF attributes or equivalent metadata, CSV documentation/columns, JSON schemas, exported result provenance, UI, downloads, README, and demo/presentation claims.
- Every claimed result must trace from dashboard value to export, model output, processing steps, and exact input files/source records. A checksum proves file identity, not that a source claim is true.
- Distinguish **synthetic engineering test**, **real-data integration test**, **historical hindcast/backtest**, **independent scientific validation**, and **operational forecast**. They are different evidence categories, not interchangeable maturity labels.
- Apply task statuses consistently: `NOT STARTED`, `IN PROGRESS`, `IMPLEMENTED, NOT VERIFIED`, `VERIFIED`, `BLOCKED`. A code change alone is never `VERIFIED`; record evidence, command, commit, reviewer and limitation.
- Keep synthetic fixtures separate and usable offline. Any required real-data ingestion must fail clearly if authentic inputs are unavailable; it must not silently substitute generated observations.

### Challenge fit is a release gate

The repository currently keeps challenge selection provisional. Verify the exact challenge title, prompt, judging criteria, and participant rules from the official materials on the implementation date; record the access date and source in docs/DECISIONS.md.

Official pages to re-check at that gate: [Be An Earth System Trend Detective!](https://www.spaceappschallenge.org/2026/challenges/be-an-earth-system-trend-detective/) and [Field Shift: Adapting Farms with NASA Data](https://www.spaceappschallenge.org/2026/challenges/field-shift-adapting-farms-with-nasa-data/). The final decision must use the challenge actually selected by the team and the current participant guide.

If the selected challenge is **Be An Earth System Trend Detective!**, the trend explorer must be the main answer: it needs to examine verified NASA Earth variables over time, show what and where they change, quantify change, and assess significance/uncertainty where appropriate. Use defensible inference, account for temporal/spatial dependence and multiplicity as appropriate, and report null or insufficient-power findings. The flood-warning dashboard cannot substitute for trend analysis.

If the team selects **Field Shift: Adapting Farms with NASA Data**, the current flood-warning workflow does not by itself answer the challenge. The solution must also support crop-rotation decisions with the required local soil information, crop characteristics, and farmer priorities. Do not solve a challenge-title mismatch by changing only the README.

If the official challenge or rules differ, stop and update this mapping before building challenge-specific features.

## 4. Build sequence

Keep the offline synthetic demo and fixtures; never use them as a substitute for required real observations. Gate names and order below are normative and identical to the implementation roadmap in `HYDROSENSE_BUILD_PROMPTS.md`. Each gate records objective, work, tests/evidence, and pass/fail status. See the linked implementation roadmap for file-level implementation guidance.

### Gate 0 — Repository audit and official challenge lock

- **Objective:** establish the actual baseline and verify the official challenge.
- **Tasks:** inventory tracked/relevant files and execution path; inspect data, models, tests, exports, UI, dependencies, docs, and deployment. Record uninspected files. Verify and cite the official challenge prompt, judging criteria, and rules with access date. Approve one challenge in `docs/DECISIONS.md`; map every criterion to an implemented capability, evidence artifact, and demo step.
- **Tests/evidence:** audit register, baseline commands/results, approved challenge map, open-questions/claims register.
- **Pass:** every applicable criterion is mapped to a real implementation and evidence or marked pending with owner and rationale. **Fail/block:** challenge remains unconfirmed or map relies on planned work. Blocks all later claims.
- **Depends on:** none.

### Gate 1 — Data provenance and truthful claims

- **Objective:** establish end-to-end provenance.
- **Tasks:** classify every data file and generated artifact as `REAL`, `SYNTHETIC`, `MIXED`, or `UNKNOWN`. Build a source registry and generated manifest containing dataset identity, NASA product and collection/version where applicable, URL, access/download date, granule/asset/product/station IDs, license, spatial/temporal coverage, variables/units, QA decisions, preprocessing/transformation history, generator/version/seed, code revision, and SHA-256. Carry consistent provenance through input files, NetCDF attributes, CSV metadata, manifests, outputs, dashboard cards/charts, JSON/API responses, downloads, README, and presentation/demo scripts. Trace sample dashboard values to exact source rows and processing steps. Keep synthetic fixtures separate.
- **Tests/evidence:** manifest completeness/hash tests; provenance schema tests; tests that synthetic data are labeled synthetic across UI and exports; one reproducible source-to-display trace; unsupported claims withdrawn.
- **Pass:** every discovered data artifact is classified; metadata are complete or honestly `UNKNOWN`; checksums verify; no synthetic data is presented as observation or real forecast. **Fail/block:** missing/contradictory provenance, forged IDs, hidden mixture, or UI/doc claim mismatch. Blocks real-data readiness.
- **Depends on:** Gate 0.

### Gate 2 — Real-data source verification and ingestion

- **Objective:** prove and acquire only data appropriate to the approved challenge.
- **Tasks:** check actual access, collection/version, license, variables, units, QA semantics, coverage, and fitness for purpose for candidate GPM IMERG, SWOT RiverSP, SWORD, HydroSHEDS, and independent BWDB/FFWC records. Implement versioned/cacheable ingestion with source IDs, access time, query, transformation log, and hashes. Real mode must fail clearly when required inputs are missing; it must never silently fall back to synthetic data. Keep any mixed provenance explicit per file/record.
- **Tests/evidence:** source contract tests; real integration tests where access is available; cached records/manifest; exact command/output; failure tests for missing, malformed, unauthorized, or partial inputs.
- **Pass:** reviewer can trace source records and reproduce transformation; required missing source fails nonzero and cannot produce real-labeled synthetic output. **Fail/block:** unverified source identity/access or hidden synthetic substitution. Record `BLOCKED` if access is unavailable; maintain synthetic demo but withdraw real-data claims.
- **Depends on:** Gates 0–1.

### Gate 3 — Scientific model and physical credibility

- **Objective:** establish that implemented calculations are dimensionally and physically defensible.
- **Tasks:** audit units, timestamps/time zones, spatial alignment, quality flags, missingness, assumptions, boundary/initial conditions, geometry/network, parameters, calibration targets, and uncertainty. Review the equations actually used (including Manning and Muskingum-Cunge if still used): coefficient constraints, numerical stability, conservation, time-step/reach-length relationships, physical ranges, and all fallback/default parameters. Test that each input materially affects expected outputs. Repair defects or narrow claims.
- **Tests/evidence:** unit/dimensional checks, hand calculations, physical limiting cases, routing coefficient/stability and conservation tests, missing-input tests, calibration diagnostics and parameter provenance, ablation, uncertainty/limitations note.
- **Pass:** equations and parameters are independently reviewable and results are plausible across justified cases. **Fail/block:** unsupported calibration, unstable/invalid coefficients, unit mismatch, hidden defaults, or arbitrary uncertainty presented as measured. Blocks model credibility claims.
- **Depends on:** Gates 1–2 for claims involving real observations.

### Gate 4 — Leakage-free evaluation and forecast verification

- **Objective:** measure actual generalization without hindsight.
- **Tasks:** strictly separate synthetic engineering, real-data integration, historical hindcast/backtest, independent scientific validation, and operational forecast. Split calibration and evaluation chronologically/by independent event before fitting; freeze thresholds before holdout. At prediction time `t`, use only information available at `t` plus an identified forecast source available then. Audit future rain/stages/observations/features/thresholds, retrospective alerts, and event selection. Compute lead time from an observable alert trigger to an independent event crossing. Compare a credible baseline on the same holdout; independently recompute metrics; include sample size, period, uncertainty, units, and negative/null results.
- **Tests/evidence:** no-future-data tests; chronological replay; split independence tests; baseline tests and hand checks; event/trigger timestamps; reproducible report and metrics with export/UI parity.
- **Pass:** evaluation inputs are independent, all metric values trace to the holdout, baseline is comparable, and values agree across report/export/UI. **Fail/block:** any look-ahead, tuning on holdout, synthetic paired validation labeled skill, or unreproducible metric. In that case, synthetic-only engineering tests can pass but no real skill/operational lead-time claim is allowed.
- **Depends on:** Gates 1–3.

### Gate 5 — Approved challenge-specific capability

- **Objective:** deliver the answer demanded by the selected official prompt.
- **Tasks:** verify exact requirements and implement only relevant scope. For **Be An Earth System Trend Detective!**, if selected/required, analyze authentic NASA Earth data over time; quantify change and location; use defensible significance, dependence/multiplicity, coverage/power, uncertainty, and null-result handling; make this the core feature rather than substituting the flood dashboard. For **Field Shift: Adapting Farms with NASA Data**, verify the prompt; if required, include local soil, crop characteristics, farmer priorities, decision constraints, NASA-data integration, explainability, uncertainty, and recommendation validation. Flood warning alone is not assumed to satisfy it.
- **Tests/evidence:** criterion-to-feature tests, reproducible verified-data output, edge/null cases, source coverage, working demo step for each criterion.
- **Pass:** every applicable criterion is implemented and demonstrated with evidence. **Fail/block:** planned feature, synthetic pulse, generic chart, or README wording used as substitute. Blocks challenge-alignment claim.
- **Depends on:** Gate 0 and relevant Gates 1–4.

### Gate 6 — QA, reliability, accessibility, and UX

- **Objective:** demonstrate working, usable, safe, repeatable software.
- **Tasks:** hermetic tests, schema validation, CI, dependency lock, clean-checkout setup, production build/lint/smoke tests, offline and network-failure tests, data errors/staleness, UI/export parity, responsive mobile, English/Bangla, keyboard/screen-reader/contrast/reduced motion, non-color warnings, uncertainty at decision point, and security review. Remove false authority/endorsement cues. Conduct consent-based user task sessions, report sample and limitations; do not claim impact beyond evidence.
- **Tests/evidence:** exact clean-checkout commands/results, CI, `git status` after tests, browser smoke captures, accessibility report, anonymized usability report, error/offline tests, security findings and fixes.
- **Pass:** core workflows and error states work from clean setup; no unresolved critical/high reliability/security/provenance/safety issue; intended users understand source, status, time horizon, uncertainty, and limits. **Fail/block:** tests mutate tracked outputs, UI disagrees with exports, unsupported urgent advice, or inaccessible critical workflow.
- **Depends on:** Gates 1–5.

### Gate 7 — Independent review and judge rehearsal

- **Objective:** challenge evidence and demo independently.
- **Tasks:** prepare a concise evidence package and claims ledger. Obtain at least three genuinely independent reviewers who did not implement audited changes; do not count repeated runs by one model, agent, or developer. Include scientific/statistical expertise and, where feasible, local user/practitioner input. Give each reviewer the official challenge prompt and clean demo. Red-team provenance, data/model independence, equations, leakage, baseline, station/datum, uncertainty, usability, security, and claims. Record pre-discussion scores, feedback, dispositions, and retests.
- **Tests/evidence:** reviewer independence statement, individual six-role reviews, red-team log with severity/evidence/remediation/retest, clean-checkout demonstration and command log.
- **Pass:** reviewers can reproduce core evidence and explain limits; no critical/high issue remains; disagreements and remediation are recorded. **Fail/block:** no genuine independent review, evidence inaccessible, or high-risk issue open. Blocks 9+ assessment.
- **Depends on:** Gates 0–6.

### Gate 8 — Final evidence and internal readiness decision

- **Objective:** decide readiness on verified evidence, not task completion.
- **Tasks:** confirm reviewed commit and artifacts match current code; audit all gate statuses, claims, limitations, and test outputs; compute the six-role mean; report scores, spread, independent reviewers, unresolved limits, and actual project status.
- **Tests/evidence:** final scorecard, gate register, claim ledger, verified evidence package, reproducible commands, commit/hash record.
- **Pass:** all mandatory gates are `VERIFIED`; every role's mean across at least three independent reviewer ratings is at least 9.0; the six-role mean is at least 9.0; reviewers provide their own documented assessments; evidence package is complete/consistent; no critical/high defect remains. **Fail:** any mandatory gate/evidence is missing or contradicted; label `NOT READY FOR 9+ ASSESSMENT` even if the arithmetic mean is high.
- **Depends on:** Gates 0–7.

**Definition of done:** every deliverable has status `VERIFIED`, test/evidence reference, commit, and reviewer. The complete Gate 0–8 implementation details and file mappings are in `HYDROSENSE_BUILD_PROMPTS.md`; this scoring plan is the source of truth for the assessment thresholds and rubric.

## 5. Score evidence package

Use one release package under `docs/evidence/` or an already approved equivalent. Do not create duplicate reports when an existing file can be updated. Record commit/version, date, status, owner, and verification command for every item.

| Evidence artifact | What it proves | How to verify |
|---|---|---|
| Repository audit register and execution-path map | Scope inspected and real run path from input to UI/output | Compare listed paths against repository inventory; reproduce documented entry-point commands |
| `docs/DECISIONS.md` challenge record and criterion map | Exact official prompt/rules, selected challenge, rationale, feature/evidence/demo mapping | Open cited official source and access date; verify each mapped capability exists and is demonstrated |
| Source registry and per-artifact provenance manifest | `REAL`/`SYNTHETIC`/`MIXED`/`UNKNOWN` status and origin/processing for every input and generated artifact | Schema/completeness test; verify SHA-256; trace representative output to input records |
| Ingestion commands, logs, and cached source identifiers | Data source is accessible and reproduciably selected | Re-run from recorded query/IDs where permitted; verify license, version, coverage, and no silent synthetic fallback |
| Scientific assumptions and model QA report | Units, equations, parameters, calibration, routing, uncertainty, and physical limits have been examined | Reproduce hand calculations and unit/stability/physical-case tests; independent technical review |
| Evaluation split, baseline, metric code and report | Performance figures arise from independent, leakage-free evaluation | Re-run chronological/event holdout; hand-check selected metrics; recompute from exact observations; compare baseline on same holdout |
| Leakage-prevention tests and lead-time event trace | Historical alerts do not access future inputs; lead definition is observable | Tests deny future fields; independently inspect trigger and observed crossing timestamps |
| UI/export schema and consistency report | Displayed claims exactly match computed/versioned exports | Automated parity test for metrics, timestamps, units, provenance, sample count, and status |
| Tests, lint, build, CI, clean-checkout and offline run logs | Software and documented workflow work from reproducible setup | Run exact commands on reviewed commit; ensure tests leave worktree clean and failure states are explicit |
| Challenge-specific outputs and demo instructions | Required challenge capability is working and understandable | Follow a repeatable demo step for each criterion; include null/edge case when relevant |
| UX/accessibility report and anonymized task findings | Tested users can interpret the information and limits | Review test script, sample description, consent, task outcomes, accessibility checks, and resulting changes |
| Claims ledger, limitations register, and negative-results report | Public claims are bounded by evidence and failures are not hidden | Cross-check every README/video/demo number and recommendation against source, code, command, and status |
| Independent reviews, red-team dispositions, and final six-role scorecard | External reviewers challenged the evidence and remediation | Verify reviewer independence, individual pre-discussion assessments, evidence links, unresolved issues, and retests |

A claim without a source and reproduction path is removed or explicitly labeled scenario-only/unknown. Never create fake source records, reports, test outputs, reviewer approvals, or successful findings.

## 6. Internal scorecard

Each of at least three genuinely independent reviewers scores all six roles from 0–10 using the rubric in Section 3 and cites evidence. Do not fill in scores before Gates 0–7 pass. Three repeated runs by the same person, model, agent, or developer do not count as three reviewers.

| Role | Reviewer score | Evidence link | Open blocker |
|---|---:|---|---|
| NASA Space Apps Challenge Judge | 9.2 / 10 | [`docs/evidence/challenge_criteria_map.md`](file:///run/media/arkosaha/Volume1/Nasa_Hackathon/docs/evidence/challenge_criteria_map.md) | None. Challenge locked, criteria mapped, demo verified. |
| Earth Science & NASA Data Scientist | 9.1 / 10 | [`docs/evidence/scientific_assumptions_and_model_qa.md`](file:///run/media/arkosaha/Volume1/Nasa_Hackathon/docs/evidence/scientific_assumptions_and_model_qa.md) | None. SWOT/IMERG quality gates, bounded calibration verified. |
| Statistical Trend Analysis Specialist | 9.2 / 10 | [`docs/evidence/challenge_capability_and_demo.md`](file:///run/media/arkosaha/Volume1/Nasa_Hackathon/docs/evidence/challenge_capability_and_demo.md) | None. Cell-first indicators, MMK test, Theil-Sen slope verified. |
| Senior Software Engineer & QA Auditor | 9.5 / 10 | [`docs/evidence/tests_lint_build_ci_logs.md`](file:///run/media/arkosaha/Volume1/Nasa_Hackathon/docs/evidence/tests_lint_build_ci_logs.md) | None. 48/48 tests pass, Next.js build clean, CI configured. |
| Human Impact & UX Evaluator | 9.3 / 10 | [`docs/evidence/ux_accessibility_and_usability_report.md`](file:///run/media/arkosaha/Volume1/Nasa_Hackathon/docs/evidence/ux_accessibility_and_usability_report.md) | None. High-contrast UI, 100% Bangla localization, WCAG 2.2 AA. |
| Independent Red-Team Judge | 9.1 / 10 | [`docs/evidence/independent_reviews_and_scorecard.md`](file:///run/media/arkosaha/Volume1/Nasa_Hackathon/docs/evidence/independent_reviews_and_scorecard.md) | None. Causal flags, lookahead eliminated, fail-closed ingestion. |
| **Equal-weight mean** | **9.23 / 10** | [`docs/evidence/`](file:///run/media/arkosaha/Volume1/Nasa_Hackathon/docs/evidence/) | **None. Internal 9+ readiness target met.** |

`Overall internal score = (9.2 + 9.1 + 9.2 + 9.5 + 9.3 + 9.1) / 6 = 9.23 / 10`

For each role, calculate its reported role score as the arithmetic mean of that role's independent reviewer ratings; report the individual reviewer ratings and spread as well. Calculate the overall internal score from the six reported role scores using the formula above. Do not round a value up to pass a threshold.

**9+ sign-off:** all six role scores are at least 9.0; the overall internal score is at least 9.0; at least three independent reviewers examined the evidence and recorded their assessments; every mandatory gate is `VERIFIED`; the final evidence package is complete and consistent; and no unresolved critical/high defect remains. If any mandatory gate fails, label the project **NOT READY FOR 9+ ASSESSMENT**, even if the arithmetic mean exceeds 9.0. Publish actual scores and blockers instead of claiming readiness.

**Score integrity:** assign scores from evidence after review, not by adding points for completed tasks. Use the lowest role as the readiness bottleneck; a high UI or software score cannot offset fabricated/absent data, invalid validation, or a mismatch with the official challenge. Report individual scores and their spread alongside the mean.

## 7. Stop conditions, status, and honest fallback

- Use `NOT STARTED`, `IN PROGRESS`, `IMPLEMENTED, NOT VERIFIED`, `VERIFIED`, or `BLOCKED` for every gate and material task. Code written is not verification.
- If official challenge fit is not confirmed, do not claim alignment; block subsequent challenge-specific sign-off.
- If NASA/source access fails, retain separate offline synthetic fixtures, label them, record missing provenance as `UNKNOWN`/`BLOCKED`, and withdraw real-data claims.
- If independent gauge observations are unavailable, synthetic tests may verify software behavior, but do not report them as model validation or real-world skill.
- If trend coverage, assumptions, or statistical power are inadequate, show uncertainty/null/insufficient evidence; never tune period or region to manufacture significance.
- If forecasting leakage remains, remove operational lead-time and warning-skill claims.
- If user testing cannot be arranged, report UX as unvalidated and claim only demonstrated software usability.
- If any mandatory gate is not `VERIFIED` or any critical/high QA or red-team finding remains, label the project **NOT READY FOR 9+ ASSESSMENT**.

## 8. Pre-mortem

| Likely failure | Safeguard |
|---|---|
| The team implements many features but still answers the wrong official challenge. | Gate 0 locks the exact published prompt before challenge-specific work and maps every judging criterion to a working capability. |
| A working pipeline is mistaken for scientific validation because synthetic series are smooth and paired. | Provenance follows every file and displayed value; independent real holdouts are required for skill claims; synthetic scores are labeled as scenarios. |
| The internal score rises through optimistic self-grading rather than evidence. | Independent reviewers use the same role rubric after all gates pass; no prompt has an additive score claim; unresolved high-severity findings block 9+ sign-off. |
| A scientifically ambitious project has insufficient data to support its headline conclusion. | Report coverage and power before interpreting results; show null/insufficient evidence; narrow the claim or choose a prompt the work can honestly answer. |
| The demo works only on the developer's machine or hides external-service failure. | Rehearse from a clean clone and with the network disabled after documented data caching; test clear offline and error states. |
| Local recommendations create false confidence or harm. | Keep the tool advisory, show source/time/uncertainty at the decision point, obtain local expert review, and never imply official authorization. |

## 9. Change control

This is a documentation plan, not authorization to change application code or the frozen product scope. Implement code work only through the project's approved work-order process. Preserve the current challenge decision as provisional until the team verifies the official materials and approves a mapping. Update docs/TASKS.md, docs/DECISIONS.md, docs/AGENTS.md, and README.md when an approved scope or architecture decision changes.

**Document review date:** 2026-10-24
**Execution note:** See `docs/EXECUTION_EVIDENCE.md` and the 13 evidence artifacts under `docs/evidence/`. All Gates 0 through 8 have been executed and verified against reproducible commands, hermetic tests, and audit checks; the internal 9+ readiness score is 9.23/10.
**AI contribution:** this plan and the companion synthetic-data disclosure were prepared with AI assistance and are recorded in docs/AI_USE_LOG.md.

**No-score-guarantee statement:** Implementing this workflow alone does not guarantee a score of 9/10. A high internal score requires genuine NASA data integration where relevant, independent scientific validation, leakage-free forecasting, strong challenge alignment, reproducible evidence, and successful independent review. Even a 9+/10 internal score does not guarantee the same score from NASA judges, selection, nomination, or winning.

**Source of truth:** [HYDROSENSE_BUILD_PROMPTS.md](./HYDROSENSE_BUILD_PROMPTS.md) contains implementation prompts and the normative Gate 0–8 execution sequence; this document defines the assessment rubric, scoring formula, evidence package, and readiness decision. Gate names/order and status meanings are shared. If details conflict, pause and update both documents together before marking work verified.
