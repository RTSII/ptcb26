# UI standards

Locked rules for UI edits and new components or templates. Home is the reference look.

1. **Viewport fit (Chrome laptop)**. Content-hug cards. Dense only as needed. A card fills most or all of the viewport (at least ¾). Kill side and bottom dead space. Tight padding, including the card bottom and the buttons, out to the screen edge. Body type stays laptop-readable (no squint). Kill phantom overflow (a few pixels of scroll). Short pages never scroll. Real vertical scroll only when dense content genuinely overflows.
2. **Organic shapes**. Cards and triggers are not limited to rounded rectangles or bento blocks. Reactor consoles, chamfered pods, and targeting reticles are in bounds. Measure from the center, with even padding. Tightness follows #1. Translucent radial glass is for interactive cores so Matrix rain shows through.
3. **Physical metaphors**. Cards with a real counterpart (flashcards) follow the tool: Rolodex tab, stepped deck shadow, spindle notch. Functional badges and actions only.
4. **Header (3-zone grid)**. `1fr auto 1fr` on every subpage. Far left: Red Pill / Blue Pill mark (`38px × 32px`) + `PTCE 2026`. Center: page title + icon. Far right: contextual nav (`‹ Home`, `‹ Course`, or a utility).
5. **Legibility**. No wall-of-green body text. Matrix-cohesive with Home (obsidian-green fills, chamfered panels, mint/cyan accents). Slate is not an end state. Cooler or neutral accents are OK on dense Notes / Course / Exam prose when contrast needs them. Proportional sans for paragraphs. `JetBrains Mono` for stems, codes, doses, ratios, formulas. Phosphor green / mint / cyan mark keys, stems, active state, and telemetry.
6. **Parenthesis-safe parsing**. Clinical text nests semicolons and parentheses (`Tylenol = acetaminophen (max 4,000 mg/day; hepatotoxic in overdose).`). Split on semicolons with `splitOutsideParens` so parenthetical notes are never cut into orphan chips.
7. **Purpose-built layouts**. Match the structure. Do not dump everything into bullets.
   - Brand / generic: 2-column table (`BRAND NAME` | `GENERIC NAME`).
   - OTC actives: 3-column table (brand | ingredient | class and pearls).
   - Abbreviations and conversions: compact chart, list, or token grid (`ABBREVIATION` ➔ `CLINICAL TRANSLATION`).
   - Schedules and specs: 2-column table (classification | mechanisms and pearls).
   - Procedures and laws: briefing cards, `#01` index chips, bold tags, Matrix-cohesive with the page.
8. **One control per job**. Remove instructional filler above the content. Merge a duplicate nav or filter bar into the card it controls. No "x of y" when a dropdown or indicator already shows position. No second prev/next set in the same area. Combine and edit to cut redundancy. This does not force everything into one card. Notes target: domain rail + topic stage (`study_notes_v4_plan.md`).
9. **Action row**. One row: Back or Prev far left, primary (Start, center control, or dropdown) center, Next far right. Primary CTAs sit centered in the card. Prefer icon-only prev/next where the meaning is obvious. Compact, consistent, on-theme. Same glyph style and size for the same action on every page.
10. **Centering**. Card titles and card icons are center-aligned by default, not only the header center zone.
11. **Accordion lists** (Notes and Course home). All cards closed on load. No auto-open and no restored open state. The idle list has top breathing room (Notes ~10vh; shrink it when that spacer would force extra scroll). Opening eases that spacer shut and pins the active card under the header. Other cards collapse to a slim fixed-order row so the active card fills the viewport. Course idle cards stay the narrow column; the active card expands to full width. Hide search and other secondary chrome while a card is open. The card title is centered in the accordion header; badges may stay at the sides. The page title and its icon live in the centered header zone and are not repeated in the body. In-card scroll or pagination is fine for dense content. Honor `prefers-reduced-motion`.
12. **Visual aids**. Prefer in-code charts, tables, compact lists, and SVG that replace repeated prose and save space (conversions as a chart or list). Decorative AI art is deferred and is never a substitute.
13. **Theme**. Matrix is primary on every surface.
    - Blend by surface: classic green rain, Neo-Zion industrial green, Resurrections cleaner neon.
    - Vaporwave is a light accent only (icons, small glows). Never co-equal. Not glowy-everything. Flashy only when the control is functional first.
    - Surfaces: obsidian `#010804`, emerald `#00ff41`, mint `#b6ffc9`. Cyan `#05d9e8` / `#38bdf8` and pink `#ff2a6d` stay small accents.
    - Cards over rain may be less opaque so the background shows, never at the cost of legibility.
    - `css/matrix.css` is planned so Notes, Course, and Exam inherit Home. Not extracted yet.
    - Rain (`js/app.js`): quality over density — fade, placement, angle, perspective, and depth, not more glyphs. Katakana and hex columns, bright leads with white tips, darker green behind, fade toward the bottom, no static grid. Skip when `prefers-reduced-motion` is set.
14. **UI work sequence**. Lock these rules, test on the Chrome laptop viewport, then extras. After any service-worker cache bump, unregister the service worker and clear site data before judging UI.
