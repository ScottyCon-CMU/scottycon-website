# PR title

feat: faithfully migrate the ScottyCon Wix website to React and TypeScript

# PR description

Port the accepted ScottyCon website to the existing React, TypeScript, Vite, and React Router project. Preserve the original page structure, wording, years, artwork, typography, layout, and content ordering across Home and 18 subroutes. Apply the authorized Flea Market removal and route internal navigation locally.

The implementation includes desktop/phone menus, original color themes, complete Artist Alley galleries, updated sponsor tiers, native React schedule tables, and standard Google Maps embeds. Official assets are local with recorded provenance; identical downloads share references without changing image bytes or crops. Runtime desktop/mobile source data remains in `src/data/`. Delivery excludes screenshots, one-off migration scripts, browser logs, and personal development tools.

Implemented with **Codex assistance**. **Info-related pages overlap work claimed by George**; coordinate ownership and review before merging this branch. The user has manually accepted the website's presentation.

## Validation

- Isolated install from the existing lockfile: `npm ci --offline --no-audit --no-fund`.
- `npm run lint`, `npm run build`, `git diff --check`.
- `node scripts/check-home.mjs`, `node scripts/check-site.mjs`, `node scripts/check-colors.mjs`, `node scripts/check-assets.mjs`.
- Fresh Chromium desktop and phone-emulation cleanup regression: Home, all migrated subroutes, submenu navigation, Artist Alley multi-image/zoom, schedule tables/phone details, and both maps. No missing local resources or page exceptions observed.
- Build succeeds with the existing large-chunk warning. No new physical-device, Safari, or Firefox certification is claimed.

## Integration limits

Newsletter submission is not connected and never reports fabricated success. Instagram uses captured official posts; live refresh, its post modal, and Load More remain unconnected. Standard Google Maps embeds preserve verified points but not Wix's custom theme. Wix gallery `?pgid=` sharing state is not replicated. External forms and checkout retain their targets; no submissions or transactions were performed. Asset redistribution permissions, including commercial fonts, remain subject to the respective owners' licenses.

See [maintenance.md](maintenance.md) for setup, source/data locations, independent checks, and integration details, and [asset-sources.json](asset-sources.json) for media provenance. No commit, push, merge, or deployment has been performed by Codex; this file is a draft for team review.
