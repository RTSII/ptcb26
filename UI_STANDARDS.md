# UI standards

This file extends [docs/general-ui-standards.md](docs/general-ui-standards.md) (v2). General rules 1–12 apply. This file adds PTCB viewports, theme, header, lesson layout, regions, and page class. A PTCB rule that changes a general default names that rule and why ("How to use these rules" in the general file). Home is the reference look.

1. **Viewport (Chrome laptop)**. Primary viewport is 1600×770 (1600×900 screen at 100% scaling). Secondary is 1366×768. Dense only as needed. How full the main card is, and that controls hug their content, are general rules 7 and 12. Tight padding, including the card bottom and the buttons, out to the screen edge. Kill phantom overflow (a few pixels of scroll). Whether a page scrolls follows general rules 1–2 and the page classification below.
2. **Organic shapes**. Cards and triggers are not limited to rounded rectangles or bento blocks. Reactor consoles, chamfered pods, and targeting reticles are in bounds. Measure from the center, with even padding. Tightness follows general rule 7. Translucent radial glass is for interactive cores so Matrix rain shows through.
3. **Physical metaphors**. Cards with a real counterpart (flashcards) follow the tool: Rolodex tab, stepped deck shadow, spindle notch. Functional badges and actions only.
4. **Header (3-zone grid)**. `1fr auto 1fr` on every subpage. Far left: Red Pill / Blue Pill mark (`38px × 32px`) + `PTCE 2026`. Center: page title + icon. Far right: contextual nav (`‹ Home`, `‹ Course`, or a utility). Page header title = Orbitron 700 ~26px, #00ff41, soft green glow, defined once via shared tokens.
5. **Type roles**. No wall-of-green body text. Matrix-cohesive with Home (obsidian-green fills, chamfered panels, mint/cyan accents). Slate is not an end state. Cooler or neutral accents are OK on dense Notes / Course / Exam prose when contrast needs them. Proportional sans for paragraphs. `JetBrains Mono` for stems, codes, doses, ratios, formulas. Phosphor green / mint / cyan mark keys, stems, active state, and telemetry. Size and the readability floor are general rules 4 and 11.
6. **Parenthesis-safe parsing**. Clinical text nests semicolons and parentheses (`Tylenol = acetaminophen (max 4,000 mg/day; hepatotoxic in overdose).`). Split on semicolons with `splitOutsideParens` so parenthetical notes are never cut into orphan chips.
7. **Purpose-built layouts**. Match the structure. Do not dump everything into bullets.
   - Brand / generic: 2-column table (`BRAND NAME` | `GENERIC NAME`).
   - OTC actives: 3-column table (brand | ingredient | class and pearls).
   - Abbreviations and conversions: compact chart, list, or token grid (`ABBREVIATION` ➔ `CLINICAL TRANSLATION`).
   - Schedules and specs: 2-column table (classification | mechanisms and pearls).
   - Procedures and laws: briefing cards, `#01` index chips, bold tags, Matrix-cohesive with the page.
8. **Redundant controls**. One control per job is general rule 9. PTCB cuts: remove instructional filler above the content. Merge a duplicate nav or filter bar into the card it controls. No "x of y" when a dropdown or indicator already shows position. No second prev/next set in the same area. This does not force everything into one card. Notes target: domain rail + topic stage (`study_notes_v4_plan.md`).
9. **Action row**. Back left, primary center, Next right is general rule 8. On a lesson the nav row is Back, All Modules, Next. All Modules is the center locator, not the primary action. Mark complete and Test This Module stay their own centered row so those jobs are not the same control (general rule 9). A setup row's center may be that row's dropdown (question count, topic select) when the dropdown is the primary control. Prev and next may be icon-only where the meaning is obvious; general rule 10 still gives them an accessible name. The same action uses the same glyph, style, and size on every page.
10. **Centering**. Card titles and card icons are center-aligned by default, not only the header center zone.
11. **Accordions**. Closed on page load. No auto-open. Do not restore an open state on load, unless Rob asks otherwise. Notes only: the idle list has a ~10vh top band that holds the search bar; opening eases that band shut and pins the active card under the header; other cards collapse to a slim fixed-order row so the active card fills the viewport; hide search while one is open; in-card scroll or pagination is fine (general rules 2 and 3). Honor `prefers-reduced-motion`. Course: four domain accordions match Notes (same names, weights, and badges), closed on load, with the same ~10vh idle spacer and the same 20px gap between cards. Opening one shows the Notes domain-pill row, moves that domain to the top, and lists its modules and lessons in order inside it; the other three stay collapsed cards below it. The domain header is the same height open or closed, and the full domain name stays visible. The course list shows one centered Resume button (`Resume "<lesson title>"`, or `Start "<first lesson title>"` when nothing is saved) in place of a progress card. The ~10vh idle spacer changes general rule 7 (no large dead space): that band holds the Resume control and the Notes gap, and opening a domain gives the space back.
12. **Visual aids**. Prefer in-code charts, tables, compact lists, and SVG that replace repeated prose and save space (conversions as a chart or list). Decorative AI art is deferred and is never a substitute. Practice Exam setup is the Exam Setup console (`css/exam-setup.css`, `js/exam-setup.js`); shares and draw counts come from `EXAM_WEIGHTS` in `js/exam.js`.
13. **Theme**. Matrix is primary on every surface.
    - Blend by surface: classic green rain, Neo-Zion industrial green, Resurrections cleaner neon.
    - Vaporwave is a light accent only (icons, small glows). Never co-equal. Not glowy-everything. Flashy only when the control is functional first.
    - Surfaces: obsidian `#010804`, emerald `#00ff41`, mint `#b6ffc9`. Cyan `#05d9e8` / `#38bdf8` and pink `#ff2a6d` stay small accents.
    - Cards over rain may be less opaque so the background shows, never at the cost of legibility.
    - `css/matrix.css` is planned so Notes, Course, and Exam inherit Home. Not extracted yet.
    - Rain (`js/app.js`): quality over density — fade, placement, angle, perspective, and depth, not more glyphs. Katakana and hex columns, bright leads with white tips, darker green behind, fade toward the bottom, no static grid. Skip when `prefers-reduced-motion` is set.
14. **UI work sequence**. Lock these rules, test on the Chrome laptop viewport, then extras. After any service-worker cache bump, unregister the service worker and clear site data before judging UI. The code-change loop is **Verify before PR** in [AGENTS.md](AGENTS.md).
15. **Dashboard surface**. Dashboard cards are Resurrections glass: solid `#051318`, a faint `#00e5ff` top edge, white body text; titles, numbers, and bars are `#00ff41`, and average score and exams stay gold. The Dashboard page does not run the code rain.
16. **Contained sections**. Key points stay a right-side panel that grows to fit its items (no clip, no internal scroll); bullets wrap beside it and run full width below. Under ~900px the panel is full width above, in two columns. Re-check layout after content PRs.
17. **Lesson body fit**. This changes general rule 4 when the overflow is still small. If the reading region overflows by about 60px or less, step bullet text down to 0.92 until it fits; if it still overflows, leave it full size and scroll inside the reading region (general rule 2). Reporting Programs & Recalls, Pharmacist Intervention & Immunization Workflow (VIS / VAERS), Common SIG Codes & Abbreviations, and Controlled Substance Schedules may also step the title down to 0.52 of the row size (the header's bottom margin with it only if the type alone still overflows), up to about 100px of overflow. Key points and buttons stay full size. Body text does not go below 0.92. Those two floors clear a short scrollbar on the named lessons; past 0.92, rule 4 wins and the text stays full size.
18. **Lesson title row**. The domain pill and module label sit on the left of the lesson card's top row. The lesson title is centered in that same row, at most two lines; step its type down, then truncate, so it does not cover the pill or the label. The lesson intro stays in the data and is not shown. Bullets start under that row.

## Page classification

`check-page-fit.js` loads every top-level page at 1600×770 and 1366×768, first empty, then with heavy saved progress (general rule 6).

**Glance screens** (general rule 1):

- Home (`index.html`)
- Progress Dashboard (`dashboard.html`). This changes general rule 1: with live data the main region still scrolls. The fix is deferred in [TODO.md](TODO.md) because Rob may combine the Progress Dashboard with Home Telemetry.
- Quiz setup (`quiz.html` `#setup`)
- Exam setup (`exam.html` `#examSetup`)
- Course list, domain accordions closed (`course.html`)
- Notes domain list, accordions closed (`notes.html`)
- Flashcards (`flashcards.html`)

**Reading screens** (general rule 2). The frame, header, and nav stay fixed:

- Course lessons (`body.course.lesson-open`; scroll in `#lessonView .lesson-layout`)
- Notes topics (scroll in `.nx-topic-content`)

**Other screens:**

- Course list with one domain open (`#courseList .nx-domain-open`): index of that domain's modules and lessons. Not a glance screen and not the lesson reading region.
- Quiz question (`#quiz`) and quiz results (`#results`). The header stays fixed. A long stem or the review list scrolls inside `main.container`.
- Exam question (`#examScreen`) and exam result (`#examResultScreen`). Exam Setup is the glance screen. The question and the result are separate screens on `exam.html`.

## Named UI regions

One line per region: name, page, locator, what it contains. Locators are the live nodes in that page's HTML or JS.

- Home header | home | `body.home header.hx-header` | Wordmark
- Home mode grid | home | `nav.hx-grid` | Desktop (≥900px): the grid is a size container with equal 22% side columns: Practice Exam ring left, telemetry helix right. Study Course is the centered anchor under the logo: 52cqw wide × min(52cqh, 26cqw) tall (landscape, about 805×349 at 1600×770). Below it, with a gap of clamp(24px, 6.5%, 56px), Flashcards (24cqw, main's 421:251 index-card shape) starts about 40px right of the ring, and Notes (25.5cqw, 2.25:1, wider and shorter) ends just past the course's right edge, short of the helix. The gap between them is a deliberate offset. The stack is centered vertically, so leftover height becomes space under the header divider and above the footer. Tablet and phone stack the cards; the ring comes last
- Home course card | home | `#hxCourseLink` | Study Course entry; next lesson wraps to two balanced lines (66ch) so the longest lesson name reads whole; four domain bars in one row
- Home telemetry helix | home | `section.hx-helix` | Right-column card helix, untitled: avg quiz score, counts, blueprint weights; each card links to the Dashboard section that shows the same number. Cards stay well short of the column width. Cards follow a true helix (Framer Helix3DCarousel model: STEP 44° per slot, flat front card, side swing, twist, shrink, fade; tunables STEP, FADE_IN/FADE_OUT and the radius cap in `initHelix`). Cards sit in flat z-order (no preserve-3d), so a card never cuts through the one in front; spacing is wider at the middle. Style: shared neon standard (`--neon-blue` #00e5ff, `--neon-red` #c90a1d (bold danger red), `--neon-glass-a/b`, `--neon-dim` in style.css) from the Quiz Mode card; the 1px border is hollow at the ends and fills like liquid from the top/bottom edge midpoints to the side midpoints as a card reaches the middle, then drains in reverse; numbers are neon blue and red when 0, 0% or a dash. It is Home's only Dashboard entry
- Home flashcard card | home | `a.hx-flash` | Flashcards entry
- Home notes card | home | `a.hx-notes` | Study Notes entry
- Home exam ring | home | `#homeExam` (`a.hx-dash-core`) | Practice Exam entry, centered in the left column: reactor ring min(18.5cqw, 44cqh) (about 271px reactor at 1600×770, 229px at 1366×768), links to `exam.html`. Ring text scales with the reactor (cqmin): tag SIMULATION // 03 (4cqmin, at least 9px, no letter-spacing), stacked PRACTICE / EXAM (6.8cqmin), BEGIN → (4.4cqmin, at least 10px). The text block sits slightly low (translateY 3.4cqmin). Every line stays inside the inner pink arc with at least 4px clear
- Course header | course list | `body.course header.app-header` | Wordmark, Study Course title, Home
- Course list | course list | `#courseList` | Resume control and the domain accordions
- Course resume | course list | `.course-resume` | Start or Resume link for the saved lesson
- Course domain pill row | course list | `#courseList .nx-domain-switch` | D1–D4 chips; only while a domain is open
- Course domain accordion | course list | `#courseList .nx-domain-card` | Domain header; its modules and lessons when open
- Course module | course list | `.course-module` | Title, description, progress, lesson links, domain quiz button
- Lesson card | course lesson | `#lessonView` | The open lesson
- Lesson meta | course lesson | `#lessonView .lesson-header-meta` | Domain pill and module label, left side of the top row
- Lesson title | course lesson | `#lessonView .lesson-header .lesson-title-main` | Lesson title centered on the top row (at most two lines)
- Lesson layout | course lesson | `#lessonView .lesson-layout` | Key-points panel and bullet body
- Lesson key points panel | course lesson | `#lessonView .key-points` | Right-side key points
- Lesson body | course lesson | `#lessonView .lesson-body` | Lesson bullets
- Lesson actions | course lesson | `#lessonView .lesson-actions` | Mark complete and Test This Module
- Lesson nav | course lesson | `#lessonView .lesson-nav` | Back, All Modules, Next
- Notes header | notes | `body.notes header.nx-header` | Wordmark, Study Notes title, Home
- Notes domain list | notes | `#notesArea` | Closed domain accordions, or the open domain
- Notes domain pill row | notes | `#notesArea .nx-domain-switch` | D1–D4 chips; only while a domain is open
- Notes domain accordion | notes | `#notesArea .nx-domain-card` | Domain header and, when open, the topic card
- Notes topic card | notes | `.nx-topic-card` | Top nav, topic body, and bottom nav
- Notes topic nav | notes | `.nx-topic-card-top` | Previous, topic selector, next. Prev and next cross into the adjacent domain.
- Notes topic selector | notes | `.nx-topic-select` | Topic dropdown in the top nav
- Notes topic body | notes | `.nx-topic-content` | Scrollable notes inside the topic card
- Notes bottom nav | notes | `.nx-topic-nav-bottom` | Previous, point count, next. Same cross-domain prev and next as the top bar.
- Notes search | notes | `#notesSearch` | Filter in the idle top band above the accordions (`.nx-top-filter-wrap`); band folds shut and search is hidden while a domain is open
- Quiz header | quiz | `body.quiz header.app-header` | Wordmark, Quiz title, Exit, Home
- Quiz setup | quiz | `#setup` | Mode, question count, chapter fields, Start
- Quiz card | quiz | `#quiz` | Progress, stem, choices, previous and next
- Quiz stem | quiz | `#qtext` | Question text
- Quiz choices | quiz | `#choices` | Answer buttons (`.choice`)
- Quiz results | quiz | `#results` | Score and review
- Quiz exit dialog | quiz | `#exitDialog` | Leave-quiz confirm
- Exam setup | exam setup | `#examSetup` | Length, timer, reactor, draw, start
- Exam length | exam setup | `#lenGroup` | Length choices
- Exam reactor | exam setup | `#reactor` | Question count and clock
- Exam timer pick | exam setup | `#timGroup` | Timer choices
- Exam draw | exam setup | `#domList` | Questions per domain
- Exam setup rail | exam setup | `#examSetup .xs-rail` | Steak Dinner and Enter the Construct: two separate see-through gel capsules (200x62, about 3.2:1; blue and red, tinted glass with a faint top highlight and colored glow), no socket or background behind them. Style is `.xs-pill` in `css/exam-setup.css`; the plan is to reuse it for the app-wide header if Rob likes it
- Quiz Mode holo panel | exam setup | `#xqPanel` (switch `#xqOpen`) | A hollow HUD square "Mode" button (`#xqOpen`, top right of the Exam Setup header, overhangs the dotted divider) is press-and-hold: its discrete chamfered border segments (corner brackets, notched side jogs, center bars) trace in, then an octagon fill rises, then it locks solid; no text label (aria-label only) and the cyan holo panel projects over the setup slab (same footprint). The panel's own Mode button (`#xqClose`) sits in the same spot and closes it. Hover shows the hollow neon border only; pressing fills it. Focus rings are never white (Mode button, tiles, chips use cyan glow). Only the selected mode tile glows and animates; hover is subtle. Picking a chapter chip auto-selects Chapter Test. Header, labels, chapter chips and status in the panel are center-aligned (card default). Minimal options: mode tiles (Quick 10, Chapter Test, Missed, Bookmarked, Weakest), a chapter row that is live only for Chapter Test, and its own Back to Exam and Start Quiz capsules. Start opens `quiz.html?mode=...&go=1` (and `&domain=` for a chapter), which now auto-starts on `go=1`. Esc or the switch closes it. Reduced motion gets no animation.
- Exam screen | exam | `#examScreen` | Progress, timer, question, previous, next, submit
- Exam question card | exam | `#examQuestionCard` | Domain, stem, choices
- Exam result | exam | `#examResultScreen` | Scaled score and domain breakdown
- Flashcard filters | flashcards | `#filterRow` | Domain and bookmarked pills (`.pill`)
- Flashcard stage | flashcards | `#cardArea` | Card, side arrows, counter, grade buttons
- Flashcard | flashcards | `#flashcard` | Front prompt (`#frontText`) and back answer (`#backText`)
- Flashcard actions | flashcards | `#cardArea .card-actions` | Flip, knew it, didn't know, bookmark
- Flashcard counter | flashcards | `#counter` | Place in the deck
- Dashboard stats | dashboard | `body.dashboard .stats-grid` | Quizzes, average, cards, exams
- Dashboard accuracy | dashboard | `#domainAccuracy` | Accuracy by domain
- Dashboard trend | dashboard | `#trendChart` | Quiz score trend
- Dashboard quiz history | dashboard | `#quizHistory` | Recent quizzes
- Dashboard exam history | dashboard | `#examHistory` | Best practice exam
- Dashboard backup | dashboard | `#exportBtn` | Export progress. Reset (`#resetBtn`) is in the same card.
- Dashboard reset | dashboard | `#resetBtn` | Clears all local progress
