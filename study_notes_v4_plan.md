# Study Notes v4: Terminal Codex Plan (ready handoff)

**Status:** Next work is content review, not the theme overhaul. Order is [TODO.md](TODO.md) **Next up**. The plan-review-chat-then-stop gate is superseded. Do **not** commit the local v2 `notes.json` until the blocks runtime ships with it in that overhaul PR. Google AI art stays future (end of the Notes backlog in TODO.md).  
**Repo:** `Desktop\PTCB26` · `main` at `6dd6c07` (#40)  
**Out of scope for now:** Course and Exam Matrix adoption (later). Google AI emblems / dosage-form art (future).  

---

## Decisions locked (Rob, 2026-10-06)

| # | Topic | Decision |
|---|---|---|
| 1 | Palette / theme | **Retire slate** as the Notes end-state ([UI_STANDARDS.md](UI_STANDARDS.md)). Priority: cohesive Matrix theme/UI. Non-green accents OK for dense reading contrast. |
| 2 | Search / nav | **Trim redundant** search / filter / nav. |
| 3 | Content shape | **Merge duplicate and misfiled notes** at content time (map below). |
| 4 | Fact flags | Document candidates for **future review/test**. Standing rule: [AGENTS.md](AGENTS.md). |
| 5 | Workflow | **Next step:** [TODO.md](TODO.md) **Next up**. The plan-review-chat-then-stop gate is superseded. Cloud agents + PRs. Standing rules are in [AGENTS.md](AGENTS.md). |
| 6 | Scope | Notes theme overhaul stays **Notes-only**. Course **content** review is first (no UI). Course / Exam Matrix tokens stay later. |

---

## Clarify / locked (Rob, 2026-10-07) — visual aids, not decorative art

Rob lost faith in the Claude/Devin visual-aid analysis. That plan leaned on decorative Google AI emblems and dosage-form specimens and never chose real aids that break up repeated text formatting and save viewport space.

| Topic | Decision |
|---|---|
| Google AI image briefs | Deferred, see the end of [TODO.md](TODO.md). Not a start step, and not the plan for breaking up repeated prose. |
| Fresh visual-aid pass | Part of the Notes theme overhaul ([TODO.md](TODO.md) **Next up**), after the content audits are signed off. Prefer in-code charts, lists, tables, and compact layouts. Example Rob named: the **Conversions** topic → a dense conversion chart / list (or SVG). Slate is retired ([UI_STANDARDS.md](UI_STANDARDS.md)). |

---

## Content audit (2026-10-07) — paste vs live

### What each file is

| File | Schema | Role |
|---|---|---|
| `data/notes.json` on **main** (committed) | Legacy: `domains[].sections[].title` + **`items[]` strings** | What `js/notes.js` (Codex v2) actually renders today. **44 sections / ~324 items.** |
| Local **uncommitted** `data/notes.json` (= Rob’s paste) | **version 2**: `marks` + `domains[].sections[].blocks[]` (`matrix` / `pairs` / `cards` / `formula` / `timeline` / `figure` / `chips` / `note` / `archive`) | Terminal Codex content draft. **41 sections.** Embeds 4 inline `flags`. |

**Recommendation (docs-only now):** keep the v2 JSON as **local WIP only**. Do **not** merge it onto main yet — current `notes.js` counts `.items` and has **zero** `.blocks` support; swapping files would break Study Notes until the runtime rewrite ships.

When implementation starts (**Next up** #3 only): ship the blocks runtime and v2 JSON together in one PR, after Rob signs off Course and Notes content (steps 1 and 2).

### Section merge map (main 44 → v2 41)

**Medications 14 → 14** (re-sliced, not raw count drop)

| Live main section | v2 section id | What changed |
|---|---|---|
| Top Drug Classes & Suffixes + Mechanisms of Action by Class | `cv-gi-classes`, `cns-classes`, `endo-abx-classes` | Classes + MOA **merged into matrix rows** (Class / Stem / Examples / Mechanism / Pearls), split by body system |
| Respiratory, Psych & Miscellaneous Agents | folded into `cns-classes` / `endo-abx-classes` | No longer a standalone string dump |
| Brand / Generic, OTC, Insulin, High-Alert/LASA, Side Effects, Interactions, Dosage Forms, Teratogens, MSK | same-topic v2 ids | Structured layouts; brand list expanded |
| Vaccine Storage | `storage` | Vaccines + insulin temps together |
| NTI Drugs | `nti` | Marked **`optional: true`** / archive badge |

**Patient Safety 10 → 9**

| Live main | v2 | Merge note |
|---|---|---|
| Quality Assurance & Reporting + Reporting Programs & Recalls | `reporting` | Reporting/MERP consolidated; **recall classes left in Federal `recalls`** (not Safety) |
| USP Chapter IDs + garbing dup under Infection Control | `usp` (+ archive garbing) | USP once; garbing optional archive |
| Infection Control & Hazardous Materials | `infection-hd` | PPE / HD; vaccine temps **not** here |
| Error Prevention, ISMP, NDC, Error Types/DUR, QI, Immunization | matching ids | Structured; NDC as figure+matrix |

**Order Entry 9 → 7**

| Live main | v2 | Merge note |
|---|---|---|
| Core Calculations + Essential Calculations Reference | `calculations` | One formula block; **alligation → `archive`** |
| Prescription Intake + Reading the Prescription | `reading-intake` | Merged |
| Sig, Conversions, Refills, Insurance, Aux | matching ids | Token-split pairs; partial-fill clocks with Federal |

**Federal 11 → 11** (re-homed, same count)

| Live main | v2 | Merge note |
|---|---|---|
| Key Federal Laws + Counseling & Omnibus Laws | `laws` | Timeline + Orange Book / NPI / stricter-rule cards |
| PPPA & Pseudoephedrine (CMEA) | `pppa` (packaging) + CMEA kept in `rems-cmea` | CMEA **once** under restricted programs (not duplicated under PPPA) |
| HIPAA — Tech Specifics | `hipaa` | Includes counseling offer; penalty flag inline |
| New carve-outs | `cs-records` | Transfers / inventory / C-II partial clocks pulled into one topic |

### Duplicate / near-duplicate clusters found on **live main** (why v2 merges)

Confirmed by scan of committed `notes.json` (not exhaustive clinical review):

| Cluster | Where it showed up on main | v2 handling |
|---|---|---|
| Lipitor = atorvastatin ×2 | Brand/Generic (exact dup) | Single brand↔generic row |
| Rapid insulin ×2 | Insulin Types | One matrix row |
| Sublingual / SL ×2+ | Dosage Forms (+ sig) | One dosage-forms card; SL stays in sig |
| ACE cough / pearls ×2+ | Classes + Side Effects | Matrix pearl + one side-effect row |
| DEA Forms 222 / 106 / 41 / 224 ×2 each | DEA Forms (verbose + short) | One matrix (5 rows) |
| CMEA limits ×3–4 | Laws + PPPA/CMEA + REMS/CMEA + OTC mention | One CMEA card in `rems-cmea`; OTC can keep short “behind counter” pearl |
| PPPA ×2 | PPPA section + Counseling/Omnibus | One `pppa` topic |
| C-II partial-fill clocks ×2 | Order Refills + Federal Laws | `refills` + `cs-records` / note (keep both clocks; don’t triple) |
| Recall Class I/II/III ×2 | Safety Reporting & Recalls + Federal Recalls | **Federal `recalls` only** |
| Double-check language ×3 | High-alert + Error Prevention + QI | Error-prevention + high-alert note |
| USP `<795>/<797>/<800>` ×2 | USP section + Infection Control | `usp` matrix once |
| Garbing ×2 | USP + Infection Control | Optional archive under `usp` |
| Alligation ×3 | Core + Essential calcs | `calculations` archive only |
| Orange Book / NPI under Recalls | Federal Recalls | Moved to `laws` cards |
| CSA 1970 ×2 | Key Laws + Counseling/Omnibus | One timeline row |

### Review flags (signed off in #42; insulin curve still verify)

Inline `flags` already in the local v2 JSON (4). The insulin curve and the Levemir question are not `flags` keys. Resolved wording is in committed course and notes. v2 JSON stays uncommitted.

| # | Location (v2) | Candidate issue | Proposed direction | Status |
|---|---|---|---|---|
| 1 | `med` / `side-effects` row “Amiodarone / pioglitazone” | Row names amiodarone but body is only pioglitazone (HF / bladder cancer) | Split rows or drop amiodarone from the label after source check | Resolved F-001 |
| 2 | `med` / `cns-classes` SSRI stem `` `-oxetine` / `-sertraline` `` | Duloxetine (SNRI) also ends in `-oxetine`; sertraline is not a class stem | Reword stems (e.g. teach examples, not fake stems) after source check | Resolved F-003 (course F-002) |
| 3 | `med` / `storage` “Live attenuated (MMR, Varicella) / FROZEN” | M-M-R II may be refrigerated **or** frozen; varicella must be frozen | Split MMR vs varicella storage lines after CDC/product check | Resolved F-004, F-005 |
| 4 | `fed` / `hipaa` civil penalties `$100–$50,000/violation` | Amounts are inflation-adjusted | Confirm current HHS/OCR figures before teaching numbers | Resolved F-006 |
| 5 | `med` / `insulin` | Full peak/duration curve needs complete values; v2 uses partial “Onset / profile” only | Chart only Rob-approved numbers; keep partial table or omit curve | Open — verify F-011, F-012 |
| 6 | `med` / insulin detemir (Levemir) | Whether Levemir (detemir) is still US-marketed | Confirm before teaching it as a current product. Do not change the wording until Rob signs off | Resolved F-007 |

**Rule:** insulin onset/peak/duration curve stays verify (F-011, F-012). Do not commit v2 `notes.json` until the blocks runtime ships. See [AGENTS.md](AGENTS.md).

---

## Runtime gate (why JSON stays local)

- Codex v2 `js/notes.js` still: `sec.items`, `detectLayoutType()` from **titles**, no `blocks` renderer.
- v2 JSON needs: hash router + layout renderers + mark parser (`!!` / `^^` / `` `code` ``), as in Target architecture below.
- Therefore: **docs + local WIP ready; commit of v2 JSON waits for the build PR.**

---

## Target architecture

Do not build this until the content audits in [TODO.md](TODO.md) **Next up** are signed off. Palette is Matrix-cohesive ([UI_STANDARDS.md](UI_STANDARDS.md)); slate is retired. Non-green accents are OK for dense prose. Trim redundant search and nav. Space-saving visual aids (charts, lists, tables; Conversions first) are part of the Notes theme overhaul in **Next up**. Google AI art is deferred, see the end of TODO.md. Fact-check and audit output follow [AUDIT_RUBRIC.md](AUDIT_RUBRIC.md). Do not restate it here.

### Page frame (desktop ≥ 900px)

```
┌──────────────── existing 3-zone header (unchanged) ─────────────────┐
├─ RAIL (≈280px) ─┬──────────────── STAGE ───────────────────────────┤
│ [MED  35% ▮▮▮▮] │ TOPIC STRIP: ‹  Insulin Types · 3/10 · pg 1/2  › │
│ [SAFE 23.75%  ] │ ┌──────────────────────────────────────────────┐ │
│ [ORDER 22.5%  ] │ │ content: tables, pair grids, cards, charts    │ │
│ [FED  18.75%  ] │ │ fit to stage height; extra goes to page 2      │ │
│ ── topics ──    │ └──────────────────────────────────────────────┘ │
│ ⌕ search (rail footer)                                             │
└─────────────────┴──────────────────────────────────────────────────┘
```

- **Rail:** four domain chips as chamfered pods with weight bars, then the active domain's topic list. Search sits in the rail footer.
- **Domain landing:** `#med` with no topic shows topic tiles (title, item count, layout glyph). This replaces the summary paragraph and the accordions.
- **Topic page:** one topic strip (prev/next, page dots, counter) replaces both nav bars and the old "x of y" header.
- **Hash routing** (`notes.html#fed/dea-forms/2`): deep links and the browser Back button work. One HTML file, no build step.
- **Mobile (< 900px):** the rail becomes a sticky domain tab row plus a topic `<select>`. Normal scrolling is allowed there.
- **Fit paginator:** pack rows into pages no taller than the stage. Re-pack on `ResizeObserver`. Never split a row. Most topics fit one screen at 1440×900; paging is the fallback at 1366×768 or on a very long topic.

### Schema-driven layouts

Each section declares its layout and stores structured rows. The renderer does not guess from the title. Parenthesis-safe parsing stays ([UI_STANDARDS.md](UI_STANDARDS.md) rule 6).

| Layout | Use | Look |
|---|---|---|
| `pairs` | Brand↔Generic, Sig codes, Conversions, ISMP Avoid→Use, Aux labels | Dense 3–4 column `key → value` grid. Keys in mono green, values in ice. |
| `matrix` | Classes and stems, Insulin, Schedules, DEA Forms, Recall classes, USP chapters | Real multi-column tables. |
| `cards` | Laws, REMS, DSCSA, Immunization, Dosage forms | 2–3 column chamfered pods. |
| `formula` | Calculations | Formula in mono, a one-line meaning, a worked example. |
| `timeline` | Federal laws, C-II partial-fill clocks, DUR | Horizontal SVG or CSS track. |
| `figure` | NDC, DEA check-digit, MERP ladder, storage temps, PPE sequence | Inline SVG built in code. Decorative images are deferred. |

Inline marks: `!!do NOT crush!!` → amber warning, `^^CI^^` → pink contraindication, `` `-pril` `` → green stem chip.

### Token table

Shared `css/matrix.css`, built from Home's `--hx-*` tokens. Slate is not the end state.

| Role | Token | Value | Use |
|---|---|---|---|
| Background | `--mx-void` | `#010804` | Page (same as Home) |
| Surface 1/2/3 | `--mx-fill-1..3` | `#04130a` / `#072014` / `#0b2c1b` | Stage, panels, table header |
| Edge | `--mx-edge` | Home's green→cyan gradient | Chamfered panel borders |
| Body text | `--mx-ice` | `#e6fff0` | Reading text |
| Secondary text | `--mx-dim` | `#9cc9a9` | Meta, column heads |
| Keys / stems | `--mx-green` | `#00ff41` | Terms, stems, active state |
| Headings | `--mx-mint` | `#b6ffc9` | Topic titles |
| Values / numbers | `--mx-cyan` | `#05d9e8` | Doses, codes, ratios |
| Warning | `--mx-amber` | `#ffb000` | "do NOT", black box, deadlines |
| Danger | `--mx-pink` | `#ff2a6d` | Contraindications, fatal errors |

Type: Chakra Petch for headings and keys, JetBrains Mono for codes and numbers, proportional sans at 15–16px for body. Rain stays on and dims behind the stage.

### Build steps

Do not start until the content audits in [TODO.md](TODO.md) **Next up** are signed off. When this ships, bump the service worker cache to the next version and update the docs this work changed.

| # | Step | Files |
|---|---|---|
| 0 | Branch from `main`. Baseline screenshots at 1440×900, 1366×768, 1920×1080, and 390×844. | — |
| 1 | Extract `--hx-*`, chamfer, and edge primitives into `css/matrix.css`. Point `home.css` at it with no visual change. | `css/matrix.css`, `css/home.css`, `index.html` |
| 2 | Migrate `notes.json` to the schema. Dedupe and re-home per the merge map above. Apply only flags Rob has signed off. Extend `validate.js` with layout enum, column/row arity, unique ids, and a duplicate-text check. | `data/notes.json`, `validate.js` |
| 3 | Rewrite the `notes.html` main area as a rail + stage grid. Header unchanged. Search moves to the rail footer. | `notes.html` |
| 4 | Hash router and state, layout renderers, fit paginator, keyboard nav, search overlay, inline-mark parser. | `js/notes.js` |
| 5 | In-code SVG for NDC, DEA check digit, MERP ladder, storage temps, PPE sequence, partial-fill clocks, DUR, and the laws timeline. Text stays real text. | `js/notes.js` (or `js/notes-figures.js`) |
| 6 | Rewrite `notes.css` on `matrix.css` tokens. Breakpoint at 900px. Slate tokens go away. | `css/notes.css` |
| 8 | Verify: no phantom scroll at 1366×768 and 1920×1080; every topic reachable by rail, keys, and deep link; search hits jump; Back works; `node validate.js`. | — |

Google AI art (emblems, waste bins, dosage-form specimens) is not a step. Deferred, see the end of TODO.md.

---

## Handoff

Next work is [TODO.md](TODO.md) **Next up**, in that order. Do not restate it here. Standing rules are in [AGENTS.md](AGENTS.md).

---

## Done when

- [x] Rob decisions locked
- [x] v4 plan + content audit (merge map, dups, flags)
- [x] #28 on main (Codex v2 baseline + plans)
- [x] Google AI art demoted to future; space-saving visual-aid clarify recorded (2026-10-07)
- [x] Target architecture (rail, token table, build steps) lives in this file
- [ ] [TODO.md](TODO.md) **Next up** is done through the Notes theme overhaul
- [ ] v2 `notes.json` committed only with the blocks runtime, in that overhaul PR
- [ ] Google AI art remains future (not a start step)
