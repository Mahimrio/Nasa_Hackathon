# HydroSense Dashboard — Visual & Interaction Design Architecture

> **Purpose:** Implementation-ready visual and interaction design specification for the HydroSense-SWOT scientific telemetry and harvest decision-support tool in northeastern Bangladesh.
>
> **Primary design principle:** *A trustworthy, readable, carefully crafted scientific instrument for agricultural officers and Boro rice farmers.* The interface uses a calm, restrained light visual language with high typographic contrast, solid surfaces, crisp structural boundaries, and no distracting neon blooms or heavy glassmorphism.

---

## 1. Product and experience direction

### 1.1 Product context inferred from the supplied UI

The dashboard communicates a transboundary river/hydrology monitoring and harvest decision workflow. Visible areas include:

- A balanced HydroSense header with environment/telemetry status, page navigation, language controls, and timestamp.
- A 5-second triage strip communicating immediate risk, trigger rationale, and core telemetry.
- An interactive river/reach map with named reaches, gauge station marker (Kanaighat SW266), and GIS layer disclosure accordions.
- A **Harvest Decision** panel with prominent status (NORMAL / WATCH / FLOOD RISK), modeled stage, danger clearance, and Bengali directives.
- A hydrograph/time-series panel with observed BWDB stage, Muskingum-Cunge routed forecast, SWOT uncertainty envelope, thresholds, and timeline control.
- A scientific-validation row (NSE, KGE, PBIAS, timing, and warning lead).
- An operational-limits and assumptions panel.

Keep these information roles. Maintain scientific and product requirements documented in the repository; exact data labels, units, thresholds, and model semantics come from the application/API.

### 1.2 Visual result

A calm, readable professional light interface:
- **Canvas:** Soft, eye-friendly light backdrop (`#F5F8FA`).
- **Surfaces:** Crisp white solid cards (`#FFFFFF`) with subtle, clean structural borders (`#DCE5EA`).
- **Typography:** 16 px body baseline, 18–20 px card headings, 26–32 px page titles, 28–36 px major decision values, and ≥12 px chart ticks/axes.
- **Accents:** Professional river blue (`#287BB5`) and deep blue (`#175A85`), with semantic green (`#34805A`), amber (`#B7791F`), and red (`#B4232F`) reserved strictly for hydrological states.
- **No Unnecessary Decoration:** Glassmorphism, heavy backdrop blur, neumorphism, cyan ambient glows, and persistent pulsing animations are eliminated to ensure maximum trust and legibility.

### 1.3 Style boundaries

| Design language | Direction | Rationale |
|---|---|---|
| **Surfaces** | Solid white cards (`#FFFFFF`) on `#F5F8FA` canvas | Maximum contrast and readability across daytime field conditions |
| **Borders** | Clean 1px solid borders (`#DCE5EA`) | Clear boundary delineation without visual noise or dual shadows |
| **Color Semantics** | Green (`#34805A`), Amber (`#B7791F`), Red (`#B4232F`) | Universal agricultural decision indicators paired with icons and labels |
| **Typography** | 16 px body baseline, Noto Sans Bengali with 1.6–1.7 line height | Zero text clipping, comfortable conjuncts, scannable for extension officers |
| **Motion** | Gentle, purposeful interactions; no infinite pulsing rings | Calibrated vector flows and hydrograph reveal without distracting jitter |

---

## 2. Design tokens

### 2.1 Professional Light Color Palette

| Token | Hex / Value | Intended Use |
|---|---|---|
| `bg-canvas` | `#F5F8FA` | App canvas background |
| `surface-card` | `#FFFFFF` | Primary content and instrument surfaces |
| `surface-subtle` | `#F8FAFC` | Recessed telemetry wells and parameter blocks |
| `border-default` | `#DCE5EA` | Standard card and table borders |
| `border-subtle` | `rgba(220, 229, 234, 0.7)` | Inner dividers and secondary item separators |
| `text-primary` | `#173B57` | Main headings, primary values (>9:1 contrast) |
| `text-secondary` | `#566B7C` | Supporting labels, descriptions, subtitles (>4.5:1 contrast) |
| `text-muted` | `#7A8F9E` | Secondary metadata and unit annotations |
| `blue-primary` | `#287BB5` | River pathways, active links, primary buttons |
| `blue-deep` | `#175A85` | Modeled stage hydrograph, high-emphasis metrics |
| `blue-light` | `#EBF3F8` | Information chips and active tab fills |
| `green-safe` | `#34805A` | NORMAL status (<80% danger level; crop maturing) |
| `green-light` | `#E9F4EC` | Safe status background fills |
| `amber-caution` | `#B7791F` | CAUTION / WATCH (80%–100% danger level; mobilize machinery) |
| `amber-light` | `#FEF9EE` | Caution status background fills |
| `red-danger` | `#B4232F` | BREACH / FLOOD RISK (≥13.20m PWD; immediate harvest) |
| `red-light` | `#FDF2F2` | Danger status background fills |

### 2.2 Typography Hierarchy

| Role | Target Size | Line Height | Weight | Notes |
|---|---|---|---|---|
| Main page heading | 26–32 px desktop; 24–28 px mobile | 1.25 | 700 | Primary title |
| Major decision/status value | 28–36 px | 1.2 | 750–800 | Harvest decision card |
| Card & section headings | 18–20 px | 1.35 | 650–700 | Panel titles |
| Main body text | 16 px baseline | 1.55 (EN), 1.65 (BN) | 400 | General reading |
| Supporting descriptions | 14–16 px | 1.5 | 400–500 | Context and footnotes |
| Form labels & key metadata | 14 px | 1.4 | 600 | Parameter labels |
| Secondary metadata | 12.5–13.5 px | 1.4 | 600 | Tag chips, small indicators |
| Chart axis labels & ticks | 12–12.5 px | 1.2 | 500 (Mono) | High-contrast tick labels |
| Button & navigation labels | 14–16 px | 1.3 | 600–700 | Min 44 px touch height |

### 2.3 Radius, Borders & Elevation

| Token | Value | Use |
|---|---|---|
| `radius-sm` | 4–6 px | Badges, small chips, inputs |
| `radius-md` | 8–10 px | Buttons, control groups |
| `radius-lg` | 12–14 px | Cards, hydrograph panel, map container |
| `radius-pill` | 9999 px | Status indicators, toggle pills |
| Card surface shadow | `0 1px 3px rgba(23, 59, 87, 0.05)` | Subtle depth without visual heaviness |
| Dropdown/modal shadow | `0 8px 24px rgba(23, 59, 87, 0.12)` | Floating menus and dialog elevation |

### 2.6 Layout and grid tokens

- Design reference viewport: **1440 × 900 px** desktop.
- Usable app width: full viewport minus outer gutters; maximum content width may be 1680 px, centered.
- Desktop grid: 12 columns, 24 px gutters, 24 px page side margins.
- Tablet grid: 8 columns, 16 px gutters.
- Mobile grid: 4 columns, 12 px gutters, 12–16 px side margins.
- Main dashboard grid: 8-column hero area + 4-column decision rail on desktop; hydrograph spans full width below; validation and limits span full width.
- Recommended desktop proportions: map 66.6667% of upper row; decision rail 33.3333%. Keep an actual 16–20 px gutter between them.
- Map-to-decision top alignment: exact shared top edge. Their card headings share the same baseline where possible.
- Minimum interactive target: 44 × 44 px (minimum 40 × 40 px only for dense desktop icon buttons with sufficient separation).

---

## 3. Overall screen architecture

### 3.1 Desktop information architecture (1440 px viewport)

```text
┌────────────────────────────────────────────────────────────────────────────┐
│ TOP BAR: brand | environment/status | primary actions | language | time    │
├────────────────────────────────────────────────────────────────────────────┤
│ PAGE CONTEXT: “River intelligence” / selected basin / refresh status       │
│ Optional compact filter row: basin · reach · date range · layer · export   │
├─────────────────────────────────────────────────────┬──────────────────────┤
│                                                     │                      │
│  HERO REACH MAP (8/12 columns)                      │ HARVEST DECISION     │
│  - stylized map / river flow                         │ status + confidence  │
│  - reach labels / gauge marker                       │ modeled parameters   │
│  - map legend / layer controls                       │ data timestamp       │
│                                                     │                      │
├─────────────────────────────────────────────────────┴──────────────────────┤
│ HYDROGRAPH (12/12) — time series, uncertainty, thresholds, timeline         │
├────────────────────────────────────────────────────────────────────────────┤
│ SCIENTIFIC VALIDATION (12/12) — score cards in one aligned metric row        │
├────────────────────────────────────────────────────────────────────────────┤
│ OPERATIONAL LIMITS / MODEL NOTES (12/12)                                     │
└────────────────────────────────────────────────────────────────────────────┘
```

The header may be sticky, but it should occupy no more than 64 px on desktop. The page should scroll naturally; do not trap the whole dashboard in one small internal scroll container. The map itself can have an independent pan/zoom gesture area.

### 3.2 Page background layers

Layer order from back to front:

1. `CanvasBase`: near-black solid background.
2. `AmbientBloom`: two or three static radial gradients with very low opacity.
3. `FineNoise`: optional 1–2% monochrome grain texture, preferably via tiny inline SVG/data URI or CSS mask; never reduce text contrast.
4. `MapAtmosphere`: if appropriate, a slow-moving, low-opacity glow contained only inside map card.
5. `AppShell`: header, page context, card grid.
6. `FloatingUI`: tooltips, dropdowns, dialogs; highest z-index.

Do not use bright moving aurora behind charts; map motion should be bounded to the map card clipping region.

### 3.3 Z-index plan

| Layer | Z-index |
|---|---:|
| Canvas / noise | 0 |
| Content surfaces | 1 |
| Card-local visual overlay | 2 |
| Sticky app header | 20 |
| Dropdown / tooltip | 30 |
| Command palette / modal | 50 |
| Toast notifications | 60 |
| Critical full-screen error / loading overlay | 70 |

Keep card-local pseudo-elements behind content (`pointer-events: none`). Avoid creating new stacking contexts unintentionally with transforms on all card wrappers.

---

## 4. Component-by-component specification

## 4.1 Application top bar

**Role:** orientation, environment state, high-level controls. It should not compete with the map.

- Height: 60–64 px desktop; 56–60 px mobile.
- Horizontal padding: 24 px desktop, 16 px tablet, 12 px mobile.
- Background: `rgba(5, 10, 18, .72)`, bottom border `rgba(177,221,255,.08)`, optional `backdrop-filter: blur(22px)`.
- Brand mark: 28 × 28 px icon or logomark; 10 px gap to wordmark. Wordmark 14 px semibold.
- Environment label: 10–11 px uppercase, secondary/muted; use a small dot plus text rather than color alone.
- Top-level control spacing: 8 px between adjacent icon buttons; 16–24 px between grouped controls.
- Icon-button dimensions: 40 × 40 px; 18–20 px SVG icon; radius 10–12 px.
- Language control: compact segmented control, height 30–32 px; selected state has faint cyan fill and a 1 px accent border.
- Date/time: monospace 11–12 px; right aligned. On phone, move to a secondary status row instead of shrinking below readability.
- Hover: background lightens by about 4–6%; icon moves upward by at most 1 px. Transition 160 ms.
- Focus: 2 px cyan focus ring offset 2 px.
- Avoid generic admin navigation labels if the product only needs monitoring. Use only working destinations/actions.

**Header contents should include:** product identity, current environment/mode, connection/data freshness, language if supported, and account/settings only if functional. If no account system exists, omit the profile avatar placeholder.

## 4.2 Page-context strip

- Main heading: 24–28 px; one-line if possible.
- Subtitle: 13–14 px, secondary; 6 px below title.
- Left context group, right data-freshness group: use flex with `gap: 16px` and `justify-content: space-between`.
- Vertical padding: 20–24 px desktop; 16 px mobile.
- Data freshness indicator: dot 6 px; text 12 px; 8 px spacing. Show actual `updated at` time and stale/connected status with precise language.
- Optional filter strip: 8 px gap between controls; 16 px top spacing; height 36–40 px.
- Do not add a large marketing hero; dashboard content should begin quickly.

## 4.3 Hero river map

**Priority:** This is the hero component and the primary place to express animated 3D/map styling.

### Container

- Desktop height: 360–430 px, depending on map labels and toolbar. Target 390 px at 1440 × 900.
- Minimum height: 320 px; mobile height 300–360 px, with map-first interaction rather than labels crushed into the viewport.
- Padding: 20 px desktop; 16 px tablet; 14 px mobile.
- Radius: 18 px; clip map image/tiles and effects to the panel radius.
- Background: deep blue map surface with subtle gradient; cards remain translucent but map labels require an opaque enough local backing.
- Top row height: 24–32 px with title on left and layer/expand controls on right.
- Map visual fills remaining space; use an explicit aspect/container size to avoid resize jumps.

### Map content hierarchy

1. Baseline geography / river basin context.
2. Main river reaches with a clear cyan-to-blue route line and a restrained outer glow.
3. Gauge markers (e.g. Kanighat gauge) with distinct marker geometry.
4. Reach/station labels with collision-aware positioning.
5. Borders/regions as secondary lines.
6. Flow-direction arrows/traveling dash if the hydrological semantics support flow direction.
7. Scale, north indicator or coordinate readout only if helpful and accurate.
8. Map controls and legend.

### River stroke and marker specification

- Normal route: 3 px stroke; selected/active reach 4 px.
- Selected route glow: 6–10 px blurred shadow at 20–30% opacity, not a solid neon halo.
- Reach casing/outline if needed: 6 px low-opacity dark stroke behind 3 px route to preserve separation from terrain.
- Junction nodes: 6–8 px circles; key station marker 10–12 px outer circle, 5–6 px core.
- Active gauge marker: outer 16–20 px ring, core 8–10 px. Use a soft ring pulse lasting 2.4–3.4 seconds, opacity between 0.25 and 0.6; pause under reduced-motion preference.
- Selected reach label: 12–13 px, medium, with a 4 px gap to the anchor; alternate dark/light label backing depending on map contrast.
- Unselected labels: 11–12 px and muted; hide/aggregate them when zoomed out to reduce overlap.
- Flow dash cycle: 2.8–4.5 seconds per path; avoid rapid bright dashes. The direction must match actual flow direction.

### Interactions

- Hover reach: increase stroke brightness/width modestly; reveal tooltip with reach name, current value (with unit), timestamp and data-source status if available.
- Click reach: select it; update hydrograph and decision context consistently; show persistent selected state.
- Hover gauge: marker gains a ring and tooltip; no tooltip should obscure the clicked target.
- Click gauge: open small station detail popover or select a station; avoid a large modal for a simple read.
- Zoom controls: 40 × 40 px touch targets; plus/minus buttons separated by 8 px; reset/fit action available.
- Pan: pointer drag on desktop; touch pan on mobile. Do not hijack page vertical scroll unless the gesture begins inside the map surface.
- Layer switcher: compact panel with clearly labelled layer options; selected state includes both fill and checkmark.
- Map attribution/source and coordinate system should be accessible where applicable.

### 3D and image motion

- Treat 3D as depth, not perspective distortion: subtle `translateZ` layering, small shadows and a map-card parallax of at most 2–4 px when the cursor moves across the card.
- Do not rotate the geographical content in response to cursor; it falsifies spatial understanding.
- Optional elevation/terrain image can crossfade over 300–450 ms when layers change. Keep route/gauge overlays pinned and spatially registered.
- Optional animated satellite/terrain textures should move no more than 1–2 px over 12–20 seconds and should pause when not visible.
- Avoid full-map yaw/roll on hover. Keep map orientation stable; a north-up map should remain north-up.
- If using a pre-rendered map image, do not animate it with `background-position` in a way that implies geography moves. Animate overlays instead.

### Empty/loading/error states

- Loading: dark map base + low-contrast skeleton for reaches + tiny status `Loading reach data…`; use one slow shimmer (1.4–1.8 s), disable decorative route motion until data is ready.
- No station/reach data: message states what is missing and provides a retry/filter action; never display a fake marker.
- Failed tile/provider load: retain the route/geography if available, show a small non-blocking source warning and retry.
- Stale data: preserve the map, but place an explicit stale-data chip in the map header.

## 4.4 Harvest Decision panel

**Role:** make the current decision/status instantly understandable, with the supporting model values one level below.

### Structure

- Desktop width: 300–360 px (around 4/12 columns); align top and bottom with map card where feasible.
- Padding: 20 px; radius 18 px.
- Header eyebrow: 10–11 px; title 14–16 px.
- Status symbol: 44–52 px circle with a 1.5 px semantic stroke, restrained fill, and 20–24 px check/alert icon.
- Status word: 18–20 px semibold, 8–10 px under symbol.
- Supporting explanation: 12–13 px with 17–19 px line height; max width about 30 characters per line on narrow rail.
- Divider/section gap: 16–20 px.
- Parameter rows: each 30–38 px high; label 11–12 px, value 12–13 px semibold or monospace. Align all values on a shared right edge.
- Row separator may be a 1 px border at 6–8% white; do not draw a strong line under every row.
- Panel must identify the timestamp/as-of time for the displayed decision.

### Status state model

Do not invent decision rules in the UI. Map upstream application states to semantic display states:

- `normal`: green, check/shield icon, label from the domain logic.
- `watch`: amber, eye/triangle icon and concise reason.
- `warning`: orange/amber, alert icon and clear operational implication.
- `critical`: red, alert/octagon icon and explicit critical wording.
- `unknown`: grey/blue neutral, question/clock icon, explanation that status could not be determined.
- `stale`: status may still be shown but must also display data-age warning.

Use both icon and text. Never rely on green alone to mean safe. If the status model returns confidence, render the confidence and explain what it means; do not imply probabilistic confidence if the number is actually a different score.

### Motion

- On a status update, animate the icon scale from 0.96 to 1 for 180–220 ms and fade the supporting content over 160 ms.
- A critical transition may use one short accent stroke or edge flash (≤ 400 ms), never an infinite red pulse.
- Do not animate large values through every intermediate number if that obscures the actual change; a short count-up (≤ 600 ms) is acceptable for non-critical KPIs only.

## 4.5 Hydrograph / time-series visualization

**Role:** precise technical reading first, atmosphere second.

### Sizing and spacing

- Desktop panel minimum height: 290 px; target 320–350 px.
- Panel padding: 20–24 px.
- Header row: 24 px plus 12–16 px to the plot.
- Plot should claim most of the card's height. Leave bottom room for ticks and timeline scrubber.
- Plot left margin: 44–56 px if y-axis ticks are present; right: 16–24 px; top: 12–18 px; bottom: 36–44 px for time labels. Adjust dynamically for actual labels and units.
- Chart title 13–14 px; chart subtitle/unit 11–12 px; latest timestamp 11 px monospace.

### Data styling

- Primary line: 2 px cyan/blue, rounded caps and joins.
- Observed vs predicted series: use distinct color plus dashed/solid pattern; provide a legend.
- Uncertainty band: 8–15% opacity fill with no thick outline. Include legend wording such as “model range” only if this matches the method.
- Operational threshold: 1.5 px amber dashed line; label it near the right edge and add accessible text/legend. Avoid yellow-green low-contrast.
- Grid: 1 px `grid-line`; major horizontal grid only, unless vertical grid materially helps interpretation.
- Points: no markers for every sample on dense time series; show a 5–7 px point at hover/selected time.
- Axis ticks: 11–12 px with muted text. Data labels should not collide with plot line.
- No unnecessary 3D chart extrusion. Charts remain 2D even when panels have 3D depth.

### Hover/cursor tooltip

- Pointer interaction snaps to nearest meaningful sample (not arbitrary pixel-only values).
- Tooltip includes timestamp, series/value + unit, and secondary series/range if available.
- Tooltip surface: opaque dark backing, glass border, blur 18–22 px; width 160–240 px; 10–12 px padding.
- Tooltip content rows separated by 6–8 px; swatch + text gap 8 px.
- Keyboard navigation must have an equivalent: focusable plot summary and/or arrow-key sample exploration where feasible.

### Timeline scrubber

- Track height: 4–6 px; hit area at least 32–40 px tall.
- Thumb: visual diameter 10–12 px; focus/touch hit target 32 px or larger.
- Track baseline grey-blue, progress cyan; selected date/time readout above or beside the track.
- Do not let the scrubber overlap x-axis labels. Reserve explicit vertical space for it.
- Scrubbing updates map/time-sensitive values in a coordinated state transition; debounce expensive queries rather than dropping pointer responsiveness.
- Show start/end time labels and the currently selected timestamp. Use timezone abbreviation/UTC offset accurately.

### Motion and updates

- First render line draw: 450–700 ms with ease-out. Skip or shorten for frequent streaming refresh.
- Data update: interpolate only if appropriate; do not interpolate between incompatible units or large time gaps.
- Uncertainty band fade: 200–350 ms.
- Keep axes stable when possible. If domain changes, use a controlled 250–350 ms transition and a visual hint if the scale materially changes.
- Do not animate chart data while the user is selecting/dragging; pause nonessential animation until interaction ends.

## 4.6 Scientific validation metric row

The screenshot includes a row of five scientific/model metrics. Keep their meaning sourced from the app logic and give each metric a consistent card style.

- Desktop: five equal columns if labels remain legible; gap 12 px; panel padding 16–20 px.
- At widths where five columns become cramped, switch to a 3 + 2 grid or horizontally scrollable metric list with clear affordance. Do not squeeze the label to 8 px.
- Each metric card: min-height 82–100 px, padding 14–16 px, radius 12–14 px.
- Label: 10–11 px uppercase/overline or sentence case; define an acronym tooltip for technical terms.
- Value: 22–26 px; unit/suffix follows within 4–6 px if appropriate.
- Comparison/status: 11–12 px, 6–8 px below value. Use directional icon and words, not just color.
- Card backgrounds can vary by opacity, not by arbitrary hue. Selected metric may have a 1 px cyan border and faint top glow.
- Values must display correct precision and sign. Do not force every metric to the same decimal count if domain conventions differ.
- On hover/focus, show a short definition, data period and evaluation source in a tooltip/popover.

## 4.7 Operational limits / model notes

- Use a full-width, low-profile panel. Desktop target height 90–130 px depending on text; mobile can grow naturally.
- Accent: 2 px amber left border or a small amber overline, not a full amber background.
- Padding: 16–20 px.
- Heading: 12–13 px semibold, icon + 8 px gap.
- Body: 12–13 px, line height 18–20 px.
- Desktop items: 2–3 columns; each item begins with a small semantic icon or bullet, followed by concise note. Horizontal gap 20–24 px, vertical gap 12 px.
- Use actual application-maintained warnings/assumptions. Keep these separate from a transient error or urgent alert.
- If there are many notes, provide a collapsed “View all operational limits” disclosure while leaving the most important 2–3 visible.

## 4.8 Buttons, chips, inputs and toggles

### Buttons

- Primary height: 42–44 px; 12–16 px horizontal padding; radius 10–12 px.
- Primary fill: `cyan-400` or a restrained blue/cyan gradient only for the main action; dark text if contrast allows, otherwise white.
- Secondary: translucent surface, 1 px border, white text.
- Ghost: transparent, hover fill 5–8% white.
- Danger: reserved red fill/border only for destructive actions.
- Label 13 px medium; icon 16–18 px; icon-label gap 8 px.
- Motion: transform translateY(-1 px) on hover, press returns to 0 with scale 0.98; 120–180 ms.

### Chips and state badges

- Height: 24–28 px; horizontal padding 8–10 px; pill radius.
- Text: 11–12 px medium; icon 12–14 px with 5–6 px gap.
- Status tint: low-opacity semantic fill (8–12%) plus 1 px border (15–30%) and normal-contrast text.
- Avoid using glow to make all chips look selected.

### Inputs and filters

- Height 40–44 px; padding 12 px; radius 10 px.
- Default background `rgba(4, 12, 23, .55)`; border 1 px glass-stroke.
- Placeholder color must remain legible but weaker than entered text.
- Focus border cyan plus 2 px visible outline/outer ring.
- Label sits 6 px above; helper/error text 6 px below.
- Use explicit labels, not placeholder-only forms.

### Neumorphic circular control

Use only for small actions such as map reset, layer affordance or a compact icon toggle. Include a standard border and strong focus ring so the control does not disappear into the panel. Do not use neumorphism for primary actions.

## 4.9 Tooltips and overlays

- Tooltip show delay: 300–450 ms; hide delay 100–150 ms; never delay keyboard focus tooltip.
- Maximum width: 280 px; padding 10–12 px.
- Background opacity ≥ 92%; blur 14–20 px; border visible against both dark and bright areas.
- Popover radius 12–14 px; shadow medium.
- Modal: use only for a multi-step or high-impact workflow. A station detail can be a popover or drawer.
- Overlay closes on Escape; focus returns to the triggering control. Clicking inside a popover must not trigger map selection underneath.

---

## 5. Responsive behavior

### 5.1 Breakpoints

Use content-based breakpoints; these are initial suggestions:

| Name | Width | Layout behavior |
|---|---:|---|
| Small mobile | `< 480 px` | Single column; compact top bar; map first; validation cards 2 columns where readable |
| Mobile / large phone | `480–767 px` | Single-column cards; optional horizontal metric strip |
| Tablet portrait | `768–1023 px` | Persistent journey tabs with secondary controls in an accessible disclosure; map full width and decision panel below |
| Laptop / compact desktop | `1024–1679 px` | Brand and actions on the first header row, journey navigation centered below; map + decision rail in a 2:1 ratio where labels fit |
| Large desktop | `≥ 1680 px` | Single-row header; intended 8/4 split; center content to max-width 1680 px and do not enlarge chart text/spacing without limit |

### 5.2 Mobile order

1. Compact top bar; navigation and connection state stay available through the mobile menu.
2. Page context and essential filters.
3. Harvest decision summary (either before map if it is urgent, or directly beneath map according to product priority; the recommended first view is map then a concise decision summary).
4. Map (height 300–360 px; map toolbar buttons remain touchable).
5. Hydrograph.
6. Scientific metrics (2 columns or horizontal list).
7. Operational limits (collapsed if long).

On narrow widths, do not preserve desktop columns at the expense of unreadable panels. Reflow. On mobile the map should not require hover; all important details must be reachable by tap.

### 5.3 Responsive typography and spacing

- On widths below 480 px, page title 21–24 px; card headings 13–14 px; body remains 14 px.
- Card padding 14–16 px; gaps 12 px; page margins 12–16 px.
- Keep numeric values at least 20 px for important metrics.
- Do not hide status reason or freshness information solely to save space; move them into a clear disclosure if required.
- Use `min-width: 0` for grid/flex children and allow legitimate text wrapping. Avoid global `white-space: nowrap`.

---

## 6. Motion system: 3D, interface, images and map

### 6.1 Motion principles

Motion has to communicate **state, hierarchy, direction or causality**. Decorative motion is rare, slow, subtle and bounded. Nothing flashes continuously to manufacture urgency.

### 6.2 Timing tokens

| Token | Duration | Use |
|---|---:|---|
| `motion-instant` | 100–120 ms | Press feedback, tiny toggles |
| `motion-fast` | 150–180 ms | Hover, focus surface, simple state |
| `motion-normal` | 220–280 ms | Popover, panel change, status transition |
| `motion-slow` | 350–500 ms | Map layer crossfade, panel entrance |
| `motion-reveal` | 450–700 ms | First chart path draw, low-frequency reveal |
| `motion-ambient` | 12–24 s | Very subtle optional background/terrain drift |

Easing defaults: `cubic-bezier(.2, .75, .25, 1)` for entering; `cubic-bezier(.4, 0, .2, 1)` for state changes; `cubic-bezier(.2, 0, 0, 1)` for exits. Prefer `transform` and `opacity`; avoid animating blur, large shadows, height, or layout properties continuously.

### 6.3 Card depth and 3D hover

- Standard card hover: border opacity rises modestly; `translateY(-1px)` only where the card is interactive.
- Hero map may have a mild 3D parallax based on pointer position, capped at 2–4 px; separate visual layers respond at different strengths.
- No tilt on data-heavy metric cards, chart axes, or paragraphs.
- On touch devices, remove pointer parallax and hover transforms.
- Keep map geography spatially accurate. Use card and background depth to convey 3D, not map distortion.

### 6.4 Map flow animation

- Animate a dashed overlay along the route or a subtle traveling highlight, not the geometry itself.
- Use SVG `stroke-dasharray` / `stroke-dashoffset` if the route is SVG and performance is acceptable, or a map renderer's line animation layer.
- Duration roughly 3–5 seconds, linear and continuous only while the map is in view and the user has not requested reduced motion.
- A gauge pulse should be local and slow (2.4–3.4 s). A selected route should never pulse in a manner that looks like a warning.
- Distinguish normal continuous river flow from event/state alerts by shape and speed, not solely color.
- If the route is not temporal/flow-aware data, do not animate a flow direction. Use a static highlighted line instead.

### 6.5 Image animation and layer switching

- Animate between terrain/satellite/dark base layers with an opacity crossfade of 300–450 ms.
- Ensure all marker and vector layers stay aligned while the raster fades.
- Lazy-load heavy image layers; show a stable dark fallback to prevent layout shift.
- Do not autoplay large videos. If using a shader or animated texture, provide a static fallback and disable under reduced motion/low-power conditions.

### 6.6 Stagger and entry

- First page load: header appears without movement; page context fades in; main cards can stagger by 40–60 ms each, capped at 200 ms total delay.
- Keep the page immediately useful: do not delay core data behind a long cinematic intro.
- On data refresh, update only components whose data changed; do not replay all entrance animation.

### 6.7 Reduced motion and runtime performance

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    scroll-behavior: auto !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
  .map-parallax-layer { transform: none !important; }
}
```

Also expose a UI setting if the product supports motion preferences. Stop animated map/charts outside the viewport where possible (`IntersectionObserver`). Prefer CSS/SVG/canvas/WebGL layers for the required visualization; avoid rendering dozens of independently animated DOM elements. Keep the map pan/zoom at responsive frame rates, and profile on an average laptop and mobile phone.

---

## 7. Data visualization and information design rules

1. **Label first, effect second.** Titles, units, axes, timestamps, and status reason must remain visible above any decorative overlay.
2. Never display a number without its unit when the unit applies. Show units adjacent to the value and explain abbreviated units in context.
3. Be explicit about whether a value is measured, modeled, forecast, an uncertainty interval or a validation score.
4. Every chart uses a legend or direct labelling sufficient to distinguish series without relying only on color.
5. Keep scales and thresholds faithful to the underlying data. Never smooth or interpolate in a way that implies nonexistent measurements.
6. Round values consistently with the domain requirement, not just aesthetic preferences.
7. Use a timestamp and timezone for time-dependent decisions and time series.
8. Data freshness must be separate from the hydrological status: “NORMAL” does not automatically mean “data is current.”
9. Distinguish `no data`, `loading`, `stale`, and `zero`. They are not interchangeable.
10. If the display uses an uncertainty band, expose what the band represents (for example, confidence/credible interval or a model range) only when the method is known.
11. Technical acronyms in validation cards should have concise definitions in tooltips or a glossary panel.
12. Provide textual summaries or accessible data tables for complex plots where feasible.

---

## 8. Accessibility and usability requirements

- Full keyboard navigation across top bar, filters, map controls, cards, timeline and dialogs.
- Visible focus ring: 2 px accent plus 2 px offset; never remove `outline` without a replacement.
- Target sizes: 44 × 44 px preferred; spacing between touch targets at least 8 px where practical.
- Contrast: text 4.5:1; large text 3:1; important graphical objects/controls should have clear contrast against adjacent colors.
- Never communicate NORMAL/WATCH/CRITICAL with color alone; use status text and icon/shape.
- `prefers-reduced-motion` honored for every motion type, including image and map animation.
- Screen-reader labels for icon-only controls, chart summaries and map controls.
- Tooltips must also be available via keyboard focus and not require a mouse hover.
- Focus order follows reading order. Dialog/popover opening manages focus and restores it on close.
- Dynamic status updates should be announced carefully (e.g. polite live region for routine updates; assertive only for genuinely urgent critical updates). Avoid announcing every streaming sample.
- Support browser zoom to 200% without loss of core functionality or horizontal page overflow.
- Do not rely on 10 px text for any essential user decision. Overlines/metadata may be 10–11 px; critical status and values must be larger.
- Provide clear error copy with next steps and a retry affordance when feasible.

---

## 9. Component architecture (framework-agnostic)

Use the existing framework and conventions of the repository once inspected locally. Do not introduce a new front-end framework purely for this visual redesign. Suggested separation:

```text
AppShell
├── AmbientCanvas
├── TopBar
│   ├── Brand
│   ├── EnvironmentStatus
│   ├── DataFreshnessIndicator
│   └── HeaderActions
├── DashboardPageHeader
│   ├── PageTitle
│   ├── SelectionContext
│   └── DashboardFilters
├── DashboardGrid
│   ├── RiverMapPanel
│   │   ├── MapLayer
│   │   ├── ReachOverlay
│   │   ├── GaugeMarker
│   │   ├── MapTooltip
│   │   ├── MapLegend
│   │   └── MapControls
│   ├── HarvestDecisionPanel
│   │   ├── DecisionStatus
│   │   ├── DecisionExplanation
│   │   └── ParameterList
│   ├── HydrographPanel
│   │   ├── ChartHeader
│   │   ├── ChartLegend
│   │   ├── TimeSeriesPlot
│   │   ├── ThresholdLayer
│   │   ├── UncertaintyBand
│   │   └── TimelineScrubber
│   ├── ScientificValidationPanel
│   │   └── ValidationMetricCard[]
│   └── OperationalLimitsPanel
└── OverlayRoot
    ├── TooltipRoot
    ├── PopoverRoot
    ├── DialogRoot
    └── ToastRoot
```

### Component boundaries

- **Presentation components** receive typed props and do not fetch network data directly.
- **Data/state layer** owns selected basin/reach/station, timestamp, query state, refresh state and API mapping.
- **Visualization adapters** translate app data into a stable shape for the map and chart library.
- **Design tokens** and shared primitives (`GlassPanel`, `MetricValue`, `StatusBadge`, `IconButton`) are separate from domain components.
- Keep decision-rule logic out of presentation components. The UI formats the authoritative model result; it does not recompute the science.
- Make empty/loading/error/stale states explicit in component APIs rather than optional styling hacks.

### Suggested typed data contracts

Adjust exact field names to the repository's existing types; this is a design boundary, not a claim about the current implementation.

```ts
type DataFreshness = {
  status: "live" | "delayed" | "stale" | "offline" | "unknown";
  observedAt?: string; // ISO 8601 including timezone/UTC marker
  updatedAt?: string;
  sourceLabel?: string;
};

type DecisionSeverity = "normal" | "watch" | "warning" | "critical" | "unknown";

type DecisionSummary = {
  severity: DecisionSeverity;
  title: string;
  explanation: string;
  asOf: string;
  confidence?: number; // include only if the source defines this as confidence
  parameters: Array<{
    id: string;
    label: string;
    value: number | string;
    unit?: string;
    displayValue?: string;
  }>;
};

type Reach = {
  id: string;
  name: string;
  geometry: unknown; // use the project's actual GeoJSON/map-library type
  selected?: boolean;
  flowDirection?: "forward" | "reverse" | "unknown";
};

type TimeSeriesPoint = {
  timestamp: string;
  observed?: number | null;
  modeled?: number | null;
  lowerBound?: number | null;
  upperBound?: number | null;
};
```

If the real project uses different data structures, adapt the visualization layer instead of forcing a sweeping model refactor.

---

## 10. Suggested CSS token implementation

```css
:root {
  color-scheme: dark;
  --bg-950: #050A12;
  --bg-900: #08111F;
  --surface-900: rgba(14, 27, 45, .88);
  --surface-850: rgba(18, 35, 57, .78);
  --surface-800: rgba(24, 43, 68, .72);
  --glass-stroke: rgba(177, 221, 255, .14);
  --glass-stroke-strong: rgba(126, 213, 255, .34);
  --text-primary: #F2F7FF;
  --text-secondary: #A9BAD0;
  --text-muted: #71849C;
  --cyan-400: #35D8F2;
  --cyan-300: #74ECFF;
  --blue-500: #3185FF;
  --violet-500: #8172FF;
  --green-400: #30E08A;
  --amber-400: #FFC45C;
  --red-400: #FF647C;
  --grid-line: rgba(159, 191, 224, .10);

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;

  --radius-xs: 6px;
  --radius-sm: 10px;
  --radius-md: 14px;
  --radius-lg: 18px;
  --radius-xl: 24px;
  --radius-pill: 999px;

  --motion-fast: 160ms;
  --motion-normal: 240ms;
  --motion-slow: 420ms;
  --ease-out: cubic-bezier(.2, .75, .25, 1);
}

*, *::before, *::after { box-sizing: border-box; }

html { background: var(--bg-950); }
body {
  margin: 0;
  min-width: 320px;
  color: var(--text-primary);
  background: var(--gradient-canvas, var(--bg-950));
  font-family: Inter, Manrope, ui-sans-serif, system-ui, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  font-variant-numeric: tabular-nums;
}

.dashboard-shell {
  width: min(100% - 48px, 1680px);
  margin-inline: auto;
  padding-block: 20px 28px;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(300px, 1fr);
  gap: 16px;
}

.glass-panel {
  position: relative;
  min-width: 0;
  overflow: hidden;
  border: 1px solid var(--glass-stroke);
  border-radius: var(--radius-lg);
  background: var(--gradient-glass, var(--surface-900));
  box-shadow: 0 18px 44px rgba(0,0,0,.22),
              inset 0 1px 0 rgba(225,246,255,.075);
  backdrop-filter: blur(18px) saturate(125%);
  -webkit-backdrop-filter: blur(18px) saturate(125%);
}

.glass-panel:focus-within { border-color: var(--glass-stroke-strong); }

:focus-visible {
  outline: 2px solid var(--cyan-300);
  outline-offset: 2px;
}

@media (max-width: 1023px) {
  .dashboard-shell { width: min(100% - 32px, 900px); }
  .dashboard-grid { grid-template-columns: minmax(0, 1fr); }
}

@media (max-width: 479px) {
  .dashboard-shell { width: calc(100% - 24px); padding-block: 12px 20px; }
  .dashboard-grid { gap: 12px; }
}

@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
  .glass-panel { background: rgba(10, 20, 34, .96); }
}
```

If the codebase uses a CSS framework, implement these values through that framework's theme/token mechanism instead of adding competing styling systems.

---

## 11. Map/chart implementation options

Choose based on the actual repository dependencies and rendering approach, not only visual preference.

### Map

- If a map library already exists, keep it and style the surface/overlays around it.
- If using geographic raster/vector tiles, make sure attribution and provider terms are respected and the layer does not visually overwhelm the hydrograph/decision content.
- For simple basin geometry and a few reaches, SVG paths over a fixed projection can be sufficient and enable precise glow/dash animation.
- For interactive, geospatially accurate panning/zooming, use the map system already present; do not rebuild a GIS renderer in raw DOM.
- Ensure reach/gauge overlays respond to resize without losing geographic alignment.

### Charts

- Prefer the current plotting library if it supports accessibility, uncertainty bands, pointer interaction, and performant updates.
- Canvas/WebGL can help with large time series, but labels/tooltips still need accessible DOM equivalents.
- A bespoke SVG plot is practical for a moderate number of points and full styling control, provided axis/tooltip/keyboard needs are covered.
- Keep underlying data visible/exportable where appropriate; never make critical values available only through a hover tooltip.

### 3D library

Do **not** introduce a heavyweight 3D engine for parallax/shadows alone. CSS perspective, SVG depth layers, or a map renderer's supported custom layer will often provide the desired feel with lower bundle/performance cost. Use WebGL/Three.js only if a real 3D terrain/globe/elevation use case exists and performance is verified.

---

## 12. States, refresh behavior and error handling

Every data-heavy panel should have explicit UI variants:

- `loading`: stable container dimensions, low-distraction skeleton, non-deceptive placeholder values.
- `ready`: full data, as-of timestamp, accessible labels.
- `partial`: show what is present and identify which sub-data is unavailable.
- `stale`: retain context but show age/last successful update visibly.
- `empty`: state what filter/range or source may be responsible, only when known.
- `error`: explain the failure at a useful level and offer retry where possible.
- `offline`: distinct from an application error; show whether cached values are being displayed.

Avoid using fake zeros, made-up lines, or a default green status during loading. A stale decision must not look like a fresh live decision. Update timestamps in the user's configured/known timezone, or label UTC explicitly.

---

## 13. Performance and technical quality

- Keep card content layout stable while charts/maps load; reserve heights and use skeletons.
- Avoid blur filters over giant full-screen layers when a static gradient can do the job; expensive blur can be costly on integrated GPUs.
- Animate `transform`/`opacity` where possible. Avoid continuously animating box-shadow, `filter: blur`, top/left, or dimensions.
- Memoize or otherwise stabilize map source/feature data if the current framework requires it; don't recreate all geometry each render.
- Avoid rerendering every card on every live data tick. Keep subscriptions/state close to relevant components.
- Decouple chart cursor updates from full dashboard state if pointer movements become expensive.
- Lazy-load nonessential satellite/elevation imagery and below-the-fold detail views.
- Use vector icon assets (SVG/icon package already used by the project) instead of emoji for production controls.
- Avoid auto-playing video or large assets in the hero unless they materially support the monitoring task.
- Test blur and motion with a low-power mode, high device pixel ratio and mobile throttling.

---

## 14. Recommended implementation sequence

### Phase 1 — Audit and tokenization

1. Inspect the existing app entry, page/component structure, package manifest, styling approach, map/chart libraries and data types.
2. Preserve working data fetching, decision logic, coordinates, selection state, and hydrograph behavior.
3. Add central color/type/spacing/radius/motion tokens.
4. Create `AppShell`, `GlassPanel`, button/input/status primitives and responsive grid.

### Phase 2 — Layout redesign

1. Rebuild the header/page context without changing its data dependencies.
2. Make the map and Harvest Decision panel share a row at desktop sizes.
3. Rebuild the hydrograph with defined plot margins, legend, tooltip and timeline.
4. Convert scientific validation into consistent metric cards.
5. Restyle operational limits into a low-profile semantic panel.
6. Validate the first layout at 1440 × 900, 1280 × 800, 1024 × 768, 768 × 1024, 390 × 844 and 320 × 700.

### Phase 3 — Motion and visual polish

1. Add low-intensity background bloom and the shared glass surface style.
2. Implement map reach selection, gauge marker hover/focus and selection synchronization.
3. Add route animation only if flow direction/time semantics are valid.
4. Add chart reveal and update transitions.
5. Add restrained 3D panel depth/parallax; disable for touch/reduced-motion.
6. Add terrain/satellite crossfade only if the underlying layer is available and useful.

### Phase 4 — QA and refinement

1. Verify decision labels/values and timestamp are consistent with the underlying data.
2. Check contrast over every gradient and at 200% zoom.
3. Test keyboard-only usage, screen reader names, reduced motion and touch.
4. Test loading, empty, stale, partial, offline and error states.
5. Check performance during map pan/zoom and chart hover/scrub.
6. Remove effects that impair legibility or distract from the status decision.

---

## 15. Acceptance checklist

### Visual consistency

- [ ] One consistent 4 px spacing scale; key layout rhythm uses 8 px increments.
- [ ] Cards share border, radius, header alignment and padding rules.
- [ ] Cyan/blue is the primary interaction/data accent; semantic colors are reserved for state.
- [ ] Glass effects have adequate surface opacity and do not impair contrast.
- [ ] Neumorphism is used on small controls only, not as the only signifier of interactivity.
- [ ] Ambient blur is confined to the background/hero atmosphere.
- [ ] No overuse of glows, gradients, bright outlines or simultaneous animations.

### Map

- [ ] Reach paths and gauge coordinates remain accurate during resize/layer switch.
- [ ] Flow animation, if enabled, has a valid direction and meaning.
- [ ] Reach/gauge selection updates connected context without stale cross-panel state.
- [ ] Tooltip/map controls support keyboard and touch.
- [ ] Map attribution is present where required.

### Chart and metrics

- [ ] Axes, time zone, units, legend and thresholds are legible.
- [ ] Uncertainty band meaning is explicit when known.
- [ ] Timeline scrubbing updates the selected timestamp consistently.
- [ ] Validation labels/precision match the scientific/application source.
- [ ] Missing or stale data is never presented as a true zero/live value.

### Accessibility/performance

- [ ] Reduced motion is supported.
- [ ] Visible keyboard focus and minimum touch targets are in place.
- [ ] Status is not conveyed by color alone.
- [ ] Essential text contrast is verified.
- [ ] No layout jump during map/chart loading.
- [ ] Effects remain smooth on a representative mid-range device.
- [ ] Dashboard remains usable at 320 px width and 200% browser zoom.

---

## 16. Final design direction

The intended result should feel like a **premium scientific command center**: near-black/navy canvas, soft atmospheric cyan/blue/violet lighting, carefully layered glass panels, small tactile controls, accurate map geometry, a vivid but restrained river route, a crisp hydrograph, aligned scientific metrics, and semantic operational notes. The map and hydrological data should supply most of the visual energy; blur, 3D depth and animation should reinforce structure rather than compete with it.

**Non-negotiable priority order:** data correctness → legibility → hierarchy → interaction clarity → motion polish → decoration.

---

## 17. Integration notes

- This document is a visual/interaction specification based on the supplied references and visible dashboard screenshot. Repository source code was not successfully retrieved through the connected GitHub integration during preparation, so component names, framework-specific commands and dependency names above are intentionally framework-agnostic.
- Before implementation, confirm the real source paths, CSS approach, installed chart/map libraries and data schema; adapt the architecture rather than replacing working domain logic.
- Suggested file location in the repository: `docs/DESIGN_ARCHITECTURE.md` or root-level `DESIGN_ARCHITECTURE.md`.

---

## 18. Module 2: Historical Rainfall Trend Explorer UI Specification

### 18.1 High-Level Component Architecture
Module 2 is delivered within the existing Next.js 16 App Router application as a dedicated, decoupled view (`TrendExplorerViewer.js`) mounted conditionally in `ui/app/page.js`:

```
AppHeader (Top Bar) ──► Mode Switcher: [ 🛰️ Real-Time Warning ] | [ 📊 Rainfall Trends ]
                              │
         ┌────────────────────┴────────────────────┐
         ▼                                         ▼
[Mode = WARNING (Mod 1)]                  [Mode = TRENDS (Mod 2)]
  ├─ 5-Second Triage Bar                    ├─ Sector / Indicator Controls Bar
  ├─ 8:4 Hero (RiverMap + Decision Rail)     ├─ 25-Year Recharts Time-Series Chart
  └─ Forecast Timeline Hydrograph           ├─ 4 Factual Statistical Readout Cards
                                            └─ Contextual Climatological Disclaimer Box
```

### 18.2 UI Controls & Interaction Tokens
1. **Header Segmented Control:**
   - 32 px height segmented pill in `AppHeader.js`.
   - Active state: `#287BB5` background with white text (`#FFFFFF`) and 2 px offset focus ring.
   - Switches telemetry view in state without full page reload.
2. **Controls Toolbar (`TrendExplorerViewer.js`):**
   - **Zone Selector:** Dropdown selecting between *Zone A (Meghalaya Ridge)*, *Zone B (Eastern Inflow)*, and *Zone C (Central Haor Basin)*.
   - **Indicator Segmented Toggle:** Compact button pair switching between `$PRCPTOT_{AM}$` (Total Rain, mm) and `$R50mm_{AM}$` (Heavy Rain Days $\ge 50\text{ mm}$).
3. **Recharts Multi-Decadal Time Series:**
   - Canvas backdrop: Crisp white card surface (`#FFFFFF`) with `#DCE5EA` border.
   - Bar / Point elements: `#287BB5` river blue with subtle hover highlight.
   - Sen's Slope Trend Line: Distinct solid navy line (`#175A85`, 2.5 px stroke).
   - Analytical 95% Confidence Interval Envelope: Shaded band with `rgba(40, 123, 181, 0.12)` fill.
   - Tooltip: Floating white card with 1 px border, displaying Year, Observed Metric, and Trend-Fitted Value.
4. **4 Factual Statistical Scorecard Cards:**
   - Card 1: **Trend Slope ($\beta$):** Displayed in mm/decade or days/decade with analytical 95% CI.
   - Card 2: **Statistical Significance:** Governing $p$-value with clear status badge ("Statistically Significant ($p < 0.05$)" or "No Significant Trend ($p \ge 0.05$)").
   - Card 3: **Autocorrelation Audit:** Sample lag-1 $r_1$ value and governing test badge (Standard MK vs Modified MK).
   - Card 4: **Data Completeness:** Verified 100% complete seasons count ($25/25$ seasons).
5. **Contextual Climatological Disclaimer:**
   - Soft recessed well (`#F8FAFC`) with `#DCE5EA` border.
   - Explicit disclaimer text: *"Historical rainfall trends reflect multi-decadal climatology and do not predict individual flood events."*

