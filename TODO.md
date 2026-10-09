# TODO

Live backlog. History in `docs/archive/` is not this list.

## Next up (in order)

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
  - **Federal gap content (deferred):** C-FED-005 (emergency C-II follow-up paper or electronic, and DEA notice if not delivered); C-FED-006 (multiple C-II prescriptions, up to a 90-day supply); C-FED-007 (notify the prescriber if a cannot-supply remainder is not filled within 72 hours); C-FED-010 (Form 222/CSOS signed by the registrant or a power of attorney); C-FED-023 (stock recovery is not a recall); C-FED-026 (P/U-list scope, P-list residue, CS that is also hazardous waste); C-FED-027 (calculation items for 2.2 and 2.4).
  - **Partial scope (lesson stays on the default path):** `m11l3` — FDCA history, PPPA, ADA, and NDC sit outside 2.1–2.6; the Medication Guide bullet supports 2.4. `m12l2` — FEFO, expired stock, and NDC returns sit outside FDA recall 2.5; recall classes and initiation stay on the default path.

1. **Match Study Course accordion UI/page to Study Notes accordion.**
   - Auxiliary labels: course Patient Safety `m6l1` vs Notes Order Entry.
   - C-II refill and partial fill: course Federal `m10l2` vs Notes Order Entry.
   - OBRA-90 DUR: course Federal `m11l2` only vs Notes also under Patient Safety.
   - NDC format: Notes Patient Safety section; no course lesson.
   - Course-only: ADC overrides; regulatory agencies lesson; technician scope lesson.
   - Notes-only: FMEA; tech cannot verify their own work. Concurrent DUR is in course `m4l4`.
   - Garb vs PPE: course `m5l2` sterile garb order vs Notes routine PPE order.
2. **Study Notes content audit.** Same standard ([AUDIT_RUBRIC.md](AUDIT_RUBRIC.md)).
3. **Notes theme overhaul.** Only after the course audit and the notes audit are signed off (`study_notes_v4_plan.md`).

Course is the primary path; Notes summarize it. Lock course facts before Notes so the same error is not fixed twice. Course and notes audits use [AUDIT_RUBRIC.md](AUDIT_RUBRIC.md). Standing rules: [AGENTS.md](AGENTS.md).

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
- [x] Service worker and `?v=` cache busters. Current name: `ptce-2026-v65` in `sw.js`
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
