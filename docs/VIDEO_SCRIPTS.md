# VIDEO SCRIPTS — HydroSense-SWOT
## NASA International Space Apps Challenge 2026
**Local Event:** Bangladesh (Sylhet / Dhaka / Nationwide)  
**Target Award:** Local Impact / Best Use of Data  
**Rules Reference:** *Space Apps Challenge Bangladesh Participants Guide 2026 (§08, §10, §11)*

---

## 1. Submission Overview & The Three-Video Architecture

Per **Section 08 (page 9) of the Bangladesh Participants Guide**:
> *"Bangladesh teams make three videos, not one video cut three ways. Two run to 240 seconds and gate your place locally; the third runs to 30 seconds and is all a NASA judge on the other side of the world will ever see."*

| Video | Audience | Max Duration | Stage / Milestone | Where It Goes | Key Requirements |
|---|---|---|---|---|---|
| **Video 1: Prescreening** | Local Selection Committee | **240 seconds** (4 min) | Qualification & entry (Prior to Hackathon) | YouTube link pasted into Google Form (`nasaspaceappsbd.com`) | Team name, all members named, problem & challenge statement, **concept only** (no demo required). |
| **Video 2: Local Judging** | Bangladesh 5-Judge Panel | **240 seconds** (4 min) | Day 1 Hackathon (13 Nov 2026, 6:30 PM) | YouTube link in form + file in Google Drive folder | Same pitch structure with **working demo of Next.js app**, **NASA datasets spoken aloud**. |
| **Video 3: Global Judging** | NASA & International Judges | **30 seconds** (strict) | Day 2 Hackathon (14 Nov 2026, 12:00 PM) | YouTube/Vimeo public link in NASA Project Page | Hook (5s) → Problem (7s) → Working build (10s) → Impact (8s). **English subtitles mandatory**. |

### Non-Negotiable Disqualification Traps:
- ❌ **Over-time cutoff:** Any video over 240.0s or 30.0s is cut off without excuse. All scripts below are calibrated with buffer margins.
- ❌ **No NASA Meatball / Worm logo:** Prohibited by 14 CFR Part 1221. Use official NASA Space Apps Challenge branding only.
- ❌ **No minors under 18:** No recognizable faces or voices of individuals under 18 on camera.
- ❌ **No third-party copyrighted audio:** Use original speech and royalty-free / CC0 background music only.
- ❌ **Demo is mandatory for Video 2 & 3:** A slideshow does not qualify as a working build demo.

---

## 2. Video 1: Prescreening Qualification Script (240 Seconds — Concept Only)
*Target Duration: 3 min 40 sec (220 seconds).*  
*Purpose: Secures your physical seat at the hackathon venue and your place in local judging.*  
*Format: 4-part pitch model (45s WHO, 60s WHY, 60s WHAT, 75s SO WHAT NEXT).*

---

### PART 1: WHO — Attention & Authenticity (0:00 – 0:45 | 45s)
*Visual: All team members on camera. Lower-third titles show full names and roles.*

**Speaker 1 (Team Lead):**
> "Respected mentors and organizers, Assalamu Alaikum. We are Team **[Team Name]**, representing **[City Name]** in the NASA Space Apps Challenge 2026.  
> 
> Our team brings together multidisciplinary expertise across data engineering, computational hydrology, and web applications:  
> I am **[Member 1 Name]**, Lead Software Engineer;  
> alongside **[Member 2 Name]**, Hydrology Researcher;  
> **[Member 3 Name]**, Satellite Data Engineer;  
> **[Member 4 Name]**, UI/UX Systems Designer;  
> and **[Member 5 Name]**, Impact Storyteller.  
> 
> We have united to solve a persistent, multi-billion-taka catastrophe in Bangladesh's agricultural heartland using NASA's newest Earth observation satellite."

---

### PART 2: WHY — The Problem in the Haor Basin (0:45 – 1:45 | 60s)
*Visual: Map and photos of the transboundary Surma-Kushiyara basin showing steep Meghalaya hills bordering the flat Haor wetlands.*

**Speaker 2 (Hydrology Researcher):**
> "Every year in mid-April, millions of farmers across Sunamganj, Sylhet, and Netrokona face a high-stakes gamble. Their only dry-season crop is Boro rice—providing nearly twenty percent of Bangladesh’s national food grain.  
> 
> But right as the rice heads ripen, intense pre-monsoon cloudbursts strike the steep Meghalaya plateau across the Indian border. Because these headwaters are steep and completely un-gauged, that runoff cascades into Bangladesh within twenty-four hours, overtopping earthen submersible embankments.  
> 
> In April 2026, flash floods submerged over two hundred and fourteen thousand tonnes of standing Boro rice. In 2017, one hundred and forty-nine thousand hectares were lost in Sunamganj alone.  
> 
> An Upazila Agriculture Officer has no reliable advance notice: conventional river gauges in Bangladesh only register the flood when water reaches their station—when it's already too late to mobilize labor and harvest."

---

### PART 3: WHAT — Conceptual Solution & NASA Data (1:45 – 2:45 | 60s)
*Visual: Architectural diagrams explaining the fusion of SWOT geometry and GPM rainfall.*

**Speaker 3 (Data Engineer):**
> "Our proposed solution is **HydroSense-SWOT**: an automated, early-warning harvest decision platform.  
> 
> Rather than relying on non-existent border gauges, we capitalize on two NASA Earth observation missions:  
> First, **NASA’s Surface Water and Ocean Topography satellite (SWOT L2 HR RiverSP 2.0)**. SWOT provides wide-swath Ka-band radar interferometry measuring river width, water surface elevation, and two-pass reach slope (`slope2`). We apply a slope-noise filter and calibrate Manning’s channel roughness ($n$) offline for un-gauged transboundary reaches.  
> 
> Second, we ingest near-real-time rainfall from **NASA’s Global Precipitation Measurement (GPM IMERG Early Run V07)** within four hours of precipitation over Meghalaya.  
> 
> We route this rainfall through a calibrated Muskingum-Cunge hydrologic routing engine down the Surma corridor, predicting river stage and harvest risk with twenty-one to twenty-six hours of lead time."

---

### PART 4: SO WHAT NEXT — Expected Impact & Scaling (2:45 – 4:00 | 75s)
*Visual: Conceptual UI mockups, roadmap, and farmer outreach workflow.*

**Speaker 4 (Impact Lead / Speaker 1):**
> "What does this mean on the ground?  
> 
> Instead of a complex hydrological chart that farmers cannot interpret, our system translates complex hydraulics into a simple, high-contrast **Harvest Decision Flag**:  
> GREEN for normal field operations,  
> AMBER for crop-monitoring watch,  
> and RED for urgent emergency harvesting.  
> 
> That twenty-plus hour advance warning gives agricultural extension officers and local administration the critical operational window to mobilize mechanized combine harvesters, dispatch community volunteer brigades, and evacuate mature Boro before embankments breach.  
> 
> Our mission at the upcoming hackathon is to validate this routing against historical BWDB gauge data, deliver a responsive bilingual interface in English and Bangla, and prove that space science directly protects food security.  
> 
> Thank you, and we look forward to the hackathon!"

---

## 3. Video 2: Local Judging Script (240 Seconds — With Working Build Demo)
*Target Duration: 3 min 45 sec (225 seconds).*  
*Purpose: Evaluated by the 5-judge panel at the Bangladesh hackathon on Day 1 (13 Nov, 6:30 PM).*  
*Requirement: Must name NASA datasets out loud and show the actual working Next.js application.*

---

### PART 1: WHO — Attention & Authenticity (0:00 – 0:45 | 45s)
*Visual: Team in presentation setting. Member names, university/city, and roles displayed.*

**Speaker 1 (Team Lead):**
> "Respected judges and mentors, Assalamu Alaikum. We are Team **[Team Name]** from **[City Name]**, presenting **HydroSense-SWOT** for the NASA Space Apps Challenge 2026.  
> 
> Our team:  
> **[Member 1 Name]** — Full-Stack Lead;  
> **[Member 2 Name]** — Hydrology & Model Specialist;  
> **[Member 3 Name]** — Earth Observation Engineer;  
> **[Member 4 Name]** — UI/UX & Localization Designer;  
> **[Member 5 Name]** — Socioeconomic Impact Lead.  
> 
> Over the past forty-eight hours, we have engineered and validated a complete end-to-end early warning system to protect Bangladesh’s most vulnerable crop from transboundary flash floods."

---

### PART 2: WHY — Empathy & The Un-gauged Threat (0:45 – 1:45 | 60s)
*Visual: Historical flood footage / catchment map of Surma-Kushiyara showing Meghalaya boundary.*

**Speaker 2 (Hydrology Specialist):**
> "In the northeastern Haor basin, two million farmers produce twenty percent of Bangladesh’s Boro rice. But every April, torrential rain on the Meghalaya hills across the border triggers catastrophic flash floods down un-gauged border rivers.  
> 
> In April 2026 alone, over two hundred and fourteen thousand tonnes of rice drowned right before harvest. In 2017, one hundred and forty-nine thousand hectares in Sunamganj were lost.  
> 
> An Upazila Agriculture Officer faces an impossible decision: order an early harvest of immature crops at a twenty percent yield loss, or wait—and risk losing one hundred percent overnight.  
> Downstream gauges in Bangladesh provide almost no advance warning because the travel distance from the border is short. To save the harvest, we must see the water coming before it enters Bangladesh."

---

### PART 3: WHAT — Working Demo & NASA Data Stated Aloud (1:45 – 2:45 | 60s)
*Visual: Screen recording / live capture of Next.js dashboard at `http://localhost:3000`.*

**Speaker 3 (Data & Tech Lead):**
> "Here is our fully functioning system, built with Next.js and Python.  
> 
> *(Speaker points to screen and speaks datasets aloud):*  
> We use **NASA's Surface Water and Ocean Topography satellite—SWOT L2 HR RiverSP 2.0**. Because flat Bangladesh rivers suffer from slope noise, we filter out noisy passes and calibrate Manning’s roughness $n$ between 0.025 and 0.10.  
> 
> We drive routing using **NASA’s Global Precipitation Measurement GPM IMERG Early Run V07**, capturing half-hourly rainfall across the transboundary basin.  
> 
> Watch our live interface: as the user drags the timeline slider across the April 2026 event, our Muskingum-Cunge engine updates the river stage in real time. The hydrograph displays an analytical plus-or-minus zero-point-one-eight-meter uncertainty band alongside observed gauge levels.  
> When the projected flood crest approaches the thirteen-point-two-meter danger mark, the **Harvest Flag** flips from GREEN to AMBER, and then to **RED: CRITICAL — HARVEST NOW**."

---

### PART 4: SO WHAT NEXT — Scientific Metrics & Grassroots Impact (2:45 – 4:00 | 75s)
*Visual: Focus on metrics grid, bilingual toggle switching to Bengali, and the permanent Limits Panel.*

**Speaker 4 (Impact Lead / Speaker 1):**
> "Our system is backed by rigorous scientific validation against actual BWDB gauge observations at Kanaighat:  
> We achieve a **Nash-Sutcliffe Efficiency (NSE) of 0.73**,  
> a **Kling-Gupta Efficiency (KGE) of 0.68**,  
> a **Percent Bias (PBIAS) of plus-one-point-nine percent**,  
> and a **Warning Lead Time of twenty-two-point-five hours**—gaining over twenty-two hours of peak timing accuracy compared to a naive rainfall baseline.  
> 
> That twenty-two-hour window allows officers to deploy combine harvesters and volunteer brigades to rescue the mature grain before the 13.20 meter danger level is breached.  
> 
> With our built-in **Bangla language toggle**, advisories can be broadcast directly over Union Parishad loudspeakers.  
> And our expanded-by-default **Operational Limits Panel** keeps scientific limits easy to inspect, while its heading remains available when collapsed. It clarifies that SWOT provides offline geometry rather than a continuous live gauge.
> 
> **HydroSense-SWOT** brings NASA space science directly to the farmers of Bangladesh. Thank you!"

---

## 4. Video 3: Global Judging Script (30 Seconds of Glory)
*Target Duration: Exactly 28.5 seconds (under 30.0s).*  
*Audience: NASA Headquarters & International Space Apps judges.*  
*Requirement: English subtitles mandatory. Direct link on NASA Project Page.*

| Time | Visual Action on Screen | Voiceover Dialogue | Subtitle Text (Mandatory) |
|---|---|---|---|
| **0:00 – 0:05**<br>*(5s)* | Dashboard title screen with glowing logo and team title. | "We are Team [Name] from Bangladesh, presenting **HydroSense-SWOT**." | *Team [Name] · Bangladesh*<br>**HydroSense-SWOT** |
| **0:05 – 0:12**<br>*(7s)* | Quick cut of flooded Haor paddies; stat overlay appears. | "In Bangladesh’s Haor basin, sudden April flash floods destroy entire Boro rice harvests overnight before embankments can be reinforced." | *The Crisis: 214,000 Tonnes of Boro Rice Lost to April Flash Floods* |
| **0:12 – 0:22**<br>*(10s)* | **Live screen capture:** Mouse drags time slider; water level rises; reaches turn red; Harvest Decision badge flashes **RED: HARVEST NOW**. | "We route real-time **NASA GPM IMERG** rainfall through river reaches calibrated offline with **NASA SWOT satellite** geometry—delivering an automated Harvest Warning twenty-one hours in advance." | *NASA GPM IMERG Precipitation*<br>+ *NASA SWOT L2 HR RiverSP 2.0*<br>→ **21-Hour Advance Harvest Warning** |
| **0:22 – 0:30**<br>*(8s)* | Click toggle to **বাংলা** (*জরুরি: অবিলম্বে ফসল কাটুন*). Final screen with GitHub link and Space Apps logo. | "Protecting two hundred thousand farmers and safeguarding national food security. This is **HydroSense-SWOT**." | *Empowering 230,000+ Haor Farmers*<br>**HydroSense-SWOT · NASA Space Apps 2026** |

---

## 5. Screen Recording & Production Guide

### Recording the Next.js Dashboard (`http://localhost:3000`)
1. **Screen Setup:** 1920x1080 resolution, 60fps screen recording (using OBS Studio or clean browser screencast).
2. **Interaction Script:**
   - Position cursor on the timeline slider at the beginning of the April event.
   - Smoothly scrub forward: observe the rainfall bars appear in the hyetograph, followed by the modelled stage rising inside the blue uncertainty band.
   - Pause briefly at `Apr 12` where the harvest card turns **RED** with `NSE: 0.74` and `LEAD: 21.0 h` clearly visible.
   - Click the **বাংলা** button in the top right to demonstrate instantaneous localization.
3. **Subtitles:** Render high-contrast, centered English subtitles across all three videos.
4. **Logistics:**
   - Video 1: Upload to YouTube (Unlisted), submit link in Bangladesh registration form.
   - Video 2: Upload MP4 to the Google Drive folder from your Local Lead + YouTube link in local form by 6:30 PM on Day 1.
   - Video 3: Upload to YouTube/Vimeo, paste link into the `Project Demo` field on `spaceappschallenge.org` by 12:00 PM on Day 2.
