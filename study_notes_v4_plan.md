# Study Notes v4: Terminal Codex Plan (ready handoff)

**Status:** Next work is content review, not the theme overhaul. Order is `TODO.md` → **Next up**: (1) Study Course content review, (2) Study Notes content review (includes the five fact flags), (3) Study Notes theme overhaul only after Rob signs off 1 and 2. The plan-review-chat-then-stop gate is superseded. Do **not** commit the local v2 `notes.json` until the blocks runtime ships with it in that overhaul PR. Google AI art stays future (end of the Notes backlog).  
**Repo:** `Desktop\PTCB26` · tip on `main` after #28  
**Supersedes:** `study_notes_v3_plan.md` (keep for architecture detail)  
**Out of scope for now:** Course and Exam Matrix adoption (later). Google AI emblems / dosage-form art (future).  

---

## Decisions locked (Rob, 2026-10-06)

| # | Topic | Decision |
|---|---|---|
| 1 | Palette / theme | **Replace locked slate** as the Notes end-state. Priority: cohesive Matrix theme/UI. Non-green accents OK for dense reading contrast. |
| 2 | Search / nav | **Trim redundant** search / filter / nav. |
| 3 | Content shape | **Merge duplicate and misfiled notes** at content time (map below). |
| 4 | Fact flags | Document candidates for **future review/test**. No silent fact changes. |
| 5 | Workflow | **Next step:** `TODO.md` **Next up** — Course content review, then Notes content review, then the Notes theme overhaul only after Rob signs off both. The plan-review-chat-then-stop gate is superseded. Cloud agents + PRs; no merge without Rob's explicit approval. |
| 6 | Scope | Notes theme overhaul stays **Notes-only**. Course **content** review is first (no UI). Course / Exam Matrix tokens stay later. |

---

## Clarify / locked (Rob, 2026-10-07) — visual aids, not decorative art

Rob lost faith in the Claude/Devin visual-aid analysis. That plan leaned on decorative Google AI emblems and dosage-form specimens and never chose real aids that break up repeated text formatting and save viewport space.

| Topic | Decision |
|---|---|
| Google AI image briefs | **Deferred** → clarify / future TODO. Emblem, waste-bin, and dosage-form specimen prompts (v3 §4) are **not** required to start the overhaul. The desktop Word doc that holds those prompts is **reference-only** until this clarify is resolved. Do not generate or wire `assets/notes` art as a start step. |
| Prior optional art (v3 §4) | **Not trusted** as the visual-aid strategy. Do not treat those briefs as the plan for breaking up repeated prose. |
| Fresh visual-aid pass | Part of the Notes theme overhaul (`TODO.md` **Next up** #3), after Course and Notes content sign-off — not a docs-only plan-review chat before that. Look for aids that actually break up repeated prose and save viewport space. Prefer in-code charts, lists, tables, and compact layouts over decorative PNGs. Example Rob named: the **Conversions** topic → a dense conversion chart / list (or SVG), not more text rows. Rob will point at more sections when he can; Claude started editing, so he could not screenshot the intended sections. Decorative Google AI art stays **future** — revive only after this strategy is locked. |

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

### Review flags (5 candidates — unverified)

Inline `flags` already in the local v2 JSON (4). Fifth is structural (insulin curve), not a `flags` key:

| # | Location (v2) | Candidate issue | Proposed direction (**not approved**) | Status |
|---|---|---|---|---|
| 1 | `med` / `side-effects` row “Amiodarone / pioglitazone” | Row names amiodarone but body is only pioglitazone (HF / bladder cancer) | Split rows or drop amiodarone from the label after source check | Pending review/test |
| 2 | `med` / `cns-classes` SSRI stem `` `-oxetine` / `-sertraline` `` | Duloxetine (SNRI) also ends in `-oxetine`; sertraline is not a class stem | Reword stems (e.g. teach examples, not fake stems) after source check | Pending — flagged in JSON |
| 3 | `med` / `storage` “Live attenuated (MMR, Varicella) / FROZEN” | M-M-R II may be refrigerated **or** frozen; varicella must be frozen | Split MMR vs varicella storage lines after CDC/product check | Pending — flagged in JSON |
| 4 | `fed` / `hipaa` civil penalties `$100–$50,000/violation` | Amounts are inflation-adjusted | Confirm current HHS/OCR figures before teaching numbers | Pending — flagged in JSON |
| 5 | `med` / `insulin` | Full peak/duration curve needs complete values; v2 uses partial “Onset / profile” only | Chart only Rob-approved numbers; keep partial table or omit curve | Pending — no curve figure in WIP |

**Rule:** leave flagged wording as-is until Rob OK. Implementation must not “fix” facts quietly.

---

## Runtime gate (why JSON stays local)

- Codex v2 `js/notes.js` still: `sec.items`, `detectLayoutType()` from **titles**, no `blocks` renderer.
- v2 JSON needs: hash router + layout renderers + mark parser (`!!` / `^^` / `` `code` ``) per earlier architecture.
- Therefore: **docs + local WIP ready; commit of v2 JSON waits for the build PR.**

---

## Target UI / architecture

Unchanged intent from v3 §2 (rail + stage, fit paginator, shared `matrix.css`, schema-driven layouts). Palette: Matrix-cohesive; non-green accents OK for dense prose. Trim redundant search/nav.

Execution sequence still v3 §3 (shared `matrix.css` → content schema → shell → runtime → in-code figures → styles → verify → docs) — **do not run until Rob signs off Study Course and Study Notes content reviews** (`TODO.md` **Next up** #1–#2). Skip v3 §3 step 7 (optional Google AI art / `assets/notes`). That step stays **future**, not part of planning or the start gate.

Space-saving visual aids (charts/lists/tables; Conversions first) are part of the theme overhaul (**Next up** #3), after those content sign-offs. Google AI image briefs (v3 §4) stay at the end / future. Do not burn cycles on emblems, waste bins, or dosage-form specimen prompts. Revive decorative art only after the space-saving strategy is locked.

---

## Handoff

```text
PTCB26 — next work follows TODO.md "Next up (in order)". The plan-review-chat-then-STOP gate is superseded.

1. Study Course content review — content only. Audit against the Jan 2026 PTCE outline (Medications 35%, Patient Safety 23.75%, Order Entry 22.50%, Federal 18.75%). Facts correct and current; nothing on-exam missing, incomplete, duplicated, or outdated/off-exam. Audit list with sources. Rob signs off (factual + complete) before any edits. No UI/theme changes.
2. Study Notes content review — same audit (duplicate, incomplete, missing, incorrect; gaps covered/fixed). Includes the five fact flags in study_notes_v4_plan.md plus whether Levemir (detemir) is still US-marketed. Known dup: Insulin Types repeats rapid-acting, long-acting, and storage lines. Rob signs off before edits.
3. Study Notes theme overhaul (Terminal Codex / Matrix per UI_STANDARDS.md and study_notes_v4_plan.md) only after 1 and 2 are signed off. One PR: blocks runtime + v2 notes.json together. Keep v2 notes.json outside data/ until that PR.

Rules: review, then sign-off, then edits. One domain per PR where practical. No silent clinical fact edits. No merge without Rob's explicit approval.
```

---

## Done when

- [x] Rob decisions locked
- [x] v4 plan + content audit (merge map, dups, flags)
- [x] #28 on main (Codex v2 baseline + plans)
- [x] Google AI art demoted to future; space-saving visual-aid clarify recorded (2026-10-07)
- [ ] Study Course content review + Rob sign-off before edits (`TODO.md` **Next up** #1)
- [ ] Study Notes content review + Rob sign-off before edits, including the five flags (`TODO.md` **Next up** #2)
- [ ] Theme overhaul only after those content sign-offs (`TODO.md` **Next up** #3)
- [ ] v2 `notes.json` committed only with the blocks runtime, in that overhaul PR
- [ ] Google AI art remains future (not a start step)
