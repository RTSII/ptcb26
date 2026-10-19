# Rob's General UI Standards (apps and tools)

Status: approved by Rob 2026-10-19; v2 adds "How to use these rules" and layout/navigation defaults 7–12, approved by Rob 2026-10-19 6:54 PM ET. Owner: PTCB (drafted), shared by all agents.

## Scope
- Applies to all of Rob's apps and tools, e.g. PTCB26 (PWA), REF2IMG (local web app), Decanter (native .NET Windows app).
- Does NOT apply to websites, blogs, or portfolios unless Rob says so.
- Rules are written in stack-neutral behavior terms. Each project's own UI doc extends this file and adds only project specifics: target viewport/window sizes, theme, components, and implementation notes.

## How to use these rules

  - These are best-practice defaults, not constraints. They guide decisions; they don't limit what options an agent may suggest or pick.
  - When a rule conflicts with a project's needs, a decision, or another rule, the agent names the conflict and explains it to Rob, with a recommendation, instead of silently following or ignoring the rule.
  - A project doc may change a default for its own stack or design (for example a native Windows app), as long as it says which rule and why.

## Screen fit rule
1. **Glance screens always fit.** Main pages, hubs, home screens, and dashboards are for quick visual data. They fit entirely within the project's defined full-screen viewport/window, with no page-level scroll, in every data state (empty, typical, heavy).
2. **Reading screens scroll only inside their reading region.** Dense reading or study content (lessons, notes, long reference text) may scroll, but only within its own content region; the surrounding frame, header, and nav stay fixed.
3. **Growing content adapts in place.** A component whose content grows with data must not extend the screen. It caps items, uses fixed slots, scales, or pages within the component ("show more" or in-card paging).
4. **Readability floor.** Fitting never shrinks text or targets below a comfortable reading and click size for the target display. If content can't fit at that floor, adapt per rule 3 instead of shrinking further.
5. **Every component states its overflow strategy.** New or changed components document how they behave when content exceeds their space (cap, slot, scale, page, or scroll region).
6. **Check every data state.** Fit checks run at each project's target sizes with empty and heavy data, not only the default state.

## Layout and navigation defaults

7.  **Main content fills the screen.** The main card or content area fills most of the window (at least about three-quarters, edge to edge in practice), with no large dead space at the sides or bottom.
8.  **Nav order is consistent.** In a footer or action row, Back sits on the left, the primary action (Start, Submit, Mark Complete) sits in the center, and Next sits on the right. Primary actions are centered.
9.  **One control per job.** Each choice is made in one place. Don't add a second menu, submenu, or greyed-out field that duplicates or can't change an existing control.
10. **Compact, consistent icons.** Icons come from one set at one size and style, with small consistent targets. Icon-only buttons get a text label for accessibility. Secondary actions like Clear stay compact (for example a trash icon).
11. **Readable type.** Body text is set comfortably larger than browser or OS minimums for the target display, and hierarchy comes from weight and color rather than tiny text.
12. **Controls hug their content.** Dropdowns and buttons are sized to their content and centered in their row, not stretched or scattered.

## General practice
- Do only the requested change. Don't add unrequested features or redesign neighbouring UI.
- Content may be condensed to fit only if every pertinent fact stays.

## Override clause
In planning or overhaul stages, a rule here may be overruled when the agent gives a clear explanation of why. Outside those stages, follow the rules or ask Rob.

## References (not rules)
- Refactoring UI and similar design resources are reference material only. They aren't rules and aren't applied as a blanket guide.
