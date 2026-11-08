# Maintenance and delivery

The accepted site follows the live Wix page structure and original wording, including its mixed years and spelling. Flea Market content/navigation is intentionally excluded, and internal links use local hash routes. Keep the accepted presentation unchanged when updating infrastructure.

## Local use

Use Node.js 24 LTS (verified with 24.19.0 / npm 11.17.0). Vite requires Node 20.19+ or 22.12+. From the repository root:

```sh
npm ci
npm run dev
```

Open the URL printed by Vite, followed by `/#/`. The application uses `HashRouter`; for example, `/#/panels` supports direct loading and refresh. For a production build and local preview:

```sh
npm run build
npm run preview
```

No environment file, Wix account, Refero connection, or Google Maps API key is required. Newsletter integration is not configured.

## Source and content

| Location | Responsibility |
| --- | --- |
| `src/components/`, `src/pages/` | Shared rendering, page wrappers, and routes; `Layout.tsx` imports `./Navbar`. |
| `src/data/original-home/` | Home's desktop/mobile markup and CSS. These are runtime inputs, not disposable capture caches. |
| `src/data/original-site/` | 18 subroutes' desktop/mobile markup and CSS, route registry, galleries, and schedule data. `PageFrame.tsx` loads these dynamically. |
| `src/components/original-home/` | Source markup renderer, theme/context, menus, and Home compatibility styles. |
| `src/components/original-site/` | Galleries, sizing, React tables, standard Google Maps embeds, URL mapping, and scoped compatibility styles. |
| `public/original-home/`, `public/original-site/` | Official media served at root URLs, including fonts, original-resolution gallery images, image candidates, backgrounds, and the three published CSV copies. |
| `src/assets/` | Existing starter/imported assets, retained without restructuring. |
| `scripts/fixtures/` | Small, intentional wording/link baselines used by the integrity checks. Not browser-session state. |

The original 320px phone site is selected by mobile User-Agent, matching the accepted implementation. Desktop resizing alone does not select the phone version.

When changing content, update the appropriate desktop **and** mobile JSON/CSS. Preserve component IDs used by galleries, schedules, maps, menus, and hero animations. Keep wording, years, punctuation, ordering, link destinations, and hidden states unless the team explicitly authorizes content changes. Review an intentional change before updating integrity fixtures; do not regenerate baselines just to silence a failure.

Gallery order and original-resolution files live in `galleries.json` / `pro-galleries.json`. `displaySrc`, `<picture>` candidates, and phone crops can differ from the original-resolution image intentionally. Artist Alley contains 57 current tables / 62 merchandise entries, including five two-image galleries; a source-hidden legacy gallery remains hidden. Schedule rows and parameters live in `tables.json`, alongside matching CSV hashes. Map coordinates and embed URLs live in `maps.ts`; keep both verified locations rather than geocoding an assumed entrance.

## Repeatable checks

Run from the repository root after `npm ci`; only Node and the locked project dependencies are needed:

```sh
npm run lint
npm run build
node scripts/check-home.mjs
node scripts/check-site.mjs
node scripts/check-colors.mjs
node scripts/check-assets.mjs
git diff --check
```

- Home/site checks render the real React markup and compare protected wording, links, route/anchor targets, gallery access, schedules, and media signatures.
- Color checks validate declared theme variables, isolation, and schedule palette; they do not claim browser computed-color verification.
- Asset checks verify every recorded file hash, static resource references including CSS/srcset, and local documentation links.
- Checks do not require Python, archived HTML, screenshots, a browser MCP connection, or a previous browser session. They do not write audit artifacts into the repository.
- Build retains the existing warning about large chunks; compression, image resizing, and architecture changes were outside this cleanup.

After changing media or rendering, separately inspect desktop and phone layouts, navigation by pointer/keyboard/touch, Artist Alley second images and zoom, all schedule rows/phone details, and both maps. Do not submit forms or purchases as a smoke test. An optional browser can be used manually; none is installed as a project dependency.

## Asset sources and rights

[asset-sources.json](asset-sources.json) records the 362 retained official media files, source URLs, available source labels/pages, byte sizes, and SHA-256 hashes. Duplicate files were unified only after byte equality was verified; different crops, formats, and density candidates are retained when referenced. The 110 removed downloads (53 identical copies plus 57 unreferenced variants) and development history were backed up outside this repository.

Assets originate from [ScottyCon](https://www.scottycon.com/), its Wix-hosted media/font URLs, the named sponsors/artists, and the public Table Master font/CSV sources. Existing artist, sponsor, image labels, and credits in the accepted pages are preserved. This repository does not grant a blanket license to those assets: artwork, photographs, logos, and fonts retain their respective owners' rights. The captures did not supply redistribution license documents. The team should confirm existing permissions, particularly for Wix-hosted commercial fonts such as DIN Next/Futura; do not infer a license from a public download URL. Application code dependencies retain their installed package license notices.

Published PDFs and external application, ticket, social, and venue services keep their original destinations. No local PDF was removed, and external PDFs were not converted or replaced.

## Existing integration limits

- Newsletter: the original form remains visible but has no portable backend connection. No email is sent/stored and no success state is fabricated.
- Instagram: captured official content; live refresh, Instagram's post modal, and Load More are not wired to Wix's service.
- Maps: free standard Google embeds with the verified points. Google controls, automatic centering, and map styling differ from Wix's custom theme; no source API key is reused.
- Gallery: native React interactions replace Wix runtime dependencies. Wix `?pgid=` sharing/deep-link state is not mirrored. Real-device swipe behavior and complete parity of the classic Wix viewer were not newly certified during cleanup.
- Other third-party forms/checkout are external links. No end-to-end submission or transaction has been performed.

## Delivery verification — 2026-11-08

The website had already passed user visual acceptance. This cleanup changed only byte-identical media aliases in four runtime JSON files; all TypeScript, runtime CSS, wording, and layout remain unchanged against the pre-cleanup backup. Root README, package files/lock, `./Navbar`, starter assets, and installed skills are unchanged.

An isolated `npm ci --offline --no-audit --no-fund` succeeded using the existing lockfile. Lint/build and the four integrity checks passed. Fresh Playwright Chromium contexts at 1440×1000/DPR 1 and 320×844/DPR 2 checked Home, all 18 subroutes with scrolling/image decoding, all 14 submenu links in each mode, five Artist Alley two-image galleries and zoom, all three schedule tables/24 phone details, and both maps' load/marker/zoom/link targets. No local HTTP failures or page exceptions were observed. This is a cleanup regression, not new Safari/Firefox/physical-device certification or a new full live-site comparison.

Screenshots, logs, intermediate audits, one-off capture/sync scripts, and old review narratives are archived outside the repository. This document has no dependency on those archives. `node_modules`/`dist` stay local and are already ignored by the shared ignore file. Personal Refero/Playwright files are excluded only through local `.git/info/exclude`; no team ignore preference or skill content was changed.

Suggested review: runtime source/data and official assets first, then the independent checks and these two maintenance/PR documents. Info overlaps George's claimed work and should be coordinated before merging. Nothing has been staged, committed, pushed, merged, or deployed.
