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

## UI standards

Component, template, and theme rules are in [UI_STANDARDS.md](UI_STANDARDS.md). Follow that file for any UI change.

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
README.md  TODO.md  UI_STANDARDS.md  AGENTS.md
study_notes_v4_plan.md  study_notes_v3_plan.md
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
