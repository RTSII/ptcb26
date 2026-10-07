# TODO

Live backlog. Older unchecked boxes in `ROADMAP.md` are not this list.

## Next up (in order)

1. **Study Course content review — content only.** Review all Study Course material against the 2026 PTCE content outline (Jan 2026: Medications 35%, Patient Safety 23.75%, Order Entry 22.50%, Federal 18.75%). Verify every fact is correct and current, nothing on-exam is missing, nothing incomplete, no duplicates, nothing outdated/off-exam. Produce an audit list with sources. Rob signs off on contents (factual + complete) before any edits ship. No UI/theme changes in this step.
2. **Study Notes content review — same review.** Same audit for Study Notes (duplicate, incomplete, missing, incorrect lesson info; gaps covered/fixed). Includes the 5 fact flags in `study_notes_v4_plan.md` (amiodarone/pioglitazone label, SSRI stems, MMR vs varicella storage, HIPAA penalty amounts, insulin onset/peak/duration completeness) plus whether Levemir (detemir) is still US-marketed. Known example: Insulin Types repeats rapid-acting, long-acting, and storage lines. Rob signs off on contents before edits ship.
3. **Study Notes theme overhaul** (Terminal Codex / Matrix per `UI_STANDARDS.md` and `study_notes_v4_plan.md`) — only after steps 1 and 2 are signed off. Ships blocks runtime + v2 `notes.json` together in one PR.

Each step is review, then Rob's sign-off, then edits. One domain per PR where practical. No silent clinical fact edits. No merge without Rob's explicit approval.

Superseded by the block above (do not follow these):

- Plan-review chat that edits plan/docs only, then **STOP**
- Start the Notes overhaul after a reviewed-plan sign-off
- `matrix.css` → blocks runtime → then v2 JSON as its own start sequence
- Five fact flags as their own gate (they sit inside step 2)

## Study Notes — Terminal Codex (v4)

- [x] Codex v2 baseline on main (#28, SW v43) — legacy `items` renderer
- [x] `study_notes_v3_plan.md` (history) + `study_notes_v4_plan.md` (handoff + **2026-10-07 content audit**)
- [x] Content audit: main 44→v2 41 merge map, dup clusters, 5 review flags documented
- [ ] **Do not commit** the local v2 notes file, and keep it outside `data/` until `js/notes.js` reads `blocks` (old runtime renders it empty). Ship together with the blocks runtime in **Next up** #3, after steps 1 and 2 are signed off.
- [ ] Course / Exam Matrix tokens later
- [ ] Future: Google AI prompt pack / `assets/notes` emblems + dosage-form specimens (deferred; Word doc reference-only)
- [ ] Future: clarify/revive decorative art only after space-saving visual-aid strategy is locked


## UI & Design System Rubric
- [x] Matrix Red Pill / Blue Pill unified branding across all pages (global 38px × 32px standard)
- [x] Zero-scroll desktop Chrome viewport layout (`100dvh`, frame as container)
- [x] Dashboard trigger: organic circular Matrix reactor UI component with translucent glass center & even perimeter padding
- [x] Flashcards trigger: tabbed physical Rolodex index card with stepped deck depth and spindle notch icon
- [x] Study Notes Codex v2 baseline (3-zone header, layouts, parenthesis-safe parsing)
- [x] Cascading Katakana Matrix rain FX (depth layers, white lead tips, no static grid floor overlays)
- [x] Service worker & cache-busting query system (`?v=49`, `ptce-2026-v49`)
- [x] Study Course home: chapters closed on load, title in the centered header, chapter titles centered (`ptce-2026-v49`)
- [ ] Notes palette: Matrix-cohesive (retire slate-as-end-state) per `study_notes_v4_plan.md`
- [ ] Trim redundant Notes search/filter/nav chrome
- [ ] Shared `matrix.css` tokens — `UI_STANDARDS.md` documents the UI templates; extraction stays open

## Study sign-off

Punch-list loop still open:

1. Quick 10
2. Chapter Test
3. 30-question practice exam

Federal Requirements and Patient Safety course pass 1 are done. Those two domains still need the three punch lists above. Medications and Order Entry are not signed off.

`node validate.js` only checks structure and a few copy assertions. It does not close this loop.
