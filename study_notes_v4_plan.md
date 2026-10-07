# Study Notes v4: Terminal Codex Plan (ready handoff)

**Status:** Plan only. Do **not** start the overhaul in a new chat until Rob says go.  
**Repo:** `Desktop\PTCB26` · branch track `feature/notes-v3` → merge to `main`  
**Supersedes:** `study_notes_v3_plan.md` (keep as history; this file is the working plan)  
**Out of scope for now:** Course and Exam Matrix adoption (later pass).  
**Do not commit:** local WIP `data/notes.json` edits (early content work Rob did not want started yet).

---

## Decisions locked (Rob, 2026-10-06)

| # | Topic | Decision |
|---|---|---|
| 1 | Palette / theme | **Replace locked slate** as the Notes target. Slate was never the goal — it was offered only as a non-green option for dense reading. Priority: **cohesive Matrix theme/style/UI**, well crafted, intuitive. Non-green accents remain OK where they help contrast on word-heavy cards/sections. |
| 2 | Search / nav chrome | **Trim redundant** search / filter / nav. One clear path beats stacked duplicates. |
| 3 | Content shape | **Merge duplicate and misfiled notes** when implementation starts (topic map in §2.4 of v3 still the draft map). |
| 4 | Content accuracy flags | Document the five candidate factual issues below for **future review/test**. Do **not** treat solutions as approved. No silent fact changes. |
| 5 | Workflow | New chat / cloud-agent handoff uses this plan. **Refine and document only** until Rob explicitly starts implementation. Code still goes through Cursor cloud agents + PRs; no merge without Rob OK. |
| 6 | Scope | **Notes only** for this overhaul. Course / Exam adopt shared `matrix.css` tokens later. |

---

## What already landed on `feature/notes-v3` (baseline, not "start overhaul")

These commits are the Codex v2 / HUD baseline already on the branch (and intended to merge with this plan). They are **not** the v4 Terminal Codex build:

- Homepage Matrix operator HUD / rain craft work
- Study Notes Codex v2 shell (layouts, slate palette as interim, `splitOutsideParens`, SW `ptce-2026-v43`)
- Docs updates tied to that baseline
- `study_notes_v3_plan.md` (historical)

**Still local-only (leave alone):** uncommitted `data/notes.json` rewrite.

---

## Target (unchanged intent from v3, palette decision updated)

### Goals

1. Less chrome, denser structured data, screen-fit paging.
2. Shared design tokens with Home (`css/matrix.css`) — Matrix-primary cohesive UI.
3. Schema-driven `notes.json` (explicit `layout` + structured rows) so renderers stop guessing from titles.
4. Hash routing, keyboard paging, one rail + stage frame on desktop ≥900px.

### Architecture sketch

See mermaid + rail/stage ASCII in `study_notes_v3_plan.md` §2 — still valid. Palette tokens in v3 §2.5 ("phosphor on obsidian-green") are the **default Notes direction**, with permission to use cooler/neutral accents inside dense reading surfaces when Matrix green would hurt legibility.

### Rubric updates this plan authorizes (docs only until build)

- **Rubric #5:** Drop "locked slate for Notes" as the end state. Notes should share Matrix tokens with Home; use non-green accents for dense prose contrast when needed.
- **Rubric #8:** Keep search reachable without hunting, but **dedupe** — rail footer or a single bottom control is enough; remove duplicate nav/filter bars.

### Execution steps (do not run until Rob starts the overhaul)

Same sequence as v3 §3 (shared `matrix.css` → content schema → shell → runtime → figures → styles → optional art → verify → docs/SW bump). Bump SW when implementation ships (target name TBD at build time; do not invent a bump in this docs-only pass beyond what already shipped on the branch).

Optional Google AI art briefs remain in v3 §4 (text-free assets only; charts in code).

---

## Candidate content flags (review / test later — not approved fixes)

These came from the v3 audit. **Status: unverified.** Capture here so a future pass can confirm against current PTCE 2026 sources, then propose fixes for Rob OK.

| # | Area | Candidate issue | Notes for future review |
|---|---|---|---|
| 1 | Med › Side Effects | `"Amiodarone/pioglitazone…"` may be mislabeled; amiodarone content may be missing | Confirm label vs body; split or rewrite only after source check |
| 2 | Med › Resp/Psych | SSRI stems `(-oxetine/-sertraline)` look wrong (duloxetine is SNRI; sertraline is not a stem) | Recheck stem teaching vs exam-safe wording |
| 3 | Vaccine storage | "MMR … FROZEN" may oversimplify (M-M-R II fridge or frozen; varicella frozen) | Confirm against current CDC/product storage |
| 4 | HIPAA penalties | `$100–$50,000/violation` may be outdated (inflation-adjusted amounts) | Confirm current HHS/OCR ranges before teaching numbers |
| 5 | Insulin curve | Peak/duration incomplete for a full curve chart | Only chart values Rob approves; partial data → partial figure or omit |

**Also planned at content time (not fact changes):** dedupe ~25 near-duplicates and re-home misfiled items (NPI/Orange Book, PPE, vaccine temps, etc.) per v3 §2.4 topic map — still requires Rob OK on the merge list when implementation starts.

---

## Handoff prompt (paste into a new chat when Rob is ready)

```text
PTCB26 Study Notes — Terminal Codex (v4 plan).

Read study_notes_v4_plan.md end-to-end. Historical detail: study_notes_v3_plan.md.

LOCKED:
- Matrix-cohesive Notes UI (replace slate-as-end-state). Non-green accents OK for dense reading contrast.
- Trim redundant search/filter/nav.
- Notes-only scope. Course/Exam later.
- Do NOT change clinical facts without Rob OK. Five candidate flags are listed in the v4 plan for future review/test only.
- Do NOT commit or continue the local uncommitted data/notes.json WIP unless Rob explicitly asks.
- Code via Cursor cloud agents + draft PRs. No merge without Rob explicit OK.
- Standing UI seed: Back L / center CTA / Next R; content-hug Chrome; center titles/icons; Matrix primary.

STOP CONDITION for planning chats: refine docs only. Do not begin the overhaul until Rob says start.

When Rob says start: implement per v4 execution sequence; open draft PR; ping North for Chrome verify.
```

---

## Done when (this docs pass)

- [x] Rob answered palette / dedupe / workflow / scope
- [x] v4 plan written with handoff block
- [ ] Merged to `main` with Codex v2 baseline + plans (excluding uncommitted `notes.json`)
- [ ] Desktop on `main` pulled; local `notes.json` WIP still uncommitted
