# PTCE 2026 Study App Roadmap

Project roadmap for the PTCE 2026 personal study app.

This file tracks current state, build order, implementation decisions, and next steps. Study content itself should stay in JSON files under `app/data/`.

## Project Goal

Build a fast, local, mobile-first PTCE 2026 study system using plain HTML/CSS/JavaScript and JSON data.

The app should help with:

- High-yield PTCE review
- Flashcard drilling
- Multiple-choice question practice
- Weighted 90-question practice exams
- Weak-area tracking
- Local progress persistence

This is a private personal study app, not a commercial product.

## Core Constraints

- Use vanilla HTML/CSS/JavaScript.
- Use JSON files for study content.
- Use `localStorage` for progress.
- No backend.
- No login.
- No framework.
- No build step.
- No unnecessary file sprawl.
- Must run locally through localhost.
- Must be mobile-first and usable on iPhone-sized screens.
- Markdown files are for roadmap/project memory only, not study content.

## Exam Blueprint

| Domain | Weight |
|---|---:|
| Medications | 40% |
| Patient Safety & Quality Assurance | 26.25% |
| Order Entry & Processing | 21.25% |
| Federal Requirements | 12.5% |

Target distribution for 90-question practice exam:

| Domain | Target Questions |
|---|---:|
| Medications | 36 |
| Patient Safety & Quality Assurance | 24 |
| Order Entry & Processing | 19 |
| Federal Requirements | 11 |
| Total | 90 |

## Current Stage

```text
Stage 3 complete: Data files created.
Stage 4 next: Wire UI pages to JSON data.
