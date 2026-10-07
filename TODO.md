# TODO

Live backlog. Older unchecked boxes in `ROADMAP.md` are not this list.

## Study Notes — Terminal Codex (v4)

- [x] Codex v2 baseline on main (#28, SW v43) — legacy `items` renderer
- [x] `study_notes_v3_plan.md` (history) + `study_notes_v4_plan.md` (handoff + **2026-10-07 content audit**)
- [x] Content audit: main 44→v2 41 merge map, dup clusters, 5 review flags documented
- [ ] **Do not start** Notes overhaul until Rob says start
- [ ] **Do not commit** local v2 `data/notes.json` until `js/notes.js` reads `blocks` (ship together)
- [ ] When started: `matrix.css` → blocks runtime → then v2 JSON; draft PR
- [ ] Rob OK on five fact flags before changing clinical wording
- [ ] Course / Exam Matrix tokens later


## UI & Design System Rubric
- [x] Matrix Red Pill / Blue Pill unified branding across all pages (global 38px × 32px standard)
- [x] Zero-scroll desktop Chrome viewport layout (`100dvh`, frame as container)
- [x] Dashboard trigger: organic circular Matrix reactor UI component with translucent glass center & even perimeter padding
- [x] Flashcards trigger: tabbed physical Rolodex index card with stepped deck depth and spindle notch icon
- [x] Study Notes Codex v2 baseline (3-zone header, layouts, parenthesis-safe parsing)
- [x] Cascading Katakana Matrix rain FX (depth layers, white lead tips, no static grid floor overlays)
- [x] Service worker & cache-busting query system (`?v=43`, `ptce-2026-v43`)
- [ ] Notes palette: Matrix-cohesive (retire slate-as-end-state) per `study_notes_v4_plan.md`
- [ ] Trim redundant Notes search/filter/nav chrome
- [ ] Reusable UI component template library / shared `matrix.css` tokens

## Study sign-off

Punch-list loop still open:

1. Quick 10
2. Chapter Test
3. 30-question practice exam

Federal Requirements and Patient Safety course pass 1 are done. Those two domains still need the three punch lists above. Medications and Order Entry are not signed off.

`node validate.js` only checks structure and a few copy assertions. It does not close this loop.
