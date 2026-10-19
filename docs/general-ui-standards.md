# Rob's General UI Standards (apps and tools)

Status: approved by Rob 2026-10-19. Owner: PTCB (drafted), shared by all agents.

## Scope
- Applies to all of Rob's apps and tools, e.g. PTCB26 (PWA), REF2IMG (local web app), Decanter (native .NET Windows app).
- Does NOT apply to websites, blogs, or portfolios unless Rob says so.
- Rules are written in stack-neutral behavior terms. Each project's own UI doc extends this file and adds only project specifics: target viewport/window sizes, theme, components, and implementation notes.

## Screen fit rule
1. **Glance screens always fit.** Main pages, hubs, home screens, and dashboards are for quick visual data. They fit entirely within the project's defined full-screen viewport/window, with no page-level scroll, in every data state (empty, typical, heavy).
2. **Reading screens scroll only inside their reading region.** Dense reading or study content (lessons, notes, long reference text) may scroll, but only within its own content region; the surrounding frame, header, and nav stay fixed.
3. **Growing content adapts in place.** A component whose content grows with data must not extend the screen. It caps items, uses fixed slots, scales, or pages within the component ("show more" or in-card paging).
4. **Readability floor.** Fitting never shrinks text or targets below a comfortable reading and click size for the target display. If content can't fit at that floor, adapt per rule 3 instead of shrinking further.
5. **Every component states its overflow strategy.** New or changed components document how they behave when content exceeds their space (cap, slot, scale, page, or scroll region).
6. **Check every data state.** Fit checks run at each project's target sizes with empty and heavy data, not only the default state.

## General practice
- Do only the requested change. Don't add unrequested features or redesign neighbouring UI.
- Content may be condensed to fit only if every pertinent fact stays.

## Override clause
In planning or overhaul stages, a rule here may be overruled when the agent gives a clear explanation of why. Outside those stages, follow the rules or ask Rob.

## References (not rules)
- Refactoring UI and similar design resources are reference material only. They aren't rules and aren't applied as a blanket guide.
