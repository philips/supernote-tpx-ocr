# Supernote TPX OCR

Enrich and improve your Supernote handwriting recognition without installing any apps. This fully web based application can use any TPX LLM provider (including one you self-host) to do the word recognition.

## Technical Architecture

- Fully client-side javascript using Astro static deploy
- Preview .note files client side using https://github.com/philips/supernote-obsidian-plugin#supernote-viewer-web-component-experimental
- Uses MTP-TS and WebUSB to access Supernote files https://github.com/polvi/yolorepo/tree/main/mtp-ts
- Uses TPX to get access to an LLM for doing the OCR

## Roadmap

- [x] Web based file browser of Supernote device using supernote viewer web component and mtp-ts
- [x] TPX login for users to access their LLM
- [x] Rasterizes .note files and uploads to LLM with a prompt to recognize handwriting; recognized text is shown in the browser and downloadable as a .txt file
- [ ] Writes recognized text back to a new note named <orig>-tpx-ocr.note with https://github.com/philips/supernote-typescript and uploads it to the device over MTP

## Development

```sh
bun install
bun run dev     # dev server
bun run build   # static build to dist/
```

`/` (`src/pages/index.astro`, `src/scripts/device-browser.ts`) is the device file
browser; it needs a Chromium-based browser (WebUSB) and a Supernote plugged in
over USB. `/test` (`src/pages/test.astro`, `src/scripts/test-fixture.ts`) is a
no-device path that loads a bundled test fixture (`public/fixtures/rtr.note`,
from `supernote-typescript`'s own test suite) straight into the same viewer +
recognition pipeline, for trying the rasterize → TPX-recognize flow without a
Supernote on hand. Both pages share `src/layouts/AppShell.astro` (topbar, TPX
panel, viewer pane) and the `tpx-login.ts`/`ocr.ts` scripts; only the sidebar's
source panel and its loader script differ.

TPX login (`src/lib/tpx/`, `src/scripts/tpx-login.ts`) implements the
[TPX v0.3 OAuth profile](https://tokenpony.dev/spec) as a public,
client-side-only OAuth client: discovery (RFC 9728 + RFC 8414), dynamic
client registration (RFC 7591, cached per provider in `localStorage`), a
PAR + PKCE(S256) authorization request, code exchange, and rotating-refresh
handling. The sidebar's "TPX" panel lets you point at any provider that
advertises the `llm-inference` grant type — tokenpony.dev by default, or a
self-hosted one.

Handwriting recognition (`src/lib/ocr/rasterize.ts`, `src/lib/tpx/inference.ts`,
`src/scripts/ocr.ts`) rasterizes each page with `supernote-typescript`'s
`toImage`, flattens it onto white (pages are stored transparent), and sends
it as a vision chat-completion request to whichever model under the current
TPX grant advertises vision support. "Recognize handwriting" in the viewer
toolbar runs it page by page and shows the result alongside the note
preview; "Download .txt" saves it locally as `<orig>-tpx-ocr.txt`.

## License

AGPL-3.0-or-later. This project vendors [`mtp-ts`](https://github.com/polvi/yolorepo/tree/main/mtp-ts)
(AGPL-3.0-or-later, by Alex Polvi) and a build of
[`<supernote-viewer>`](https://github.com/philips/supernote-obsidian-plugin) (MIT,
which itself links the GPL-3.0-or-later `supernote-typescript`) — see the
`NOTICE.md` files next to each vendored copy in `src/lib/mtp-ts/` and
`public/vendor/` for details and provenance. It also depends directly on
the npm-published [`supernote-typescript`](https://github.com/philips/supernote-typescript)
(GPL-3.0-or-later) for rasterization, and vendors one small function from
its unreleased `main` branch (`flattenToWhite`, not yet in the published
version) directly into `src/lib/ocr/rasterize.ts` with attribution in a
comment there.
