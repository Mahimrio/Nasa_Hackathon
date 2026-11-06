---
name: HydroSense-SWOT
description: Restrained, professional scientific telemetry and harvest decision-support tool for transboundary flash-flood early warning in the Haor basin of Bangladesh
colors:
  bg-canvas: "#F5F8FA"
  surface-card: "#FFFFFF"
  surface-subtle: "#F8FAFC"
  border-default: "#DCE5EA"
  border-subtle: "rgba(220, 229, 234, 0.7)"
  text-primary: "#173B57"
  text-secondary: "#566B7C"
  text-muted: "#7A8F9E"
  blue-primary: "#287BB5"
  blue-deep: "#175A85"
  blue-light: "#EBF3F8"
  green-safe: "#34805A"
  green-light: "#E9F4EC"
  amber-caution: "#B7791F"
  amber-light: "#FEF9EE"
  red-danger: "#B4232F"
  red-light: "#FDF2F2"
typography:
  display:
    fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "clamp(1.625rem, 3vw, 2rem)"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.015em"
  title:
    fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 650
    lineHeight: 1.35
    letterSpacing: "-0.01em"
  body:
    fontFamily: "'Outfit', -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  bangla:
    fontFamily: "'Noto Sans Bengali', -apple-system, sans-serif"
    fontSize: "1rem"
    lineHeight: 1.65
  mono:
    fontFamily: "'JetBrains Mono', monospace"
    fontSize: "0.875rem"
    fontWeight: 550
    lineHeight: 1.45
    letterSpacing: "-0.01em"
rounded:
  sm: "4px"
  md: "8px"
  lg: "12px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  panel-card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.text-primary}"
    borderColor: "{colors.border-default}"
    rounded: "{rounded.lg}"
    padding: "20px 24px"
    boxShadow: "0 1px 3px rgba(23, 59, 87, 0.05)"
  button-primary:
    backgroundColor: "{colors.blue-primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.md}"
    padding: "10px 18px"
    minHeight: "44px"
  badge-status:
    rounded: "{rounded.pill}"
    padding: "4px 12px"
    fontSize: "13px"
---

# Design System — HydroSense-SWOT

> **Theme status (2026-11-03):** The app ships two themes. **Mocha** (dark) is the default (`data-theme="mocha"` in `layout.js`, persisted in `localStorage` as `hydrosense_theme`) and is documented in **Section 6**. **Light Field** is the toggleable alternative and is what Sections 1–5 and the frontmatter tokens describe. Where Sections 1–5 conflict with Section 6 on surfaces, decoration or fonts, Section 6 wins for Mocha. Semantic rules (GREEN/AMBER/RED, 12px type floor, bilingual parity, reduced motion) apply to both.

## 1. Overview & Visual Philosophy

HydroSense-SWOT is a high-precision scientific telemetry and harvest decision-support instrument tailored for transboundary flash-flood early warning in the Haor basin of northeastern Bangladesh. It is used by Upazila agricultural extension officers (DAE) and Boro rice farming communities.

The design adheres to a **calm, readable, trustworthy professional light visual language**:
- **Clean Solid Surfaces:** High-legibility white surfaces (`#FFFFFF`) on a soft neutral blue-gray canvas (`#F5F8FA`) with delicate perimeter dividers (`#DCE5EA`).
- **No Unnecessary Decoration:** Glassmorphism, translucent backdrops, neumorphic buttons, heavy drop shadows and neon cyan blooms have been removed to prioritize clarity, contrast, and operational trust. Looping motion is allowed only under the rules in **Section 7** (slow, low-contrast, transform/opacity only, off under reduced motion).
- **Scientific Credibility:** Primary decisions (GREEN / AMBER / RED) and modelled gauge water levels are visually anchored with high prominence, while secondary hydrological validation and assumptions remain accessible without competing for visual attention.
- **First-Class Bilingualism:** Full parity between English and Bengali (`Noto Sans Bengali`), with comfortable line heights (1.6–1.7) ensuring vowel markers and conjuncts render crisply without clipping or crowding.

---

## 2. Palette & Semantic Color System

### 2.1 Core Surfaces & Text
- **Canvas Background (`#F5F8FA`):** Soft, eye-friendly light backdrop that prevents glare while sustaining contrast.
- **Card Surfaces (`#FFFFFF`):** Crisp, solid surface providing maximum typographic contrast.
- **Subtle Wells (`#F8FAFC`):** Light recessed areas for parameter listings and telemetry breakdowns.
- **Borders & Dividers (`#DCE5EA`):** 1px structural bounds preventing card ambiguity without heavy visual noise.
- **Primary Text (`#173B57`):** Deep navy with > 9:1 contrast ratio against white surfaces for effortless scannability.
- **Secondary Text (`#566B7C`):** Calibrated slate-blue for descriptions, subtitles, and metadata (> 4.5:1 contrast).
- **Muted Text (`#7A8F9E`):** Reserved strictly for non-critical timestamps and unit tags.

### 2.2 Semantic Status & Hydrology
- **Interface & River Blue (`#287BB5`):** Interactive actions, primary river pathways, and calibrated reach vectors.
- **Deep Blue (`#175A85`):** Modeled hydrograph trajectory and major metrics.
- **Green Safe (`#34805A` / `#E9F4EC`):** NORMAL status — stage well below danger threshold (< 80%), safe for maturing Boro rice.
- **Amber Caution (`#B7791F` / `#FEF9EE`):** CAUTION / WATCH — stage at 80%–100% of danger level; farmers and extension officers mobilize harvest machinery.
- **Red Danger (`#B4232F` / `#FDF2F2`):** BREACH / FLOOD RISK — stage reaching or exceeding 13.20 m PWD; immediate harvest order.

---

## 3. Typography Architecture

### Minimum Hierarchy Targets
| Element | Target Size | Line Height | Weight |
|---|---|---|---|
| **Main Page Heading** | 26–32 px desktop; 24–28 px mobile | 1.25 | 700 |
| **Major Decision / Status Value** | 28–36 px | 1.2 | 750–800 |
| **Section & Card Headings** | 18–20 px | 1.35 | 650–700 |
| **Main Body Text** | 16 px baseline | 1.55 (EN), 1.65 (BN) | 400 |
| **Supporting Descriptions** | 14–16 px | 1.5 | 400–500 |
| **Form Labels & Metric Metadata** | 14 px | 1.4 | 600 |
| **Secondary Metadata & Chips** | 12.5–13.5 px | 1.4 | 600 |
| **Chart Axes & Tick Labels** | 12–12.5 px | 1.2 | 500 (Mono) |
| **Interactive Buttons & Nav** | 14–16 px | 1.3 | 600–700 (min 44px touch) |

*Rule:* No user-facing data or label is rendered below 12px. Uppercase text is strictly confined to short telemetry codes and station abbreviations.

---

## 4. Map & Visualization Layers

- **Interactive Reach Map:** Renders verified coordinates for the Kanaighat SW266 gauge (`[24.9980, 92.2594]`, danger 13.20m PWD) and the Surma/Kushiyara river geometry.
- **Layer Disclosure Accordions:** The map layer control provides individual toggle-down disclosure panels for all 4 GIS layers:
  1. River Flow Motion (vector trajectories)
  2. SWOT Satellite Swaths (KaRIn radar tracks)
  3. HydroSHEDS Basins (drainage divides)
  4. IMERG Rainfall Heatmap (satellite precipitation plume)
- **CVD-Safe Color Palettes:** Cividis and Viridis color ramps for continuous discharge and rainfall fields to ensure accessibility for color-vision-deficient users.

---

## 5. Layout & Information Architecture

- **Three Dedicated Pages (Module 1 — Operational Flood Warning):**
  1. `/dashboard` — 5-Second Triage, Primary Harvest Decision, River Map, Hydrograph, Accuracy Scorecard, and Operational Limits.
  2. `/forecast` — Detailed 72h Muskingum-Cunge hydrological forecast and parameter controls.
  3. `/advisory` — Actionable harvest advisories, printable field bulletin, and farmer/officer directives.
- **Analytical View (Module 2 — Historical Rainfall Trend Explorer):**
  - Delivered via dedicated `TrendExplorerViewer.js` component activated via topbar segmented switcher (`🛰️ Real-Time Warning` vs `📊 Rainfall Trends`).
  - Features 25-year Recharts multi-decadal time-series chart with solid navy Sen's slope line (`#175A85`), analytical 95% CI envelope (`rgba(40, 123, 181, 0.12)`), 4 factual statistical cards, and contextual climatological disclaimer well (`#F8FAFC`).
- **Responsive Viewport Targets:** Captured in headless Chromium at 1440×900 (desktop), 1170×820 (compact desktop/tablet landscape), 768×1024 (tablet portrait), 390×844 (mobile), and 320×700 (narrow mobile). The document width matched the viewport in each capture; physical touch-device behavior remains unverified.
- **Operational Limits Disclosure:** The methods panel stays expanded by default and collapses with distinct panel SVGs, a smooth state transition, keyboard-operable control, and a reduced-motion path.
- **Shared Scientific Footer:** All operational routes share a bilingual mission and data-provenance footer for NASA SWOT, GPM IMERG Early Run V07, and the BWDB Kanaighat gauge.

---

## 6. Mocha Blend Theme (default, in progress)

Brief: *Mocha Brown, Platinum Silver, Pale Lavender must read as one blended system; cards, buttons and background all in that family; cards animated; fonts professional and multi-family.* Work is **uncommitted and not pushed** (user asked not to push).

**Files**
- `ui/app/globals.css`: Mocha tokens in `:root, [data-theme="mocha"]`; Light Field in `[data-theme="light"]`.
- `ui/app/mocha-blend.css`: all Mocha-only treatment, scoped to `[data-theme="mocha"]`, imported after `globals.css` in `layout.js`. Numbered sections: 1 canvas, 2 type roles, 3 cards, 4 entrance, 5 top bar, 6 buttons, 7 decision panel, 8 map chrome, 9 overlays/tooltips, 10 selection/scrollbar/focus, 11 reduced motion, 12 accent fills, 13 map header fixes.
- `ui/app/components/SurfaceFX.js`: pointer-follow spotlight. One delegated `pointermove` listener, rAF-throttled, writes `--mx/--my` on `.glass-panel, .triage-pillar-card, .metric-card, .advisory-stat-box`. Disabled for coarse pointers and `prefers-reduced-motion`.

**Roles**
| Role | Colour | Tokens |
|---|---|---|
| Mocha: canvas, cards, wells | `#1D130D` canvas, `#35241A` card, `#412D21` elevated, `#22160F` well, `#3F2C20` popover | `--mocha-*`, `--surface-card`, `--surface-popover` |
| Platinum: type, hairlines, primary action | `#E8E4DE`; text `#F2EEE8` / `#CBBFB5` / `#A89A8E`; hairline `rgba(232,228,222,.14)` | `--platinum-*`, `--text-*`, `--border-subtle` |
| Pale Lavender: focus, active, satellite telemetry | `#DCD2F2`, deep `#A592D6`, border `rgba(205,190,240,.42)` | `--pale-lavender*`, `--lavender-deep` |
| Water only | sky blue `#9CCBF2` | `--cyan-*` |
| Safety (shape and icon always accompany colour) | green `#7FD6A4`, amber `#F0B45A`, red `#FF8A94` | `--green-action`, `--amber-caution`, `--red-danger` |

**Type roles:** Fraunces (display: card titles, triage headline, decision status, brand, modal headings) / Manrope (interface and body) / IBM Plex Mono (measurements, timestamps, codes, chart ticks). Bengali: Noto Serif Bengali for display, Noto Sans Bengali for UI; `.lang-bn` resets letter-spacing to 0. Fonts load through a `<link>` in `layout.js` (not CSS `@import`). 12px minimum is enforced in Mocha for the former 9–11px labels.

**Motion:** ambient lavender/mocha light drifting on `body::before` (46s) with fine grain on `body::after`; surfaces rise in with a stagger on entrance; card hover lifts and shows a lavender spotlight under the cursor; button sheen; gauge fill; status glow on the decision panel. Section 11 of `mocha-blend.css` drops the choreography under `prefers-reduced-motion` but keeps every state change.

**Charts:** Recharts reads `--chart-model` (`#C9BBF5`), `--chart-observed`, `--chart-baseline`, `--chart-rain`, `--chart-band`, `--chart-grid`, `--chart-tick`, `--chart-label`, `--chart-amber`, `--chart-red`, `--chart-dot-ring`. No hex literals remain in `HydrographPanel.js`. The uncertainty band is one range `Area` over `[lower, upper]`, with a range-aware tooltip.

**Map:** the basemap stays light for legibility; the frame, controls, gauge label (`--surface-popover`, amber border) and location button are mocha.

### 6.1 Status and handoff

Done: tokens, fonts, cards, buttons, top bar, decision panel, chart colours, map chrome, overlays, reduced motion, SVG theme toggle, screenshot rig `.design-shots/shoot.mjs` (headless Chromium; prints `overflowX` per capture). Dashboard 1440 EN/BN and 390 EN were reviewed. Round 2 captures (`b-forecast`, `b-advisory`, `b-trends`, `b-schematic`, `b-hover`, `b-bulletin`) exist in `.design-shots/`. Forecast looked coherent. Advisory, trends and bulletin were captured but not fully assessed.

**Next steps, in order**
1. Run `cd ui && npm run build` and `npm run lint`, then `pytest tests/` from the repo root. None were run after the redesign.
2. ~~Fix the clipped "Danger 13.20m" label~~ Done 2026-11-06 (Section 7): both Recharts charts in `HydrographPanel.js` use a 104px right margin, the rain chart is 120px tall, and both Y-axis titles are centred (`textAnchor: "middle"`), so "Rain (mm/h)" and the Bengali titles no longer clip.
3. Fix `shoot.mjs` so the schematic capture targets the map toggle inside `.card-header-bar`, not the first `[role=radio]` (the language toggle).
4. Review `b-advisory.png`, `b-trends.png`, `b-bulletin.png`, and take a hover shot of `.triage-pillar-card`.
5. Check the topbar between 1170 and 1760 px: "Trend Explorer" clipped to "Trend Ex…" at about 1566 px before the redesign; the compact two-row layout applies at 1440.
6. Open items from earlier in the session, not yet investigated: (a) "Flood Peak (13.4m)" jump pill shows active while the replay is at Apr 11 18:00 (8.88 m); (b) a Next.js dev overlay "1 Issue" badge; (c) WATCH badge contrast, which should be rechecked in both themes.
7. Check the Light Field theme for regressions (`globals.css` was edited in about 260 lines).
8. After human review, commit. Delete `ui/dev.log` (stray) and decide whether `.design-shots/` and `NASA Webapp Challenge Assistance.md` (about 970 KB) belong in the repo or in `.gitignore`.

Run: `cd ui && npm run dev` then open `http://localhost:3000`. The dev server was stopped at the user's request; another project runs on this machine, so check the port before starting.

---

## 7. Motion Layer (2026-11-06)

Brief: *make the app visually appealing and simple for regular users: smooth transitions, smooth page changes, looped animated content, without touching the core.* Everything is decorative. No data, model output, thresholds or copy meaning changed.

**Files**
- `ui/app/motion.css`: the whole motion layer, imported last in `layout.js` (after `shell.css`). Numbered sections: 1 route transitions, 2 scroll progress, 3 scroll reveal, 4 ambient loops, 5 pathway cards, 6 hydrograph draw-in, 7 footer water line, 8 Trend Explorer orbit, 9 map icons, 10 reduced motion. Both themes; accent colour comes from `--motion-accent` (lavender in Mocha, blue in Light Field) and `--motion-water` (`--cyan-400`).
- `ui/app/template.js`: wraps every page in React 19.3 `<ViewTransition>` with `enter`/`exit` maps `nav-forward`, `nav-back`, default `page-fade`. Templates remount per navigation, so each page gets an enter/exit pair while the layout (header) persists.
- `ui/app/lib/navDirection.js`: journey order Dashboard (1) → Forecast (2) → Advisory (3) → Trends. `navTransitionTypes(from, to)` returns `["nav-forward"]` or `["nav-back"]` for `<Link transitionTypes>`. Used by the header tabs and brand link (`AppHeader.js`) and by the in-page journey links and pathway cards (`page.js`, `forecast/page.js`, `advisory/page.js`).
- `ui/app/components/MapIcon.js`: 13 line icons (map, light, satellite, layers, waves, wave, orbit, mountain, rain, compass, pin, check, offline) replacing emoji in the map toolbar, basemap menu, layer list and Quick Focus menu (`InteractiveMapLeaflet.js`). Map legend labels in `RiverMapPanel.js` dropped their emoji prefixes; the colour swatches already identify each layer.

**Choreography**
| Moment | Treatment |
|---|---|
| Route change (tabs, journey links) | Old page fades out in 160ms while sliding 56px; new page slides in from the other side (440ms, `--ease-expo`) and fades in after the exit. Forward slides left, back slides right. Untyped navigations (browser back, `/` ↔ `/dashboard`) use a 14px rise and fade. |
| Top bar | `view-transition-name: site-header`. During typed route changes its group does not animate and the old snapshot is hidden, so the bar stays fixed and the existing sliding tab pill stays visible. Language and theme swaps keep the whole-page cross-fade from `shell.css`. |
| Scrolling | 2px gradient hairline under the top bar tracks page progress (`animation-timeline: scroll(root)`). Sections from the third one down, and the pathway cards, rise in over the first 140px of entry (`animation-timeline: view()`). Footer rows finish when fully visible, so the last row is never left faded. Browsers without scroll timelines keep the one-shot entrance from `mocha-blend.css`. |
| Loops | Brand glyph ripple (4.8s). Top-bar replay beacon and triage flag dot breathe (2.6–2.8s; AMBER 1.8s, RED 1.2s). Decision orb halo ring (GREEN 3.6s, WATCH 2.4s, CRITICAL 1.6s; the orb's own AMBER/RED scale pulse is unchanged). Hydrograph replay dot breathes (2.4s). Light sweeps along the water-level gauge fill (3.4s). Sheen across the triage flag badge (every 7s). Next-step arrows nudge (3.2s). Two wave layers drift along the top of the footer (18s and 27s). Trend Explorer "Awaiting verified input" card: satellite orbits Earth (9s) with falling rain drops. |
| Hover | Pathway cards: lavender/blue sheen pass and the arrow pushes 5px. |
| Charts | Hydrograph series (lines, uncertainty area, rain bars) are revealed left to right once on mount with `clip-path: inset()`, so dash patterns are untouched. Recharts' own animation stays off (`isAnimationActive={false}`), so replay scrubbing never re-animates. |

**Rules**
- Loops animate `transform` and `opacity` only (the footer waves are a 200%-wide pseudo-element moved with `translate3d`), and every loop is at least 1.2s. Calm GREEN breathes slowly; AMBER and RED loop faster so urgency still reads from motion as well as colour, icon and text.
- `::view-transition { pointer-events: none }` keeps unnamed content clickable during a route change.
- `prefers-reduced-motion: reduce`: route swaps are instant, scroll reveal and every loop are off, the scroll hairline is hidden, hover feedback is colour only.
- The Trend Explorer visual is explicitly an "awaiting input" state. It shows no numbers, axes or trend shapes, so it cannot be read as a synthetic result.

**Related fix (map lifecycle):** with `cacheComponents: true`, Next keeps visited routes in a hidden React `<Activity>`. Hiding ran react-leaflet's cleanup (`map.remove()`) but kept the dead map in context, so returning to the dashboard by client navigation threw `_leaflet_pos` / `min` / "Map container is being reused" errors and showed the error boundary. This was reproduced on the unmodified branch. `InteractiveMapLeaflet.js` now renders `<MapContainer>` only while the page is visible (`mapAlive`, set in a layout effect and cleared in its cleanup), so a fresh map is built when the page is shown again. Map toolbar state (basemap, layers, focus) lives outside `MapContainer` and is kept.

**Verified (2026-11-06):** `npm run lint` clean; `npx next build` compiles and prerenders all 6 routes; Dashboard → Forecast → Dashboard → Advisory → Dashboard navigation runs with zero console errors and a live map; `nav-forward` slide observed on the view-transition pseudo-elements; chart labels checked in Mocha/English and Light/Bengali. `pytest tests/`: 47 passed, 1 failed (`test_checked_in_fixture_manifest_is_complete_and_hashes_match`, a CRLF checkout checksum mismatch on `data/fixtures/gauge_kanaighat.csv` that also fails without these changes).
