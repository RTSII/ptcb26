# PTCE 2026 Study App

A private, mobile-first study system for focused PTCE 2026 preparation.

The app is designed for an experienced nationally certified pharmacy technician retaking the PTCE. It emphasizes compressed review, active recall, exam-style practice, weak-area identification, and local progress tracking without requiring a backend, account, framework, or build process.

## Project Purpose

This project provides a high-yield alternative to generic or outdated exam-preparation tools.

Primary goals:

- Refresh all PTCE 2026 content domains efficiently.
- Review compressed, exam-focused notes.
- Drill domain-tagged flashcards.
- Practice multiple-choice questions with rationales.
- Run a weighted PTCE-style practice exam.
- Identify weak domains and subtopics.
- Store progress locally in the browser.
- Run locally on a PC through localhost.
- Remain usable on iPhone-sized Safari screens.

This is a private personal study tool, not a commercial product.

## PTCE Content Blueprint

The study content and practice-exam distribution follow these domain weights:

| Domain | Weight | 90-Question Target |
|---|---:|---:|
| Medications | 40% | 36 |
| Patient Safety and Quality Assurance | 26.25% | 24 |
| Order Entry and Processing | 21.25% | 19 |
| Federal Requirements | 12.5% | 11 |
| **Total** | **100%** | **90** |

Because the percentages do not convert perfectly into whole questions, the 90-question distribution is rounded to total exactly 90 questions.

## Current Project Status

The application is implemented directly from the repository root.

### Implemented

- Home study hub
- JSON-driven notes viewer
- Domain-tagged flashcards with flip, swipe, filters, and reviewed tracking
- Multiple-choice quiz mode with end-of-session answer review
- Chapter Test mode (filter by domain, then subtopic)
- Quick 10 quiz mode
- Weighted practice-exam interface using the 36/24/19/11 blueprint distribution
- Progress dashboard with per-domain accuracy breakdown
- Shared mobile-first styling
- Shared JavaScript utilities (`window.App`: Storage, Util, DOMAINS)
- Browser-based progress persistence
- Notes, flashcards, and question data files
- Standardized full domain names across all data files and modules

### Current Development Stage

```text
Stages 1–4: Planning, content, and initial implementation complete
Stage 5: Core integration refactor complete (shared App API, aligned domain names,
         rebuilt quiz/exam engines)
Stage 6: Question-bank expansion complete — 152 validated questions
         (Medications 60, Patient Safety and Quality Assurance 38,
          Order Entry and Processing 38, Federal Requirements 16)
Stage 6B: UI overhaul — synthwave × Matrix dark theme complete
Stage 6C: Content expansion complete — flashcards 68 → 133 cards,
          notes → 40 sections / 251 bullets covering every question subtopic
Stage 7: Content validation and mobile/device testing next
```

Verified August 6, 2026: all six pages and every JS/JSON/CSS asset serve over localhost (HTTP 200); a jsdom functional harness covering index, notes, flashcards, quiz (Quick 10, Chapter, Custom), exam (30/90-question, timer, scoring), and dashboard passes 69/69 checks; all JSON validates and all JS files pass syntax checks. The full 90-question practice exam now draws completely unique questions in the official 36/24/19/11 blueprint distribution. Flashcards expanded to 133 cards and study notes to 40 sections / 251 bullets spanning every question subtopic across all four domains.

## Technology

- HTML5
- CSS3
- Vanilla JavaScript
- JSON data files
- Browser `localStorage`
- Static localhost server

The project intentionally does not use:

- A backend
- A database
- User accounts
- A JavaScript framework
- Package management
- A bundler
- A compilation step
- A cloud dependency for normal study use

## UI Theme

The interface uses a dark "synthwave × Matrix" theme:

- Deep-space backgrounds with a perspective neon grid and scanline overlay
- Neon pink, cyan, violet, and matrix-green accent palette
- A Matrix-style falling-character canvas background (respects `prefers-reduced-motion`)
- Neon-glow cards, buttons, progress bars, and score displays
- Orbitron and Share Tech Mono display fonts (loaded from Google Fonts with system fallbacks)

All styling lives in `css/style.css`; the background effect is initialized by `js/app.js`.

## Repository Structure

The application runs directly from the repository root.

```text
ptcb26/
├── README.md
├── ROADMAP.md
├── TESTING_REPORT.md
├── index.html
├── notes.html
├── flashcards.html
├── quiz.html
├── exam.html
├── dashboard.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── notes.js
│   ├── flashcards.js
│   ├── quiz.js
│   ├── exam.js
│   └── dashboard.js
└── data/
    ├── notes.json
    ├── flashcards.json
    └── questions.json
```

There is no `app/` subdirectory. All documentation and code must use the root-based paths shown above.

## Application Pages

| Page | Purpose |
|---|---|
| `index.html` | Main study hub and navigation |
| `notes.html` | High-yield notes organized by domain |
| `flashcards.html` | Active-recall flashcard study |
| `quiz.html` | Multiple-choice practice (Quick 10, Chapter Test, Custom) |
| `quiz.html?mode=quick` | Random Quick 10 session |
| `exam.html` | Weighted PTCE-style practice exam |
| `dashboard.html` | Scores, progress, and weak-area review |

## JavaScript Modules

### `js/app.js`

Shared application utilities and browser-storage functions, exposed as `window.App`.

Responsibilities include:

- Loading JSON data (`Util.fetchJSON`)
- Shuffling and sampling data (`Util.shuffle`, `Util.sample`)
- Managing saved progress (`Storage` under `ptce2026_progress_v1`)
- Recording quiz attempts
- Recording exam attempts
- Tracking reviewed/known flashcards
- Calculating percentages and formatting durations
- Escaping rendered HTML
- Providing the standardized `DOMAINS` list
- Initializing the Matrix-style background effect (`FX`)

### `js/notes.js`

Loads and renders:

```text
data/notes.json
```

Responsibilities include:

- Rendering domain headings
- Showing domain weights
- Rendering summaries and sections
- Displaying lists and study points
- Handling missing or failed data loads
- Escaping displayed data safely

### `js/flashcards.js`

Loads and renders:

```text
data/flashcards.json
```

Responsibilities include:

- Displaying one card at a time
- Flipping between front and back
- Navigating through the deck
- Filtering cards
- Shuffling cards
- Tracking reviewed cards
- Saving known and needs-review status

### `js/quiz.js`

Loads questions from:

```text
data/questions.json
```

Responsibilities include:

- Building quiz sessions
- Supporting Quick 10, Chapter Test (domain/subtopic), and Custom modes
- Rendering answer choices
- Evaluating answers
- Displaying rationales in the end-of-session review
- Calculating results
- Saving quiz attempts with per-question outcomes

### `js/exam.js`

Builds a weighted practice exam from:

```text
data/questions.json
```

Responsibilities include:

- Selecting questions by PTCE domain weight
- Tracking selected answers
- Scoring the completed exam
- Producing domain-level results
- Recording exam attempts
- Handling a question bank containing fewer than 90 unique questions

### `js/dashboard.js`

Reads saved browser progress and displays:

- Flashcard activity
- Quiz attempts
- Exam attempts
- Recent scores
- Average or best performance
- Weak domains
- Weak subtopics
- Progress-reset controls

## Study Data

Study content belongs only in the JSON files under `data/`.

Markdown files are for project documentation, planning, state tracking, and AI/user coordination. They should not duplicate the full study content.

### `data/notes.json`

Source of truth for compressed study notes.

Expected top-level structure:

```json
{
  "domains": []
}
```

Notes should cover the four PTCE domains and emphasize high-yield retake material rather than textbook-length instruction.

Important content areas include:

- Drug classes
- High-yield brand/generic pairs
- Indications
- Mechanisms of action
- Major adverse effects
- Interactions
- Contraindications
- Medication safety
- Look-alike/sound-alike medications
- High-alert medications
- NIOSH hazardous drugs
- Order entry
- Prescription processing
- Days supply
- Dosage calculations
- Dilution and concentration
- Alligation
- Patient safety
- Quality assurance
- Error prevention
- Controlled substances
- DEA forms
- CSOS
- USP `<795>`, `<797>`, and `<800>` concepts relevant to technicians

Law-related content should identify the effective year when the year is meaningful to the tested rule or current guidance.

### `data/flashcards.json`

Source of truth for flashcard content.

Each flashcard should use this schema:

```json
{
  "id": "unique-card-id",
  "front": "Prompt or question",
  "back": "Answer or explanation",
  "domain": "PTCE domain",
  "subtopic": "Specific subtopic",
  "difficulty": "easy"
}
```

Required fields:

| Field | Purpose |
|---|---|
| `id` | Unique stable identifier |
| `front` | Question, term, or active-recall prompt |
| `back` | Answer or concise explanation |
| `domain` | One of the four standardized domains |
| `subtopic` | More specific content category |
| `difficulty` | Difficulty label used by filtering |

### `data/questions.json`

Source of truth for quiz and practice-exam questions.

Each question should use this schema:

```json
{
  "id": "unique-question-id",
  "question": "Question text",
  "options": [
    "Option A",
    "Option B",
    "Option C",
    "Option D"
  ],
  "answer": 0,
  "rationale": "Explanation of the correct answer",
  "domain": "PTCE domain",
  "subtopic": "Specific subtopic",
  "difficulty": "medium"
}
```

The `answer` value must correspond to the correct zero-based position in `options`.

Example:

```json
{
  "options": [
    "Correct answer",
    "Distractor",
    "Distractor",
    "Distractor"
  ],
  "answer": 0
}
```

Question requirements:

- Every `id` must be unique.
- Every question must have one unambiguously correct answer.
- The answer index must match the correct choice.
- Every rationale must explain why the answer is correct.
- Distractors should be plausible but clearly incorrect.
- Domain names must be consistent.
- Subtopics should be specific enough for weak-area tracking.
- Questions should be relevant to the current PTCE blueprint.
- Law and compounding content must be checked against current federal and USP guidance.
- State-specific law should not be presented as universal federal law.

## Domain Naming

Use the same domain names consistently across notes, flashcards, questions, JavaScript, and dashboard results:

```text
Medications
Patient Safety and Quality Assurance
Order Entry and Processing
Federal Requirements
```

Do not create minor variations such as:

```text
Patient Safety & QA
Order Entry
Federal Law
Medication
```

unless the JavaScript explicitly normalizes them. Consistent source data is preferred over relying on normalization.

## Browser Storage

The application uses this `localStorage` key:

```text
ptce2026_progress_v1
```

Saved progress may include:

- Reviewed flashcards
- Known flashcards
- Flashcards needing review
- Quiz attempts
- Exam attempts
- Domain performance
- Missed subtopics
- Last activity information

Changing the key creates a new independent progress record. Existing saved data will not automatically move to a new key.

Progress is local to the browser and device. Clearing browser storage, using private browsing, or changing browsers can remove or separate saved progress.

## Running Locally

JSON files should be loaded through localhost rather than opening the HTML files directly with `file://`.

### Python

From the repository root:

```bash
python -m http.server 8000
```

If the system uses `python3`:

```bash
python3 -m http.server 8000
```

Open:

```text
http://localhost:8000/
```

### Pages to Test

```text
http://localhost:8000/
http://localhost:8000/notes.html
http://localhost:8000/flashcards.html
http://localhost:8000/quiz.html
http://localhost:8000/quiz.html?mode=quick
http://localhost:8000/exam.html
http://localhost:8000/dashboard.html
```

Do not expect JSON `fetch()` operations to work reliably when opening pages directly from the filesystem.

## Initial Integration-Test Checklist

### General

- [ ] Home page loads without visual or console errors.
- [ ] Every navigation link opens the correct page.
- [ ] Shared CSS loads on every page.
- [ ] Shared JavaScript loads on every applicable page.
- [ ] No page references an `app/` directory.
- [ ] No required files return HTTP 404.
- [ ] Layout works at desktop and mobile widths.

### Notes

- [ ] `data/notes.json` loads successfully.
- [ ] All four domains render.
- [ ] Domain weights render correctly.
- [ ] Sections and bullet points render correctly.
- [ ] Empty or missing sections do not break the page.

### Flashcards

- [ ] `data/flashcards.json` loads successfully.
- [ ] Front and back display correctly.
- [ ] Card flip works.
- [ ] Previous and next controls work.
- [ ] Shuffle works.
- [ ] Domain and difficulty filters work.
- [ ] Known and needs-review actions persist after refresh.

### Quiz

- [ ] `data/questions.json` loads successfully.
- [ ] Questions and choices render.
- [ ] Correct and incorrect feedback works.
- [ ] Rationales appear at the correct time.
- [ ] Standard quiz scoring is accurate.
- [ ] Quick 10 selects no more than 10 questions.
- [ ] Completed attempts appear on the dashboard.

### Practice Exam

- [ ] Exam questions are selected by domain weight.
- [ ] The same question is not unintentionally repeated.
