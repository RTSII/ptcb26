# Audit rubric

For models. Read before a content audit or a fact fix. Do not restate this file in the audit output.

## Purpose

Study material must be 100% factual, current for PTCE 2026, and complete against the official outline effective January 6, 2026: [PTCE Content Outline (PDF)](https://www.ptcb.org/wp-content/uploads/2025/07/PTCE-Content-Outline.pdf).

Map findings and coverage lines to these knowledge areas. `*` means some or all of the area is calculation-based.

- D1 Medications 35%: 1.1 names/classes · 1.2 therapeutic duplications · 1.3 interactions/contraindications · 1.4* dose, form, route, handling, duration · 1.5 adverse effects/allergies · 1.6 indications · 1.7* stability · 1.8 storage
- D2 Federal Requirements 18.75%: 2.1 hazardous and non-hazardous waste · 2.2* controlled-substance prescriptions and schedules · 2.3 controlled-substance handling, loss, destruction, take-back · 2.4* restricted programs and REMS · 2.5 recalls · 2.6 DSCSA
- D3 Patient Safety and Quality Assurance 23.75%: 3.1 high-alert and LASA · 3.2 error prevention · 3.3* pharmacist intervention · 3.4 event reporting · 3.5* prescription-error types · 3.6 infection control and cleaning
- D4 Order Entry and Processing 22.50%: 4.1* calculations, sig, abbreviations · 4.2* administration supplies · 4.3* lot, expiration, NDC · 4.4 returns and reverse distribution

Keep the four domain strings in `README.md`. Do not invent short aliases in the data.

## Scope

- Course: `data/course.json` (module id + lesson id).
- Notes: committed `data/notes.json` (`domains[].sections[]`). Do not edit or commit the local v2 `blocks` file.
- Quiz (`data/questions.json`) and flashcards (`data/flashcards.json`) are a later audit. Out of scope unless the task names them.
- One domain, or about 3–4 lessons, per pass. Stable ID prefix per batch so chats do not collide: `C-D1-001`, `N-D2-001` (C or N, domain, sequence).

## What to check

- Facts: drug names, classes, stems, indications, dosing and storage, schedules, federal law, USP chapters, calculations.
- Currency: 2026 rules; discontinued products.
- Completeness: every knowledge area above, at technician depth.
- Duplicates and contradictions inside a file, and between Course and Notes.
- Gaps.
- Scope creep: non-tested material (alligation, NTI list, sterile garbing, USP `<795>` technique) stays optional. Flag it. Do not delete it.
- Consistency: terms, units, abbreviations.
- After the Course audit is signed off, the Notes audit must flag any Notes claim that contradicts that Course text (`CONSIST`).

## Sources

One source per finding. No source = unverified: set `FIX` to `verify` and do not invent a replacement.

Accept: FDA or DailyMed labels, DEA, CFR/eCFR, USP, CDC, HHS/OCR (HIPAA), ISMP, PTCB (the outline above).

## Rules

Standing rules are in `AGENTS.md`: no silent fact edits; sourced facts only; Rob signs off; do not commit v2 `notes.json` until the blocks runtime ships. Do not restyle UI during content work.

`CONF` L = verify-only. Do not apply that fix without Rob.

`RX` = the fix changes a drug fact, a law, or a number. List every RX finding at the top of the PR description for Rob to sign off.

## Output

No prose. No rubric restatement. Header, then findings, then coverage, then one count line.

Header (one line): `AUDIT|type|batch|commit SHA audited|YYYY-MM-DD`

The fixer stops if `HEAD` is not that SHA.

Finding (one line):

`ID|SEV(H/M/L)|CONF(H/M/L)|TYPE(FACT/GAP/DUP/CURRENCY/SCOPE/CONSIST)|RX(Y/N)|FILE:locator|CURRENT(short quote)|FIX(exact replacement or action)|SOURCE(url)`

Coverage (one line per knowledge area in the batch's domain):

`KA#|covered Y/N/partial|where|missing`

Count (one line): `COUNT|findings N|H n|M n|L n|RX n|open-H n`

Example:

```
AUDIT|course|C-D1|6dd6c07|2026-10-09
C-D1-001|H|L|FACT|Y|data/course.json:m1l5|SSRIs (-oxetine/-sertraline/-talopram)|verify; do not teach those strings as class stems|https://dailymed.nlm.nih.gov/dailymed/
1.1|partial|m1l1,m1l5|stem list unverified
COUNT|findings 1|H 1|M 0|L 0|RX 1|open-H 1
```

## Done when

- Every outline knowledge area in the batch is `covered Y`.
- Zero open H findings.
- Every applied FIX has a SOURCE url.
- Rob has signed off (RX list first in the PR).

## Fixer

1. Read `AGENTS.md`, `TODO.md` **Next up**, and this file. Confirm `HEAD` matches the header SHA.
2. Apply one batch in one PR. Skip `CONF` L, and any row whose `FIX` is `verify`, until Rob says apply.
3. PR description: RX findings first, then each ID as `done` or `skipped` with a reason.
4. Run **Verify before PR** in `AGENTS.md`.
5. Stop for Rob's sign-off. Do not merge.
