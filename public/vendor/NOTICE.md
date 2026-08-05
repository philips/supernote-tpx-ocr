# supernote-viewer.js (vendored, built)

Built from [`philips/supernote-obsidian-plugin`](https://github.com/philips/supernote-obsidian-plugin)
at commit [`f070393`](https://github.com/philips/supernote-obsidian-plugin/commit/f070393eff823609eda61e9c8f2a43e61f093608)
via `npm run build:webcomponent`, per that repo's `webcomponent-usage.md` (the
`<supernote-viewer>` element isn't published anywhere yet, so consumers are
told to self-host a built copy).

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
