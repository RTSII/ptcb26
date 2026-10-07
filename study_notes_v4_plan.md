# Study Notes v4: Terminal Codex Plan (ready handoff)

**Status:** Plan + content audit only. Do **not** start the overhaul / do **not** commit the local v2 `notes.json` until Rob says go and the Notes runtime can read `blocks`.  
**Repo:** `Desktop\PTCB26` · tip on `main` after #28  
**Supersedes:** `study_notes_v3_plan.md` (keep for architecture detail)  
**Out of scope for now:** Course and Exam Matrix adoption (later).  

---

## Decisions locked (Rob, 2026-10-06)

| # | Topic | Decision |
|---|---|---|
| 1 | Palette / theme | **Replace locked slate** as the Notes end-state. Priority: cohesive Matrix theme/UI. Non-green accents OK for dense reading contrast. |
| 2 | Search / nav | **Trim redundant** search / filter / nav. |
| 3 | Content shape | **Merge duplicate and misfiled notes** at content time (map below). |
| 4 | Fact flags | Document candidates for **future review/test**. No silent fact changes. |
| 5 | Workflow | New chat uses handoff below. Refine/document until Rob says start. Cloud agents + PRs; Rob OK to merge. |
| 6 | Scope | **Notes only.** Course / Exam later. |

---

## Clarify / locked (Rob, 2026-10-07) — visual aids, not decorative art

Rob lost faith in the Claude/Devin visual-aid analysis. That plan leaned on decorative Google AI emblems and dosage-form specimens and never chose real aids that break up repeated text formatting and save viewport space.

| Topic | Decision |
|---|---|
| Google AI image briefs | **Deferred** → clarify / future TODO. Emblem, waste-bin, and dosage-form specimen prompts (v3 §4) are **not** required to start the overhaul. The desktop Word doc that holds those prompts is **reference-only** until this clarify is resolved. Do not generate or wire `assets/notes` art as a start step. |
| Prior optional art (v3 §4) | **Not trusted** as the visual-aid strategy. Do not treat those briefs as the plan for breaking up repeated prose. |
| Fresh visual-aid pass | **Clarify before the overhaul, or early in it.** Look for aids that actually break up repeated prose and save viewport space. Prefer in-code charts, lists, tables, and compact layouts over decorative PNGs. Example Rob named: the **Conversions** topic → a dense conversion chart / list (or SVG), not more text rows. Rob will point at more sections when he can; Claude started editing, so he could not screenshot the intended sections. |

---

## Content audit (2026-10-07) — paste vs live

### What each file is

| File | Schema | Role |
|---|---|---|
| `data/notes.json` on **main** (committed) | Legacy: `domains[].sections[].title` + **`items[]` strings** | What `js/notes.js` (Codex v2) actually renders today. **44 sections / ~324 items.** |
| Local **uncommitted** `data/notes.json` (= Rob’s paste) | **version 2**: `marks` + `domains[].sections[].blocks[]` (`matrix` / `pairs` / `cards` / `formula` / `timeline` / `figure` / `chips` / `note` / `archive`) | Terminal Codex content draft. **41 sections.** Embeds 4 inline `flags`. |

**Recommendation (docs-only now):** keep the v2 JSON as **local WIP only**. Do **not** merge it onto main yet — current `notes.js` counts `.items` and has **zero** `.blocks` support; swapping files would break Study Notes until the runtime rewrite ships.

When implementation starts: ship runtime + v2 JSON together (or feature-flag), after Rob OK on flags/dedupe.

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

Execution sequence still v3 §3 (shared `matrix.css` → content schema → shell → runtime → in-code figures → styles → verify → docs) — **do not run until Rob starts the overhaul.** Skip v3 §3 step 7 (optional Google AI art / `assets/notes`). That step is **deferred / clarify**, not “do when starting.”

Visual-aid strategy = **clarify / future** (2026-10-07 section above). v3 §4 Google AI image briefs are reference history only. Do not burn cycles on emblems, waste bins, or dosage-form specimen prompts until Rob clarifies.

---

## Handoff prompt (paste into a new chat when Rob is ready)

```text
PTCB26 Study Notes — Terminal Codex (v4 plan).

Read study_notes_v4_plan.md end-to-end (includes 2026-10-07 content audit and visual-aid clarify). History: study_notes_v3_plan.md.

LOCKED:
- Matrix-cohesive Notes UI (retire slate-as-end-state). Non-green accents OK for dense reading.
- Trim redundant search/filter/nav.
- Notes-only. Course/Exam later.
- Live main notes.json = legacy items[]. Local uncommitted notes.json = version 2 blocks schema (deduped draft). Do NOT commit v2 JSON until runtime supports blocks — ship together.
- Five candidate fact flags in v4 plan: review/test later; no silent clinical edits.
- Code via Cursor cloud agents + draft PRs. No merge without Rob OK.
- UI seed: Back L / center CTA / Next R; content-hug Chrome; center titles/icons; Matrix primary.
- Visual-aid strategy = clarify / future. Do not burn cycles on Google AI emblems, waste-bin art, or dosage-form specimen prompts until Rob clarifies. v3 §4 optional art is not trusted as the strategy. Desktop Word prompt doc is reference-only. Prefer in-code charts/lists/tables/compact layouts that break up repeated prose and save space (example: Conversions → dense chart/list or SVG).

STOP for planning chats: docs only. Do not begin overhaul until Rob says start.

When Rob says start: implement matrix.css → runtime blocks renderers → then commit v2 notes.json (after flag decisions). Do not generate or wire assets/notes Google AI art as part of start. Draft PR; North Chrome verify.
```

---

## Done when

- [x] Rob decisions locked
- [x] v4 plan + content audit (merge map, dups, flags)
- [x] #28 on main (Codex v2 baseline + plans)
- [ ] Overhaul start (Rob explicit)
- [ ] v2 `notes.json` committed only with runtime that reads `blocks`
