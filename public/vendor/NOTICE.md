# supernote-viewer.js (vendored, built)

Built from [`philips/supernote-obsidian-plugin`](https://github.com/philips/supernote-obsidian-plugin)
at commit [`f070393`](https://github.com/philips/supernote-obsidian-plugin/commit/f070393eff823609eda61e9c8f2a43e61f093608),
plus [PR #211](https://github.com/philips/supernote-obsidian-plugin/pull/211)
(commit [`4c9571c`](https://github.com/philips/supernote-obsidian-plugin/commit/4c9571c641bd496f76271deec8edb4ff9e782c2f),
"Draw text-view toolbar icon as a letter A, not three lines") cherry-picked on
top - `main` had moved further ahead with unrelated features (a new
`<supernote-atelier-viewer>` component, page-cache tuning) not worth pulling
in for one icon fix, so this base commit + one cherry-pick keeps the vendored
diff minimal and easy to reason about. Built via `npm run build:webcomponent`,
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
