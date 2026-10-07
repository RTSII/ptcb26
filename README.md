# PTCE 2026 Study App

Private study PWA for Rob's PTCE retake. Vanilla HTML, CSS, and JavaScript. No framework, build, backend, or accounts.

Repo: [RTSII/ptcb26](https://github.com/RTSII/ptcb26)

Rob passed the PTCE around 2020. The point of this app is the post-2020 material and the outline effective January 6, 2026, not a reteach of basics he already knows.

## What it does

Seven static pages, served from the repo root:

| Page | Role |
|---|---|
| `index.html` | Home. Study Course is the large center panel; Flashcards, Quiz, Practice Exam, and Notes sit around it. Progress is a header icon. |
| `course.html` | 12 modules. Work a lesson, then jump into a domain quiz. |
| `notes.html` | Compressed notes by domain. |
| `flashcards.html` | Flip / filter deck. |
| `quiz.html` | Quick 10, Chapter Test, Missed, Bookmarked, Weakest Domain, Weakest Subtopic. |
| `exam.html` | Weighted practice exam. Length 30 / 60 / 90. Timer off, 60 min, or 110 min. |
| `dashboard.html` | Local scores, domain accuracy, blueprint weights, export / import. |

Progress lives in `localStorage` under `ptce2026_progress_v1`. Study text lives in `data/*.json`. Markdown is project docs only.

## Content rules

- Only current 2026 PTCE facts. Outdated material does not stay in the default pools.
- Official outline (PTCB Job Analysis 2024, effective January 6, 2026):

| Domain | Weight | 90-question draw |
|---|---:|---:|
| Medications | 35% | 32 |
| Patient Safety and Quality Assurance | 23.75% | 21 |
| Order Entry and Processing | 22.50% | 20 |
| Federal Requirements | 18.75% | 17 |

The 90-question counts are the rounded whole-question split in `js/exam.js` (`BLUEPRINT_90`). Shorter exams scale that split.

Use those four domain strings in JSON. Do not invent short aliases in the data files.

Items that are off the 2026 core are optional course lessons or `featured: false`, and they stay out of the default exam, Quick 10, and weak-area pools. Archive still in the bank: alligation (question `q136`, flashcards `47` and `109`), sterile-garbing question `q122`, and four optional lessons (NTI list, sterile cleanroom/garbing, USP `<795>` technique, alligation).

## Working rules

- Do not merge without Rob's explicit OK. A North verify by itself is not a merge.
- Code changes go through Cursor cloud agents. Review happens on GitHub pull requests.
- `node validate.js` checks schema, IDs, domain names, and a few copy assertions. It is not a content sign-off.

## Locked UI standards & Design Rubric

These are locked design standards across the app. Follow this rubric for future project edits and new UI components and templates.

1. **Viewport fit (Chrome laptop)**:
   - Content-hug cards. Dense only as needed. A card fills most or all of the Chrome viewport (at least ¾). Kill side and bottom dead space.
   - Tight padding, including the card bottom and the buttons, out to the screen edge. Body type stays laptop-readable (no squint).
   - Kill phantom overflow (a few pixels of scroll when content barely exceeds the viewport). Short pages never scroll.
   - Real vertical scroll is OK only when dense content genuinely overflows.
2. **Organic Shapes & Translucent Elements (Beyond Bento Rectangles)**:
   - Cards and action triggers are **not** restricted to standard rounded rectangles or rigid bento blocks.
   - Unique shapes (circular reactor consoles, chamfered obsidian pods, concentric targeting reticles) provide organic visual hierarchy.
   - **Center-point dimensioning**: measure boundaries from the center, with even padding. Tightness follows viewport fit (#1).
   - **Selective translucency**: Not all cards need opaque solid fills. Interactive telemetry cores utilize translucent radial glass (`background: radial-gradient(...)` with `backdrop-filter: blur(...)`) to let animated Matrix code cascade visibly behind rotating rings.
3. **Physical / Skeuomorphic Matrix Metaphors (e.g. Rolodex Index Cards)**:
   - Cards with physical counterparts (e.g. Flashcards) draw inspiration from tangible tools (the iconic rotating desktop Rolodex or the matrix operator contact directory).
   - Features include tabbed index tops, subtle stepped deck drop-shadows (creating the illusion of stacked cards beneath), custom spindle notch icons, and minimal text fluff. Keep only functional status badges and clear action triggers.
4. **Header Architecture Standard (3-Zone Balanced Grid)**:
   - All subpage headers follow a strict 3-zone CSS grid (`1fr auto 1fr`):
     - **Far Left**: The Matrix Red Pill / Blue Pill dual-capsule icon (`38px × 32px`, tilted capsules with 3D gradients and gloss highlights) + `PTCE 2026` logo.
     - **Center**: Page Title + Contextual Icon, strictly centered horizontally and tightly padded to body margins.
     - **Far Right**: Contextual navigation trigger (`‹ Home`, `‹ Course`, or utility button).
5. **Legibility First (Matrix-cohesive, contrast where dense)**:
   - Monolithic bright green across whole pages causes eye fatigue during dense clinical reading — avoid wall-of-green body text.
   - **Primary direction is a cohesive Matrix theme** shared with Home (obsidian-green fills, chamfered panels, mint/cyan accents). Slate-as-Notes-end-state is retired; it was only a non-green contrast option, not the product goal.
   - Dense Notes / Course / Exam surfaces may use cooler or neutral accents for long prose when that improves contrast, without breaking Matrix identity.
   - Body text stays high-contrast and readable (proportional sans for paragraphs; `JetBrains Mono` for stems, codes, doses, ratios, formulas).
   - Phosphor green / mint / cyan are for keys, stems, active state, and telemetry — not full-page body wash.
   - Working plan: `study_notes_v4_plan.md` (v3 kept as history).
6. **Zero-Cutoff & Parenthesis-Safe Parsing**:
   - Medical and clinical text contains nested semicolons and parentheses (e.g. `Tylenol = acetaminophen (max 4,000 mg/day; hepatotoxic in overdose).`).
   - Semicolon delimiters must be parsed using parenthesis-safe algorithms (`splitOutsideParens`) so that parenthetical notes, dosage caps, and warnings are never truncated or broken into orphaned chips.
7. **Contextual Multi-Layout Presentation**:
   - Avoid forcing all study data into generic bullet points. Match the content structure to purpose-built layouts:
     - **Brand / Generic**: 2-up dual-column responsive data table with explicit column headers (`BRAND NAME` | `GENERIC NAME`).
     - **OTC Active Ingredients**: 3-column table (`OTC BRAND NAME` | `ACTIVE INGREDIENT` | `CLINICAL CLASS & KEY PEARLS`).
     - **Abbreviations & Conversions**: compact chart, list, or token grid with header legend (`ABBREVIATION` ➔ `CLINICAL TRANSLATION`).
     - **Clinical Specs & Schedules**: 2-column specifications table (`CLASSIFICATION / SCHEDULE` | `CLINICAL MECHANISMS & PEARLS`).
     - **Procedures & Laws**: Briefing cards with `#01` index chips and bolded tags, Matrix-cohesive with the page.
8. **One control per job**:
   - Remove instructional or descriptive filler above the content.
   - Merge a duplicate nav or filter bar into the card it controls. Do not show "x of y" when a dropdown or indicator already shows position. No second prev/next set doing the same job in the same area.
   - Combine and edit to cut redundancy and format tighter. This does not force everything into one card.
   - v4 Notes target: domain rail + topic stage; see `study_notes_v4_plan.md`.
9. **Action row / button template**:
   - One row: Back or Prev far left, primary (Start, center control, or dropdown) center, Next far right.
   - Primary CTAs are centered in the card.
   - Prefer icon-only prev/next where the meaning is obvious. Compact, consistent, on-theme. Same glyph style and size for the same action on every page.
10. **Centering**:
    - Card titles and card icons are center-aligned by default, not only the page-header center zone.
11. **Accordions**:
    - Default closed on page load. No auto-open, and do not restore an open state on load, unless Rob asks otherwise.
12. **Visual aids**:
    - Prefer in-code charts, tables, compact lists, and SVG that replace repeated prose and save space (conversions as a chart or list).
    - Decorative AI art is deferred and is never a substitute.
13. **UI work sequence**:
    - Lock these standards, test on the Chrome laptop viewport, then extras.
    - After any service-worker cache bump, unregister the service worker and clear site data before judging UI.

## Theme & Visual System

Matrix is primary on every surface. Home is the reference look.

- **Blend by surface**: classic green rain, Neo-Zion industrial green, and Resurrections cleaner neon.
- **Vaporwave is a light accent only** (icons, small glows). Never co-equal. Not glowy-everything. Flashy is OK only when the control is functional first.
- **Surfaces**: obsidian (`#010804`), emerald (`#00ff41`), mint (`#b6ffc9`). Cyan (`#05d9e8` / `#38bdf8`) and pink (`#ff2a6d`) stay small accents.
- **Cards over rain** may be less opaque so the background shows. Never at the cost of legibility.
- **Shared tokens**: `css/matrix.css` is planned so Notes, Course, and Exam inherit Home. Not extracted yet.
- **Matrix rain** (`js/app.js`): quality over density — fade, placement, angle, perspective, and depth, not more glyphs.
  - Cascading Katakana and hex columns. Bright green leads with white tips; darker green behind.
  - Smooth fade toward the bottom. No static grid overlays.
  - Skip when `prefers-reduced-motion` is set.


## Run it

Serve the repo folder on the desktop:

```text
Desktop\PTCB26
http://127.0.0.1:8000/
```

From that folder:

```bash
python -m http.server 8000
```

Open `http://127.0.0.1:8000/`. `fetch()` of the JSON files needs a local server. `file://` is not a supported way to study.

On `localhost`, `127.0.0.1`, and `::1`, `js/app.js` unregisters any service worker and deletes Cache Storage so a normal refresh shows the files Python just served.

## Service worker

Cache name: see `sw.js`.

- Install precaches the HTML, CSS, JS, JSON, manifest, and icon, then `skipWaiting()`.
- Activate deletes every cache whose name is not the current one, then `clients.claim()`.
- Same-origin GET only. Fonts and anything cross-origin are left to the network.
- App shell (navigations, HTML, CSS, JS) is network-first, cache fallback if offline.
- JSON and the other same-origin assets are cache-first.

After a cache-name bump, unregister the service worker and clear site data before judging UI. A hard refresh (`Ctrl + Shift + R`) bypasses disk cache. Asset URLs carry a query-string cache buster.

## Layout

```text
index.html  course.html  notes.html  flashcards.html  quiz.html  exam.html  dashboard.html
manifest.json  sw.js  icon.svg  validate.js
css/style.css  css/home.css  css/notes.css
js/app.js  home.js  course.js  notes.js  flashcards.js  quiz.js  exam.js  dashboard.js
data/course.json  notes.json  flashcards.json  questions.json
README.md  TODO.md  study_notes_v4_plan.md  study_notes_v3_plan.md
```

There is no `app/` directory. Shared helpers are `window.App` (`Storage`, `Util`, `DOMAINS`, `FX`) in `js/app.js`.

## Current state

**Study Notes next step:** Terminal Codex is **planned only** — see `study_notes_v4_plan.md` (content audit: merge map, dups, 5 review flags). Live Notes still renders the committed legacy `items` JSON in `data/notes.json`. The local-only v2 `blocks` file must never be served in that path — the old runtime renders it empty. Keep it outside `data/` until the blocks runtime ships. Do not start implementation until Rob says go. Course / Exam Matrix later.

Key recent architecture and UI upgrades:
- **Study Notes Codex v2 (baseline on main after notes-v3 merge)**:
  - Interim dense-reading palette and five purpose-built clinical layouts; 3-zone notes header; bottom filter; `splitOutsideParens`.
  - v4 plan replaces slate-as-end-state with Matrix-cohesive Notes UI and trimmed search/nav chrome.
- **Flashcard Tabbed Rolodex Index Card**:
  - Physical index-card trigger with top file tab, stepped deck depth, spindle notch icon.
- **Organic Circular Matrix Reactor Core**:
  - Dashboard trigger as translucent circular reactor with center-point dimensioning.
- **Matrix Red Pill / Blue Pill Brand Identity**:
  - Dual-capsule icon (`38px × 32px`) across headers.
- **Matrix Rain FX Refinement**:
  - Cascading Katakana columns with lead highlights and depth fading.


Bank on this commit:

- 219 questions (Medications 69, Patient Safety 51, Order Entry 46, Federal Requirements 53), including 2 `featured: false`
- 190 flashcards, including 2 `featured: false`
- 12 modules, 45 lessons (41 featured + 4 optional archive)

Recent merges that got the UI here, newest first:

- #30 plan-review gate; Google AI art deferred
- #29 Notes v4 content audit docs
- #28 Study Notes Codex v2 baseline + v3/v4 Terminal Codex plans (Notes overhaul not started)
- #26 home HUD asymmetry and Matrix rain craft (`v34`)
- #24 Matrix home and progress dashboard
- #25 / #23 lesson pages hug the viewport; short lessons no longer phantom-scroll
- #21 lesson fill and larger reading type
- #20–#16, #13–#11 quiz setup density, left/center/right actions, Quick 10 at chapter scale
- #9–#4 flashcard and quiz/exam viewport fit
- #15 / #14 2026 fact scrub (Federal and Patient Safety, then the wider bank)
- #10 localhost skips the service worker; app shell is network-first
- #3 Stage 7 post-2020 pack (CARA partials, clozapine / iPLEDGE REMS, VIS, take-back, recalls)
- #1 align to the January 6, 2026 outline

`ROADMAP.md` and `TESTING_REPORT.md` are older logs. They still describe cache names and stage lists from before these merges. Live status is this file. What's left is [TODO.md](TODO.md).
