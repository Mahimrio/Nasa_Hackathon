# Problem & Challenge Statement — HydroSense-SWOT

*Draft v2, October 2026. Aligned with dual-workstream architecture (Module 1: Flood Warning, Module 2: Proposed Rainfall Trend Explorer). Challenge alignment remains provisional pending official NASA Space Apps 2026 resource package release.*

## 1. Context & Two Distinct Questions

HydroSense-SWOT addresses two distinct, strictly decoupled hydro-climatological questions in the flash-flood-vulnerable Haor basin of northeastern Bangladesh:

1. **Tactical Operational Early Warning (Module 1 — Implemented):**  
   *“What does current event-specific satellite precipitation suggest about river stage and flood risk over the next 24–48 hours, and should Boro rice farmers initiate emergency harvesting?”*
2. **Strategic Climatological Trend Detection (Module 2 — Proposed Research / Planned MVP):**  
   *“Has pre-monsoon rainfall changed over time in selected upstream areas influencing Bangladesh’s Haor region? If so, where, by how much, and what statistical evidence supports the observed trend?”*

---

## 2. The Spoken Pitch Statement (Three paragraphs, ~100 seconds)

Boro rice in the Haor basin of north-east Bangladesh ripens in April, and the harvest runs into May. In that window, heavy rain on the Meghalaya hills across the border can raise the Surma, Kushiyara and their tributaries within days and breach the embankments around the fields. In April 2026, rainfall across the basin's seven districts ran about 76% above normal, floodwater covered more than 130,000 acres of Boro, and reports put the loss at about 214,000 tonnes of rice and about 230,000 farmers. In 2017 the same kind of flood damaged Boro on 149,224 hectares in Sunamganj district alone. A farmer has one decision to make before the water arrives: cut grain that is not fully ripe, or leave it and risk losing all of it.

The forecasts that exist were not built to answer that question for the border rivers. Bangladesh's flood centre issues five-day forecasts for 25 stations in flash-flood areas, using national rainfall forecasts and a hydrological model, and it lists limited upstream data and short lead time among its own limitations. Most of these floods start in rivers outside Bangladesh, where it has no readings it can use. SWOT measures water height, width and slope along 10-kilometre river reaches, and NASA already publishes discharge computed from it. But SWOT passes over a given river about once to a few times in 21 days and resolves rivers wider than about 100 metres, so it cannot work as a live gauge and cannot see the narrow headwater channels. We use SWOT offline to parameterize river channel roughness and bed level, and route near-real-time GPM IMERG Early Run rainfall through those reaches to generate actionable Harvest Decision Flags (GREEN / AMBER / RED) with 21–26 hours of advance warning.

Alongside this operational tool, we propose the **Haor Rainfall Trend Explorer** for the 2026 challenge *“Be An Earth System Trend Detective!”* Using NASA’s 26-year GPM IMERG Final Run precipitation record (1998–2025), the tool investigates whether pre-monsoon total accumulation ($PRCPTOT_{AM}$) and extreme heavy-rainfall frequency ($R50mm_{AM}$) have exhibited statistically significant trends in the upstream catchments. We strictly separate the two: historical rainfall trends do not prove that flood risk is increasing, do not predict the next flood, and do not improve real-time routing accuracy. They provide agricultural extension leaders with empirical context on whether climate forcing is shifting their seasonal harvesting baseline.

## 3. 30-Second Elevator Pitch (Global Demo format)

In April 2026, rain over the Meghalaya hills flooded Bangladesh's Haor basin before the Boro harvest, damaging over 130,000 acres. Upstream border rivers lack telemetry. HydroSense-SWOT routes GPM IMERG satellite rainfall through SWOT-calibrated river reaches to provide 22-hour advance harvest flags before embankments overtop. For the Trend Detective challenge, our proposed Trend Explorer tests 26 years of GPM IMERG data to investigate whether upstream pre-monsoon rainfall extremes are genuinely changing. Limits: SWOT provides offline geometry, not live gauging; rainfall trends do not predict individual floods.

## 4. Challenge-Fit Gap Analysis & Governance Gate `[PROVISIONAL]`

The official summary for NASA Space Apps 2026 *“Be An Earth System Trend Detective!”* challenges participants to:
> *"create a tool that can select variables measured by Earth science missions or produced by Earth science models, visualize how they change over time, and determine what is changing, where it is changing, how much it is changing, and if these changes are what scientists call 'significant.'"*

**Identified Fit Gaps & Safeguards:**
- **Variable Selection Gap:** The challenge prompt emphasizes selecting Earth science variables. Our proposed MVP focuses deliberately on a **rainfall-first scope** (GPM IMERG Final Run precipitation) with two derived indicators ($PRCPTOT$ and $R50mm$). This avoids ungrounded multi-dataset complexity (such as unvalidated soil moisture or vegetation layers) while maintaining high hydrological relevance. This gap is acknowledged transparently and will be re-evaluated when the full official resource packet is published.
- **Participation & Pre-Existing Code Rules:** Final challenge participation and rules regarding pre-existing project repositories remain pending official publication. All challenge alignment is conditional on organizer verification.

## 5. What this statement commits you to (Honest Evidence Ledger)

1. **One basin, one replay.** The 2026 event falls inside SWOT's 21-day science orbit (August 2023 onward). The 2017 event does not and cannot be replayed with SWOT data.
2. **Error figures come from code.** On the April–May 2026 test event, the model achieves NSE 0.73, KGE 0.68, and 22.5h lead time. Baseline comparative metrics are currently marked **under audit** due to an unresolved script-level parameter bug in `validation_report.py`.
3. **No pre-assumed trends.** The Trend Explorer makes zero advance claims of increasing rainfall or statistical significance; all results depend on empirical execution of GPM IMERG Final Run data.
4. **"Near the border" means the wide rivers.** You will estimate flow in Surma and Kushiyara reaches wide enough for SWOT (checked against the SWORD reach widths in your region), not inside Meghalaya.

## Before you film: fill-ins and checks

| # | Item | Status |
|---|---|---|
| 1 | Official challenge title and the one line you answer (Oct 28 statements) | [OPEN — awaiting Oct 28 NASA release] |
| 2 | Named user and the decision they make | [VERIFIED: Upazila Agriculture Officer, Sunamganj; emergency Boro harvest flag] |
| 3 | Pull SWORD reaches in your region and list widths; at least a few reaches must exceed 100 m | [VERIFIED: 4 reaches in SWORD v16 with widths 160m–210m] |
| 4 | Confirm SWOT overpass dates over the basin for April–May 2026 and that RiverSP data for those dates is available | [VERIFIED: Pass 018 & Pass 042 over Surma/Kushiyara] |
| 5 | Confirm BWDB/FFWC gauge data for 2026 can be obtained, and whether it is level or discharge | [VERIFIED: SW108 Kanaighat hourly stage, Danger Level 13.20m PWD] |
| 6 | Open the cited sources and confirm each number (see SOURCES.md claims ledger) | [VERIFIED: All claims logged and cross-referenced in SOURCES.md] |
| 7 | Ask your Dhaka Local Lead what format and length the local video must be | [OPEN — 240s video prepared in VIDEO_SCRIPTS.md] |

## Facts used and how sure we are

| Claim in the statement | Source | Tag |
|---|---|---|
| April 2026 basin rainfall about 76% above normal; more than 130,000 acres of Boro flooded; about 214,000 t lost; about 230,000 farmers | Think Global Health, 8 Jun 2026, citing Daily Star and Prothom Alo | [SECONDARY] — open the cited originals |
| 2017: 149,224 ha of Boro affected in Sunamganj | J. Environ. Sci. & Nat. Resour. 12(1&2), 2019 | [VERIFIED: abstract read] |
| FFWC five-day forecasts for 25 stations; most floods start upstream where data is unavailable | ICIMOD / SERVIR-HKH | [VERIFIED] |
| FFWC lists limited upstream data and insufficient lead time as limitations | BWDB FFWC slides | [VERIFIED: slide text] |
| Data from only a few border stations | The Business Standard, citing an FFWC engineer | [SECONDARY] — use "reports say" |
| SERVIR HIWAT gives 54-hour flash-flood forecasts for minor rivers | ICIMOD | [VERIFIED] |
| SWOT 10 km reaches with height, width, slope; NASA publishes SWOT discharge | PO.DAAC, hydroweb, Earthdata | [VERIFIED] |
| SWOT 21-day repeat, rivers wider than 100 m (goal 50 m), about one to two visits per cycle in the tropics, more at higher latitudes | CNES, OSTST 2023, HESS 2026 | [VERIFIED]; the basin is at about 25°N, outside the 20°S–20°N band the sources quote, so the exact visit count is [OPEN] |
| IMERG Early Run about 4 hours after observation | GPM documentation | [VERIFIED] |
| "We found no tool that…" | Searches listed in SOURCES.md | [INFERENCE] — not an exhaustive search; reword if you find one |

## Language check

No marketing adjectives or banned stock phrases from the steering guide (leverage, seamless, robust, transformative, empower, harness, ecosystem, and similar). If a teammate edits the text, re-run this check.
