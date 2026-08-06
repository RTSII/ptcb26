# PTCE 2026 Study App Roadmap

This file tracks project phases, completed work, active tasks, QA requirements, release criteria, future enhancements, and implementation decisions.

Study content does not belong in this file. The content sources of truth are:

```text
data/notes.json
data/flashcards.json
data/questions.json
```

## Project Goal

Build a fast, mobile-first PTCE 2026 study app for an experienced pharmacy technician retaking the exam.

The completed app should provide:

- Compressed high-yield notes
- Active-recall flashcards
- Multiple-choice quizzes
- Quick 10 sessions
- Weighted 90-question practice exams
- Rationales and score feedback
- Weak-domain and weak-subtopic tracking
- Local progress persistence
- PC and iPhone-friendly use
- Fully static localhost operation

## Core Constraints

- Vanilla HTML, CSS, and JavaScript
- Root-based application structure
- JSON study-content files
- Browser `localStorage`
- No backend
- No database
- No login
- No heavy framework
- No build process
- No unnecessary files
- Mobile-first interface
- Localhost-compatible
- Content aligned with the current PTCE outline
- Federal and USP content reviewed against current guidance
- Markdown used only for project documentation and tracking

## PTCE Blueprint

| Domain | Weight | 90-Question Target |
|---|---:|---:|
| Medications | 40% | 36 |
| Patient Safety and Quality Assurance | 26.25% | 24 |
| Order Entry and Processing | 21.25% | 19 |
| Federal Requirements | 12.5% | 11 |
| **Total** | **100%** | **90** |

## Current Repository Structure

```text
ptcb26/
├── README.md
├── ROADMAP.md
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

The project does not use an `app/` subdirectory. Future changes must preserve the root-based structure unless an intentional migration is documented first.

## Current Stage

```text
Stages 1–3: Complete
Stage 4: Initial implementation complete
Stage 5: Integration testing and QA — active
Stage 6: Question-bank expansion and content validation — next
Stage 7: Mobile polish and initial release
```

## Stage 1 — Scope and Architecture

### Objective

Define the purpose, audience, technical constraints, content model, and build order.

### Status

Complete.

### Completed

- [x] Defined the app as a private PTCE 2026 retake study system.
- [x] Defined the intended user as an experienced pharmacy technician.
- [x] Selected a high-yield refresher approach instead of textbook-style content.
- [x] Selected HTML5, CSS3, and vanilla JavaScript.
- [x] Selected JSON files for study content.
- [x] Selected browser `localStorage` for progress.
- [x] Excluded accounts, backend services, databases, and frameworks.
- [x] Defined mobile-first use.
- [x] Defined localhost as the primary runtime.
- [x] Established the four PTCE content domains and weights.
- [x] Established markdown as project documentation rather than study-content storage.
- [x] Established JSON files as the study-content sources of truth.

## Stage 2 — Initial Notes Content

### Objective

Create compressed, high-yield notes covering the PTCE domains and priority subtopics.

### Status

Initial version complete.

### Completed

- [x] Created `data/notes.json`.
- [x] Organized content by PTCE domain.
- [x] Included medication-focused review.
- [x] Included patient-safety and quality-assurance review.
- [x] Included order-entry and processing review.
- [x] Included federal-requirements review.
- [x] Included calculation concepts.
- [x] Included controlled-substance concepts.
- [x] Included USP `<795>`, `<797>`, and `<800>` concepts relevant to technicians.
- [x] Consolidated study notes into JSON.
- [x] Avoided separate markdown study-note files.

### Remaining Content QA

- [ ] Confirm all domain labels are consistent.
- [ ] Review drug facts for accuracy and current relevance.
- [ ] Review federal requirements for current accuracy.
- [ ] Flag meaningful law-related effective years.
- [ ] Review DEA forms, schedules, and CSOS content.
- [ ] Review NIOSH hazardous-drug content.
- [ ] Review USP compounding information.
- [ ] Verify all calculation examples.
- [ ] Remove unnecessary duplication.
- [ ] Identify content gaps from quiz performance.

## Stage 3 — Flashcards and Questions

### Objective

Convert passive notes into active study formats.

### Status

Initial version complete.

### Completed

- [x] Created `data/flashcards.json`.
- [x] Added stable card identifiers.
- [x] Added front and back content.
- [x] Added domain metadata.
- [x] Added subtopic metadata.
- [x] Added difficulty metadata.
- [x] Created `data/questions.json`.
- [x] Added multiple-choice questions.
- [x] Added answer choices.
- [x] Added answer indexes.
- [x] Added rationales.
- [x] Added domain metadata.
- [x] Added subtopic metadata.
- [x] Added difficulty metadata.
- [x] Distributed content across all four PTCE domains.

### Current Limitation

The current project state records 66 questions.

At least 90 unique, valid questions are required for one full unique 90-question practice exam. The immediate minimum expansion is 24 additional questions.

## Stage 4 — Initial Application Implementation

### Objective

Create the functional interfaces and connect them to the JSON data.

### Status

Initial implementation complete; integration validation remains.

### Completed

#### Shared application

- [x] Created `js/app.js`.
- [x] Added JSON-loading support.
- [x] Added progress-storage support.
- [x] Used `ptce2026_progress_v1` as the storage key.
- [x] Added shared quiz/exam progress handling.
- [x] Added shared utility behavior.

#### Home page

- [x] Created `index.html`.
- [x] Added navigation to each study mode.
- [x] Added Quick 10 access.
- [x] Added mobile-first card navigation.

#### Notes

- [x] Created `notes.html`.
- [x] Created `js/notes.js`.
- [x] Connected the page to `data/notes.json`.
- [x] Added domain and section rendering.
- [x] Added load-error handling.

#### Flashcards

- [x] Created `flashcards.html`.
- [x] Created `js/flashcards.js`.
- [x] Connected the page to `data/flashcards.json`.
- [x] Added card display and navigation.
- [x] Added study-progress behavior.

#### Quiz

- [x] Created `quiz.html`.
- [x] Created `js/quiz.js`.
- [x] Connected the page to `data/questions.json`.
- [x] Added question and answer rendering.
- [x] Added answer feedback and rationales.
- [x] Added Quick 10 routing.

#### Practice exam

- [x] Created `exam.html`.
- [x] Created `js/exam.js`.
- [x] Connected the page to `data/questions.json`.
- [x] Added weighted-exam logic.
- [x] Added scoring and result behavior.

#### Dashboard

- [x] Created `dashboard.html`.
- [x] Created `js/dashboard.js`.
- [x] Added local progress summaries.
- [x] Added performance and weak-area behavior.

#### Styling

- [x] Created `css/style.css`.
- [x] Added shared visual styling.
- [x] Added mobile-first layouts.
- [x] Added common cards, controls, and navigation styling.

## Stage 5 — Integration Testing and QA

### Objective

Verify that the existing implementation works as a complete local application.

### Status

Active next build step.

### 5.1 Localhost Smoke Test

Start the server from the repository root:

```bash
python -m http.server 8000
```

Test:

```text
http://localhost:8000/
http://localhost:8000/notes.html
http://localhost:8000/flashcards.html
http://localhost:8000/quiz.html
http://localhost:8000/quiz.html?mode=quick
http://localhost:8000/exam.html
http://localhost:8000/dashboard.html
```

Checklist:

- [ ] Server starts from the repository root.
- [ ] Home page loads.
- [ ] Every page returns HTTP 200.
- [ ] Every navigation link works.
- [ ] CSS loads on every page.
- [ ] JavaScript loads without syntax errors.
- [ ] Browser console contains no uncaught errors.
- [ ] No path references the nonexistent `app/` directory.
- [ ] No required request returns HTTP 404.

### 5.2 JSON Validation

- [ ] Validate `data/notes.json`.
- [ ] Validate `data/flashcards.json`.
- [ ] Validate `data/questions.json`.
- [ ] Confirm each file contains valid JSON without comments or trailing commas.
- [ ] Confirm every required field exists.
- [ ] Confirm flashcard IDs are unique.
- [ ] Confirm question IDs are unique.
- [ ] Confirm domain names are consistent.
- [ ] Confirm difficulty labels are consistent.
- [ ] Confirm every question answer is a valid choice index.
- [ ] Confirm every rationale corresponds to the marked answer.
- [ ] Confirm no accidental duplicate questions.
- [ ] Confirm no empty questions, choices, fronts, backs, or rationales.

### 5.3 Notes Integration

- [ ] Notes page fetches `data/notes.json`.
- [ ] All four domains render.
- [ ] Domain weights render correctly.
- [ ] Domain summaries render.
- [ ] Sections render in the intended order.
- [ ] Bullet lists render correctly.
- [ ] Collapsible sections behave correctly.
- [ ] Missing optional data does not crash the page.
- [ ] A failed fetch displays a useful message.

### 5.4 Flashcard Integration

- [ ] Flashcards page fetches `data/flashcards.json`.
- [ ] The first card renders.
- [ ] Front and back content are correct.
- [ ] Flip control works.
- [ ] Previous and next controls work.
- [ ] Shuffle works.
- [ ] Domain filter works.
- [ ] Difficulty filter works.
- [ ] Empty filter results are handled.
- [ ] Reviewed status is saved.
- [ ] Known status is saved.
- [ ] Needs-review status is saved.
- [ ] Saved statuses remain after refresh.
- [ ] Card counts remain accurate after filtering.

### 5.5 Quiz Integration

- [ ] Quiz page fetches `data/questions.json`.
- [ ] Questions render correctly.
- [ ] Four choices render when four are supplied.
- [ ] Only one answer can be submitted per question.
- [ ] Correct answers receive correct feedback.
- [ ] Incorrect answers receive correct feedback.
- [ ] The correct rationale appears.
- [ ] Score increments only when appropriate.
- [ ] Next-question behavior works.
- [ ] Final results are accurate.
- [ ] Quiz attempts save to `localStorage`.
- [ ] Domain performance is recorded correctly.
- [ ] Subtopic misses are recorded correctly.
- [ ] Quick 10 mode detects `mode=quick`.
- [ ] Quick 10 uses no more than 10 unique questions.

### 5.6 Practice-Exam Integration

- [ ] Exam page fetches `data/questions.json`.
- [ ] Exam selection uses the official domain weights.
- [ ] Full target distribution is 36/24/19/11.
- [ ] Selection does not unintentionally duplicate questions.
- [ ] Navigation preserves selected answers.
- [ ] Unanswered questions are handled clearly.
- [ ] Final submission requires an intentional action.
- [ ] Total score is accurate.
- [ ] Domain scores are accurate.
- [ ] Missed subtopics are accurate.
- [ ] Exam attempt saves to `localStorage`.
- [ ] Limited-bank behavior is clear when fewer than 90 questions exist.
- [ ] The app does not silently duplicate questions to reach 90.

### 5.7 Dashboard Integration

- [ ] Dashboard reads `ptce2026_progress_v1`.
- [ ] Empty-state dashboard displays correctly.
- [ ] Reviewed-card count is correct.
- [ ] Known-card count is correct.
- [ ] Needs-review count is correct.
- [ ] Quiz-attempt count is correct.
- [ ] Latest quiz score is correct.
- [ ] Average quiz score is correct.
- [ ] Exam-attempt count is correct.
- [ ] Best exam score is correct.
- [ ] Weak-domain data is correct.
- [ ] Weak-subtopic data is correct.
- [ ] Reset progress requires confirmation.
- [ ] Reset progress clears only expected project data.
- [ ] Dashboard updates correctly after reset.

### 5.8 Cross-Page Persistence

- [ ] Flashcard progress survives page reload.
- [ ] Quiz history survives page reload.
- [ ] Exam history survives page reload.
- [ ] Dashboard reflects activity from all modules.
- [ ] Invalid or old stored data does not crash the app.
- [ ] Progress remains isolated under `ptce2026_progress_v1`.

### Stage 5 Completion Criteria

Stage 5 is complete when:

- Every page loads through localhost.
- All JSON fetches succeed.
- No uncaught console errors remain.
- Quiz and exam scoring are verified.
- Progress survives refresh.
- Dashboard statistics match recorded activity.
- Limited question-bank behavior is explicit.
- Critical desktop and mobile defects are fixed.

## Stage 6 — Question-Bank Expansion

### Objective

Support a full unique 90-question exam and improve repeat practice.

### Status

Next after critical integration defects are fixed.

### Immediate Target

Expand from 66 to at least 90 unique questions.

Minimum additional questions needed:

```text
24
```

### Target Domain Balance

For a 90-question minimum bank:

| Domain | Minimum Target |
|---|---:|
| Medications | 36 |
| Patient Safety and Quality Assurance | 24 |
| Order Entry and Processing | 19 |
| Federal Requirements | 11 |
| **Total** | **90** |

The actual source bank may contain more than these numbers while the exam selector draws the weighted distribution.

### Expansion Priorities

#### Medications

- [ ] Brand/generic recognition
- [ ] Drug classes
- [ ] Common indications
- [ ] Major adverse effects
- [ ] Contraindications
- [ ] Important interactions
- [ ] Storage requirements
- [ ] Dosage forms and routes
- [ ] High-alert medications
- [ ] Look-alike/sound-alike medications
- [ ] Hazardous drugs
- [ ] Medication-safety scenarios

#### Patient Safety and Quality Assurance

- [ ] Error-prevention strategies
- [ ] Tall Man lettering
- [ ] High-alert processes
- [ ] Medication reconciliation
- [ ] Root-cause concepts
- [ ] Quality-improvement concepts
- [ ] Infection prevention
- [ ] Recall handling
- [ ] Reporting systems
- [ ] Compounding safety
- [ ] USP `<795>`, `<797>`, and `<800>`

#### Order Entry and Processing

- [ ] Prescription interpretation
- [ ] SIG translation
- [ ] Days-supply calculations
- [ ] Dosage calculations
- [ ] Quantity calculations
- [ ] Dilution calculations
- [ ] Concentration calculations
- [ ] Alligation
- [ ] Reconstitution
- [ ] Insulin calculations
- [ ] Ophthalmic and otic quantities
- [ ] Package-size and billing scenarios

#### Federal Requirements

- [ ] Controlled-substance schedules
- [ ] DEA Form 222
- [ ] DEA Form 106
- [ ] DEA Form 41
- [ ] CSOS
- [ ] Inventory requirements
- [ ] Prescription transfer rules
- [ ] Refill restrictions
- [ ] Recordkeeping
- [ ] Disposal and destruction
- [ ] Federal versus state-law distinctions

### Question QA Requirements

Each added question must have:

- [ ] A unique ID.
- [ ] One unambiguously correct answer.
- [ ] Plausible distractors.
- [ ] A correct zero-based answer index.
- [ ] A concise rationale.
- [ ] A standardized domain name.
- [ ] A useful subtopic.
- [ ] A consistent difficulty label.
- [ ] Current and supportable pharmacy content.
- [ ] No unsupported state-specific assumption.
- [ ] No duplicate or near-duplicate wording.

### Long-Term Bank Target

After the minimum release:

```text
150–250 validated questions
```

This larger target reduces repetition and supports more useful repeat exams.

## Stage 7 — Content Validation

### Objective

Review all notes, cards, and questions for exam relevance and factual accuracy.

### Medication Review

- [ ] Verify brand/generic pairs.
- [ ] Verify drug classes.
- [ ] Verify primary indications.
- [ ] Verify major adverse effects.
- [ ] Verify major interactions.
- [ ] Verify contraindications.
- [ ] Verify dosage forms and routes.
- [ ] Verify high-alert designations.
- [ ] Verify look-alike/sound-alike examples.
- [ ] Verify hazardous-drug information.

### Federal Requirements Review

- [ ] Verify controlled-substance schedules.
- [ ] Verify DEA form purposes.
- [ ] Verify CSOS information.
- [ ] Verify inventory and recordkeeping information.
- [ ] Verify refill and transfer rules.
- [ ] Distinguish federal rules from stricter state requirements.
- [ ] Add meaningful effective years where appropriate.
- [ ] Remove outdated law references.

### Compounding Review

- [ ] Review USP `<795>` concepts.
- [ ] Review USP `<797>` concepts.
- [ ] Review USP `<800>` concepts.
- [ ] Keep content at the technician/PTCE level.
- [ ] Verify terminology and beyond-use-date concepts.
- [ ] Verify hazardous-drug handling concepts.
- [ ] Avoid presenting facility policy as universal law.

### Calculation Review

- [ ] Verify days-supply problems.
- [ ] Verify dosage and quantity problems.
- [ ] Verify ratio-strength problems.
- [ ] Verify percentage-strength problems.
- [ ] Verify dilution problems.
- [ ] Verify alligation problems.
- [ ] Verify reconstitution problems.
- [ ] Verify insulin and injectable calculations.
- [ ] Confirm units and rounding instructions.

## Stage 8 — Mobile UX and Accessibility

### Objective

Polish the working application for repeated study on desktop and iPhone Safari.

### Mobile QA

- [ ] Test at iPhone 13 viewport dimensions.
- [ ] Test portrait orientation.
- [ ] Test landscape orientation where practical.
- [ ] Verify safe-area spacing.
- [ ] Verify no horizontal scrolling.
- [ ] Verify text remains readable without zooming.
- [ ] Verify buttons have adequate tap areas.
- [ ] Verify fixed or sticky controls do not cover content.
- [ ] Verify flashcard flipping works on touch.
- [ ] Verify answer choices are easy to select.
- [ ] Verify long rationales remain readable.
- [ ] Verify dashboard cards fit narrow screens.

### Accessibility QA

- [ ] Verify semantic headings.
- [ ] Verify controls use buttons or appropriate links.
- [ ] Verify visible keyboard focus.
- [ ] Verify keyboard navigation.
- [ ] Verify sufficient color contrast.
- [ ] Verify feedback is not communicated by color alone.
- [ ] Verify meaningful labels.
- [ ] Verify disabled states are understandable.
- [ ] Verify dynamic feedback is readable by assistive technology where practical.
- [ ] Verify reduced-motion behavior if animations are used.

### Visual Consistency

- [ ] Use consistent spacing.
- [ ] Use consistent button styles.
- [ ] Use consistent card styles.
- [ ] Use consistent success and error feedback.
- [ ] Use consistent empty states.
- [ ] Use consistent loading states.
- [ ] Keep the interface focused and uncluttered.

## Stage 9 — Initial Release

### Objective

Produce a stable personal-use release.

### Release Criteria

- [ ] All pages load through localhost.
- [ ] All JSON files validate.
- [ ] No critical console errors remain.
- [ ] Notes render correctly.
- [ ] Flashcards work and persist.
- [ ] Standard quiz works.
- [ ] Quick 10 works.
- [ ] Practice-exam scoring works.
- [ ] Dashboard results are accurate.
- [ ] Question bank contains at least 90 validated questions.
- [ ] Federal and USP content has received a focused review.
- [ ] Core calculations have been checked.
- [ ] iPhone Safari testing is complete.
- [ ] README accurately explains the app.
- [ ] ROADMAP accurately reflects project status.

## Stage 10 — Optional Enhancements

These tasks are deferred until the core release is stable.

- [ ] Missed-question review mode
- [ ] Needs-review flashcard session
- [ ] Weak-domain quiz mode
- [ ] Weak-subtopic quiz mode
- [ ] Question bookmarking
- [ ] Flashcard bookmarking
- [ ] Session-length selection
- [ ] Difficulty filtering
- [ ] More detailed dashboard trends
- [ ] Export progress to JSON
- [ ] Import progress from JSON
- [ ] Dark mode
- [ ] Offline service worker
- [ ] Installable PWA support
- [ ] GitHub Pages deployment
- [ ] Larger 150–250-question bank
- [ ] Larger flashcard bank

Optional features must not delay correcting core data, scoring, persistence, or mobile-use defects.

## Immediate Work Order

Follow this order to avoid adding content on top of an unverified application:

1. Replace and separate `README.md` and `ROADMAP.md`.
2. Standardize `ROADMAP.MD` to `ROADMAP.md`.
3. Run the app through localhost.
4. Test every page for fetch and console errors.
5. Validate all three JSON files.
6. Verify quiz scoring and rationale behavior.
7. Verify practice-exam weighting and limited-bank behavior.
8. Verify `localStorage` persistence.
9. Verify dashboard calculations.
10. Fix integration defects.
11. Expand the question bank from 66 to at least 90.
12. Perform pharmacy-content validation.
13. Complete iPhone Safari and accessibility testing.
14. Mark the initial personal-use release complete.

## Decision Log

### Architecture

- The application remains static and local-first.
- The application runs from the repository root.
- No `app/` directory is used.
- No backend is required.
- No database is required.
- No account system is required.
- No heavy framework is required.
- No package manager or build step is required.

### Data

- Study notes remain in `data/notes.json`.
- Flashcards remain in `data/flashcards.json`.
- Questions remain in `data/questions.json`.
- Study content is not duplicated into markdown.
- Domain labels should remain standardized.
- Data IDs should remain stable and unique.

### Progress

- Browser progress uses `localStorage`.
- The storage key is `ptce2026_progress_v1`.
- Progress is device- and browser-specific.
- Clearing browser data may remove saved progress.

### Documentation

- `README.md` explains the project, architecture, setup, data, and usage.
- `ROADMAP.md` tracks stages, tasks, QA, and future work.
- Documentation must reflect the actual repository rather than a planned directory that does not exist.
- README and ROADMAP must remain separate rather than replacing one with the other.

### Content

- Content should be concise and exam-focused.
- The intended user is an experienced pharmacy technician.
- The current PTCE outline controls domain priorities.
- Current federal and USP guidance controls law and compounding review.
- State-specific rules must not be described as universal federal requirements.
- Meaningful law-related years should be identified.
- Accuracy takes priority over question volume.

### Practice Exam

- The target practice exam contains 90 questions.
- The target distribution is 36/24/19/11.
- Questions should be unique within an exam.
- The app should not silently duplicate questions to reach 90.
- The minimum bank target is 90 validated questions.
- The preferred later bank target is 150–250 questions.
