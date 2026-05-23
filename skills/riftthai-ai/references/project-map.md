# RiftThai Project Map

## App Shell

- `src/routes/+layout.svelte`: layout entry.
- `src/routes/layout.css`: global visual system, mesh background, shared styling.
- `src/lib/components/AppNav.svelte`: main page top nav and mobile bottom nav for Gallery/Keywords/Phases.
- `src/lib/components/SiteMenu.svelte`: cross-page menu for Domains, Q&A, Official.
- `src/lib/components/AppFooter.svelte`: footer.

## Gallery

- `src/routes/+page.svelte`: main gallery state, filters, pagination, view modes, modal state.
- `src/routes/+page.server.ts`: card data load and query param handoff.
- `src/lib/components/SearchBar.svelte`: search input, results count, set/type/domain filter controls.
- `src/lib/components/IconSelect.svelte`: reusable custom select with optional icons.
- `src/lib/components/CardGrid.svelte`: card thumbnail grid.
- `src/lib/components/Pagination.svelte`: pagination controls.
- `src/lib/components/EmptyState.svelte`: no-results state.
- `src/lib/components/CardModal.svelte`: card popup, image, ability rendering, edit mode.

## Data And Helpers

- `src/lib/data/riftbound_cards_all.json`: main card dataset.
- `src/lib/types/card.ts`: card shape.
- `src/lib/utils/cardImages.ts`: optimized image URL and srcset helpers.
- `src/lib/data/domainIcons.ts`: domain icon mapping.
- `src/lib/data/typeIcons.ts`: type icon mapping.
- `src/lib/data/rarityIcons.ts`: rarity icon mapping.
- `src/lib/data/keywords.ts`: keyword metadata and icon mappings.

## Informational Pages

- `src/routes/qa/+page.svelte`: rules Q&A page.
- `src/routes/domains/+page.svelte`: domain guide.
- `src/lib/components/KeywordSection.svelte`: keyword guide on main route.
- `src/lib/components/TurnPhasesSection.svelte`: turn phase guide on main route.

## Commands

- Type/Svelte diagnostics: `npm.cmd run check`
- Dev server, only when explicitly requested: `npm.cmd run dev`
- Current dev port check: `netstat -ano | Select-String -Pattern ':5173'`
