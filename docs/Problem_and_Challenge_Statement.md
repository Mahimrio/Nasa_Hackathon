# Problem & Challenge Statement — HydroSense-SWOT

*Draft v1, 2026-10-08. Items in [square brackets] must be filled or checked before filming. The challenge line cannot be final until the full statements are published on Oct 28.*

## The statement (three paragraphs, about 100 seconds spoken)

Boro rice in the Haor basin of north-east Bangladesh ripens in April, and the harvest runs into May. In that window, heavy rain on the Meghalaya hills across the border can raise the Surma, Kushiyara and their tributaries within days and breach the embankments around the fields. In April 2026, rainfall across the basin's seven districts ran about 76% above normal, floodwater covered more than 130,000 acres of Boro, and reports put the loss at about 214,000 tonnes of rice and about 230,000 farmers. In 2017 the same kind of flood damaged Boro on 149,224 hectares in Sunamganj district alone. A farmer has one decision to make before the water arrives: cut grain that is not fully ripe, or leave it and risk losing all of it.

The forecasts that exist were not built to answer that question for the border rivers. Bangladesh's flood centre issues five-day forecasts for 25 stations in flash-flood areas, using national rainfall forecasts and a hydrological model, and it lists limited upstream data and short lead time among its own limitations. Most of these floods start in rivers outside Bangladesh, where it has no readings it can use; news reports, citing the flood centre, say it receives data from only a few of the stations along the border. The SERVIR tool adds 54-hour forecasts for small rivers, but it estimates flow from rainfall and a model, with few measurements of the river channel itself. SWOT measures water height, width and slope along 10-kilometre river reaches, and NASA already publishes discharge computed from it. But SWOT passes over a given river about once to a few times in 21 days and resolves rivers wider than about 100 metres, so it cannot work as a live gauge and cannot see the narrow headwater channels. We found no tool that uses SWOT to set the channel parameters, runs satellite rainfall through them within hours, and turns the result into a harvest decision for these rivers.

We will build that for the Surma–Kushiyara reaches near the border. We take SWOT reach measurements, fit channel roughness and bed level against downstream BWDB gauge records, and route GPM IMERG Early Run rainfall (available about four hours after observation) through those reaches to flag when a flood is likely and which upazilas should harvest early. We will replay the April 2026 flood using only data available before each date, keep calibration and test periods separate, and report Nash–Sutcliffe efficiency, bias and warning lead time against the gauges, next to a rainfall-only baseline. The user is [named user, for example an upazila agriculture officer in Sunamganj]. This answers the challenge "[exact official title]", which asks [one line quoted from the official statement, Oct 28]. We state the limits on screen: SWOT does not see the narrowest upstream channels, and lead time comes from rainfall data, not from SWOT passes.

## 30-second version (about 75 words, for the ≤30 s demo format)

In April 2026, rain over the Meghalaya hills flooded the Haor basin before the Boro harvest. Floodwater covered more than 130,000 acres and about 230,000 farmers were affected. Upstream rivers have no gauges Bangladesh can read. We use SWOT river width, height and slope to set channel parameters, run IMERG rainfall through them, and check against Sylhet gauges. We replay the April 2026 flood and report the error. Answer to [challenge title]. Limit: SWOT cannot see the narrowest channels.

## What this statement commits you to (so the build matches the words)

1. **One basin, one replay.** The 2026 event falls inside SWOT's 21-day science orbit (August 2023 onward). The 2017 event does not and cannot be replayed with SWOT data.
2. **Error figures come from code.** Do not show NSE, R² or lead time until you have computed them on the test period. The earlier prompt that hard-coded NSE 0.86, R² 0.89 and +18 hours must be removed.
3. **Baseline beside the result.** If you cannot beat a rainfall-only baseline, say so and show what SWOT adds (for example better peak timing or smaller bias). A modest honest result scores better than an unsupported strong one.
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
