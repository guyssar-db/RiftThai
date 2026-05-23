---
name: riftthai-ai
description: Project-specific workflow guidance for maintaining the RiftThai SvelteKit card database. Use when Codex works in this repository on UI changes, Svelte 5 components, search/filter behavior, card images, Q&A/domain pages, card data, Thai translation/mojibake issues, validation, or local dev-server handling.
---

# RiftThai AI

## Core Rules

Work as a project maintainer for the RiftThai SvelteKit app.

- Prefer existing patterns in `src/routes/+page.svelte`, `src/lib/components/`, and `src/lib/utils/`.
- Use Svelte 5 runes syntax already present in the repo: `$state`, `$derived`, `$effect`, `$props`, and `$bindable`.
- Do not start `npm run dev` automatically. The user normally keeps `http://localhost:5173/` open already.
- Run `npm.cmd run check` after Svelte/TypeScript changes unless the user explicitly says not to.
- Keep UI changes compact and mobile-aware. This app has sticky search/filter UI and a bottom mobile nav.
- Do not overwrite unrelated dirty work. Read diffs before editing files with existing modifications.

## Common Workflows

### Main Gallery

Use these files first:

- `src/routes/+page.svelte` for state, filtering, pagination, view switching, and modal wiring.
- `src/lib/components/SearchBar.svelte` for search input and set/type/domain filters.
- `src/lib/components/IconSelect.svelte` for custom dropdown behavior.
- `src/lib/components/CardGrid.svelte` for gallery cards and popup open behavior.
- `src/lib/components/CardModal.svelte` for popup details.

When changing search/filter behavior:

- Keep `currentPage = 1` when search or filters change.
- Preserve `Battlefield` behavior: selecting Battlefield type clears and disables domain filtering.
- Normalize user-visible search broadly enough for English names, Thai names, card code, set, type, rarity, domain, ability text, and tags.
- Be careful with Thai mojibake. Some historical data contains garbled Thai-looking text; preserve existing data unless explicitly asked to clean it.

### Mobile UI

For mobile search/filter work:

- Keep the search input and filter toggle in one row.
- Put filter controls behind the filter button on mobile.
- Avoid multi-column filter layouts below desktop; narrow screens can overlap custom dropdowns.
- Ensure `IconSelect` dropdowns do not overflow horizontally on mobile.

For sticky behavior:

- Avoid wrapping a sticky element in a short parent that limits its sticky range.
- Avoid using `overflow-x-hidden` on ancestors of sticky UI when `overflow-x-clip` is enough.

### Images And Popup Speed

Use `src/lib/utils/cardImages.ts` for Riot/Sanity image URL transforms.

- Prefer responsive `srcset` and optimized widths instead of loading original images.
- For modal image speed, preload a moderate popup image on card hover/focus/click.
- Keep modal image widths close to actual rendered size; oversized `srcset` candidates slow popup display.

### Q&A And Domain Pages

Use:

- `src/routes/qa/+page.svelte`
- `src/routes/domains/+page.svelte`
- `src/lib/components/SiteMenu.svelte`

When adding Q&A:

- Summarize rules in Thai rather than copying long source text.
- Keep each item shaped as `{ category, question, answer }`.
- Use categories that are easy to search, such as `Rules & Timing`, `Rules & Combat`, `Keywords & Abilities`.
- If browsing for current rules, prefer official Riot/Riftbound pages first, then clearly marked community FAQs.

When editing `domains` or `qa` navigation:

- Keep a clear Back button to `/` in the top nav.
- Keep `SiteMenu active="domains"` or `SiteMenu active="qa"` as appropriate.

## Validation

After edits:

1. Run `npm.cmd run check`.
2. Review warnings as actionable unless clearly irrelevant.
3. Do not start or restart the dev server unless the user explicitly asks.
4. If checking whether a dev server is already running, use `netstat -ano | Select-String -Pattern ':5173'`.

## References

Read `references/project-map.md` when you need a quick file map or task-to-file routing.
