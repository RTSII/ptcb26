# TODO

Live backlog. History in `docs/archive/` is not this list.

## Next up (remaining tasks, 2026-10-22)

The consolidated open list. Main is `047727c` (#83), cache `ptce-2026-v96`. One PR per task unless noted; Rob OKs every merge ([AGENTS.md](AGENTS.md) Cost & workflow rules). Priority: **P1** next, **P2** soon, **P3** later.

**Decisions waiting on Rob**

1. [ ] **P2 · Fold Amoxicillin into the Penicillins row?** Optional follow-up to #83 (merged as-is, Amoxicillin kept separate).
2. [ ] **P3 · Roomier Brand / Generic rows?** Optional follow-up to #83 (rows pad 3–8px to fill the card today).
3. [ ] **P2 · Practice Exam drill modes.** The Home Practice Exam card part is resolved (#87): the left-column Practice Exam ring (`#homeExam`) replaced the card. Still open: Quick 10, chapter test, Missed, Bookmarked, Weakest Domain/Subtopic, subtopic and difficulty filters have no Home entry since #76. Rob picks where they live (a popover from the ring, or options in Exam Setup).

**Notes**

4. [x] **P1 · Bottom "Search Codex" filter — Done (#86): moved, not removed.** It is the only Notes search, so Rob chose to move it. `#notesSearch` + `#notesSearchClear` now sit in `section.nx-top-filter-wrap` in the idle ~10vh top band above the domain accordions; the band folds shut while a domain is open (search hidden, as before). The old bottom wrap and its CSS are gone. No page scroll; topic-card height and in-card scroll match main at 1600x770 and 1366x768.
5. [ ] **P2 · Notes overhaul stage 0 + stage 2.** `check-notes-containment.js` harness, then the body shell (`css/notes-body.css`, `js/notes-body.js`, `js/notes-layouts.js`). None of these files exist yet ([docs/notes-overhaul-plan.md](docs/notes-overhaul-plan.md) §7). Stage 1 (cross-domain prev/next) shipped in #72.
6. [ ] **P2 · Notes overhaul stages 3–7: one layout PR per domain (D1–D4).** Not built. #82/#83 only re-laid the three short pair tables. Each domain PR also removes cross-topic duplicate rows (plan §9).
7. [ ] **P3 · Notes visual aids VA-01–VA-07 and Matrix palette.** One PR per code-built aid (stages 8–14), plus retiring slate for the Matrix-cohesive palette and the shared `css/matrix.css` tokens (not extracted yet).

**Dashboard / Home**

8. [ ] **P2 · Dashboard live-data scroll.** With heavy saved progress the Dashboard main region still scrolls (`check-page-fit.js` heavy pass, 2026-10-22: 800px at 1600×770, 802px at 1366×768). Fix candidates: fixed chart height, show only the last few quiz attempts. Rob may still combine Dashboard with Home telemetry.
9. [ ] **P2 · Old pill-icon headers to the Home brand.** Notes, Dashboard, Quiz, Practice Exam, and Flashcards still use `matrix-pill-icon`; only Home and Course use `hx-logo`.

**Content fixes**

10. [x] **P1 · Duplicate "Double-check … selected high-alert meds" line ×3** in Patient Safety: High-Alert & LASA Drugs, Error Prevention Basics, Quality Improvement Methods. Keep one copy, no fact change. Done (#86): kept High-Alert & LASA Drugs, removed Error Prevention Basics and Quality Improvement Methods copies; folded the QI definition ("two staff separately verify") into the kept line.
11. [x] **P1 · Duplicate alligation line ×2** in Order Entry: Core Calculations and Essential Calculations Reference. Keep one copy, no fact change. Done (#86): kept Essential Calculations Reference, removed the Core Calculations copy.
12. [ ] **P3 · Open verify flags.** Insulin onset/peak/duration curve (F-011, F-012); C-PS-004, C-PS-005; C-OE-001, C-OE-003; and the unsourced, deferred lines in the done log below. Source each per [AUDIT_RUBRIC.md](AUDIT_RUBRIC.md) or leave it out.
13. [ ] **P3 · Course vs Notes breakdown leftovers (verify).** Auxiliary labels (course `m6l1` vs Notes Order Entry); OBRA-90 DUR placement; course-only ADC overrides / agencies / technician scope; Notes-only FMEA and "tech cannot verify own work"; garb vs PPE order. The four-domain accordion match itself shipped (#63).

**Docs**

14. [x] **Docs refresh** (#85, 10-22): README current state, this list, UI_STANDARDS helix region, plan status lines.

**Study sign-off**

15. [ ] **P2 · Study sign-off passes with punch lists:** Quick 10 → Chapter Test → 30-question practice exam. Report gaps, stale post-2020 facts, wrong answers, and UI blockers. Course content (including Federal and Patient Safety) was signed off 2026-10-10 (#61). `node validate.js` does not close this loop.

**Future**

16. [ ] **P3 · AI art cards** (e.g. mL-to-tsp household measures). Gated behind the Notes review overhaul; code-built aids come first, and art never replaces them (plan §9 dropped VA-R1 from the overhaul).
17. [ ] **P3 · Study Course graphic** for the Home Study Course card. TBD; the course ring stays hidden because it would duplicate the Practice Exam ring.
18. [ ] **P3 · Device and deploy passes (Rob to confirm).** iPhone Safari (portrait/landscape, safe area, tap targets, flip, long rationales, narrow Dashboard); accessibility (headings, focus, keyboard, contrast, not color alone, labels, reduced motion); GitHub Pages deploy.

Course is the primary path; Notes summarize it. Lock course facts before Notes so the same error is not fixed twice. Course and notes audits use [AUDIT_RUBRIC.md](AUDIT_RUBRIC.md). Standing rules: [AGENTS.md](AGENTS.md).

## Done log

Shipped work kept for its verify flags and deferred lines. Item 12 above tracks what is still open here.

- [x] **Fact flags** (#42). Six plan flags, plus course `m1l5` SSRI stems and `m1l4` / `m3l2` insulin and detemir. Insulin onset/peak/duration curve stays verify (F-011, F-012).
- [x] **Domain 1 Course accuracy fixes** (#43). FACT and misleading claims from the Domain 1 course audit.
  - [x] **Domain 1 gap content.** C-D1-018; 1.1 missing classes; 1.3 supplement/lab interactions; 1.4 strengths/durations; 1.5 SJS/TEN; 1.5 GLP-1 boxed warning; 1.6 missing indications; 1.7 MDV 28-day; 1.8 restricted access. Applied as GF-MED-001–033 in m1–m3.
    - **Unsourced, deferred:** Flomax brand on the tamsulosin line; penicillin–cephalosporin cross-reactivity percent; St. John's wort plus warfarin; Zovirax cream for shingles, genital herpes, or chickenpox; red yeast rice course sentence; Tamiflu prophylaxis day count; GLP-1 boxed warning for products other than Ozempic and Victoza; Coumadin brand; heparin indication.
- [x] **Patient Safety accuracy fixes.** C-PS-001, C-PS-002, C-PS-003, and C-PS-006. C-PS-004 (hazardous-drug decontamination agent) and C-PS-005 (penicillin/sulfa tray rule) stay verify.
  - [x] **Patient Safety gap content.** 3.1 high-alert additions (neuromuscular blockers, oral sulfonylureas, Humulin R U-500); 3.2 error-prone abbreviations and the FDA buPROPion/busPIRone tall-man pair; 3.3 prospective DUR screens, Part D concurrent DUR, over/underutilization, and adverse-event vs medication-error definitions; 3.4 MedWatch product-quality reports and required VAERS reports; 3.5 prospective DUR daily-dosage formula; 3.6 PPE don/doff sequence and soap-and-water triggers. Applied as GF-PS-001–003 and GF-PS-005–015 in m4–m6. GF-PS-004 skipped (duplicate of GF-MED-017).
    - **Unsourced, deferred:** technician cannot verify their own work; FMEA; hazardous-drug decontamination agent (C-PS-004); penicillin or sulfa dedicated counting tray (C-PS-005).
- [x] **Order Entry accuracy fixes.** C-OE-002, C-OE-004, C-OE-005, C-OE-006, C-OE-007, and C-OE-008 (`m9` optional archive). C-OE-001 (subscription/refills) and C-OE-003 (insulin 50-day unit supply vs in-use dating) stay verify.
  - [x] **Order Entry gap content.** C-OE-009 (4.2 administration supplies); C-OE-010 (4.3 NDC, lot, expiration); C-OE-011 (4.4 returns); 4.1 v/v percent and proportion. Applied as GF-OE-001–025. New lessons `m7l3`, `m7l4`, and `m7l5` after `m7l2`. `m9` not used.
    - **Unsourced, deferred:** filter needles and 0.22-micron sterilizing filters; return to stock of will-call or patient-returned medication, including any day limit; lancets, glucose meters, test strips, and alcohol swabs as a required diabetic kit.
- [x] **Federal Requirements accuracy fixes (m10–m12).** C-FED-001, C-FED-002, C-FED-003, C-FED-004, C-FED-008, C-FED-009, C-FED-011, C-FED-012, C-FED-013, C-FED-014, C-FED-015, C-FED-017, C-FED-021, and C-FED-022. Whole lessons marked optional archive: `m11l1` HIPAA, `m11l2` OBRA-90, `m12l1` agencies, `m12l3` technician scope.
  - [x] **Federal gap content.** C-FED-005; C-FED-006; C-FED-007; C-FED-010; C-FED-023; C-FED-026; C-FED-027. Applied as GF-FED-001–010 in m10 and m12.
    - **Unsourced, deferred:** same-day issuance of multiple Schedule II prescriptions. Current 21 CFR 1306.12(b) does not require them to be issued on the same day.
  - **Partial scope (lesson stays on the default path):** `m11l3` — FDCA history, PPPA, ADA, and NDC sit outside 2.1–2.6; the Medication Guide bullet supports 2.4. `m12l2` — FEFO, expired stock, and NDC returns sit outside FDA recall 2.5; recall classes and initiation stay on the default path.
- [x] **Course gap-fill.** Medications, Patient Safety, Order Entry, and Federal Requirements (#48–#51).
- [x] **Study Course content and layout** signed off (Rob, 2026-10-10; #60 fit, #61 sign-off).
- [x] **Match Study Course accordion UI/page to Study Notes accordion** (#63). Open breakdown leftovers are Next up item 13.
   - Auxiliary labels: course Patient Safety `m6l1` vs Notes Order Entry.
   - [x] C-II refill and partial fill: Notes Order Entry copy removed. Federal schedules and Key Federal Laws keep them (course `m10l2`).
   - OBRA-90 DUR: course Federal `m11l2` only vs Notes also under Patient Safety.
   - [x] NDC format: Notes section is Order Entry, with course `m7l4`. Lot and expiration are in Notes (`Lot and Expiration`).
   - Course-only: ADC overrides; regulatory agencies lesson; technician scope lesson.
   - Notes-only: FMEA; tech cannot verify their own work. Concurrent DUR is in course `m4l4`.
   - Garb vs PPE: course `m5l2` sterile garb order vs Notes routine PPE order.
   - [x] Consolidate Study Course structure into exactly the 4 main domains as accordion groups (Medications, Patient Safety, Order Entry, Federal), combining sub-domains/modules under them. Long lists are fine; the accordion moves the active section to the top.
- [x] **Study Notes content audit** (#64–#67), missing topics added (#68), misplaced topics moved (#58), duplicates dropped (#62). Same standard ([AUDIT_RUBRIC.md](AUDIT_RUBRIC.md)).
- **Notes theme overhaul** (open: Next up items 4–7). Approved layout (#70): [docs/notes-overhaul-plan.md](docs/notes-overhaul-plan.md). Earlier handoff: `study_notes_v4_plan.md`.
   - [x] Key Federal Laws: biennial inventory and the 2-year prescription-record line are one card. The C-II–IV transfer-warning card is removed on purpose. The C-II receipt card stays separate. Do not restore or resplit those.
   - [x] Notes prev/next on the top and bottom bars cross domain boundaries. They stop only on the first topic and the last topic.
   - [x] DSCSA card 7 spans the full topic-body width. Leave the card text and the `#07` index as they are. Card 6's label is Handling suspect product.
   - [x] Known Teratogens is a row on Patient Safety High-Alert & LASA Drugs, not its own Medications topic. Do not put that topic back.
   - [x] Step 1, before layout: diff current `data/notes.json` against `a0e7321` (before `a7542b5`) and list lost or garbled content and broken titles/numbering to restore (#62).
   - [x] Short pair topics as alphabetical two-pair, four-column tables filled column by column (#82, #83, merged 2026-10-22).


Superseded by the block above (do not follow these):

- Plan-review chat that edits plan/docs only, then **STOP**
- Start the Notes overhaul after a reviewed-plan sign-off
- `matrix.css` → blocks runtime → then v2 JSON as its own start sequence
- Fold the fact flags into a later content review

## Study Notes — Terminal Codex (v4)

- [x] Codex v2 baseline on main (#28, SW v43) — legacy `items` renderer
- [x] `study_notes_v4_plan.md` (handoff, 2026-10-07 content audit, and the target architecture)
- [x] Content audit: main 44→v2 41 merge map, dup clusters, 6 review flags documented
- [ ] **Do not commit** the local v2 notes file, and keep it outside `data/` until `js/notes.js` reads `blocks` (old runtime renders it empty). Ship it with the blocks runtime in the Notes theme overhaul (see **Next up**).
- [ ] Course / Exam Matrix tokens later
- [ ] Future (Next up 16): Google AI prompt pack / `assets/notes` emblems + dosage-form specimens (deferred; Word doc reference-only)
- [ ] Future: clarify/revive decorative art only after space-saving visual-aid strategy is locked


## UI & Design System Rubric
- [x] Red Pill / Blue Pill mark (38px × 32px) on every page. Home wordmark (`hx-logo`) is on Home and Course only
- [x] Chrome laptop viewport: no phantom scroll. Real scroll only when content overflows ([UI_STANDARDS.md](UI_STANDARDS.md))
- [x] Dashboard trigger: organic circular Matrix reactor UI component with translucent glass center & even perimeter padding
- [x] Flashcards trigger: tabbed physical Rolodex index card with stepped deck depth and spindle notch icon
- [x] Study Notes Codex v2 baseline (3-zone header, layouts, parenthesis-safe parsing)
- [x] Cascading Katakana Matrix rain FX (depth layers, white lead tips, no static grid floor overlays)
- [x] Service worker and `?v=` cache busters. Current name: `ptce-2026-v100` in `sw.js`
- [x] Study Course home: chapters closed on load, title in the centered header, chapter titles centered (`ptce-2026-v49`)
- [x] Home course card (#37)
- [x] Dashboard Resurrections glass cards with no rain on the Dashboard (#38)
- [x] Exam Setup console (#39)
- [x] Study Course Resume button with one-open accordions and the Home brand (#40)
- [ ] Switch the Notes, Dashboard, Quiz, Practice Exam, and Flashcards headers to the Home brand (Next up 9)
- [ ] Notes palette: Matrix-cohesive (retire slate-as-end-state) per `study_notes_v4_plan.md` (Next up 7)
- [ ] Trim redundant Notes search/filter/nav chrome (bottom filter done in #86: moved to the top band)
- [ ] Shared `matrix.css` tokens — `UI_STANDARDS.md` documents the UI templates; extraction stays open (Next up 7)
- [x] Home relayout (#76), telemetry helix (#77, #80), and rain mask (#81). `UI_STANDARDS.md` Home regions now point at `section.hx-helix`.
- [x] Home 3-column relayout (#87, `ptce-2026-v99`). The Practice Exam ring is on the left: the Dashboard ring retitled, about 31% smaller, linking to `exam.html`, with its text kept inside the arcs. The landscape Study Course is the centered anchor; its next lesson wraps to two lines. Below it, Flashcards (main's shape) and a wider, shorter Notes card sit offset. The untitled helix is on the right. The old Practice Exam card is removed, and the helix tiles are the Dashboard entry (`#dashStats` anchor added).
- [x] Practice Exam setup capsules (`ptce-2026-v100`): Steak Dinner and Enter the Construct restyled as narrower, see-through red and blue gel capsules, closer to the movie props, each its own button. Possible follow-up: reuse as the app-wide header pills (Rob decides).

## Later

- [ ] **Dashboard live-data scroll.** Next up item 8.
- [x] **Home helix telemetry column.** Shipped in #77, #80, #81.
- [ ] **Practice Exam drill-mode gaps.** Next up item 3.
- [ ] **Study Course graphic.** Next up item 17.

## From ROADMAP (Rob to confirm; Next up item 18)

- [ ] iPhone Safari pass: portrait and landscape, safe area, no horizontal scroll, tap targets, flashcard flip, long rationales, and the Dashboard on a narrow screen.
- [ ] Accessibility pass: semantic headings, visible keyboard focus, keyboard navigation, contrast, feedback not by color alone, meaningful labels, and reduced motion.
- [ ] GitHub Pages deploy so a phone can open the app without a local server.
