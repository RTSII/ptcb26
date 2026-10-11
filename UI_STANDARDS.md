# UI standards

Locked rules for UI edits and new components or templates. Home is the reference look.

1. **Viewport fit (Chrome laptop)**. Primary viewport is 1600×770 (1600×900 screen at 100% scaling). Secondary is 1366×768. Content-hug cards. Dense only as needed. A card fills most or all of the viewport (at least ¾). Kill side and bottom dead space. Tight padding, including the card bottom and the buttons, out to the screen edge. Body type stays laptop-readable (no squint). Kill phantom overflow (a few pixels of scroll). Short pages never scroll. Real vertical scroll only when dense content genuinely overflows.
2. **Organic shapes**. Cards and triggers are not limited to rounded rectangles or bento blocks. Reactor consoles, chamfered pods, and targeting reticles are in bounds. Measure from the center, with even padding. Tightness follows #1. Translucent radial glass is for interactive cores so Matrix rain shows through.
3. **Physical metaphors**. Cards with a real counterpart (flashcards) follow the tool: Rolodex tab, stepped deck shadow, spindle notch. Functional badges and actions only.
4. **Header (3-zone grid)**. `1fr auto 1fr` on every subpage. Far left: Red Pill / Blue Pill mark (`38px × 32px`) + `PTCE 2026`. Center: page title + icon. Far right: contextual nav (`‹ Home`, `‹ Course`, or a utility). Page header title = Orbitron 700 ~26px, #00ff41, soft green glow, defined once via shared tokens.
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
11. **Accordions**. Closed on page load. No auto-open. Do not restore an open state on load, unless Rob asks otherwise. Notes only: the idle list has ~10vh of top breathing room; opening eases that spacer shut and pins the active card under the header; other cards collapse to a slim fixed-order row so the active card fills the viewport; hide search while one is open; in-card scroll or pagination is fine. Honor `prefers-reduced-motion`. Course: four domain accordions match Notes (same names, weights, and badges), closed on load, with the same ~10vh idle spacer and the same 20px gap between cards. Opening one shows the Notes domain-pill row, moves that domain to the top, and lists its modules and lessons in order inside it; the other three stay collapsed cards below it. The domain header is the same height open or closed, and the full domain name stays visible. The course list shows one centered Resume button (`Resume "<lesson title>"`, or `Start "<first lesson title>"` when nothing is saved) in place of a progress card.
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
17. **Lesson body fit**. If the reading region overflows by about 60px or less, step bullet text down to 0.92 until it fits; if it still overflows, leave it full size and scroll. Reporting Programs & Recalls, Pharmacist Intervention & Immunization Workflow (VIS / VAERS), Common SIG Codes & Abbreviations, and Controlled Substance Schedules may also step the title and intro down to 0.52 (margins with them only if the type alone still overflows), up to about 100px of overflow. Key points and buttons stay full size. Body text does not go below 0.92.

## Named UI regions

One line per region: name, page, locator, what it contains. Locators are the live nodes in that page's HTML or JS.

- Home header | home | `body.home header.hx-header` | Wordmark
- Home mode grid | home | `nav.hx-grid` | Study Course, telemetry, Quiz, Practice Exam, Flashcards, Notes, Dashboard
- Home course card | home | `#hxCourseLink` | Study Course entry, next lesson, completion ring, domain bars
- Home telemetry | home | `section.hx-tele` | Quiz accuracy, counts, blueprint weights
- Home quiz card | home | `a.hx-quiz` | Quiz Mode entry
- Home exam card | home | `a.hx-exam` | Practice Exam entry and best score
- Home flashcard card | home | `a.hx-flash` | Flashcards entry
- Home notes card | home | `a.hx-notes` | Study Notes entry
- Home dashboard core | home | `#homeProgress` | Dashboard entry and live counts
- Course header | course list | `body.course header.app-header` | Wordmark, Study Course title, Home
- Course list | course list | `#courseList` | Resume control and the domain accordions
- Course resume | course list | `.course-resume` | Start or Resume link for the saved lesson
- Course domain pill row | course list | `#courseList .nx-domain-switch` | D1–D4 chips; only while a domain is open
- Course domain accordion | course list | `#courseList .nx-domain-card` | Domain header; its modules and lessons when open
- Course module | course list | `.course-module` | Title, description, progress, lesson links, domain quiz button
- Lesson card | course lesson | `#lessonView` | The open lesson
- Lesson title | course lesson | `#lessonView .lesson-title-main` | Centered lesson title
- Lesson intro | course lesson | `#lessonView .lesson-intro` | Italic intro under the title
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
- Notes topic nav | notes | `.nx-topic-card-top` | Previous, topic selector, next
- Notes topic selector | notes | `.nx-topic-select` | Topic dropdown in the top nav
- Notes topic body | notes | `.nx-topic-content` | Scrollable notes inside the topic card
- Notes bottom nav | notes | `.nx-topic-nav-bottom` | Previous, point count, next
- Notes search | notes | `#notesSearch` | Filter under the accordions; hidden while a domain is open
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
- Exam setup rail | exam setup | `#examSetup .xs-rail` | Steak Dinner and Enter the Construct
- Exam screen | exam | `#examScreen` | Progress, timer, question, previous, next, submit
- Exam question card | exam | `#examQuestionCard` | Domain, stem, choices
- Exam result | exam | `#examResultScreen` | Scaled score and domain breakdown
- Flashcard filters | flashcards | `#filterRow` | Domain and bookmarked pills (`.pill`)
- Flashcard stage | flashcards | `#cardArea` | Card, side arrows, counter, grade buttons
- Flashcard | flashcards | `#flashcard` | Front prompt (`#frontText`) and back answer (`#backText`)
- Flashcard actions | flashcards | `#cardArea .card-actions` | Flip, knew it, didn't know, bookmark
- Flashcard counter | flashcards | `#counter` | Place in the deck
- Dashboard stats | dashboard | `body.dashboard .stats-grid` | Quizzes, average, cards, exams
- Dashboard focus | dashboard | `#weakDomain` | Weakest domain or subtopic
- Dashboard focus actions | dashboard | `.focus-actions` | Review missed, bookmarked, weakest domain, weakest subtopic
- Dashboard focus clears | dashboard | `.focus-clear` | Clear missed and clear bookmarks
- Dashboard weights | dashboard | `.dash-weights` | PTCE domain weight bars (`#weightBars`)
- Dashboard accuracy | dashboard | `#domainAccuracy` | Accuracy by domain
- Dashboard trend | dashboard | `#trendChart` | Quiz score trend
- Dashboard quiz history | dashboard | `#quizHistory` | Recent quizzes
- Dashboard exam history | dashboard | `#examHistory` | Best practice exam
- Dashboard backup | dashboard | `#exportBtn` | Export progress; `#importFile` sits in the same card
- Dashboard reset | dashboard | `#resetBtn` | Clears all local progress
