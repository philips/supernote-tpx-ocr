# supernote-viewer.js (vendored, built)

Built from [`philips/supernote-obsidian-plugin`](https://github.com/philips/supernote-obsidian-plugin)
at commit [`e767c8c`](https://github.com/philips/supernote-obsidian-plugin/commit/e767c8c9445bdf064ad71f3d0841f66ef13373a7)
(merge of [PR #220](https://github.com/philips/supernote-obsidian-plugin/pull/220),
"Fix word-overlay and export text-layer alignment on N6/A6X"). This is the
latest `main` HEAD; it supersedes the previous vendored copy, which was pinned
at `f070393` plus a cherry-pick of [PR #211](https://github.com/philips/supernote-obsidian-plugin/pull/211)
(the text-view toolbar icon redraw) because `main` had then moved further ahead
with unrelated features (a new `<supernote-atelier-viewer>` component,
page-cache tuning) not worth pulling in for one icon fix. Since then those
features plus useful fixes have landed - notably the icon fix from PR #211
(merged at `eecfa89`), [PR #214](https://github.com/philips/supernote-obsidian-plugin/pull/214)
SVG page export, [PR #217](https://github.com/philips/supernote-obsidian-plugin/pull/217)
vector-ink support, and [PR #219](https://github.com/philips/supernote-obsidian-plugin/pull/219)
N6/A6X word-overlay alignment - so the whole `main` tip is now pulled in
rather than a minimal cherry-pick. Built via `npm run build:webcomponent`,
per that repo's `webcomponent-usage.md` (the `<supernote-viewer>` element
isn't published anywhere yet, so consumers are told to self-host a built
copy).

The plugin/web-component code itself is MIT (Brandon Philips). This bundle
also links its `supernote-typescript` submodule
([`philips/supernote-typescript`](https://github.com/philips/supernote-typescript),
GPL-3.0-or-later) plus its other npm dependencies (fast-png, image-js,
pdf-lib, sql.js). GPL-3.0-or-later code is combinable into an
AGPL-3.0-or-later work, which is why this project (`supernote-tpx-ocr`) is
licensed AGPL-3.0-or-later overall — see `/LICENSE`.

To rebuild after an upstream change:

```sh
git clone --recurse-submodules https://github.com/philips/supernote-obsidian-plugin
cd supernote-obsidian-plugin
npm install && (cd supernote-typescript && npm install && npm run build)
npm run build:webcomponent   # writes dist/supernote-viewer.js
```

Then copy `dist/supernote-viewer.js` over this file and update the commit
SHA above.
