# Agents

Read in this order:

1. This file, for standing rules and the pre-PR loop.
2. [TODO.md](TODO.md) **Next up**, for what to do, in that order.
3. [AUDIT_RUBRIC.md](AUDIT_RUBRIC.md) before any content audit or fact-fix.
4. [UI_STANDARDS.md](UI_STANDARDS.md) before any UI change.
5. [README.md](README.md) for how to run the app and the content rules.
6. [study_notes_v4_plan.md](study_notes_v4_plan.md) only for Notes content or the Notes theme overhaul.

Do not read `docs/archive/`. Those files are history.

- Do not merge without Rob's explicit approval.
- Do not commit v2 `notes.json` until the blocks runtime ships with it. Keep that file outside `data/` until then.
- No silent clinical fact edits.
- **Sourced facts only.** When researching or adding/rewriting study content in this repo (course, notes, quiz, flashcards), every clinical, drug, legal, or numeric claim must be checked against an approved source listed in [AUDIT_RUBRIC.md](AUDIT_RUBRIC.md) and cited in the PR. Never write facts from model memory alone. If it can't be verified, leave it out or flag it as verify. Never invent stems, patterns, mnemonics-as-facts, or numbers.
- This is a personal study app for Rob's sole use. Add no legal or medical disclaimers or hedging to content or UI, and don't hold back development over legal concerns. Accuracy comes from sourcing, not disclaimers.
- **Docs on sign-off.** For non-trivial work (new features, new UI rules, multi-file changes, finished TODO items), once Rob signs off on the screenshots or current state, update the affected docs IN THE SAME PR before asking for the merge OK.
  - TODO/status: tick done items, add follow-ups, keep the priority order.
  - `UI_STANDARDS.md`: any new standing UI rule, one line, no duplicates. README or plan files only if this work changed them.
  - Edit only docs related to this PR. No docs-only PRs for work that has its own PR. No doc edits for unrelated or in-progress work.
  - Skip this for small tweaks (copy, color nudge, one-line fix, cache bump). Keep few doc files and don't overload them.

## Verify before PR

On every code change, run this loop before asking for review. In the PR description, record only failures found, what was fixed, and any open flags or known limits. No running log file.

- `node validate.js`. It checks schema, IDs, domain names, and a few copy assertions. It is not a content sign-off.
- Serve locally and load every touched page, plus Home. No console errors.
- Exercise the touched feature end to end (start an exam, resume a lesson, flip a card).
- Check phantom scroll at 1366×768 and 1920×1080. Real scroll only when dense content overflows. See [UI_STANDARDS.md](UI_STANDARDS.md).
- If assets changed, bump the service worker cache to the next version, and the matching check in `validate.js`.
- Quick regression check of pages that share the touched CSS or JS.
- Fix and re-run until this is clean.
