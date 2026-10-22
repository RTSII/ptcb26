# Agents

Read in this order:

1. This file, for standing rules and the pre-PR loop.
2. [TODO.md](TODO.md) **Next up**, for what to do, in that order.
3. [AUDIT_RUBRIC.md](AUDIT_RUBRIC.md) before any content audit or fact-fix.
4. [docs/general-ui-standards.md](docs/general-ui-standards.md), then [UI_STANDARDS.md](UI_STANDARDS.md), before any UI change. UI_STANDARDS extends general rules 1–12 with PTCB-only details.
5. [README.md](README.md) for how to run the app and the content rules.
6. [study_notes_v4_plan.md](study_notes_v4_plan.md) only for Notes content or the Notes theme overhaul.

Plans and briefs name the regions they touch, and the regions they do not touch, using **Named UI regions** in [UI_STANDARDS.md](UI_STANDARDS.md). Screen fit and the layout defaults are in [docs/general-ui-standards.md](docs/general-ui-standards.md).

Do not read `docs/archive/`. Those files are history.

## Cost & workflow rules (Rob, 2026-10-22)

0. Money and security rules outrank every process rule in this file. If the PR/merge workflow would ever need spending (on-demand credit, paid usage), stop and ask Rob.
1. No cloud or extra agents by default. PTCB makes code changes itself on its own computer, on a branch with a draft PR. A cloud agent needs Rob's explicit OK for each launch and each follow-up or reply, and the ask must say it bills on-demand.
2. Any usage, credit, or billing error is a hard stop: halt, report to Rob, and don't retry, launch, or reply to agents until he says so.
3. Before any merge ask, PTCB renders screenshots itself at 1600x730 and 1366x768 (defaults for Rob's HP laptop in Chrome) and shows them.
4. Merges are unchanged: Rob OKs each one; then mark ready, squash-merge, and fast-forward the current station.

- Notes tables default to alphabetical order; selective ordering only when it drastically reduces scroll or page count. Size columns to content with even padding and split spare width evenly; don't shrink font to fit, fix column widths first. These are best-practice defaults, not hard constraints.

## Frontend edits

1. Docs first: before any edit to existing frontend code or page content, read this file, [docs/general-ui-standards.md](docs/general-ui-standards.md), [UI_STANDARDS.md](UI_STANDARDS.md), [README.md](README.md), and that page's HTML, CSS, and JS once. Reuse existing classes and patterns. No new layout unless Rob asked for one.
2. Every agent, including subagents and parallel agents: research and gather, then plan, then execute only the requested task, then stop and report. No free rein. No extra scope.
3. Content PRs are UI PRs. Screenshot every touched page at 1600×770 (1366×768 secondary). Confirm each is contained, padded, and free of clipping, spill, and wasted width. Put the screenshots in the report.
4. When Rob names a specific approach, follow it literally and ask before deviating. When he does not name a route or area, use best judgment within the requested scope, after the docs-first read, with no destructive actions, and state the chosen approach in the report.
5. Grok Bot reviews screenshots before any merge, including standing-approval merges. Passing numbers alone do not count.

- Do not merge without Rob's explicit approval.
- Do not commit v2 `notes.json` until the blocks runtime ships with it. Keep that file outside `data/` until then.
- No silent clinical fact edits.
- **Sourced facts only.** When researching or adding/rewriting study content in this repo (course, notes, quiz, flashcards), every clinical, drug, legal, or numeric claim must be checked against an approved source listed in [AUDIT_RUBRIC.md](AUDIT_RUBRIC.md) and cited in the PR. Never write facts from model memory alone. If it can't be verified, leave it out or flag it as verify. Never invent stems, patterns, mnemonics-as-facts, or numbers.
- Prefer standard pharmacy abbreviations after a term's first mention in a lesson (tab/tabs, cap, mL, mg, mcg, IR/ER, PO). Do not abbreviate every word, invent forms, or use ISMP error-prone abbreviations.
- Handoffs and prompts for another AI must be one paste-ready block, model-tailored and terse, with guardrails: touch only the task files, no destructive git, no merge without Rob's OK, preserve shared data/keys/styles, and run the verify loop.
- This is a personal study app for Rob's sole use. Add no legal or medical disclaimers or hedging to content or UI, and don't hold back development over legal concerns. Accuracy comes from sourcing, not disclaimers.
- **Docs on sign-off.** For non-trivial work (new features, new UI rules, multi-file changes, finished TODO items), once Rob signs off on the screenshots or current state, update the affected docs IN THE SAME PR before asking for the merge OK.
  - TODO/status: tick done items, add follow-ups, keep the priority order.
  - `docs/general-ui-standards.md` and `UI_STANDARDS.md`: any new standing UI rule, one line, no duplicates. README or plan files only if this work changed them.
  - Edit only docs related to this PR. No docs-only PRs for work that has its own PR. No doc edits for unrelated or in-progress work.
  - Skip this for small tweaks (copy, color nudge, one-line fix, cache bump). Keep few doc files and don't overload them.
  - Update the README Directory structure tree when files are added, removed, or renamed.

## Verify before PR

On every code change, run this loop before asking for review. In the PR description, record only failures found, what was fixed, and any open flags or known limits. No running log file.

- `node validate.js`. It checks schema, IDs, domain names, and a few copy assertions, then runs `check-containment.js`. That loads every lesson at 1600×770 (primary) and 1366×768 (secondary). It fails if a key-points panel or a lesson-card child clips or overflows its container border, or if the reading region shows a scrollbar that does not reveal text. It is not a content sign-off.
- Serve locally and load every touched page, plus Home. No console errors.
- Exercise the touched feature end to end (start an exam, resume a lesson, flip a card).
- Check page fit at 1600×770 and 1366×768, empty and heavy. Glance screens do not page-scroll. See [docs/general-ui-standards.md](docs/general-ui-standards.md) and [UI_STANDARDS.md](UI_STANDARDS.md). Rob's Chrome viewport is 1600×770 on a 1600×900 screen at 100% scaling. 1366×768 is the secondary check.
- If assets changed, bump the service worker cache to the next version, and the matching check in `validate.js`.
- Quick regression check of pages that share the touched CSS or JS.
- Fix and re-run until this is clean.

## Git rules: two stations

1. GitHub is the source of truth. All changes go through a branch and a PR. The local copies on the Cube and the HP laptop are test copies: pull-only, with no edits or commits made in them.
2. Sync before testing. Before any test on a machine, git fetch and confirm the copy matches origin/main (or the PR branch under test). If it's behind, run git pull --ff-only. If it's dirty or has diverged, stop and report to Rob. No force, reset, or stash.
3. After a merge, update the machine Rob is currently on. The other machine catches up the next time he uses it (rule 2).
4. Testing a PR locally means checking out that PR's branch in the local copy, then switching back to main afterward. Results record the machine name and the commit SHA tested.
5. Machine-generated files stay out of git: logs, build output, local data, and libraries go in .gitignore. Each machine's repo path is recorded in the project's station notes.
6. One agent at a time runs git commands on a given local copy.

### Stations

- Cube mini PC (host CUBE): C:\Users\rtsii\Desktop\PTCB26, served with python -m http.server 8000 --bind 127.0.0.1 from the repo root.
- HP laptop: C:\Users\rtsii\Desktop\ptcb26, same serve command.
