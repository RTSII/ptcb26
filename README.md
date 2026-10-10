# PTCE 2026 Study App

Private study PWA for Rob's PTCE retake. Vanilla HTML, CSS, and JavaScript. No framework, build, backend, or accounts.

Repo: [RTSII/ptcb26](https://github.com/RTSII/ptcb26)

Rob passed the PTCE around 2020. The point of this app is the post-2020 material and the outline effective January 6, 2026, not a reteach of basics he already knows.

## What it does

Seven static pages, served from the repo root:

| Page | Role |
|---|---|
| `index.html` | Home. Study Course is the large center panel; Flashcards, Quiz, Practice Exam, and Notes sit around it. Dashboard is the reactor card. |
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

Draw counts are the largest-remainder split of those weights times the chosen length, from `ExamSetup.scaleDraw` (`js/exam-setup.js`), which `js/exam.js` uses to build the exam. A 90-question exam is 32 / 21 / 20 / 17.

Use those four domain strings in JSON. Do not invent short aliases in the data files.

Items that are off the 2026 core are optional course lessons or `featured: false`, and they stay out of the default exam, Quick 10, and weak-area pools. Archive still in the bank: alligation (question `q136`, flashcards `47` and `109`), sterile-garbing question `q122`, and ten optional lessons (NTI list, sterile cleanroom/garbing, USP `<795>` technique, alligation, third-party billing/DAW, prior authorization/coordination of benefits, HIPAA, OBRA-90 counseling, regulatory agencies, technician scope).

## Working rules

Standing rules, the reading order, and the pre-PR loop are in [AGENTS.md](AGENTS.md). UI rules are in [UI_STANDARDS.md](UI_STANDARDS.md). What's left is [TODO.md](TODO.md).

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

Asset URLs carry a query-string cache buster. After a cache-name bump, follow [UI_STANDARDS.md](UI_STANDARDS.md). A hard refresh (`Ctrl + Shift + R`) bypasses disk cache.

## Directory structure

Every tracked file. Update this tree when a file is added, removed, or renamed ([AGENTS.md](AGENTS.md)).

```text
# docs
├── .gitignore                  # ignores .abacusai/ and node_modules/
├── AGENTS.md                   # standing rules and the pre-PR loop
├── AUDIT_RUBRIC.md             # sourced-fact rules for course and notes audits
├── README.md                   # how to run the app, content rules, this tree
├── TODO.md                     # live backlog; Next up is the work order
├── UI_STANDARDS.md             # locked UI rules; Home is the reference look
└── study_notes_v4_plan.md      # Notes v4 plan; theme overhaul waits on TODO

# pages
├── course.html                 # Study Course: module list and lesson reader
├── dashboard.html              # local scores, domain accuracy, export and import
├── exam.html                   # weighted practice exam
├── flashcards.html             # flip deck
├── index.html                  # Home: course panel, mode cards, dashboard reactor
├── notes.html                  # Study Notes
└── quiz.html                   # Quick 10, chapter, missed, bookmarked, weak areas

# assets
├── icon.svg                    # PWA icon: red pill / blue pill mark
├── manifest.json               # install manifest; start_url is index.html
├── sw.js                       # service worker, cache ptce-2026-vNN
├── validate.js                 # schema, ID, domain, copy, and containment checks
└── check-containment.js        # headless lesson containment; invoked by validate.js

css/
├── exam-setup.css              # practice-exam setup console; tokens stay on .xs
├── home.css                    # Home operator console; body.home only
├── notes.css                   # Study Notes page styles
└── style.css                   # shared theme and the other page styles

data/
├── course.json                 # 12 modules and their lessons
├── flashcards.json             # flip-card deck
├── notes.json                  # domain notes in the committed items shape
└── questions.json              # quiz and practice-exam bank

docs/
└── archive/                    # history; do not read for current work
    ├── README.md               # archive index
    ├── ROADMAP.md              # archived stage log
    ├── study_notes_v3_plan.md  # archived Notes v3 plan; v4 plan is current
    └── TESTING_REPORT.md       # archived integration test log

js/
├── app.js                      # window.App: Storage, Util, DOMAINS, FX
├── course.js                   # module accordions, lesson reader, optional skip
├── dashboard.js                # progress stats, domain accuracy, quiz history
├── exam-setup.js               # exam length, timer, and domain draw counts
├── exam.js                     # blueprint exam and score report
├── flashcards.js               # flip, filters, spaced repetition, bookmarks
├── home.js                     # Home telemetry and the course link
├── notes.js                    # notes renderer for the committed items JSON
└── quiz.js                     # quiz modes and chapter tests
```

There is no `app/` directory. Shared helpers are `window.App` (`Storage`, `Util`, `DOMAINS`, `FX`) in `js/app.js`.

## Current state

Home is the reference HUD. Study Course is the large card and opens the course list. That list has one Resume button and one-open accordions. Practice Exam setup is the Exam Setup console. Dashboard cards are Resurrections glass, and that page does not run the rain. Notes accordions start closed. Header titles share one style ([UI_STANDARDS.md](UI_STANDARDS.md)). The Home wordmark is on Home and Course; Dashboard, Quiz, Practice Exam, and Flashcards still use the older wordmark ([TODO.md](TODO.md)).

Notes still render the committed legacy `items` JSON. The v2 `blocks` file stays outside `data/` until the blocks runtime ships ([AGENTS.md](AGENTS.md)). The Notes plan is [study_notes_v4_plan.md](study_notes_v4_plan.md). What to do next is [TODO.md](TODO.md) **Next up**.

Cache name: `sw.js` (`ptce-2026-v70`).

Bank on this commit:

- 284 questions (Medications 97, Patient Safety 65, Order Entry 59, Federal Requirements 63), including 2 `featured: false`
- 190 flashcards, including 2 `featured: false`
- 12 modules, 48 lessons (38 featured + 10 optional archive)

UI history is the git log. Older stage logs and the test report are in `docs/archive/` and are not current.
