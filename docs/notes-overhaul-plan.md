# Study Notes topic-body overhaul: macro plan

**Status:** planning only. Nothing in this document is built. Execution is one stage and one PR at a time, each ending at a checkpoint Rob reviews.
**Baseline:** `main` @ `87e1f88`, service worker cache `ptce-2026-v82`.
**Content status:** `data/notes.json` is audited and signed off. No fact is added, removed, or reworded by any stage.

---

## 0. Scope, naming, and how the numbers were obtained

### 0.1 What this plan changes (and what it does not)

This plan is for the **expanded individual Study Notes page**: one domain open, one topic showing. The thing being redesigned is the **topic body**, the area inside the parent topic card that sometimes shows a vertical scrollbar.

| Name used in this plan | What it is on screen | CSS / JS anchor | In scope? |
|---|---|---|---|
| Notes page | `notes.html` | `body.notes` | context |
| Domain accordion list (idle) | The four closed domain cards | `.nx-domain-card.nx-domain-closed` | **No** |
| Domain pills | `D1 35%` ... `D4 18.75%` row | `.nx-domain-switch`, `.nx-domain-chip` | **No** (nav fix only syncs them) |
| Domain header | `DOMAIN 1 · 35% · Medications · 12 Clinical Topics ▲` | `.nx-domain-header` | **No** |
| Topic card | The parent card holding the dropdown, the body, and the bottom bar | `.nx-topic-card` | Shell stays; only the body inside changes |
| Topic bar | `‹  [topic dropdown]  ›` | `.nx-topic-card-top`, `.nx-topic-nav-top` | **No** |
| **Topic body** | The table, cards, or tiles that fill the middle and sometimes scroll | `.nx-topic-content` | **YES. This is the whole target.** |
| Bottom bar | `‹  27 Points  ›` | `.nx-topic-nav-bottom` | Only the prev/next behavior (section 6) |

Course (`course.html`) loads `css/notes.css` and reuses `.nx-domain-card` (`-open` / `-closed`), `.nx-domain-header` (and `-left` / `-right`), `.nx-domain-name`, `.nx-domain-pill`, `.nx-weight-badge`, `.nx-topic-count-badge`, `.nx-chevron-icon`, `.nx-domain-body`, `.nx-domain-switch`, and `.nx-domain-chip` (`js/course.js` L243-L267; overrides in `css/style.css` `body.course .nx-*` from L1343). **Those classes are frozen.** All new body styling goes in a new namespace (`.nb-*`) in a new file that only `notes.html` loads.

### 0.2 Vocabulary used below (re-labeling list)

| Term | Meaning |
|---|---|
| Topic ID `T{d}.{n}` | App domain `d` (D1 Medications, D2 Patient Safety, D3 Order Entry, D4 Federal) and topic number `n` in dropdown order. Example: `T4.4` = Federal "Key Federal Laws". |
| KA | Official PTCE outline knowledge area. **The outline numbers domains differently from the app**: outline 1 = Medications, 2 = Federal, 3 = Patient Safety, 4 = Order Entry ([AUDIT_RUBRIC.md](AUDIT_RUBRIC.md)). So app D2 (Patient Safety) topics carry KA 3.x, app D3 (Order Entry) carry KA 4.x, and app D4 (Federal) carry KA 2.x. |
| Item / Point | One string in a section's `items[]`. The bottom bar counts items ("27 Points"). Unchanged by this plan. |
| Unit | One layout piece: a whole item, or a sentence/clause split out of an item. Splitting is allowed; every word of every item must still render exactly once. |
| Set | One of N side-by-side tables in a multi-set table. |
| Tier | Density tier: `roomy`, `standard`, `dense` (section 5.1). |
| Spec | A per-topic entry in `js/notes-layouts.js`: pattern, grouping by item/unit index, tier, and approved structural labels. It never holds fact text. |

### 0.3 Measured canvas (headless Chrome, `main` @ `87e1f88`)

Measured by loading `notes.html`, opening every topic, and reading `.nx-topic-content` geometry. The script ran from `/tmp`; the repo is untouched.

| Quantity | 1600×770 (primary) | 1366×768 (secondary) |
|---|---|---|
| Header / pill row / domain header | 51 / 34 / 52 px | same |
| Topic bar / bottom bar | 60 / 53 px | same |
| Topic body box today (`.nx-topic-content`) | 1384 × 486 px | 1318 × 484 px |
| Body padding today | 14px top/bottom, 16px left/right | same |
| Inner canvas today | 1352 × 458 px (no scrollbar), 1342 wide with the 10px scrollbar | 1286 × 456 px |
| **Planned padding** (`--nb-body-pad`) | `10px 12px` | same |
| **Planned inner canvas** | **1360 × 466 px** | **1294 × 464 px** |
| Reading-font average glyph width | about 7.2 px at 0.9rem (system-ui in headless Linux) | same |
| Table row today (`td` padding 11px) | 46.8 px brand row, 49 px clinical row | same |

**Caveats, stated up front:**
1. These are headless Linux numbers. Rob's Chrome on Windows uses Segoe UI for `system-ui`, so every height below is an **estimate** with roughly ±8% error. Example: TODO.md says Federal "FDA Medication Recalls" scrolls slightly on Rob's screen, but headless Chrome measures it as fitting. The metrics differ, so a topic within about 8% of the limit counts as borderline.
2. The screenshots Rob attached show the Chrome bookmarks bar, so the real body may be about 30px shorter than the 770 standard (the Notes body looks about 456px tall in them, against 486px measured). Planning rule: **target at most 430px of content (92% of 466px).** That is also the inner height at a 1600×736 stress viewport. Topics estimated above 430px are flagged "tight" and get a dense-tier fallback.
3. "Text floor" in the index is a measured prototype: each topic's real text laid out as plain `label | text` rows at 0.92rem with tight 5px rows, in 1, 2, and 3 side-by-side sets (smallest result shown). It is a lower bound for any layout of that text, not a design.

### 0.4 What is wrong today (drives the whole plan)

From the screenshots and the measurements:

1. **Scroll in 12 of 40 topics at 1600×770** (8 heavy, 4 slight), up to 372px (`T1.2`), and **16 of 40 at 1366×768** (11 heavy, 5 slight). See section 1.
2. **Dead space in many short topics.** `T1.8 Vaccine Storage` is 3 cards plus 1 orphan card; `T1.9`, `T1.12`, and every Patient Safety topic leave 40-60% of the body empty.
3. **Phantom scroll** at 1600×770: `T3.5` and `T3.9` overflow by 2px, and `T4.8` by 9px (a scrollbar for no visible reason).
4. **Parser artifacts in the render** (`js/notes.js`):
   - `NOTE` badge on label-less table rows (`renderClinicalTable`).
   - Unlabeled briefing cards (`renderBriefingGrid`), for example `#02` DATA 2000 and `#03` Biennial inventory in Key Federal Laws.
   - `—` placeholders in OTC for Claritin and Zyrtec, because the shared note "(2nd-gen antihistamines)" attaches only to Allegra.
   - Token mis-splits: `gtt = drop. OD/OS/OU = right/left/both eyes` becomes one tile and the error-prone warning is glued onto `AD/AS/AU`; `1 fl oz : ≈ 30 mL` shows a stray `:` arrow; `Temperature: °C = (°F − 32) × 5/9` becomes a code of `Temperature: °C`.
   - Lowercase body starts after a label is lifted out ("created the 5-schedule system", "frozen (-50°C to -15°C)").
   - Trailing periods on short token values ("1 cup = 240 mL.").
   - The legend "ABBREVIATION / CONVERSION CODE ➔ CLINICAL TRANSLATION" also heads Conversions, where "abbreviation" is wrong.
5. **Every card is the same size** (`minmax(420px, 1fr)` briefing grid, `minmax(290px, 1fr)` token grid), regardless of content or priority.
6. **Nav:** the bottom (and top) prev/next stops at the first and last topic of a domain, and focus is lost after each click because `render()` rebuilds the DOM.
7. `.nx-empty-topic` is emitted by the JS but has no CSS.

---

## 1. Complete index

**Legend**
- **Pri** (layout priority, not a study ranking). Signals: **B** = bulk list (10 or more items); **C** = the topic's KA is calculation-based (`*` in AUDIT_RUBRIC: 1.4, 1.7, 2.2, 2.4, 3.3, 3.5, 4.1, 4.2, 4.3); **R** = the topic text states a 2021-2026 change (for example "eliminated", "removed", "retired", "discontinued", a 2026 date, COVID-19 products). Weight tiers come from the domain share. Rule: **H** = two or more signals, or any signal inside D1 (35%); **M** = one signal elsewhere, or no signal in a domain at or above 22.5%; **L** = no signal in Federal (18.75%). Priority decides which unit becomes the dominant one (hero or primary table), accent emphasis, and review order. It does not decide card size. Content does.
- **KA**: a superscript `¹` means the KA number is cited in the notes text itself; otherwise it is inferred from the AUDIT_RUBRIC KA definitions (Rob can correct).
- **Now** = current render type from `detectLayoutType`: `clin` = `renderClinicalTable`, `brief` = `renderBriefingGrid`, `brand`, `otc`, `token`.
- **Fit now** is an **estimate**, measured headless, as overflow px at 1600×770 / 1366×768. Classes: `fits` (0-2px; 1-2px is called phantom), `slight` (3-100px), `heavy` (over 100px). `fits*` means it fits but leaves large dead space.
- **Text floor** = section 0.3 caveat 3, at 1600.
- **Target** = pattern code from section 2. `VA-nn` = visual aid (section 4).

### D1 Medications (35%), 12 topics

| ID | Topic | KA | Pri (basis) | Items | Now | Fit now (1600 / 1366) | Text floor | Target |
|---|---|---|---|---:|---|---|---:|---|
| T1.1 | Top Drug Classes & Suffixes | 1.1 | H (B, D1) | 14 | clin | heavy +273 / heavy +275 | 366 | P1 2-set, standard |
| T1.2 | Mechanisms of Action by Class | 1.1 | H (B, D1) | 16 | clin | heavy +372 / heavy +374 | 299 | P1 2-set, roomy |
| T1.3 | Common Brand / Generic Pairs | 1.1 | H (B, D1) | 27 | brand | heavy +242 / heavy +244 | pair | P2 2-set × 2-col, dense |
| T1.4 | Insulin Types | 1.4 | H (C, R, D1) | 7 | brief | fits* 0 / slight +26 | 270 | P5 table + metrics, dense |
| T1.5 | Common OTC Active Ingredients | 1.1 | M (none, D1) | 7 | otc | slight +54 / slight +56 | pair | P2 3-col padded, grouped notes |
| T1.6 | Key Side Effects & Monitoring | 1.5 | H (B, D1) | 11 | clin | heavy +146 / heavy +148 | 229 | P1 2-set, roomy |
| T1.7 | Critical Interactions & Contraindications | 1.3 | H (B, D1) | 13 | brief | heavy +250 / heavy +333 | 344 | P4 cluster (arrow cards), standard |
| T1.8 | Vaccine Storage | 1.8 | H (R, D1) | 4 | brief | fits* 0 / fits* 0 | 137 | P6 lanes + **VA-01** |
| T1.9 | Known Teratogens (Pregnancy Safety) | 1.3 | M (none, D1) | 1 | brief | fits* 0 / fits* 0 | 86 | P4 chip wall + callout |
| T1.10 | Dosage Forms & Routes | 1.4 | H (C, B, D1) | 10 | brief | heavy +132 / heavy +145 | 351 | P1 2-set icon run-in + **VA-02** |
| T1.11 | Respiratory, Psych & Miscellaneous Agents | 1.6 | M (none, D1) | 9 | brief | fits 0 / heavy +141 | 290 | P4 cluster, standard |
| T1.12 | Musculoskeletal, Bone & Gout | 1.6 | M (none, D1) | 4 | brief | fits* 0 / fits* 0 | 137 | P4 2×2, roomy |

### D2 Patient Safety and Quality Assurance (23.75%), 10 topics (outline KA 3.x)

| ID | Topic | KA | Pri (basis) | Items | Now | Fit now (1600 / 1366) | Text floor | Target |
|---|---|---|---|---:|---|---|---:|---|
| T2.1 | High-Alert & LASA Drugs | 3.1 | M (none) | 3 | clin | fits* 0 / fits* 0 | 157 | P4 two cards + strip |
| T2.2 | Error Prevention Basics | 3.2 | M (none) | 7 | brief | fits* 0 / fits* 0 | 189 | P5 chain hero + 3×2 |
| T2.3 | ISMP Error-Prone Abbreviations (Avoid) | 3.2 | M (none) | 8 | brief | fits* 0 / fits* 0 | 178 | P3 avoid→write cards |
| T2.4 | Medication Error Types & DUR | 3.5¹ | M (C) | 5 | brief | fits* 0 / fits* 0 | 157 | P5 hero + chain + DUR trio |
| T2.5 | USP Chapter IDs (2026 scope) | 3.6 | M (none) | 3 | brief | fits* 0 / fits* 0 | 97 | P4 numeral cards |
| T2.6 | Quality Assurance & Reporting | 3.4 | M (none) | 4 | brief | fits* 0 / fits* 0 | 117 | P4 strip + tiles + step chains |
| T2.7 | Reporting Programs | 3.4 | M (none) | 5 | brief | fits* 0 / fits* 0 | 213 | P7 figure + text, **VA-03** |
| T2.8 | Quality Improvement Methods | 3.2 | M (none) | 5 | brief | fits* 0 / fits* 0 | 157 | P4 cluster + PDSA chain |
| T2.9 | Infection Control & Hazardous Materials | 3.6¹ | M (none) | 6 | brief | fits* 0 / fits* 0 | 218 | P4 3×2 |
| T2.10 | Immunization Workflow: VIS, VAERS & Pharmacist Hand-off | 3.3¹ | H (C, R) | 6 | brief | fits* 0 / fits* 0 | 229 | P5 hero + metrics |

### D3 Order Entry and Processing (22.50%), 10 topics (outline KA 4.x)

| ID | Topic | KA | Pri (basis) | Items | Now | Fit now (1600 / 1366) | Text floor | Target |
|---|---|---|---|---:|---|---|---:|---|
| T3.1 | Common Sig Codes | 4.1 | M (C) | 6 | token | fits 0 / fits 0 | tokens | P3 banded token grid |
| T3.2 | Key Conversions | 4.1 | M (C) | 5 | token | fits* 0 / fits* 0 | tokens | P7 three panels, **VA-04** (+ optional **VA-R1**) |
| T3.3 | Core Calculations | 4.1 | H (C, B, R) | 14 | brief | slight +86 / heavy +232 | 251 | P4 formula columns |
| T3.4 | Prescription Intake | 4.1 | M (C) | 3 | brief | fits* 0 / fits* 0 | 86 | P4 step list |
| T3.5 | Administration Supplies | 4.2 | H (C, B) | 10 | brief | phantom +2 / slight +78 | 292 | P4 four columns |
| T3.6 | NDC Format | 4.3 | M (C) | 5 | brief | fits* 0 / fits* 0 | 137 | P7 figure + text, **VA-05** |
| T3.7 | Lot and Expiration | 4.3 | M (C) | 4 | brief | fits* 0 / fits* 0 | 198 | P4 2×2, roomy |
| T3.8 | Returns | 4.4 | M (none) | 5 | brief | fits* 0 / fits* 0 | 270 | P4 2 columns + strip |
| T3.9 | Essential Calculations Reference | 4.1 | H (C, B, R) | 11 | brief | phantom +2 / heavy +170 | 281 | P4 formula columns |
| T3.10 | Reading the Prescription | 4.1 | M (C) | 4 | brief | fits* 0 / fits* 0 | 137 | P4 part cards + flags |

### D4 Federal Requirements (18.75%), 8 topics (outline KA 2.x)

| ID | Topic | KA | Pri (basis) | Items | Now | Fit now (1600 / 1366) | Text floor | Target |
|---|---|---|---|---:|---|---|---:|---|
| T4.1 | DEA Controlled Substance Schedules | 2.2 | H (C, R) | 8 | clin | slight +57 / slight +79 | 311 | P1 ladder + 3 cards |
| T4.2 | DEA Forms | 2.3¹ | L (none) | 6 | brief | fits* 0 / fits* 0 | 220 | P4 cluster |
| T4.3 | Pharmaceutical Waste, OSHA Exposure & Right-to-Know (2.1) | 2.1¹ | L (none) | 6 | brief | fits* 0 / fits* 0 | 250 | P7 figure + text, **VA-06** |
| T4.4 | Key Federal Laws | 2.2 | H (C, R) | 8 | brief | heavy +233 / heavy +171 | 369 | P1 2-set, standard |
| T4.5 | Restricted Drug Programs (2.4): REMS & CMEA | 2.4¹ | H (C, R) | 7 | brief | heavy +192 / heavy +179 | 395 | P1 1-set, dense |
| T4.6 | DEA Number Verification | 2.2 | M (C) | 3 | brief | fits* 0 / fits* 0 | 137 | P7 figure + text, **VA-07** |
| T4.7 | FDA Medication Recalls (2.5) | 2.5¹ | L (none) | 6 | brief | fits* 0 (Rob reports slight) / fits* 0 | 261 | P4 class cards + cluster |
| T4.8 | DSCSA: Drug Supply Chain Security Act (2.6) | 2.6¹ | M (R) | 7 | brief | slight +9 / slight +85 | 300 | P4 cluster, dense |

**Totals:** 40 topics, 293 items; priority split **15 H / 22 M / 3 L**. At 1600×770: 12 topics scroll (8 heavy, 4 slight), 2 show a 2px phantom scroll, and 26 fit (most leave large dead space). At 1366×768: 16 scroll (11 heavy, 5 slight) and 24 fit.

> The Notes dropdown titles contain `&` and `—`. They are rendered as-is. The plan does not rename any title.

---

## 2. Layout pattern library

Seven whole-body patterns (P1-P7) and five small modules (M1-M5) that sit inside them. Every topic in section 3 uses one pattern, plus modules where they help.

### 2.0 Shared canvas, grid, and fill rules

| Item | Value at 1600×770 | Value at 1366×768 |
|---|---|---|
| Body canvas (`.nx-topic-content` inner) | 1360 × 466 px | 1294 × 464 px |
| Fit target (the content, before stretch) | at most 430 px (92%) | at most 430 px |
| 12-column grid, gap `--nb-gap` 10px | col = 104.2 px | col = 98.7 px |
| Span widths (card incl. gaps) | s3 = 343, s4 = 447, s6 = 690, s8 = 937, s12 = 1360 | s3 = 326, s4 = 425, s6 = 657, s8 = 892, s12 = 1294 |
| Width rule | fluid; the grid uses `fr`, not px | same |
| Collapse | below 900px every span becomes 12; sets stack | same |

- **Fill rule (no bottom dead space).** The body is a CSS grid whose row tracks are `minmax(min-content, 1fr)`. Rows stretch to consume the leftover height, capped at **1.35×** natural height. Any remainder is split equally above and below the grid (a "matted" look), never left only at the bottom. Rob decides the cap policy (Q6).
- **No scroll unless truly overflowing.** `.nx-topic-content` keeps `overflow-y: auto`, but the body is built to fit. A 3px tolerance treats rounding as fit.
- **Width fill.** Top-level units always span all 12 columns (no half-empty rows). A row of three or four cards uses spans that sum to 12.
- **Tier selection.** Each spec declares a tier. The runtime fit guard (section 5.9) can step down one tier when overflow is 60px or less (UI_STANDARDS rule 17 pattern). Body text never goes below 0.92rem.

### 2.1 Pattern table

| ID | Name | Use when | Grid / columns | Min / max sizes (1600 / 1366) | Padding & gap tokens | Classes reused | Classes added (and why) |
|---|---|---|---|---|---|---|---|
| **P1** | Set table | A topic is a list of `label → text` rows. 1 set for few long rows, 2 sets for 8-16 rows, 3 only for very short rows. Replaces both the clinical table and 2-column "label + clinical specifications". | `N` side-by-side tables, `grid-template-columns: repeat(N, 1fr)`, gap 12px; inside a set: label col 24-30% (min 150px, max 230px) + text col | Set width: N=1 1360 / 1294; N=2 674 / 641; N=3 445 / 423. Do not use a set narrower than 420px. Row min height: dense 30, standard 36, roomy 44; max stretched 1.35×. Column header row 32px. | Row padding-y 4 / 7 / 10 (dense / standard / roomy); cell padding-x 14px (label), 16px (text); `--nb-gap` 12px between sets | `.nx-table-wrap`, `.nx-data-table`, `.nx-row-even/-odd`, `.nx-term-badge`, `.nx-details-body` | `.nb-set`, `.nb-tbl` (a thin wrapper: `.nx-table-wrap` forces `overflow-x:auto` and 11px cell padding, which cause side scrollbars and tall rows; the wrapper overrides both only inside `.nb-body`) |
| **P2** | Pair table | Brand/generic and OTC. Fixed columns of short values. | T1.3: 2 sets × 2 columns (brand 45% / generic 55%) = 4 columns. T1.5: 1 set × 3 columns (22% / 24% / 54%) with grouped class cells. | Set width as P1. Row height: T1.3 28-30px (dense), T1.5 40px (roomy). Header 32px. | cell padding-x 16-20px (Rob's "moderate column padding"), padding-y 4px (T1.3) / 10px (T1.5) | `.nx-brand-badge`, `.nx-generic-name`, `.nx-otc-badge`, `.nx-active-ing`, `.nx-notes-body`, `.nx-cell-brand/-generic` | `.nb-pair`, `.nb-group-note` (rowspan class cell; no existing equivalent) |
| **P3** | Banded token grid | Short code → meaning tokens that belong to a few families (sig codes). | Optional band-label column 112px + `repeat(auto-fill, minmax(215px, 1fr))` tiles, gap 8px. Token tile = mono code, `=`, meaning. Caution tile may span 2 tiles. | Tile 215-300 wide × 46-64 high at 1600; at 1366 min width 215 keeps 5 per row. Band row height 56-64px. | tile padding 8px 12px; band label mono 0.74rem | `.nx-token-card`, `.nx-token-code`, `.nx-token-arrow`, `.nx-token-meaning`, `.nx-token-legend` | `.nb-band`, `.nb-band-label` (existing grid has no row grouping) |
| **P4** | Card cluster | Narrative or formula units that vary in length. Cards share rows with spans that sum to 12 so short items stop wasting a full-size card. | 12-col grid, spans 3 / 4 / 6 / 8 / 12; rows `minmax(min-content, 1fr)` | Card min width 326 (s3 at 1366) / 343 (s3 at 1600); min height 72 (strip) / 96 (card) / 140 (hero); header bar 24px; max any card 1360 | card padding `10px 14px` (dense) / `12px 16px` (standard) / `14px 18px` (roomy); `--nb-gap` 10px | `.nx-briefing-card`, `.nx-card-header-bar`, `.nx-card-index`, `.nx-card-tag`, `.nx-card-narrative` | `.nb-grid`, `.nb-card` (composes `.nx-briefing-card`), `.nb-s3 .nb-s4 .nb-s6 .nb-s8 .nb-s12` span helpers |
| **P5** | Hero + cluster | One unit clearly matters most (high priority, or a sequence), the rest are supporting. | Hero spans 7-8 columns and the support stack spans 4-5, or the hero is a full-width band above a cluster. | Hero min 140px high; support cards 96px; band hero 100-130px | as P4; hero gets a 3px accent rail (`--nb-key`) | as P4 | `.nb-hero` (accent rail and larger label; no equivalent) |
| **P6** | Lanes | Items sort into categories that read as columns (vaccine storage). | 3 equal lanes, lane header 40px, stacked cards, an optional card straddles two lanes | lane width 440 / 418; card min 72px | lane padding 10px, gap 10px | `.nx-briefing-card` | `.nb-lane`, `.nb-lane-head` |
| **P7** | Figure + text | A visual aid carries part of the topic. | Figure band spans 12 columns (or a left panel), 2-3 text cards below | figure 150-240px high at 1600 (set per aid); text cards 96-130px | figure padding 12px; caption 0.92rem | `.nx-briefing-card` | `.nb-fig` (figure frame); figure internals are section 4 |

### 2.2 Modules (embedded inside patterns)

| ID | Module | What it is | Size | Classes | Why it is new |
|---|---|---|---|---|---|
| **M1** | Metric tile | A verbatim number plus its unit as a big mono value, caption below ("28 days", "30 calendar days", "15 minutes"). Value text is a substring of the row; the caption is the rest of that clause. | min 150×64 px; value 1.5-1.8rem JetBrains Mono 700 | `.nb-metric` | Existing cards show numbers inline at body size; recall-critical numbers need glanceable weight. |
| **M2** | Step chain | Ordered chips joined by arrows (PPE sequence, five rights, PDSA, error process types). Order follows the source order. Arrows are CSS, not text. | chip height 34px, gap 6px; wraps below 900px | `.nb-steps`, `.nb-step` | No sequence component exists. |
| **M3** | Callout strip | A full-width or spanning strip with a left rail: amber for caution/time limits, rose for contraindication/avoid. | height 48-90px, rail 3px | `.nb-callout` | Warnings today look identical to every other card. |
| **M4** | Chip | Small pill for stems (`-pril`), agent names, schedules (`C-II`), and clause lists. Always a verbatim substring. | height 26px, padding 4px 10px, font 0.92rem | `.nb-chip` | Parenthetical stems are plain text today. |
| **M5** | Inline mark | Wraps a registry-listed verbatim phrase (for example "do NOT", "black box", "WEEKLY") in an amber/rose emphasis. | inline | `.nb-mark.warn`, `.nb-mark.danger` | v4 plan mark idea, built from existing amber/rose tokens. |

### 2.3 Tier table (referenced by every topic)

| Tier | Body font | Line height | Card pad | Table row pad-y | Used for |
|---|---|---|---|---|---|
| `roomy` | 1.00rem (up to 1.05rem for 1-3 item topics) | 1.45 | 14px 18px | 10px | Sparse topics (under 60% of canvas at standard) |
| `standard` | 0.96rem | 1.40 | 12px 16px | 7px | Mid topics |
| `dense` | 0.92rem (the floor) | 1.35 | 10px 14px | 4px | Tight topics, and the fit-guard fallback |

---

## 3. Per-topic spatial blueprint

**Reading the wireframes.** Width is proportional (1 character is about 15px of the 1360px canvas); height is schematic, so each band carries its estimated pixel height. `[iN]` means item N of that topic and `[iN.a]` means its first sentence or clause. **Every wireframe shows structure and item references only. All real text comes from `notes.json` at runtime.** Estimates are labeled estimates (section 0.3). "Tight" means the estimate exceeds the 430px target at one viewport; each tight topic has a dense-tier fallback and is verified first in its stage.

**Rules that apply to every topic**
- Labels are verbatim substrings of the row (text before the first top-level `: `, ` — `, ` = `, or ` → `), or an explicit `label` in the spec that must be a contiguous substring of the item (case-folded). Labels are never invented.
- The bottom-bar count stays `items.length`.
- Index chips `#nn` appear only where the display order equals source order.
- Every word of every item renders once (coverage test, section 7).

---

### D1 Medications

#### T1.1 Top Drug Classes & Suffixes (KA 1.1, H, 14 items)
- **Pattern:** P1 Set table, 2 sets × 7 rows, `standard` tier. Columns `CLASS (STEM)` | `EXAMPLES, USE & WATCH-FORS`.
- **Grouping:** one row per item. Label = text before `: `. A parenthetical that starts with `-` in the label becomes a stem chip (M4), for example `(-pril)`. In the detail, the clause before ` — ` (the drug names) is cyan; the rest is body text. Item 13 has no stem parenthesis: its whole pre-colon text is the label.
- **Order:** source order (the file already runs cardiovascular → GI → CNS → anti-infective → other). Set A = i1-i7, Set B = i8-i14, split chosen at build for equal height. Reading order is down set A, then set B (Q5).
- **Wireframe (1360 × 466):**
```
|<-------- SET A 674 -------->| g |<-------- SET B 674 -------->|
| CLASS (STEM) | EXAMPLES...  |   | CLASS (STEM) | EXAMPLES...  |   (~32 header)
| ACE inh [-pril] | lisinopril,|   | SSRIs        | sertraline,  |
| ARBs    [-sartan] ...        |   | Benzodiaz.[-pam/-lam] ...   |   7 rows x ~54  (~380)
| ... (7 rows)                 |   | ... (7 rows)                |
```
- **Result:** est. 410 px (88%), no scroll at either viewport. Text floor 366.

#### T1.2 Mechanisms of Action by Class (KA 1.1, H, 16 items)
- **Pattern:** P1, 2 sets × 8 rows, `roomy`. Columns `CLASS` | `MECHANISM OF ACTION` (words from the title).
- **Grouping:** one row per item; label = text before `: `. Arrow text (`→`) stays inline.
- **Order:** source order. No regrouping, because class families are not stated in the file and would add a classification.
- **Wireframe:** same two-set frame as T1.1, 8 rows per set at about 48 px.
- **Result:** est. 418 px (90%) / 430 px at 1366. No scroll. Text floor 299.

#### T1.3 Common Brand / Generic Pairs (KA 1.1, H, 27 items)
- **Pattern:** P2 Pair table, 2 sets × 2 columns (4 columns total), `dense` rows of 28-30 px. Headers `BRAND NAME` | `GENERIC NAME` per set (existing strings). Moderate horizontal padding (16-20 px).
- **Grouping:** one row per item, split on ` = `. Brand white (display font), generic mint (`#bbf7d0`, existing).
- **Order (Rob: choose and justify):** by therapeutic area, so related drugs sit together for recall, with no labels shown. **Set A (14):** i1, i2, i6, i8, i7, i13, i14, i15 (cardiovascular and antithrombotic); i3, i16, i17, i18, i4 (endocrine and metabolic); i5 (GI). **Set B (13):** i11, i22 (respiratory); i9, i19, i20, i10, i21, i27, i25 (CNS, psychiatric, and neurology); i12, i23 (anti-infective); i24, i26 (musculoskeletal and gout). Within a group the order follows the source.
- **Class evidence (a content-adjacent check Rob must approve, Q3).** A class is shown nowhere; it only drives order. Even so, "never write facts from memory" applies. Pairs whose class is stated elsewhere in `notes.json`: Lipitor (Statins, T1.1), Prinivil/Zestril (ACE inhibitors, T1.1), Norvasc (calcium channel blockers, T1.1), Lasix (loop diuretics, T1.2), Coumadin (T1.2), Plavix (antiplatelet, T1.7), Glucophage (T1.2), Januvia (-gliptin, T1.1), Jardiance (SGLT2, T1.11), Ozempic/Wegovy (GLP-1, T1.11), Prilosec (PPIs, T1.1), Ventolin/ProAir and Advair (T1.11), Zoloft (SSRIs), Cymbalta (SNRIs, T1.11), Imitrex (triptans), Sinemet (T1.2), Zithromax (macrolides, T1.1), Augmentin (penicillins, T1.6), Zyloprim (T1.12), Lyrica (C-V, T4.1). **No class stated anywhere in the file for: Synthroid, Neurontin, Wellbutrin, Flexeril, Eliquis, Xarelto.** The stage PR must cite an approved source (DailyMed or FDA label per AUDIT_RUBRIC) for those six before they are placed, or leave them in source-relative position within their nearest group and flag "verify."
- **Wireframe:**
```
|<-------- SET A 674 -------->| g |<-------- SET B 674 -------->|
| BRAND NAME  | GENERIC NAME  |   | BRAND NAME  | GENERIC NAME  |  (~32)
| Lipitor     | atorvastatin  |   | Ventolin/.. | albuterol     |
| ...14 rows x 29 px (~406)   |   | ...13 rows x 29 px + 1 empty slot |
```
- **Result:** est. 438 px (94%), tight; a 14-row set at 29 px is 406 + 32 header. At 1366 the same height (rows do not wrap). Row padding may drop to 3px as the fallback. No scroll expected. The shorter set leaves one empty row slot (accepted; Q6).

#### T1.4 Insulin Types (KA 1.4, H, 7 items)
- **Pattern:** P5 Hero + cluster, `dense`. Top band = table of the four insulin types; bottom band = three modules.
- **Grouping:** top table = i1-i4, three columns: type (text before `: `, for example "Rapid-acting"), agents (the clause before ` — `, brand names in parentheses stay, cyan), and profile (the rest: onset, "cloudy", "clear", and so on). The do-NOT-mix warning in i4 gets the M5 mark. Bottom row: card "Concentrated" = i5 (rose `NOT interchangeable` mark, M5); storage card = i6.a (unopened); three metric tiles (M1) = i6.b "28 days" (Lantus vial), i6.c "28 days" (SoloStar, with its "room temperature only (do not refrigerate)"), i7 "56 days" (Tresiba). Each tile's caption is the remainder of its clause, verbatim.
- **Order:** source order; the table runs rapid → short → intermediate → long, then concentrated, then storage.
- **Not charted:** the onset/peak/duration curve stays verify (F-011, F-012). No curve is drawn.
- **Wireframe:**
```
| TYPE / AGENTS            | ONSET / PROFILE                                          |  (~34)
| Rapid-acting ...         | ...                                                      |  4 rows x ~52 (~210)
| Long-acting (basal) ...  | ...                                                      |
+----------[ Concentrated i5 ]----+---[ Storage i6.a ]---+--[28 d]--[28 d]--[56 d]--+  (~170)
```
- **Result:** est. 440 px (94%) / 455 px at 1366. **Tight.** Dense tier is planned from the start; the fallback is dropping the storage card padding. Verified first in its stage.

#### T1.5 Common OTC Active Ingredients (KA 1.1, M, 7 items → 10 brand rows)
- **Pattern:** P2, **1 set × 3 columns**, `roomy` (40 px rows), generous cell padding (20 px), headers `OTC BRAND NAME` | `ACTIVE INGREDIENT` | `CLINICAL CLASS & KEY PEARLS` (existing strings).
- **Grouping:** brand rows are split exactly as today (`;` outside parentheses). The shared note "(2nd-gen antihistamines)" at the end of i4 becomes one class cell **spanning the three rows** Claritin / Zyrtec / Allegra (`.nb-group-note`), which removes the false `—` placeholders. Benadryl, Sudafed, Mucinex, and Delsym keep their own notes. A row with no note renders an empty cell, not `—`.
- **Order:** source order (it is already analgesic → antihistamine → cough/cold). A 1px rule separates the three groups.
- **Literal alternative (Rob said "the same as Brand/Generic"):** 2 sets × 3 columns, 5 rows each. It fits easily but leaves about 200 px of bottom dead space. See Q2.
- **Wireframe (recommended):**
```
| OTC BRAND NAME | ACTIVE INGREDIENT | CLINICAL CLASS & KEY PEARLS                         |  (~36)
| Tylenol        | acetaminophen     | max 4,000 mg/day; hepatotoxic in overdose            |
| Advil/Motrin   | ibuprofen         | NSAID; take with food                                 |   10 rows x 40 (~400)
| Claritin ...   | loratadine        |+ 2nd-gen antihistamines (spans 3 rows)               |
```
- **Result:** est. 436 px at 40 px rows; use 38 px rows to land at 416 (89%). No scroll. This removes today's +54 px.

#### T1.6 Key Side Effects & Monitoring (KA 1.5, H, 11 items)
- **Pattern:** P1, 2 sets × (6 + 5) rows, `roomy`. Columns `DRUG / CLASS` | `SIDE EFFECTS & MONITORING`.
- **Grouping:** one row per item; label before `: `. Marks (M5): "black box" → rose; "stay upright 30 min" stays plain. Items 9-11 (Penicillins, Amoxicillin, Sulfonamides) stay in source order.
- **Order:** source order; Set A = i1-i6, Set B = i7-i11.
- **Result:** est. 400 px (86%), no scroll at either viewport. Text floor 229.

#### T1.7 Critical Interactions & Contraindications (KA 1.3, H, 13 items)
- **Pattern:** P4 Card cluster, `standard`. Four `→` rows become **arrow cards** (M4-style pair: left = interacting drugs, right = outcome in rose/amber); the other nine are label-led cards.
- **Grouping:** R1 = i1, i2, i6, i7 (the four rows that contain `→`). R2 = i3, i5, i8, i10. R3 = i9 (span 6) + i4 (span 6, the long metformin row). R4 = i11, i12, i13 (span 4 each). Every item appears once; i5 gets the M5 mark on "WEEKLY".
- **Order and rationale:** arrow-shaped rows first because they form a recognizable family; the rest in source order, with the two long rows paired on one line. No new clinical grouping is introduced.
- **Wireframe:**
```
[ i1 -> ][ i2 -> ][ i6 -> ][ i7 -> ]                     R1 4 x s3  (~104)
[ i3 ][ i5 ][ i8 ][ i10 ]                                R2 4 x s3  (~100)
[ i9 (s6)                 ][ i4 (s6)                 ]   R3         (~110)
[ i11 (s4)    ][ i12 (s4)    ][ i13 (s4)    ]            R4         (~96)
```
- **Result:** est. 440 px / 455 px at 1366. **Tight.** Dense tier fallback is planned (0.92rem, 10 px padding). Text floor 344.

#### T1.8 Vaccine Storage (KA 1.8, H, 4 items), VA-01
- **Pattern:** P6 Lanes with **VA-01** (section 4). Three lanes: `Frozen` | `Refrigerate 2–8°C` | `Product-specific` (lane words come from the rows). A bridge card straddles the first two lanes; a live-vaccine strip and the rule strip sit below.
- **Grouping:** i1.a Varicella → Frozen. i1.b MMR and i2 (influenza, Shingrix, pneumococcal, Tdap, Hep B) → Refrigerate. i3 COVID-19 mRNA → Product-specific. i1.b's second clause "M-M-R II may be refrigerated or frozen" → bridge card. i1.c "Live vaccines: CI in pregnancy/immunocompromised" → rose strip. i4 "Rule" → amber strip, full width.
- **Interim state:** until the VA-01 PR merges, T1.8 keeps the legacy render through the new shell.
- **Result:** est. 400 px (86%), no scroll. Replaces today's 3+1 cards and dead space.

#### T1.9 Known Teratogens (KA 1.3, M, 1 item)
- **Pattern:** P4 chip wall + callout, `roomy` with names at 1.1rem.
- **Grouping:** the single item splits on commas outside parentheses into **10 chips** (isotretinoin (iPLEDGE), thalidomide, warfarin, methotrexate, valproic acid, phenytoin, ACE inhibitors/ARBs, tetracyclines, lithium, misoprostol), 2 rows of 5. The last sentence ("Statins are not an absolute avoid: ...") becomes an amber callout (M3) below, full width. A small alert-triangle icon sits on the callout.
- **Order:** source order.
- **Wireframe:** 2 rows of 5 chips (~120 px each), then a callout (~130 px).
- **Result:** est. 380 px (82%); the remainder is matted equally. This is the sparsest topic. It cannot reach 100% without adding content (Q6).

#### T1.10 Dosage Forms & Routes (KA 1.4, H, 10 items), VA-02
- **Pattern:** P1 with icon run-in rows: 2 sets × 5 rows, `standard`. Each row is `[icon] **Label** text` flowing as one paragraph (run-in), not a separate label column; this saves a line per row.
- **Grouping:** one row per item; label before the first `: ` or `(...)` lead (i4 "Orally disintegrating tablets (ODT)", i5 "Transdermal patches" take the leading noun phrase as a verbatim substring). Icons from VA-02. Initial split Set A = i1-i5, Set B = i6-i10; the split point is a spec field and is balanced against measured heights at build (item 7 is the longest row).
- **Interim state:** before VA-02, the base layout ships without icons.
- **Result:** est. 420 px / 435 px at 1366 (tight at 1366). Text floor 351. Today's +132 px scroll goes away.

#### T1.11 Respiratory, Psych & Miscellaneous Agents (KA 1.6, M, 9 items)
- **Pattern:** P4, `standard`, 3 columns × 3 rows of cards.
- **Grouping:** one card per item. i1 splits into three labeled sub-rows (SABA rescue / ICS maintenance / LABA). Card labels: i2 "Montelukast (Singulair)", i3 "SSRIs", i4 "SNRIs", i5 "Benzodiazepines (-azepam/-azolam)" (stem chip), i6 "Z-hypnotics", i7 "SGLT2 inhibitors (-gliflozin)" as written, i8 "Thiazolidinediones (-glitazone)", i9 "Alpha-1 blockers (-azosin/-ulosin)". i8 is long and spans 6 in R3.
- **Order:** source order, R1 = i1, i2, i3; R2 = i4, i5, i6; R3 = i7, i9 (span 3 each) + i8 (span 6).
- **Wireframe:** `[i1 sub-rows][i2][i3]` / `[i4][i5][i6]` / `[i7][i9][ i8 (s6) ]`.
- **Result:** est. 425 px / 440 px at 1366. Tight at 1366. Today +141 px at 1366 goes away.

#### T1.12 Musculoskeletal, Bone & Gout (KA 1.6, M, 4 items)
- **Pattern:** P4 2×2, `roomy` (cards about 670 × 200).
- **Grouping:** i1 NSAIDs (agent chips from the pre-` — ` list: ibuprofen (Advil/Motrin), naproxen (Aleve), meloxicam (Mobic), celecoxib (Celebrex)); i2 Bisphosphonates; i3 splits into two sub-rows (Allopurinol / Colchicine); i4 Acetaminophen with M5 on "max 4 g/day" and a labeled antidote clause.
- **Order:** source order.
- **Result:** est. 400 px (86%), no scroll.

---

### D2 Patient Safety and Quality Assurance

#### T2.1 High-Alert & LASA Drugs (KA 3.1, M, 3 items)
- **Pattern:** P4. Left card (span 7) = i1 as 8 chips (comma-split outside parentheses, so "antithrombotics (warfarin, heparin, DOACs)" and "IV inotropes (e.g. digoxin)" stay whole). Right card (span 5) = i2 as five `vs` pair rows with tall-man capitals preserved. Bottom amber strip (M3) = i3.
- **Order:** source order. Labels "ISMP acute-care examples", "LASA examples", "Double-check".
- **Result:** est. 400 px (86%), no scroll. The LASA pairs must never be case-transformed (no `text-transform`).

#### T2.2 Error Prevention Basics (KA 3.2, M, 7 items)
- **Pattern:** P5. Top band hero = i1 as five chips (M4: right patient, right drug, right dose, right route, right time; a list, so no arrows) plus a dashed chip for "(+ documentation, reason)". Below, 3 × 2 cards: i2 "Use 2 identifiers", i3 (label "Barcode scanning"), i4 "Double-check", i5 (label "Medication reconciliation"), i6 (label "final verification"), i7 "Separate inventory".
- **Order:** source order.
- **Result:** est. 400 px, no scroll.

#### T2.3 ISMP Error-Prone Abbreviations (Avoid) (KA 3.2, M, 8 items)
- **Pattern:** P3-style `avoid → write` cards, `standard`. R1 = i1, i2, i3; R2 = i4, i5, i6; R3 = i7 (span 6) + i8 (span 6).
- **Grouping:** i1-i6 split on ` → `: left = the avoid token (rose, with a small ban glyph), right = the write instruction (green). i7 label "HS/hs" with the two trailing sentences as body. i8 splits into two sub-pairs (OD/OS/OU, AD/AS/AU).
- **Order:** source order.
- **Policy note:** this topic displays banned tokens as the thing to avoid. That is the signed-off content. No new UI text may use any ISMP-listed token (lint, section 5.7).
- **Result:** est. 390 px, no scroll.

#### T2.4 Medication Error Types & DUR (KA 3.5, M, 5 items)
- **Pattern:** P5. R1: hero (span 7) = i1 as five outline-error chips (incorrect dose, quantity, patient, drug, route; the list word "and" is dropped at the chip boundary) with the second sentence ("Wrong time and omission are other error types; they are not the outline examples.") as a muted note; ADE card (span 5) = i3. R2: i2 as five chips (M4: prescribing, transcription/entry, dispensing, administration, monitoring errors; types, not a sequence, so no arrows) plus a "near-miss = caught before patient" callout. R3: three DUR cards = i4 Prospective, i5.a Concurrent, i5.b Retrospective.
- **Order:** source order, with i3 pulled up beside i1 (both are definitions of "what counts").
- **Result:** est. 420 px, no scroll.

#### T2.5 USP Chapter IDs (2026 scope) (KA 3.6, M, 3 items)
- **Pattern:** P4. R1: two numeral cards (span 6 each): "USP <795>" and "USP <797>" with the chapter number large (mono 2.2rem) and the descriptor beneath. R2: full-width card = i3 with three chips for "containment", "PPE", and "spill kits", and the date correction as body text.
- **Order:** source order (795, 797, 800).
- **Result:** est. 390 px (84%).

#### T2.6 Quality Assurance & Reporting (KA 3.4, M, 4 items)
- **Pattern:** P4. R1 amber/cyan strip = i1. R2: four program tiles (span 3) from i2's clauses: MedWatch (FDA adverse event reporting), FAERS (public database), ISMP MERP, VAERS (vaccines). R3: RCA card (span 4) = i3; PPE card (span 8) = i4 as two step chains (M2): donning gown → mask → goggles → gloves, doffing gloves → goggles → gown → mask.
- **Order:** source order.
- **Result:** est. 370 px, stretched to about 400 px. No scroll.

#### T2.7 Reporting Programs (KA 3.4, M, 5 items), VA-03
- **Pattern:** P7. R1: i1 (span 6) + i2 (span 6). R2: **VA-03** ladder (full width) from i3. R3: i4 (span 6) + i5 (span 6).
- **Interim state:** legacy through the shell until VA-03.
- **Result:** est. 410 px (88%), no scroll.

#### T2.8 Quality Improvement Methods (KA 3.2, M, 5 items)
- **Pattern:** P4. R1: RCA (span 6) = i1; PDSA (span 6) = i2 with four chips (Plan, Do, Study, Act) joined in a loop (M2). R2: i3 "Double-check", i4 (label "Prospective DUR"), i5 (label "Medication reconciliation"), span 4 each.
- **Order:** source order.
- **Result:** est. 400 px, no scroll.

#### T2.9 Infection Control & Hazardous Materials (KA 3.6, M, 6 items)
- **Pattern:** P4 3 × 2 (span 4). Cards: i1 Hand hygiene (two sub-rows: alcohol rub preferred / soap and water), i2 Sharps, i3 NIOSH list (label "NIOSH"), i4 HD PPE, i5 Counting trays, i6 Vaccine storage.
- **Order:** source order.
- **Result:** est. 400 px, no scroll.

#### T2.10 Immunization Workflow: VIS, VAERS & Pharmacist Hand-off (KA 3.3, H, 6 items)
- **Pattern:** P5. R1: i1 VIS + i2 (span 6 each). R2: hero (span 8) = i3 with two metric tiles (M1): "15 minutes" and "30 minutes", the latter keeping "after a COVID-19 vaccine"; side card (span 4) = i4 with two chips (VAERS, MedWatch). R3: i5 (span 8) + i6 (span 4).
- **Order:** source order.
- **Result:** est. 430 px / 440 px at 1366. **Tight** at 1366; dense fallback.

---

### D3 Order Entry and Processing

#### T3.1 Common Sig Codes (KA 4.1, M, 6 items)
- **Pattern:** P3 banded token grid, `standard`. The legend row stays (shortened to one 30 px line).
- **Grouping (rows = bands):** B1 i1 (PO, PR, SL, IV/IM) plus the i2 caution tile (SC/SQ: do not use). B2 i3 (BID, TID, QID, QHS, QAM). B3 i4 (PRN, ac, pc, q6h). B4 i5 split into gtt, OD/OS/OU, AD/AS/AU tiles plus a spanning caution tile for "Error-prone: do not use. Write right eye, left eye, both eyes, right ear, left ear, or both ears." B5 i6 (ii tab, i cap, qs, UD). Token splitting is **by sentence and `;`**, not just `;`, which fixes the glued `gtt` tile.
- **Order:** source row order. The rows already group by family (routes, frequency, timing, eye/ear, quantity).
- **Band labels** are structural and need Rob's OK (Q4): Routes, Frequency, Timing, Eyes and ears, Quantity.
- **Wireframe:**
```
| ABBREVIATION  =  CLINICAL TRANSLATION                                              | (~30)
| Routes    | PO=..  | PR=..  | SL=..  | IV/IM=.. | [SC/SQ: do not use]               | (~58)
| Frequency | BID=.. | TID=.. | QID=.. | QHS=..   | QAM=..                            | (~58)
| Timing    | PRN=.. | ac=..  | pc=..  | q6h=..                                       | (~58)
| Eyes/ears | gtt=.. | OD/OS/OU=.. | AD/AS/AU=.. | [Error-prone: do not use ...]       | (~64)
| Quantity  | ii tab=.. | i cap=.. | qs=.. | UD=..                                    | (~58)
```
- **Result:** est. 380 px (82%), no scroll. Stretch up to 1.35× fills the rest.

#### T3.2 Key Conversions (KA 4.1, M, 5 items), VA-04
- **Pattern:** P7, three equal panels (span 4) from **VA-04**: Volume, Weight, Temperature. Optional **VA-R1** raster in the Volume panel (Q8).
- **Interim state:** legacy through the shell until VA-04, except the stray-colon and `Temperature: °C` parse fixes from stage 2.
- **Result:** est. 420 px, no scroll.

#### T3.3 Core Calculations (KA 4.1, H, 14 items)
- **Pattern:** P4 formula columns, `standard`, 3 columns of stacked formula cards. Each card = label (cyan), formula (mono green), muted note if the row has one.
- **Grouping (by what the problem asks for):** Col 1 (supply and rate): i1 days supply, i3 IV flow rate, i4 drops/min, i10 IV admixture units/hour. Col 2 (strength and volume): i2 percent w/v and w/w, i13 1:1000, i14 D10W, i8 dilution C1V1 = C2V2, i9 reconstitution, i6 powder volume. Col 3 (dose): i7 dose by weight, i12 weight conversion, i11 BSA (Mosteller), plus the alligation row (i5) as a muted, full-column strip ("not a tested skill").
- **Order rationale:** a student reads the question and picks a family; the families are rate/supply, strength/volume, and dose. Source order interleaves them.
- **Wireframe:** three columns of 3-6 stacked cards; Col 2 is the tallest at about 6 × 62.
- **Result:** est. 420 px, no scroll at either viewport. Today's +86/+232 px goes away.

#### T3.4 Prescription Intake (KA 4.1, M, 3 items)
- **Pattern:** P4 step list, `roomy` (1.05rem). Three full-width rows with step numbers (purple, M2 style).
- **Grouping:** step 1 = i1 (label "Verify patient identifiers"). Step 2 = i2 with seven chips (drug, strength, dosage form, quantity, directions, prescriber, DEA (if controlled)). Step 3 = i3 as two role cards (Technicians enter data | the pharmacist performs the final clinical verification), split on `;`.
- **Order:** source order.
- **Result:** est. 400 px (86%).

#### T3.5 Administration Supplies (KA 4.2, H, 10 items)
- **Pattern:** P4 four columns, `standard`, cards stacked per column.
- **Grouping (by device family, structural labels need Q4 approval):** Col A "Measuring" = i1, i2. Col B "Inhalers" = i3, i4, i5. Col C "Diluents" = i6, i7, i8. Col D "Vaccines" = i9, i10.
- **Order:** within a column, source order.
- **Result:** est. 420 px / 435 px at 1366 (tight at 1366). Today's +2 phantom and +78 go away. Text floor 292.

#### T3.6 NDC Format (KA 4.3, M, 5 items), VA-05
- **Pattern:** P7. Top figure (**VA-05**) from i1 and i5; bottom three cards (span 4) = i2 Segment 1, i3 Segment 2, i4 Segment 3.
- **Interim state:** legacy until VA-05.
- **Result:** est. 400 px, no scroll.

#### T3.7 Lot and Expiration (KA 4.3, M, 4 items)
- **Pattern:** P4 2×2, `roomy`. Labels: "Lot number", "Expiration", "Expiration dating", "Expiration placement". Calendar and barcode glyphs (section 5.8) on the first two.
- **Order:** source order.
- **Result:** est. 400 px.

#### T3.8 Returns (KA 4.4, M, 5 items)
- **Pattern:** P4. Left column (span 6) = i1 Credit return over i2 Non-creditable. Right column (span 6) = i3 Reverse distributor over i4 Destruction (M1 tile "30 calendar days"). Bottom strip (span 12) = i5 Returned product.
- **Order:** source order, regrouped into two columns.
- **Result:** est. 400 px / 410 px at 1366, no scroll.

#### T3.9 Essential Calculations Reference (KA 4.1, H, 11 items)
- **Pattern:** P4 formula columns, `standard` (same components as T3.3).
- **Grouping:** Col 1 (strength): i1 concentration, i2 percent to decimal, i10 percentage strength, i11 ratio strength. Col 2 (dose and flow): i3 weight-based dose, i4 IV flow rate, i5 temperature. Col 3 (days supply): i6 tablets and drops, i7 insulin, i8 sprays and inhalers, plus the i9 alligation strip (muted).
- **Order rationale:** strength, then dose/flow, then days supply; matches the question types.
- **Note:** this topic and T3.3 restate several formulas (content is frozen; section 8, Q9).
- **Result:** est. 420 px, no scroll. Today's +2 phantom and +170 at 1366 go away.

#### T3.10 Reading the Prescription (KA 4.1, M, 4 items)
- **Pattern:** P4. R1: three part cards (span 4) from i1: inscription (drug/strength), subscription (dispensing directions to the pharmacist), Signa/sig (patient directions). R2: i2 `"Disp #30"` card (span 6) + i4 identity card (span 6). R3: i3 red-flags amber strip (M3) with four chips (illegible handwriting, unusual dose, missing quantity/sig, dangerous abbreviation).
- **Order:** parts first, then the two verification cards, then the flags.
- **Result:** est. 400 px.

---

### D4 Federal Requirements

#### T4.1 DEA Controlled Substance Schedules (KA 2.2, H, 8 items)
- **Pattern:** P1 ladder + P4 cards, `dense`. Top ladder table (full width): one row per schedule (i1 C-I, i3 C-II, i5 C-III, i6 C-IV, i7 C-V). Schedule chip (M4) in the label cell; where the parenthetical is a plain comma list (i3, i5, i6, i7) it becomes agent chips; i1's long marijuana parenthetical stays as text; the clause after ` — ` is the rule text. Below: i2 marijuana split as an amber callout (span 6), i4 C-II validity (span 4), i8 tramadol/hydrocodone (span 3). R2 spans: 6 + 3 + 3.
- **Order:** schedules ascending (I → V), which is the source order; the three non-ladder items follow.
- **Result:** est. 440 px / 455 px at 1366. **Tight.** Dense tier from the start. Text floor 311. If this overflows on Rob's real fonts, see Q9.

#### T4.2 DEA Forms (KA 2.3, L, 6 items)
- **Pattern:** P4. R1: i1 Form 222 (span 6) + i2 Form 106 (span 6). R2: i3 Form 41, i4 Form 224, i5 CSOS (span 4 each). R3: i6 take-back as an amber strip (span 12).
- **Order:** source order.
- **Result:** est. 400 px, no scroll.

#### T4.3 Pharmaceutical Waste, OSHA Exposure & Right-to-Know (KA 2.1, L, 6 items), VA-06
- **Pattern:** P7. R1: i1 P-list, i2 U-list, i3 EPA sewer rule (rose strip), span 4 each. R2: **VA-06** color map (full width) from i4. R3: i5 OSHA needle-stick + i6 eyewash/right-to-know, span 6 each.
- **Interim state:** legacy until VA-06.
- **Result:** est. 410 px / 420 px at 1366. No scroll.

#### T4.4 Key Federal Laws (KA 2.2, H, 8 items)
- **Pattern:** P1, 2 sets × 4 rows, `standard`. Columns `LAW / RULE` | `DETAIL`.
- **Grouping:** one row per item. Labels: i1 "Controlled Substances Act (1970)" (prefix), i2 "DATA 2000 X-waiver" (spec label, substring), i3 "Biennial", i4 "Controlled-substance prescription records", i5 "C-III–V prescriptions", i6 "C-II–IV labels", i7 "C-II receipt", i8 "C-II partial fills". The label stays in the sentence where it was a spec label rather than a prefix (excerpt mode).
- **Order:** source order. Initial split: Set A = i1-i5, Set B = i6-i8. The split point is a spec field, so it can be moved to balance measured heights without code changes.
- **Not used:** partial-fill clock tiles; the row is 470 characters and the tiles would repeat it at card cost.
- **Result:** est. 420 px / 425 px at 1366. No scroll. Today's +233 px goes away. Text floor 369.

#### T4.5 Restricted Drug Programs (2.4): REMS & CMEA (KA 2.4, H, 7 items)
- **Pattern:** P1, **1 set**, `dense`. Columns `PROGRAM / TOPIC` | `DETAIL`. A single set is chosen because at full width each row is 2-3 lines, while a 2-set layout is taller (measured 443 px against 395 px).
- **Grouping:** one row per item. Labels: i1 "Knowledge area 2.4", i2 "REMS", i3 "Clozapine REMS", i4 "iPLEDGE (isotretinoin)", i5 "THALOMID/lenalidomide", i6 "Medication Guides", i7 "CMEA". M5 amber on "3.6 g", "9 g", and "7.5 g" in i7.
- **Order:** source order.
- **No visual aid:** metric tiles would add at least 70 px and break the budget.
- **Result:** est. 430 px / 450 px at 1366. **The tightest topic.** At 1366 the real Windows fonts may push it over; see Q9. Text floor 395.

#### T4.6 DEA Number Verification (KA 2.2, M, 3 items), VA-07
- **Pattern:** P7. R1: i1 format (span 7) + i2 formula (span 5), mono. R2: **VA-07** worked example (full width) from i3.
- **Interim state:** legacy until VA-07.
- **Result:** est. 400 px.

#### T4.7 FDA Medication Recalls (KA 2.5, L, 6 items)
- **Pattern:** P4, `standard`. R0: intro strip = i1.a ("Outline 2.5 is medication recalls."). R1: three class cards (span 4) from i1's clauses: Class I (rose), Class II (amber), Class III (cyan). R2: i2 "Recall depth", i3 (spec label "The firm initiates a recall"), i4 "Market withdrawal" (span 4 each). R3: i5 "On any recall" + i6 (spec label "Take-back programs (2.3)"), span 6 each.
- **Order:** classes I → III, then source order for the rest.
- **Result:** est. 430 px / 440 px at 1366. Tight at 1366. This is Rob's named example: the topic that scrolled slightly with 3 short cards.

#### T4.8 DSCSA (KA 2.6, M, 7 items)
- **Pattern:** P4, `dense`. R0: intro strip = i1 (36 px, spec label "DSCSA (2013, Title II of DQSA)"). R1: i2 serialization (span 6, four chips: NDC, serial number, lot number, expiration date) + i3 TI/TS (span 6). R2: i4 authorized partners (span 6, four chips: manufacturers, wholesale distributors, dispensers (pharmacies), repackagers) + i5 suspect vs illegitimate (span 6, two sub-rows). R3: i6 "Suspect product" action (span 8, M1 tile "24 hours") + i7 records (span 4, spec label "Keep DSCSA transaction records", M1 tile "6 years"). i3 uses spec label "Current exchange".
- **Order:** source order.
- **Result:** est. 440 px / 455 px at 1366. **Tight.** Dense tier. Text floor 300.

---

## 3.1 Tight list (verify first, dense fallback ready)

`T1.3`, `T1.4`, `T1.7`, `T2.10`, `T4.1`, `T4.5`, `T4.8` (and `T1.10`, `T1.11`, `T3.5`, `T4.7` at 1366 only).

---

## 4. Visual aid register

**Policy.**
- **Fact-bearing means code-built.** Anything that carries a clinical number, name, step, or rule is inline HTML/CSS/SVG whose text is read from `notes.json` at runtime. It is never a pre-rendered image, and it is never typed into JS. Text inside an external `<img>` SVG cannot use the theme tokens or be selected, so aids are inline, not asset files.
- **No new facts.** A figure may rearrange, frame, and color text that already exists. Positions, bar widths, and thermometer marks are computed only from numbers already in the row. No axis ticks, no derived ratios, and no proportional bars that imply a relationship the notes do not state.
- **Few and spread out.** Seven code-built aids plus one optional raster, in topics that are not neighbors in the dropdown (1.8, 1.10, 2.7, 3.2, 3.6, 4.3, 4.6).
- **Interim rule.** A visual-aid topic keeps its legacy render (through the new shell) until its own aid PR merges.

Entries are in build order (also dropdown order). Sizes are at 1600×770 and fluid at 1366×768.

### VA-01 `va-d1-vaccine-lanes`: Vaccine storage lanes (T1.8)
- **Type:** HTML/CSS component `NotesVA.vaccineLanes`, with three small inline glyphs (snowflake, thermometer, vial).
- **Purpose:** show at a glance which vaccines are frozen, refrigerated, or product-specific, and the one that may be either.
- **Content (verbatim, bound by item/clause):**
  - Lane `Frozen`: i1 "Varicella: frozen (-50°C to -15°C)."
  - Lane `Refrigerate 2–8°C`: i1 "MMR: refrigerate 2–8°C"; i2 "Inactivated influenza, Shingrix, pneumococcal, Tdap, Hep B: refrigerate 2–8°C."
  - Lane `Product-specific`: i3 "COVID-19 mRNA: storage is product-specific; some presentations are refrigerated and must not be frozen."
  - Bridge card across Frozen and Refrigerate: "M-M-R II may be refrigerated or frozen."
  - Rose strip: i1 "Live vaccines: CI in pregnancy/immunocompromised."
  - Amber strip, full width: i4 "Rule: most vaccines refrigerate and must not be frozen; varicella must be frozen; M-M-R II may be refrigerated or frozen."
- **Dimensions:** about 1360 × 370 px. Three lanes of 440 px (418 px at 1366), a 40 px lane header, card minimum 72 px. Below 900 px the lanes stack.
- **Binding:** a spec of `{lane, item, clause}` triples. The renderer slices the item text on `. ` and `; ` boundaries and fails the validator if a clause does not match.
- **Accessibility:** each lane is `role="group"` with `aria-labelledby` on its header; glyphs are `aria-hidden`; no meaning is carried by color alone (the lane headers and strip text say it).

### VA-02 `va-d1-dosage-icons`: Dosage-form icon set (T1.10)
- **Type:** one inline SVG sprite with 10 stroke glyphs (`pill`, `shield`, `clock`, `droplet`, `patch`, `suppository`, `bottle`, `vial`, `sun`, `lock`) defined once as `<symbol>` elements in `js/notes-va.js`.
- **Purpose:** a single run-in icon at the start of each of the 10 dosage-form rows, so the list scans by shape.
- **Content:** the 10 items, verbatim (no text lives in the icon). Icon-to-item map is by index: i1 SL → `pill`, i2 enteric-coated → `shield`, i3 extended-release → `clock`, i4 ODT → `droplet`, i5 transdermal → `patch`, i6 suppositories → `suppository`, i7 suspensions → `bottle`, i8 multi-dose vial → `vial`, i9 light → `sun`, i10 restricted access → `lock`.
- **Dimensions:** 20 px glyph in a 28 px tile, cyan stroke 1.75, `aria-hidden`.
- **Authoring:** drawn in-house on the 24 px grid, matching the header and nav icons (round caps and joins). If a set is adapted (Feather MIT or Lucide ISC), the README credits it.

### VA-03 `va-d2-merp-ladder`: NCC MERP category ladder (T2.7)
- **Type:** HTML/CSS stepped ladder `NotesVA.merpLadder`.
- **Purpose:** show the A to I harm progression as a ramp, because the source row is already a chain.
- **Content (verbatim, from T2.7 i3, split on ` → `):** label "NCC MERP error categories" then five nodes: "A potential", "B no reach", "C reach/no harm", "D monitoring to confirm no harm and/or intervention to preclude harm", "E–I increasing harm (I = death)".
- **Dimensions:** about 1360 × 150 px; five flex nodes (the D and E–I nodes grow for text); arrows are CSS chevrons. A harm gradient runs green → amber → rose as a semantic stripe on each node's top edge. The text, not the color, carries the meaning.
- **Binding:** split by the arrow glyph (`→`); node count must be five or the validator fails.
- **Accessibility:** rendered as an ordered list (`<ol>`); the visual arrows are `aria-hidden`.

### VA-04 `va-d3-conversions`: Conversion panels with a thermometer (T3.2)
- **Type:** three HTML/CSS panels (`Volume`, `Weight`, `Temperature`) plus one small inline SVG thermometer.
- **Purpose:** replace the flat token grid with a reference chart grouped by what is being converted.
- **Content (verbatim, clause-bound):**
  - Volume (ascending by value, which is arithmetic ordering): 1 tsp = 5 mL; 1 tbsp = 15 mL; 1 fl oz ≈ 30 mL; 1 cup = 240 mL; 1 pint = 473 mL; 1 quart = 946 mL; 1 gallon = 3,785 mL.
  - Weight (large to small): 1 kg = 2.2 lb; 1 lb = 454 g; 1 oz = 28.4 g; 1 grain (gr) ≈ 65 mg; 1 g = 1,000 mg; 1 mg = 1,000 mcg.
  - Temperature: "°C = (°F − 32) × 5/9" as a formula block (mono), plus "body 37°C = 98.6°F" and "fridge 2–8°C = 36–46°F" as two marker rows on the thermometer. The thermometer is a vertical bar with an unlabeled tick rhythm. Only the fridge band and the body mark are positioned, from the numbers 2, 8, and 37 on a linear °C axis. No numerals other than the two labeled marks appear.
- **Dimensions:** three panels of about 440 × 380 px (418 px wide at 1366). Volume rows 40 px; a `:` in the source (`1 fl oz: ≈ 30 mL`) is shown as the same `=`/`≈` form as the other rows.
- **Binding:** clause split on `; `, then ` = ` or `: ≈`. Panel assignment is by a `{panel, item, clause}` spec. A clause missing from the spec fails the coverage test.
- **Accessibility:** each panel is a table (`<table>` with `<th scope="row">`) for screen readers. The thermometer has a text equivalent of its two marker rows and is `aria-hidden`.
- **Panel labels** `Volume`, `Weight`, `Temperature` are structural labels needing Rob's OK (Q4).

### VA-05 `va-d3-ndc-segments`: NDC segment figure (T3.6)
- **Type:** HTML/CSS digit-cell figure `NotesVA.ndcSegments`.
- **Purpose:** show the three segments visually for each pattern.
- **Content (verbatim):** i1's three patterns "4-4-2", "5-3-2", "5-4-1" plus i5's "5-4-2" (HIPAA, 11-digit). Each pattern is a row of cells grouped into three segments with widths from the digit counts parsed from the string. Segment names come from i2-i4: "Segment 1: labeler", "Segment 2: product", "Segment 3: package size and type". Caption = i5's sentence, verbatim. The cells are blank (no sample digits are shown, so nothing is invented).
- **Dimensions:** about 1360 × 200 px (cells 28 px wide, 34 px high). The three text cards below carry i2-i4 in full.
- **Binding:** parse `/(\d+)-(\d+)-(\d+)/` from the item text. Cell counts must sum to 10 (FDA rows) or 11 (HIPAA row) or the validator fails.
- **Accessibility:** `role="img"` with an `aria-label` that repeats the four patterns; the cards below carry the full text.

### VA-06 `va-d4-waste-map`: Waste color map (T4.3)
- **Type:** HTML/CSS swatch cards `NotesVA.wasteMap` with one small bin glyph.
- **Purpose:** make the color-to-waste mapping scannable.
- **Content (verbatim, from T4.3 i4):** four cards: "black = RCRA hazardous pharmaceutical waste"; "yellow = trace chemotherapy"; "red = biohazard/sharps"; "blue or white = non-hazardous pharmaceutical waste". The swatch color is the color the row names, drawn with a 2 px light outline so black reads on the dark theme; the "blue or white" card shows two swatches. Footer caption: "Vendor labels control if they differ."
- **Dimensions:** about 1360 × 130 px, four cards of 330 px (312 px at 1366).
- **Binding:** split i4 on `; ` after the `Segregate waste.` and `Common PTCE color map:` lead-in; the lead-in stays as the figure's label text.
- **Accessibility:** the color name is in the text on each card, so the swatch is decorative (`aria-hidden`).

### VA-07 `va-d4-dea-checkdigit`: DEA check-digit worked example (T4.6)
- **Type:** HTML/CSS digit-cell figure `NotesVA.deaCheckDigit`.
- **Purpose:** walk the check-digit math on the example number so the odd and even groups are visible.
- **Content (verbatim, from T4.6 i3):** cells "A", "B", "1", "2", "3", "4", "5", "6", "3" (the two letters are muted). Digits 1, 3, 5 get a cyan group bracket "(1+3+5)=9"; digits 2, 4, 6 get a green bracket "(2+4+6)=12 ×2 =24"; the last digit is amber with "last digit 3 = check digit 3. Valid." The summing line reads "9+24=33". All arithmetic strings are the item's own clauses, split on `; `.
- **Dimensions:** about 1360 × 190 px (cells 44 × 52 px); the format and formula cards above it carry i1 and i2.
- **Binding:** the example string `AB1234563` is read from i3 with `/[A-Z]{2}\d{7}/`; bracket groups are fixed by the position rule in i2 (1st, 3rd, 5th and 2nd, 4th, 6th digits).
- **Accessibility:** one `role="img"` with an `aria-label` of the full worked line; brackets are `aria-hidden`.

### VA-R1 `va-d3-measures` (OPTIONAL): AI raster, household measure illustration (T3.2)
- **Type:** raster art `assets/notes/va-d3-measures.webp`, decorative only. **Carries no facts.** Every number and label stays live text in VA-04.
- **Placement:** the left column of the Volume panel, 150 × 300 CSS px (generate at 600 × 1200, ship at 300 × 600 for 2×). Volume rows sit to its right. `alt=""`.
- **Format:** WebP, quality 85, target 40 KB or less; transparent background only if the generator supports alpha. Otherwise generate on a solid flat `#090f17` (the card surface token) and crop to the edge.
- **Gemini prompt (paste-ready):**

```
Flat vector-style illustration, vertical composition, centered, no background elements. Subject: a short stack of household dosing measures, small to large from top to bottom: a measuring teaspoon, a measuring tablespoon, a small dosing cup, and a large measuring cup. Each is unmarked and blank, with no graduation lines, no digits, no letters, no brand marks. Style: clean geometric line-art with soft solid fills, consistent 2 px outline, slight cyan rim light on the upper-left edges. Palette: deep navy fills #0e1622 and #141f2f, outline and rim light cyan #38bdf8, a single small accent in matrix green #00ff41, pale mint highlight #bbf7d0. Background: solid flat #090f17 (or transparent if supported). Aspect ratio 1:2, 600 by 1200 px. Negative: no text, no numbers, no measurement markings, no logos, no hands, no photo-realism, no shadows on the background, no gradients across the whole canvas, no pink or purple, no clutter.
```

- **Review gate:** Rob and Grok Bot review the raster on the 1600 and 1366 screenshots. It ships only if it reads as part of the Matrix theme. If it does not, VA-04 ships without it.

### Visual aids considered and rejected
| Idea | Why not |
|---|---|
| Insulin onset/peak/duration curve (T1.4) | The source rows are on the verify list (F-011, F-012). A curve would invent numbers. |
| Volume ladder with proportional bars (T3.2) | 5 mL to 3,785 mL is not drawable to scale, and bar lengths imply ratios the notes never state. |
| Partial-fill clock tiles (T4.4) | The row is 470 characters. Tiles would repeat it at card cost and break the height budget. |
| CMEA metric tiles (T4.5) | Adds at least 70 px to the tightest topic. Amber marks on the three numbers do the job. |
| Raster dosage-form strip, bins, PPE art | A raster strip costs 80-110 px of a 466 px canvas that T1.10 and T4.3 cannot spare, and the same shapes work as code glyphs. UI_STANDARDS rule 12 keeps decorative art deferred. |
| DSCSA data-matrix glyph (T4.8) | Decorative. Four chips already carry the elements. |

---

## 5. Formatting standards

### 5.1 Typography (tier values are in section 2.3)
| Role | Face | Size | Weight | Color token |
|---|---|---|---|---|
| Body text | system-ui (as today) | 0.92rem floor / 0.96 / 1.00 (1.05 for 1-3 item topics) | 400 | `--nx-text-secondary` |
| Card / row label | Chakra Petch | 0.92rem to 1.00rem | 700 | `--nb-key` (cyan) |
| Brand / term | Chakra Petch | same as label | 700 | white (`--nx-text-primary`) |
| Generic name | system-ui | body size | 600 | mint `#bbf7d0` (existing) |
| Code / value / formula | JetBrains Mono | body size | 700 | `--nb-code` (green) |
| Column header (static chrome) | JetBrains Mono | 0.78rem, 0.1em tracking, uppercase | 700 | `--nx-text-muted` |
| Index chip `#nn` | JetBrains Mono | 0.72rem | 700 | muted |
| Metric value (M1) | JetBrains Mono | 1.5-1.8rem | 700 | `--nb-code` |
| Figure text | as body | **0.92rem floor** (figure text carries facts, so it follows the body floor) | | |

Only column headers and index chips may sit below 0.92rem. Body text and any fact-bearing text stay at 0.92rem or above, per AUDIT_RUBRIC and UI_STANDARDS rule 17. **Never apply `text-transform` to content.** Tall-man letters (`hydrOXYzine`) and units (`mL`, `mcg`) must keep their exact case. Only static column headers are uppercase.

### 5.2 Semantic color (all existing tokens; color is never the only signal)
| Meaning | Token | Used for |
|---|---|---|
| Term / key | cyan `--nx-matrix-cyan` | row labels, agent names, active ingredients |
| Code / value | green `--nx-matrix-green` | sig codes, formulas, metric values, "write" tokens |
| Generic name | mint `#bbf7d0` | generic drug names |
| Caution / time limit | amber `--nx-matrix-amber` | "do not", deadlines, caution strips |
| Avoid / contraindication / harm | rose `--nx-matrix-rose` | avoid tokens, black box, "death", class I |
| Process / sequence | purple `--nx-matrix-purple` (currently unused) | step numbers, chain arrows |

### 5.3 Badges and chips (allowed types only)
1. **Index chip `#nn`:** source item number, zero-padded. Shown only when display order equals source order, and only on card patterns. Never on tables, tiles, or reordered lists.
2. **Stem chip:** a parenthetical in a label that starts with `-` (`(-pril)`).
3. **Schedule chip:** a label that starts with `C-I`..`C-V` (T4.1).
4. **Agent chip:** a plain comma-list of names (T1.12 NSAIDs, T4.1 examples).
5. **Tone mark (M5):** a phrase listed in the spec and validated as a substring.

**Removed:** the `NOTE` fallback badge. A row with no derivable label either gets a spec label or fails validation; a row never shows a made-up badge.

### 5.4 Label derivation (replaces `detectLayoutType` heuristics for mapped topics)
Order of precedence, evaluated by the renderer per unit:
1. **Spec label:** an explicit string that must be a contiguous, case-folded substring of the item (validated). Mode `excerpt` keeps the body whole; mode `prefix` removes the label from the body.
2. **Delimiter label:** text before the first top-level (outside parentheses) `: `, ` — `, ` = `, or ` → `, up to 60 characters.
3. **None allowed:** for card and table units, no label means validation fails.

Parenthesis safety is unchanged: `splitOutsideParens` and `findOutsideParens` stay (so `Tylenol = acetaminophen (max 4,000 mg/day; hepatotoxic in overdose)` is never split inside the parentheses).

### 5.5 Text display rules (display-only; the stored strings never change)
- **Capitalization:** after a label is lifted out, a lowercase first letter of the remaining sentence-style body is capitalized with a `.nb-cap` class (`::first-letter`). Not applied to code, unit, or token cells. Rob decides in Q10.
- **Trailing period:** one trailing `.` is hidden on short token and table-cell values (not on sentences).
- **Delimiters:** `;`, `: `, ` = `, and ` → ` that were used only to split are dropped; the layout itself carries the relationship. Content arrows (`→` meaning "causes") inside prose stay.
- **List connectors:** when a list is split into chips, a leading `and` or `or` at a chip boundary is dropped. This is the only word the renderer may drop, and the coverage test allows exactly this.
- **Numbering and counts:** the bottom bar keeps "N Points" = `items.length`, even when an item is split into several units.

### 5.6 Spacing rules
- Body padding `10px 12px`. Grid gap 10px (12px between table sets). Card padding per tier. No nested padding stacks; a unit inside a card uses 6px gaps.
- Column padding: table cells 14-16px horizontal at every tier (Rob's "moderate column padding"); T1.5 uses 20px.
- No side or bottom dead space: top-level units sum to 12 columns, and the grid stretches (section 2.0).

### 5.7 Abbreviation policy (new UI text)
- New UI strings (labels, band names, column headers, figure captions, `aria-label`, `alt`) use plain words, with `mL`, `mg`, `mcg`, `IR`/`ER`, `PO`, and `tab`/`cap` only after the topic has said the full term.
- **Never** any ISMP error-prone abbreviation in new text. The banned-token list is derived from T2.3 itself (`U`, `IU`, `QD`, `QOD`, `MS`, `MSO4`, `MgSO4`, `HS`, `hs`, `OD`, `OS`, `OU`, `AD`, `AS`, `AU`, `SC`, `SQ`, `D/C`, `cc`, `μg`). `validate.js` lints every label, header, and aria string in `notes-layouts.js` and `notes-va.js` against it as whole words.
- Signed-off item text is not touched, even where it prints a banned token on purpose (T2.3, T3.1).

### 5.8 Icons
- Inline SVG, `viewBox="0 0 24 24"`, `stroke="currentColor"`, width 1.75 (2.0 for the 28 px lane glyphs), round caps and joins. Same drawing language as the header and nav icons.
- Sizes: 16 px inline, 20 px card header, 28 px lane header. At most one icon per card header. Icons are `aria-hidden` unless they carry meaning alone (none do).
- One sprite `<svg hidden>` with `<symbol id="nbi-…">` in `js/notes-va.js`. Budget of about 17 glyphs: the 10 dosage glyphs, plus `snowflake`, `thermometer`, `ban`, `alert`, `calendar`, `barcode`, `bin`.

### 5.9 Overflow, empty, and fit rules
- **Fit guard (`fitBody`)**, after each render and on resize:
  1. If body overflow is 3px or less, treat it as fit (rounding).
  2. If overflow is 4-60px and the tier is above `dense`, step down one tier and re-measure.
  3. If it still overflows, keep real scroll (`overflow-y: auto`, the existing gradient scrollbar) and set `data-nb-overflow` for the test harness.
- **Real scroll** is allowed only when dense content cannot fit at 0.92rem (candidates: T4.5, T4.1, T4.8 at 1366). Such a topic gets a bottom fade so a clipped line is never cut mid-row.
- **Empty topic:** `.nx-empty-topic` gets styling (centered, muted, one line). It never shows a scrollbar.
- **Search mode** keeps the legacy renderers (Q13).
- **Width.** Layouts are designed without a scrollbar (1360 px). If a real scrollbar appears, the grid reflows to 1350 px with no horizontal overflow.

---

## 6. Navigation fix spec

### 6.1 Current behavior (`js/notes.js`)
- `renderTopicNavigation` (L397) sets `hasPrev = currentIdx > 0` and `hasNext = currentIdx < totalTopics - 1` from the **current domain only**, so prev disables on the first topic of a domain and next disables on the last, in both the top bar and the bottom bar.
- The click handler (L621-L638) changes `activeTopic[domainIdx]` only, then `render()` rebuilds the whole area, which drops keyboard focus.
- `openDomainIndex` (L14) is only changed by domain-card and pill clicks.

### 6.2 Required behavior
Rob's rule: the **bottom** prev/next must cross domain boundaries. They stop only at the very first topic (D1 · T1.1) and the very last topic (D4 · T4.8).

| From | Action | To | Side effects |
|---|---|---|---|
| Any topic that is not first in its domain | Prev | previous topic, same domain | none |
| First topic of D2, D3, or D4 | Prev | **last topic of the previous domain** | `openDomainIndex` = previous domain; `activeTopic[prev]` = its last topic |
| First topic of D1 | Prev | disabled | `disabled`, `aria-disabled` |
| Any topic that is not last in its domain | Next | next topic, same domain | none |
| Last topic of D1, D2, or D3 | Next | **first topic of the next domain** | `openDomainIndex` = next domain; `activeTopic[next]` = 0 |
| Last topic of D4 | Next | disabled | `disabled` |

- **Sync.** After a boundary move, re-render so the domain card swaps, the pill row marks the new domain active, and the domain header shows the new name, weight, and topic count. No second open card ever exists (the accordion rule is unchanged). Reset `scrollTop` of the new body to 0.
- **Memory.** Pills keep the last topic you were on in each domain, as today. A boundary move sets the entry topic as in the table (first on Next, last on Prev) and then that domain remembers it.
- **Top bar (Q7).** Literal reading: only the bottom bar crosses; the top bar keeps stopping at domain ends. Recommended: both bars use the same rule so the two never disagree on one screen. Implementation is one flag (`crossDomain`) passed into `renderTopicNavigation`, true for bottom and (if Rob agrees) top. No second prev/next set is added.
- **Targets are derived, not hard-coded:** flatten `loadedDomains[*].sections` into an ordered list and compute the neighbor from the current position, so a future topic count change cannot break it.
- **Labels.** `aria-label` and `title` name the target, and name the domain when crossing, for example "Next topic: Order Entry and Processing, Common Sig Codes". The icon-only look does not change.
- **Focus.** After `render()`, restore focus to the same button (`[data-domain-nav] [data-action]` in the same bar), so repeated Enter or Space keeps working.
- **Live region.** One visually hidden `aria-live="polite"` node announces "Domain N, <topic title>" after a cross-domain move.
- **Keyboard (Q11).** `ArrowLeft` / `ArrowRight` move prev/next (cross-domain rule) when the event target is not a `select`, `input`, `textarea`, or `contenteditable`, no modifier key is down, and a domain is open. Everything else (Tab order, dropdown, pills) is unchanged.
- **Search mode and idle state:** nav is not rendered, so nothing changes.
- **Out of scope:** URL hash routing, swipe, and any new control.

### 6.3 Test (added to the stage 1 PR)
1. Walk Next from D1·T1.1 to D4·T4.8 (39 steps). Assert the visited sequence equals the flattened order, and at each step the active pill, the domain header, the dropdown value, and the point count match.
2. Walk Prev back to D1·T1.1. Same assertions.
3. Assert Prev is disabled at D1·T1.1 and Next at D4·T4.8, and enabled everywhere else (bottom bar).
4. Dropdown jump then Prev/Next still behaves (memory per domain).
5. `ArrowLeft`/`ArrowRight` produce the same sequence and are ignored while the dropdown is focused.
6. Home, Course, Quiz, Flashcards, Exam, and Dashboard load with no console errors.

---

## 7. Build stages (ordered checkpoints, no calendar estimates)

One stage is one PR. Stop and report at the end of each. Rob approves each merge. Stages are strictly ordered unless Rob reorders them (the visual-aid PRs may be re-sequenced freely after stage 2).

### Guardrails for every stage
- Touch only the files named for the stage.
- No edits to `data/notes.json`; no v2 `notes.json` in `data/`.
- No change to frozen classes (section 0.1) or to the domain accordion, pills, header, or dropdown styling.
- No destructive git. No merge without Rob's OK. Grok Bot reviews screenshots before any merge, including standing-approval merges.
- Bump the service worker cache to the next version (`sw.js` L2 `CACHE`, `ptce-2026-v82` → `v83` → …) and the matching assertion in `validate.js` (L257-L258 area) in every PR. Bump the `?v=` on any changed asset in `notes.html` (CSS currently `?v=50`, JS `?v=47`). Also bump `course.html`'s `notes.css?v=77` only if `css/notes.css` changed.
- Add every new shipped file to the `ASSETS` list in `sw.js` and to the `jsFiles` syntax list in `validate.js` (L40-L41).
- Update the README Directory structure tree whenever files are added. Update `UI_STANDARDS.md` with one line per new standing rule. Tick TODO.md items in the PR that finishes them. No docs-only PRs.
- Content PRs are UI PRs: screenshot every touched topic at 1600×770 and 1366×768, check contained, padded, no clipping, spill, or wasted width, and put the screenshots in the PR.

### Common "done when" (every stage)
1. `node validate.js` passes, including lesson containment and (from stage 0) the new Notes checks.
2. `notes.html`, Home, and every touched page load with no console errors.
3. The touched feature works end to end (open every touched topic in the topic bar, step with prev/next, switch domain pills).
4. No phantom scroll at 1600×770 and 1366×768; real scroll only where section 5.9 allows it.
5. Quick regression of Course (it loads `css/notes.css`), Home, Quiz, Flashcards, Exam, and Dashboard.
6. Docs updated in the same PR as above. PR description records only failures found, what was fixed, and open flags.

### Stage 0: Harness (no visual change)
- **Files:** new `check-notes-containment.js`; `validate.js` (hook after the lesson-containment block, L574-L582); `README.md` tree; `sw.js` + `validate.js` cache bump.
- **Work:**
  - `check-notes-containment.js` opens `notes.html` headless at 1600×770, 1366×768, and a 1600×736 stress viewport (informational), visits all 40 topics, and checks:
    - **A.** `.nx-topic-content` overflow is at most 3px, or the topic is on the real-scroll allowlist and the overflow is at least 8px.
    - **B.** No descendant of `.nb-body` has a bounding box outside the content box; no horizontal scrollbar.
    - **C.** No clipped text (any element with `scrollWidth > clientWidth + 1` under an overflow-hidden ancestor).
    - **D.** Computed font-size of every text node in `.nb-body` is at least 14.7px, except the allowlisted classes (column headers, index chips).
    - **E.** Fill ratio: the lowest content bottom is at least 80% of the inner height (warn) and at least 65% (fail).
    - **F.** Coverage: the multiset of word tokens in all items equals the multiset in the rendered body, minus delimiters and list connectors, plus only approved structural labels and column headers.
    - **G.** Every label and `aria-label` string in the layout registry passes the ISMP lint and every spec label is a substring of its item.
    - **H.** No console errors.
  - A `--shots <dir>` flag writes per-topic PNGs to a temp directory (never committed).
  - Stage 0 runs against the legacy render and records the current failing topics as the baseline. The checker reports (does not fail on) checks A, E, and F for unmapped topics, and fails them for mapped topics. Mapped topics grow stage by stage.
- **Checkpoint:** baseline numbers match section 1. Rob confirms the real `clientHeight` (Q1).

### Stage 1: Cross-domain navigation (section 6)
- **Files:** `js/notes.js` (`renderNavButton` L390, `renderTopicNavigation` L397, click handler L621, new keydown listener, live region); `notes.html` (`?v=`); `sw.js`; `validate.js`; `UI_STANDARDS.md` (one line: bottom prev/next crosses domains); `TODO.md` tick.
- **Checkpoint:** the walk test passes and a screen recording shows D1 → D4 and back.

### Stage 2: Body shell, tokens, density, fit guard (small visual change)
- **Files:** new `css/notes-body.css`, `js/notes-body.js`, `js/notes-layouts.js` (empty registry); `js/notes.js` (`renderSectionContent` L365 delegates to `NotesBody` when a spec exists, otherwise the legacy renderer; `render()` L437 calls `fitBody` after paint); `css/notes.css` (`.nx-topic-content` L432: padding `10px 12px`; `.nx-empty-topic` styling); `course.html` (`notes.css?v=` bump only); `notes.html` (CSS link L13, scripts L92); `sw.js` ASSETS; `validate.js`; `README.md`; `UI_STANDARDS.md` (tiers, fit guard, no-`NOTE`, no-`text-transform` on content).
- **Work:** `.nb-*` tokens and the grid shell, tiers, the fit guard, parser fixes that apply to unmapped topics too (drop the `NOTE` badge, hide trailing periods, fix the legend text for Conversions, fix the token splitting for sig and conversion items), and the registry plumbing with coverage plus label validation.
- **Checkpoint:** all 40 topics render as before or better; no new overflow; stage 0 baseline improves only through the parser fixes.

### Stages 3-7: Domain and pattern stages (mapped topics)
| Stage | Topics built | Patterns first used |
|---|---|---|
| 3 Tables | T1.1, T1.2, T1.3, T1.5, T1.6, T4.4, T4.5 | P1, P2 |
| 4 D1 cards | T1.4, T1.7, T1.9, T1.11, T1.12 | P4, P5, M1, M3, M4, M5 |
| 5 D2 | T2.1-T2.6, T2.8, T2.9, T2.10 | P3, M2 |
| 6 D3 | T3.1, T3.3, T3.4, T3.5, T3.7, T3.8, T3.9, T3.10 | P3 bands, formula columns |
| 7 D4 | T4.1, T4.2, T4.7, T4.8 | ladder, class cards |

- **Files per stage:** `js/notes-layouts.js` (spec entries), `js/notes-body.js` (pattern renderers used), `css/notes-body.css` (blocks used), `notes.html` (`?v=`), `sw.js`, `validate.js` (`?v=`/cache), README/TODO ticks.
- **Checkpoint per stage:** screenshots of every topic in the stage at 1600×770 and 1366×768, with the tight topics listed first. Topics built in stages 3-7 are removed from the stage 0 baseline list; the checker now fails them on A-H.

### Stages 8-14: Visual aids, one PR each (register order)
| Stage | Aid | Topic |
|---|---|---|
| 8 | VA-01 vaccine lanes | T1.8 |
| 9 | VA-02 dosage icons | T1.10 |
| 10 | VA-03 MERP ladder | T2.7 |
| 11 | VA-04 conversion panels + thermometer | T3.2 |
| 12 | VA-05 NDC segments | T3.6 |
| 13 | VA-06 waste color map | T4.3 |
| 14 | VA-07 DEA check digit | T4.6 |

- **Files per stage:** `js/notes-va.js` (new at stage 8; sprite + one function per aid), `js/notes-layouts.js`, `css/notes-body.css`, `notes.html` (script tag at stage 8), `sw.js` ASSETS, README.
- **Checkpoint:** each aid is checked against its source rows line by line in the PR, and the screenshots go in the PR.

### Stage 15 (optional, Rob's choice, Q8): VA-R1 raster
- **Files:** `assets/notes/va-d3-measures.webp`, `css/notes-body.css`, `sw.js` ASSETS, README.
- **Checkpoint:** Rob and Grok Bot review the raster on screenshots. Drop it if it fights the theme.

### Dependencies
Stage 0 → 1 (independent of 2, may go in parallel with it) → 2 → 3-7 → 8-14 → 15. Stages 3-7 can be done in any order after 2. Visual-aid stages can be done in any order after 2, and each needs its own topic's domain stage only for tone (they do not depend on it technically, because the interim render uses the legacy path).

---

## 8. Risks and open questions

### 8.1 Risks
| # | Risk | Mitigation |
|---|---|---|
| R1 | Headless Linux measurements differ from Rob's Windows Chrome by about ±8%, and the real viewport may be about 735 px high (screenshots show the bookmarks bar). | Content target of at most 430 px (92%). Dense fallback. A 1600×736 stress run in the harness. Q1 asks Rob for one real number. |
| R2 | `css/notes.css` is shared with Course. | All new CSS is in `css/notes-body.css`, loaded only by `notes.html`. The only `notes.css` edits are `.nx-topic-content` and `.nx-empty-topic`, neither of which Course uses (Course still gets a `?v=` bump because the file changed). Frozen-class list in section 0.1. |
| R3 | Spec is keyed by topic title; a later content PR that renames a title would silently fall back to legacy. | `validate.js` asserts every title in `notes.json` has a spec or is on the interim list, and every spec title exists. |
| R4 | Splitting items could drop or duplicate words. | The word-multiset coverage test (check F) runs on all 40 topics at both viewports. |
| R5 | Seven topics are tight (section 3.1). | Verified first in their stage, dense tier ready, real scroll under 30 px allowed for the three tightest (Q9). |
| R6 | Brand/generic area ordering implies class facts that six pairs do not support inside the file. | Q3. The stage PR cites DailyMed or the FDA label (AUDIT_RUBRIC approved sources) for those six, or flags "verify". |
| R7 | Source rows repeat content across topics (Double-check in T2.1, T2.2, T2.8; formulas in T3.3 and T3.9; alligation in both). The notes also print abbreviations such as QHS, QID, QAM, and UD as study content. Whether any of them is on the ISMP list was **not verified in this planning pass**. | Left untouched (content is signed off). Q12 asks whether to log them as a separate content audit item. |
| R8 | Raster art may not match the Matrix theme. | Optional, last, reviewed on screenshots, droppable without touching VA-04. |
| R9 | `T1.5` is a literal-instruction conflict (Rob said "same as Brand/Generic"). | Both layouts are specified and Q2 asks before any build. |
| R10 | Search results use `renderSectionContent` with filtered items, so index-based specs do not apply. | Search keeps the legacy renderers (Q13). |

### 8.2 Decisions for Rob (pick one letter each; the default is the recommendation)
**Q1. Which viewport governs the fit budget?** (Your screenshots show the Notes body about 456 px tall, against 486 px measured here at 770.)
A. 1600×770 is the standard; keep the 430 px content target, which also survives a 736 px viewport. **(recommended)**
B. Design for 736 px as the primary.
C. Paste the value of `document.querySelector('.nx-topic-content').clientHeight` from your Chrome with a domain open, and I set the target from that.

**Q2. T1.5 OTC layout.**
A. One 3-column padded table with the antihistamine note spanning three rows (fits, no dead space). **(recommended)**
B. Literally the same as Brand/Generic: two side-by-side sets of 3 columns (about 200 px of bottom dead space).

**Q3. T1.3 Brand/Generic order.**
A. By therapeutic area, no labels shown, with sourced class evidence in the PR (and "verify" for the six pairs listed in section 3). **(recommended)**
B. Keep source order.
C. Alphabetical by brand.
D. By area with small area labels (needs sourced new label text).

**Q4. New structural labels** (panel, band, and column header words that add no facts, for example `Volume`, `Routes`, `Inhalation`, `CLASS (STEM)`).
A. Allowed, kept short, listed per topic in each stage PR for your approval. **(recommended)**
B. Only words that appear verbatim in `notes.json` for that topic.

**Q5. Reading order across two table sets.**
A. Down set A, then down set B (column-major). **(recommended)**
B. Row by row across both sets.

**Q6. Very sparse topics (T1.9, T2.5, T3.4) and the one-row-short set in T1.3.**
A. Stretch rows up to 1.35×, then center the group so spare space splits above and below. **(recommended)**
B. Top-align and accept bottom space.
C. Stretch fully, whatever the row height becomes.

**Q7. Cross-domain prev/next scope.**
A. Both the top and bottom bars cross domains, so they never disagree. **(recommended)**
B. Only the bottom bar crosses (literal reading); the top stays within a domain.

**Q8. Raster art.**
A. None; code-built aids only. **(recommended)**
B. VA-R1 household measures for T3.2 (optional stage 15).

**Q9. If a tight topic still overflows on your real fonts (T4.5, T4.1, T4.8 at 1366).**
A. Allow a small real scroll with a bottom fade. **(recommended)**
B. Allow 0.88rem body text on those topics, documented in UI_STANDARDS like the lesson shrink-to-fit rule.

**Q10. Display capitalization of a lowercase body start after a label is lifted out** (for example "frozen (-50°C to -15°C)" shown as "Frozen ...").
A. Capitalize the first letter for prose only, display-only. **(recommended)**
B. Leave as stored.

**Q11. Arrow keys for prev/next** (ignored while a dropdown or field is focused).
A. Yes. **(recommended)**
B. No keyboard shortcut.

**Q12. Duplicated rows across topics and the abbreviations printed as study content.**
A. Leave as is; log a separate content-audit follow-up in TODO.md. **(recommended)**
B. Do nothing further.

**Q13. Search results (typing in the search box).**
A. Keep the current renderers for search; the redesign applies to reading mode only. **(recommended)**
B. Redesign search results later, as their own item.

---

PLAN COMPLETE: awaiting approval.
