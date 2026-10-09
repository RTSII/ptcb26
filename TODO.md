# TODO

Live backlog. History in `docs/archive/` is not this list.

## Next up (in order)

- [x] **Fact flags** (#42). Six plan flags, plus course `m1l5` SSRI stems and `m1l4` / `m3l2` insulin and detemir. Insulin onset/peak/duration curve stays verify (F-011, F-012).

1. **Study Course content audit.** 100% factual and complete against the PTCE 2026 outline ([AUDIT_RUBRIC.md](AUDIT_RUBRIC.md)).
   - **Domain 1 gap content (deferred):** C-D1-018; 1.1 missing classes; 1.3 supplement/lab interactions; 1.4 strengths/durations; 1.5 SJS/TEN; 1.5 GLP-1 boxed warning; 1.6 missing indications; 1.7 MDV 28-day; 1.8 restricted access.
2. **Study Notes content audit.** Same standard ([AUDIT_RUBRIC.md](AUDIT_RUBRIC.md)).
3. **Notes theme overhaul.** Only after 1 and 2 are signed off (`study_notes_v4_plan.md`).

Course is the primary path; Notes summarize it. Lock course facts before Notes so the same error is not fixed twice. Items 1 and 2 use [AUDIT_RUBRIC.md](AUDIT_RUBRIC.md). Standing rules: [AGENTS.md](AGENTS.md).

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
- [ ] Future: Google AI prompt pack / `assets/notes` emblems + dosage-form specimens (deferred; Word doc reference-only)
- [ ] Future: clarify/revive decorative art only after space-saving visual-aid strategy is locked


## UI & Design System Rubric
- [x] Red Pill / Blue Pill mark (38px × 32px) on every page. Home wordmark (`hx-logo`) is on Home and Course only
- [x] Chrome laptop viewport: no phantom scroll. Real scroll only when content overflows ([UI_STANDARDS.md](UI_STANDARDS.md))
- [x] Dashboard trigger: organic circular Matrix reactor UI component with translucent glass center & even perimeter padding
- [x] Flashcards trigger: tabbed physical Rolodex index card with stepped deck depth and spindle notch icon
- [x] Study Notes Codex v2 baseline (3-zone header, layouts, parenthesis-safe parsing)
- [x] Cascading Katakana Matrix rain FX (depth layers, white lead tips, no static grid floor overlays)
- [x] Service worker and `?v=` cache busters. Current name: `ptce-2026-v59` in `sw.js`
- [x] Study Course home: chapters closed on load, title in the centered header, chapter titles centered (`ptce-2026-v49`)
- [x] Home course card (#37)
- [x] Dashboard Resurrections glass cards with no rain on the Dashboard (#38)
- [x] Exam Setup console (#39)
- [x] Study Course Resume button with one-open accordions and the Home brand (#40)
- [ ] Switch the Dashboard, Quiz, Practice Exam, and Flashcards headers to the Home brand
- [ ] Notes palette: Matrix-cohesive (retire slate-as-end-state) per `study_notes_v4_plan.md`
- [ ] Trim redundant Notes search/filter/nav chrome
- [ ] Shared `matrix.css` tokens — `UI_STANDARDS.md` documents the UI templates; extraction stays open

## Study sign-off

Punch-list loop still open:

1. Quick 10
2. Chapter Test
3. 30-question practice exam

Federal Requirements and Patient Safety course pass 1 are done. Those two domains still need the three punch lists above. Medications and Order Entry are not signed off.

`node validate.js` only checks structure and a few copy assertions. It does not close this loop. The pre-PR loop is in [AGENTS.md](AGENTS.md).

## From ROADMAP (Rob to confirm)

- [ ] iPhone Safari pass: portrait and landscape, safe area, no horizontal scroll, tap targets, flashcard flip, long rationales, and the Dashboard on a narrow screen.
- [ ] Accessibility pass: semantic headings, visible keyboard focus, keyboard navigation, contrast, feedback not by color alone, meaningful labels, and reduced motion.
- [ ] GitHub Pages deploy so a phone can open the app without a local server.
