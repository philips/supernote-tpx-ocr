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
- [ ] Rasterizes .note files, uploads to LLM with prompt to recognize handwriting, and writes recognized text back to a new note named <orig>-tpx-ocr.note with https://github.com/philips/supernote-typescript and uploaded to device over MTP

## Development

```sh
bun install
bun run dev     # dev server
bun run build   # static build to dist/
```

The device file browser (`src/pages/index.astro`, `src/scripts/device-browser.ts`)
needs a Chromium-based browser (WebUSB) and a Supernote plugged in over USB.

TPX login (`src/lib/tpx/`, `src/scripts/tpx-login.ts`) implements the
[TPX v0.3 OAuth profile](https://tokenpony.dev/spec) as a public,
client-side-only OAuth client: discovery (RFC 9728 + RFC 8414), dynamic
client registration (RFC 7591, cached per provider in `localStorage`), a
PAR + PKCE(S256) authorization request, code exchange, and rotating-refresh
handling. The sidebar's "TPX" panel lets you point at any provider that
advertises the `llm-inference` grant type — tokenpony.dev by default, or a
self-hosted one.

## License

AGPL-3.0-or-later. This project vendors [`mtp-ts`](https://github.com/polvi/yolorepo/tree/main/mtp-ts)
(AGPL-3.0-or-later, by Alex Polvi) and a build of
[`<supernote-viewer>`](https://github.com/philips/supernote-obsidian-plugin) (MIT,
which itself links the GPL-3.0-or-later `supernote-typescript`) — see the
`NOTICE.md` files next to each vendored copy in `src/lib/mtp-ts/` and
`public/vendor/` for details and provenance.
