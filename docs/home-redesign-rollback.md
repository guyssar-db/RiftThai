# Home redesign 06

The default `/` uses `src/lib/components/home/HomeRedesign.svelte`.
The original page is preserved in `src/lib/components/home/HomeLegacy.svelte`.

## Compare or revert temporarily

Open `/?design=legacy` for the original page. Remove `design=legacy` for the new page.
The original SearchBar, AppNav and SiteMenu remain unchanged.
CardModal has an optional `drawer` prop; its default is false, preserving legacy behavior.
New CSS is scoped to the new home or its drawer.

## Restore the original default

In `src/routes/+page.svelte`, replace the conditional block with `<HomeLegacy {data} />`.
The new components may remain on disk for later work.

## Filters

Power cost comes from `static/cards.json`, keyed by normalized card code.
The application's existing `Card.power` field is Might and must not be used as Power cost.
All existing card content and translations still come from `src/lib/data/cards.json`.
