# HydroSense-SWOT — Research Briefing

*Prepared 2026-10-08 for NASA Space Apps 2026 (Dhaka node). Tags: [VERIFIED] read on a primary source, [SECONDARY] news or non-official page, [INFERENCE] our reading, [OPEN] needs a human check. Full challenge statements arrive Oct 28; nothing here is tied to a specific official challenge yet.*

## Problem Summary

HydroSense-SWOT is a prototype flood-timing tool for the Surma–Kushiyara part of the Haor basin in north-east Bangladesh. It uses SWOT river measurements to set channel parameters for reaches near the border, drives them with GPM IMERG rainfall, and checks the result against downstream BWDB gauges. "Done" means one replayed past flood (April–May 2026) with separate calibration and test periods, computed error figures against a rainfall-only baseline, and a clear harvest-timing flag for a named user such as an upazila agriculture officer.

## Comparable Projects & Prior Art

- **SWOT-Confluence and the Sword of Science (SoS) discharge product (NASA/CNES, DAWG).** Open-source framework that runs six discharge algorithms on SWOT river data and publishes a consensus discharge, in unconstrained and gauge-constrained versions. Version 3 was released Dec 2025 and is built in reanalysis mode, so it is a historical record, not a live feed. [VERIFIED] **Implication:** computing discharge from SWOT is no longer novel; our contribution has to be the rainfall-driven, decision-oriented layer. The original `kandread/Confluence` repository is archived; the active code is in the SWOT-Confluence GitHub organisation.
- **SWOT L2 RiverSP reach and node products.** Reach data (~10 km) carries water surface elevation, slope, width and a mission-computed discharge. Node data (~200 m) carries elevation and width but not slope. Hydrocron is a NASA time-series API over these products. [VERIFIED] The earlier spec put slope at node level, which is wrong.
- **SERVIR-HKH / ICIMOD tools for Bangladesh.** A customised Streamflow Prediction Tool gives 10-day forecasts for major rivers and feeds the national flood centre; the HIWAT tool gives 54-hour flash-flood forecasts for small river segments. [VERIFIED: ICIMOD] This is the closest existing service and it is NASA-supported. We should describe ourselves as complementary and say what we add: SWOT-derived channel parameters and a harvest decision.
- **FFWC (Bangladesh Water Development Board).** Issues five-day forecasts for 25 water-level stations in flash-flood areas using national rainfall forecasts and an in-house model; its own materials list limited upstream data and insufficient lead time as limitations. [VERIFIED: ICIMOD page and FFWC slides] A 2020 "ReqSim" model produces 10-day forecasts from satellite and global model data. [SECONDARY: opinion article]
- **Past Space Apps flood entries.** Real-time flood alert and IMERG-based risk maps reached Global Nominee in 2017, 2019 and 2020 (RTFAS, Super Citizen, FLOEWS). A Bangladesh-node entry, FloodShield (team MonsoonFive), was reported as first runner-up in a recent year. [VERIFIED pages / SECONDARY news] **Implication:** a generic "flood alert app" is crowded and the Bangladesh judges have seen one. We must lead with the SWOT and Boro-harvest angle.
- **Academic checks of SWOT water height.** A validation over India (14,000+ observations, 419 stations) reports about 0.18 m error for rivers wider than 100 m and about 0.26 m for narrower ones. [SECONDARY: cited inside a 2026 HESS article] Useful as the accuracy reference for our own check.

## Must-Have Features (table stakes for this domain)

- A map-first view of the study reaches with a clear status per reach (normal / watch / act), always showing units, data source and observation date.
- Real data from named NASA products: SWOT RiverSP reach data, GPM IMERG Early Run (half-hourly, 0.1°, about 4 hours latency), and HydroSHEDS or SWORD for river routing. [VERIFIED: GPM documentation]
- Gauge comparison: observed vs modelled flow or level at the BWDB stations, with the error figures computed by code, never typed in.
- A time-split validation: calibrate on earlier dates, test on later ones, and report NSE, bias and RMSE for the test period only.
- A simple baseline to beat (for example rainfall-only or downstream-gauge-only), shown beside our result.
- A stated limits panel: SWOT visits a given river about once to a few times per 21 days, resolves rivers wider than about 100 m (goal 50 m), and does not see the narrow Meghalaya headwater channels. [VERIFIED: CNES, OSTST, HESS]
- Plain-language output for the named user, in Bangla and English, that says what to do and by when.
- A sources and licenses page that names every dataset, paper and library.

## Competitive Differentiator Features

- **One replayed flood that a judge can scrub through.** A time slider over April–May 2026 showing rainfall arriving, modelled flow rising, and the flag turning before the downstream gauge does. This is the single signature moment. (Pattern seen in strong flood and hazard entries: a before/after the audience can discover themselves.)
- **Harvest-timing output, not just a water level.** Link the flag to Boro ripening and give the officer a decision ("cut early in these upazilas"). This ties to the crop-loss framing and to the Local Impact award. Nothing in the flood entries we found does this. [INFERENCE: searched, not exhaustive]
- **SWOT as a channel-parameter source.** Use SWOT width, height and slope to set reach roughness and bed level against downstream gauges, then drive the model with near-real-time rain. The SWOT discharge products exist, but we found no entry that uses them this way for the Haor system. [INFERENCE]
- **Visible uncertainty and honest limits.** An error band on the hydrograph and an on-screen note about what SWOT cannot see. Reads as credible and protects the Validity score.
- **Complement, don't compete, with existing services.** Show our output next to what FFWC and SERVIR already provide, so judges see a gap being filled.
- **Coordinate-agnostic design, shown only as a stated next step.** The method needs a SWOT reach table and a gauge series for any basin. Mention it in one line; do not demo three basins live.

## UI/UX Design Direction

The image search returned four flood and disaster dashboards (a flood-mapping dashboard guide, a South Asia water-information portal, an Australian disaster-intelligence piece and a commercial flood early-warning product), but only their titles were readable, so we cannot describe their visual details and we do not claim to. The direction below is therefore a design recommendation based on common practice for hazard dashboards, not a copy of those references. Use a map-first layout on a dark or neutral base with one accent colour and a perceptually uniform sequential colormap for flow, with the three-state flag shown by text and icon as well as colour. Put a single hydrograph for the selected reach beside the map, with the observed gauge line, the modelled line, the baseline, an error band and a vertical marker at the SWOT overpass dates. Keep the first screen to one question ("Should this upazila cut early?") with source and date on screen, a Bangla/English switch, and a phone layout that works with one hand. [PRACTICE]

## Sources

- Dhaka Tribune, 27 Apr 2017, Netrokona flash flood losses — https://www.dhakatribune.com/amp/bangladesh/nation/19349/flash-flood-causes-tk1-000cr-loss-in-netrakona
- Journal of Environmental Science & Natural Resources 12(1&2), 2019, effects of 2017 early flash flooding in Sunamganj haors — https://banglajol.info/index.php/JESNR/article/view/52007
- Think Global Health, 8 Jun 2026, Haor basin 2026 flash floods — https://www.thinkglobalhealth.org/article/bangladesh-faces-rice-shortages-amid-flash-floods-and-global-fuel-crisis
- The Financial Express, April 2022, haor flash flood reporting — https://thefinancialexpress.com.bd/national/floods-now-creeping-into-northern-dists-1649645421
- ICIMOD / SERVIR-HKH, flood preparedness in Bangladesh — https://servir.icimod.org/news/underpinning-flood-preparedness-in-bangladesh/
- The Business Standard, "Beyond rain: causes behind recent floods" — https://www.tbsnews.net/bangladesh/beyond-rain-causes-behind-recent-floods-927551
- BWDB FFWC presentation slides — https://pani.bwdb.gov.bd/archive/pdf/190.pdf
- The Daily Star, opinion on flood forecasting and ReqSim — https://www.thedailystar.net/opinion/news/time-develop-reliable-flood-forecasting-model-1952061
- NASA Earthdata, global river discharge release — https://www.earthdata.nasa.gov/news/nasa-cnes-release-unprecedented-global-river-discharge-water-quality-estimates
- PO.DAAC, SWOT L4 Sword of Science discharge V3 — https://podaac.jpl.nasa.gov/dataset/SWOT_L4_HR_DAWG_SOS_DISCHARGE_V3
- GitHub, Confluence (archived original) — https://github.com/kandread/Confluence ; active organisation — https://github.com/SWOT-Confluence
- Hydroweb.next, SWOT L2 HR RiverSP reach dataset — https://hydroweb.next.theia-land.fr/catalog/details/SWOT_L2_HR_RIVERSP_REACH
- Hydroweb.next, SWOT L2 HR RiverSP node dataset — https://hydroweb.next.theia-land.fr/catalog/details/SWOT_L2_HR_RIVERSP_NODE
- NASA PO.DAAC webinar on SWOT hydrology services (Hydrocron) — https://earthdata.nasa.gov/s3fs-public/2025-07/ED%20Webinar%20-%20PODAAC%20SWOT%20Hydro%20Tools%20-%20July%202025.pdf
- CNES, SWOT mission page — https://cnes.fr/en/projects/swot
- OSTST 2023, early SWOT results — https://ostst.aviso.altimetry.fr/fileadmin/user_upload/OSTST2023/Presentations/OPE2023-Early_oceanographic_results_from_SWOT.pdf
- HESS 30, 4141 (2026), SWOT in narrow rivers — https://hess.copernicus.org/articles/30/4141/2026/
- GPM, IMERG V07 technical documentation — https://gpm.nasa.gov/resources/documents/imerg-v07-technical-documentation
- GPM, what determines IMERG latency — https://gpm.nasa.gov/resources/faq/what-determines-latency-imerg
- Space Apps 2017, RTFAS (Global Nominee) — https://2017.spaceappschallenge.org/challenges/planetary-blues/water-water-everywhere/teams/victor1
- Space Apps 2019, Space VitALL (Global Nominee) — https://2019.spaceappschallenge.org/challenges/living-our-world/curious-minds-come-helping-hands/teams/space-vitall-1
- Space Apps 2020, FLOEWS (Global Nominee) — https://2020.spaceappschallenge.org/challenges/confront/flood-ideas/teams/floews
- Banglanews24, IUB team MonsoonFive / FloodShield — https://www.banglanews24.com/english/education/news/bd/157840.details
- NASA SMD notice on 2026 Space Apps dates — https://astrobiology.com/2026/09/04/registration-is-now-open-for-the-2026-nasa-space-apps-challenge/
