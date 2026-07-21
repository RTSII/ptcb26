# PTCE 2026 Study App

A lightweight, mobile-first study tool for the **PTCB Pharmacy Technician Certification Exam (PTCE) 2026**.

Built for a nationally certified pharmacy technician retaking the PTCE who wants a fast, high-yield refresher system instead of a generic prep course.

The app uses plain **HTML, CSS, JavaScript, and JSON data files** — no frameworks, no build step, no backend, no login. It runs locally through a browser using a small localhost server.

## Purpose

This project is a private personal study system designed to:

- Review all official PTCE 2026 content domains.
- Drill high-yield flashcards.
- Practice multiple-choice questions with rationales.
- Simulate weighted PTCE-style practice exams.
- Track weak domains and subtopics locally.
- Stay lean, fast, editable, and easy to run from a local repo.

This is **not** a commercial app and does not need enterprise features, accounts, sync, analytics, or a backend.

## Core Requirements

- Must run locally on PC through a localhost browser.
- Must work well on mobile, especially iPhone-sized screens.
- Must use static files only:
  - HTML
  - CSS
  - JavaScript
  - JSON
- Must keep study content in JSON files.
- Must avoid unnecessary frameworks, package managers, bundlers, or databases.
- Must be easy to edit manually.
- Must use `localStorage` for saved progress.
- Must keep markdown files limited to project state, roadmap, and coordination.

## Exam Blueprint

PTCE 2026 study content and practice weighting should align with the official PTCB domain structure:

| Domain | Weight |
|---|---:|
| Medications | 40% |
| Patient Safety & Quality Assurance | 26.25% |
| Order Entry & Processing | 21.25% |
| Federal Requirements | 12.5% |

The practice exam should draw questions in approximately these proportions.

For a 90-question simulated exam, use this target distribution:

| Domain | Approx. Questions |
|---|---:|
| Medications | 36 |
| Patient Safety & Quality Assurance | 24 |
| Order Entry & Processing | 19 |
| Federal Requirements | 11 |
| Total | 90 |

## Tech Stack

- Plain HTML5
- CSS3
- Vanilla JavaScript
- JSON data files
- Browser `fetch()` for loading data
- Browser `localStorage` for progress
- Localhost server for development/use

No required dependencies.

## Theme / UX Direction

- Mobile-first layout.
- Optimized for quick use on iPhone Safari and desktop browsers.
- Navy / white / gold visual direction.
- Large touch targets.
- Fast navigation.
- Scannable cards, tables, and short study chunks.
- Built for retaking and rapid review, not beginner textbook reading.

## Current Project Structure

Current intended repo structure:

```text
ptcb26/
├── README.md
├── ROADMAP.md
└── app/
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
