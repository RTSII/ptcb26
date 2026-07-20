# PTCE 2026 Study App

A lightweight, mobile-first study tool for the **PTCB Pharmacy Technician Certification Exam (PTCE) 2026**. Built with plain **HTML, CSS, and JavaScript** plus JSON data files — **no frameworks, no build step, no backend**. All progress is saved locally in your browser via `localStorage`.

Optimized for **iPhone Safari** and desktop browsers, with a navy / white / gold theme.

## Features

| Module | Description |
|--------|-------------|
| 🗂️ **Flashcards** | Domain-tagged cards with flip animation, prev/next, keyboard arrows, and touch swipe. |
| 📝 **Quiz Mode** | Timed multiple-choice questions with instant rationale feedback and domain filtering. |
| 🎯 **Practice Exam** | Simulated exam (30/60/90 questions) weighted to the PTCE 2026 blueprint, with a scaled-score report. |
| 📊 **Dashboard** | Tracks quiz scores, cards reviewed, exams completed, and your weakest domain. |
| 📚 **Study Notes** | Collapsible quick-reference by domain (drug classes, sig codes, DEA schedules, laws, calculations). |

## PTCE 2026 Domain Weights

| Domain | Weight |
|--------|-------:|
| Medications | 40% |
| Patient Safety & Quality Assurance | 26.25% |
| Order Entry & Processing | 21.25% |
| Federal Requirements | 12.5% |

The Practice Exam draws questions from the bank in these proportions.

## Project Structure

```
ptcb26/
├── index.html          # Home / navigation hub
├── flashcards.html
├── quiz.html
├── exam.html
├── dashboard.html
├── notes.html
├── css/
│   └── style.css       # Shared mobile-first styles
├── js/
│   ├── app.js          # Shared utils, localStorage, data loading
│   ├── flashcards.js
│   ├── quiz.js
│   ├── exam.js
│   ├── dashboard.js
│   └── notes.js
└── data/
    ├── flashcards.json # 60+ domain-tagged cards
    ├── questions.json  # 60+ MCQs with rationales
    └── notes.json      # Structured study notes per domain
```

## Running the App

Because the app loads JSON via `fetch()`, most browsers block `file://` requests (CORS). Run a tiny local web server from the project folder:

**Python 3**
```bash
cd ptcb26
python3 -m http.server 8000
```
Then open <http://localhost:8000> in your browser.

**Node (if installed)**
```bash
npx serve
```

On an iPhone, you can host it on your computer and open the LAN address (e.g. `http://192.168.1.x:8000`) in Safari, or deploy the folder to any static host (GitHub Pages, Netlify, etc.).

> Opening the HTML files directly by double-clicking may work in some browsers but is not guaranteed because of `fetch()` restrictions on `file://`. A local server is recommended.

## Deploying to GitHub Pages

1. Push this repo to GitHub (already at `RTSII/ptcb26`).
2. In the repo settings → **Pages**, set the source to the `main` branch, root folder.
3. Your app will be served at `https://rtsii.github.io/ptcb26/`.

## Data & Content

All flashcards, questions, and notes contain real PTCE-relevant content: actual brand/generic drug pairs, DEA schedules and forms, federal laws (CSA, HIPAA, OBRA-90, PPPA, CMEA), sig codes, and pharmacy calculations. Feel free to expand the JSON files — the UI reads them dynamically.

## Notes

- Progress is stored only in your browser (`localStorage` key `ptce2026_progress_v1`). Clearing site data resets it, and the Dashboard has a **Reset All Progress** button.
- The approximate scaled score (1000–1600, ~1400 to pass) is a study estimate, not an official PTCB score.

---

*Built for personal CPhT exam preparation. Good luck on the exam! 💊*
