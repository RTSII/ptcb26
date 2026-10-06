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

## Locked UI standards

These are locked. Test them. Do not add a reusable template system, extra chrome, or new page patterns until they stay locked under test.

- Back on the left, Start or the center action in the middle, Next on the right. Lesson nav and quiz setup already use a `1fr auto 1fr` row.
- Primary CTAs sit centered in the card.
- Cards fill at least three quarters of the Chrome viewport, and most or all of it when the screen is the content. Kill side gaps and bottom dead space.
- Body type stays readable on a laptop. Vertical scroll only when the content actually overflows. No phantom overflow on short pages.
- Icon nav stays compact, and icons stay on-theme with each other.
- Card titles and icons are generally center-aligned.
- The look is dense Chrome viewport: the window is the frame, not a narrow column floating in empty space.
- Sequence is fixed: lock these standards, test them, then extras and templates.

## Theme

Primary theme is The Matrix: green rain and terminal code, on the home HUD and the progress dashboard.

Vaporwave (pink, cyan, violet, the synthwave grid) is a light accent on the shared stylesheet. It is not a second, equal theme. Home and dashboard turn the grid floor off and run the rain canvas at full opacity. Other pages still inherit more of the older accent palette.

Functional first. Cards have to be opaque enough to read. Home cards are about `rgba(6, 32, 18, 0.94)`; the featured course card is denser.

Rain is composed, not piled on. Home rain (`js/app.js`) uses a quiet header fade, two column depths, and a perspective floor under the HUD. Glyph count stays in the same range as the earlier home rain. Do not make it denser just to make it denser. `prefers-reduced-motion` skips the canvas.

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

`sw.js` cache name on this main: `ptce-2026-v34`.

- Install precaches the HTML, CSS, JS, JSON, manifest, and icon, then `skipWaiting()`.
- Activate deletes every cache whose name is not the current one, then `clients.claim()`.
- Same-origin GET only. Fonts and anything cross-origin are left to the network.
- App shell (navigations, HTML, CSS, JS) is network-first, cache fallback if offline.
- JSON and the other same-origin assets are cache-first.

After a cache-name bump, unregister the service worker and clear site data. A hard refresh by itself often leaves the old cache in control.

## Layout

```text
index.html  course.html  notes.html  flashcards.html  quiz.html  exam.html  dashboard.html
manifest.json  sw.js  icon.svg  validate.js
css/style.css
js/app.js  course.js  notes.js  flashcards.js  quiz.js  exam.js  dashboard.js
data/course.json  notes.json  flashcards.json  questions.json
README.md  TODO.md
```

There is no `app/` directory. Shared helpers are `window.App` (`Storage`, `Util`, `DOMAINS`) in `js/app.js`.

## Current state

`main` at `b22c35e5b1b947406cf6c820fb9bfea07cbb18fb` — merge of PR [#26](https://github.com/RTSII/ptcb26/pull/26).

That merge is the home HUD: Study Course as the large center panel, four offset peers (not a uniform grid), centered titles, icons, and the course action, and a composed Matrix rain (header fade, two depths, perspective floor). Service worker cache `ptce-2026-v34`.

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
