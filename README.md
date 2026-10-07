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

These are locked design standards across the app. Follow this rubric for future project edits and new UI components:

1. **Viewport as Frame (Zero-Scroll on Desktop)**:
   - On desktop Chrome, the viewport is the frame (`100dvh`, `overflow: hidden`). Cards fill available space without phantom scrollbars.
   - Kill excessive side gutters and dead whitespace; expand layouts tastefully (e.g. 1400px codex manual for Study Notes, full 12-column tactical HUD for Home).
2. **Organic Shapes & Translucent Elements (Beyond Bento Rectangles)**:
   - Cards and action triggers are **not** restricted to standard rounded rectangles or rigid bento blocks.
   - Unique shapes (circular reactor consoles, chamfered obsidian pods, concentric targeting reticles) provide organic visual hierarchy.
   - **Center-point dimensioning & organic padding**: Component boundaries are measured from the center point with even, generous negative space around them so the surrounding cards and background breathe.
   - **Selective translucency**: Not all cards need opaque solid fills. Interactive telemetry cores utilize translucent radial glass (`background: radial-gradient(...)` with `backdrop-filter: blur(...)`) to let animated Matrix code cascade visibly behind rotating rings.
3. **Physical / Skeuomorphic Matrix Metaphors (e.g. Rolodex Index Cards)**:
   - Cards with physical counterparts (e.g. Flashcards) draw inspiration from tangible tools (the iconic rotating desktop Rolodex or the matrix operator contact directory).
   - Features include tabbed index tops, subtle stepped deck drop-shadows (creating the illusion of stacked cards beneath), custom spindle notch icons, and minimal text fluff. Keep only functional status badges and clear action triggers.
4. **Header Architecture Standard (3-Zone Balanced Grid)**:
   - All subpage headers follow a strict 3-zone CSS grid (`1fr auto 1fr`):
     - **Far Left**: The Matrix Red Pill / Blue Pill dual-capsule icon (`38px × 32px`, tilted capsules with 3D gradients and gloss highlights) + `PTCE 2026` logo.
     - **Center**: Page Title + Contextual Icon, strictly centered horizontally and tightly padded to body margins.
     - **Far Right**: Contextual navigation trigger (`‹ Home`, `‹ Course`, or utility button).
5. **Legibility First & Eye-Strain Reduction Palette**:
   - Monolithic bright green across whole pages causes severe eye fatigue during dense clinical reading.
   - For high-density study pages (Study Notes, Course, Exam), adopt a **Dark Slate / Obsidian & Brushed Silver palette**:
     - Base surfaces: `#03070b` (deep background), `#090f17` (surface base), `#0e1622` (elevated cards), `#141f2f` (table headers).
     - Borders: Brushed silver hairlines (`rgba(148, 163, 184, 0.22)` to `0.35`).
     - Body text: High-contrast off-white (`#e2e8f0` and `#f8fafc`) set in proportional, clean sans-serif typography (`system-ui`, `-apple-system`, `sans-serif`) to ensure effortless reading.
     - Monospace (`JetBrains Mono`): Reserved for drug stems, abbreviations, dosages, ratios, and formulas.
     - Matrix Accents: Matrix Cyan (`#38bdf8`) and Phosphor Green (`#00ff41`) are used strategically as highlights, active badges, stems, and key clinical terms—never as blinding wall-of-text backgrounds.
6. **Zero-Cutoff & Parenthesis-Safe Parsing**:
   - Medical and clinical text contains nested semicolons and parentheses (e.g. `Tylenol = acetaminophen (max 4,000 mg/day; hepatotoxic in overdose).`).
   - Semicolon delimiters must be parsed using parenthesis-safe algorithms (`splitOutsideParens`) so that parenthetical notes, dosage caps, and warnings are never truncated or broken into orphaned chips.
7. **Contextual Multi-Layout Presentation**:
   - Avoid forcing all study data into generic bullet points. Match the content structure to purpose-built layouts:
     - **Brand / Generic**: 2-up dual-column responsive data table with explicit column headers (`BRAND NAME` | `GENERIC NAME`).
     - **OTC Active Ingredients**: 3-column table (`OTC BRAND NAME` | `ACTIVE INGREDIENT` | `CLINICAL CLASS & KEY PEARLS`).
     - **Abbreviations & Conversions**: Token grid cards with header legend (`ABBREVIATION` ➔ `CLINICAL TRANSLATION`).
     - **Clinical Specs & Schedules**: 2-column specifications table (`CLASSIFICATION / SCHEDULE` | `CLINICAL MECHANISMS & PEARLS`).
     - **Procedures & Laws**: Clean dark slate briefing cards with `#01` index chips and bolded tags.
8. **Relocated Bottom-Centered Filters**:
   - Remove instructional copy from page headers. Place live search/filter inputs centered at the bottom beneath the accordion content to keep the top of the workspace completely focused on study material.

## Theme & Visual System

- **Primary Theme: The Matrix**: Deep obsidian surfaces (`#010804`), emerald terminal greens (`#00ff41`), mint highlights (`#b6ffc9`), and flowing Japanese Katakana / hex character rain.
- **Accents**: Vaporwave / Cyberpunk neon cyan (`#05d9e8` / `#38bdf8`) and vivid pink (`#ff2a6d`) used as subtle telemetry and indicator accents.
- **Matrix Rain FX (`js/app.js`)**:
  - Smooth vertical cascading columns of Japanese Katakana and code glyphs.
  - Multi-depth layering: foreground bright green leads with white tips, background darker depth green.
  - Smooth fade out towards the bottom; no static grid character overlays.
  - Skips gracefully when `prefers-reduced-motion` is enabled.


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

`sw.js` cache name on this main: `ptce-2026-v43`.

- Install precaches the HTML, CSS, JS, JSON, manifest, and icon, then `skipWaiting()`.
- Activate deletes every cache whose name is not the current one, then `clients.claim()`.
- Same-origin GET only. Fonts and anything cross-origin are left to the network.
- App shell (navigations, HTML, CSS, JS) is network-first, cache fallback if offline.
- JSON and the other same-origin assets are cache-first.

After a cache-name bump, unregister the service worker and clear site data. A hard refresh (`Ctrl + Shift + R`) bypasses disk cache using query-string cache busters (`?v=43`).

## Layout

```text
index.html  course.html  notes.html  flashcards.html  quiz.html  exam.html  dashboard.html
manifest.json  sw.js  icon.svg  validate.js
css/style.css  css/home.css  css/notes.css
js/app.js  home.js  course.js  notes.js  flashcards.js  quiz.js  exam.js  dashboard.js
data/course.json  notes.json  flashcards.json  questions.json
README.md  TODO.md
```

There is no `app/` directory. Shared helpers are `window.App` (`Storage`, `Util`, `DOMAINS`, `FX`) in `js/app.js`.

## Current state

Branch: `feature/home-hud-overhaul` (Service worker cache `ptce-2026-v43`).

Key recent architecture and UI upgrades:
- **Study Notes Codex v2 Overhaul**:
  - Replaced all-green wall of text with a high-contrast **Dark Slate / Obsidian & Brushed Silver palette** (`#03070b` / `#090f17` / `#0e1622` / `#141f2f`) and `#e2e8f0` proportional sans-serif reading text to eliminate eye fatigue.
  - Implemented 5 purpose-built clinical layouts: 2-up Brand/Generic table with explicit headers, 3-column OTC active ingredients table, token abbreviation & conversion grids with legend headers, 2-column clinical specifications table, and dark slate briefing cards.
  - Re-architected header into a 3-zone balanced grid: Red/Blue Pill icon + `PTCE 2026` logo on left, centered `Study Notes` title + document icon, and `‹ Home` link on right.
  - Eliminated top instructional text clutter; moved search/filter to a centered pill bar below the accordions.
  - Fixed parenthesis-clipping bugs via `splitOutsideParens` so that dosages, warnings, and pearls remain 100% complete without truncation.
  - Resolved Chrome cache serving stale assets via `?v=43` cache-busting queries and `sw.js` cache bumping.
- **Flashcard Tabbed Rolodex Index Card**:
  - Reimagined flashcard trigger into an authentic physical index card with top file tab, stepped deck drop-shadow depth, custom spindle notch icon, and zero text fluff.
- **Organic Circular Matrix Reactor Core**:
  - Dashboard trigger redesigned as a translucent circular reactor core positioned organically in the open space below Quiz Mode and between Study Notes and Practice Exam with center-point dimensioning.
- **Matrix Red Pill / Blue Pill Brand Identity**:
  - Distinctive dual-capsule icon (`38px × 32px`, `#38bdf8` blue pill / `#ff4b72` red pill) integrated uniformly across headers on all pages.
- **Matrix Rain FX Refinement**:
  - Pure cascading Japanese Katakana glyph columns with lead highlights and depth fading, eliminating static grid character overlays.


Bank on this commit:

- 219 questions (Medications 69, Patient Safety 51, Order Entry 46, Federal Requirements 53), including 2 `featured: false`
- 190 flashcards, including 2 `featured: false`
- 12 modules, 45 lessons (41 featured + 4 optional archive)

Recent merges that got the UI here, newest first:

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
