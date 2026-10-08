# Agents

Read [UI_STANDARDS.md](UI_STANDARDS.md) before any UI change.

- Do not merge without Rob's explicit approval.
- Do not commit v2 `notes.json` until the blocks runtime ships with it. Keep that file outside `data/` until then.
- No silent clinical fact edits.
- **Docs on sign-off.** For non-trivial work (new features, new UI rules, multi-file changes, finished TODO items), once Rob signs off on the screenshots or current state, update the affected docs IN THE SAME PR before asking for the merge OK.
  - TODO/status: tick done items, add follow-ups, keep the priority order.
  - `UI_STANDARDS.md`: any new standing UI rule, one line, no duplicates. README or plan files only if this work changed them.
  - Edit only docs related to this PR. No docs-only PRs for work that has its own PR. No doc edits for unrelated or in-progress work.
  - Skip this for small tweaks (copy, color nudge, one-line fix, cache bump). Keep few doc files and don't overload them.
