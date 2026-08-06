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
- [ ] Writes recognized text back to a new note named <orig>-tpx-ocr.note with https://github.com/philips/supernote-typescript and uploads it to the device over MTP -
      still blocked on `supernote-typescript` having no `.note` write/serialize support at all (read/rasterize/PDF only); in the meantime, AI-recognized text can be embedded into a downloadable PDF instead (see "AI-text PDF export" below), and the original `.note` can be downloaded unmodified via "Download .note"

## Development

```sh
bun install
bun run dev     # dev server
bun run build   # static build to dist/
bun run check   # astro check (typecheck)
bun run lint    # eslint
bun run test    # vitest run
```

`.github/workflows/ci.yml` runs all four (lint, check, test, build) on every
pull request and on push to `main`.

`/` (`src/pages/index.astro`, `src/scripts/device-browser.ts`) is the device file
browser; it needs a Chromium-based browser (WebUSB) and a Supernote plugged in
over USB. Each file row has a download button (⬇, reads it via `MtpFs.readFile`
and saves it locally), and the "Upload to this folder" picker writes a local
file into the currently-browsed device folder via `MtpFs.writeFile` (creates
parent folders as needed, deletes any same-named file first - MTP has no
in-place overwrite). Browsers without WebUSB (Safari, notably) can't use any
of that — `/`'s sidebar also has a separate "Upload" section
(`src/scripts/upload-note.ts`) that loads a `.note` file picked from disk
straight into the viewer + recognition pipeline instead, no device connection
needed (this one only loads into the browser - it doesn't write to a device).
`/test` (`src/pages/test.astro`,
`src/scripts/test-fixture.ts`) is a similar no-device path, but loads a bundled
test fixture (`public/fixtures/rtr.note`, from `supernote-typescript`'s own
test suite) instead of a user-picked file, for trying the rasterize →
TPX-recognize flow without a Supernote on hand. All three sources feed the
same `note-loaded` event (`src/scripts/note-events.ts`) that `ocr.ts`
listens for. `/` and `/test` share `src/layouts/AppShell.astro` (topbar,
sidebar tabs, viewer pane); only the Browse tab's source panel(s) and
loader script(s) differ.

The sidebar (`src/scripts/sidebar-tabs.ts`) has three tabs, in order:
Browse (the source panel(s) above), Convert - the "Convert Handwriting to
Text with AI" control, described next - and Settings (the TPX panel,
below). Switching tabs just toggles which `.sidebar-panel` is `hidden`;
`showSettingsTab()`/`dispatchOpenSettings()` let other scripts (`ocr.ts`,
when TPX isn't connected yet) jump the sidebar to Settings without
importing its DOM internals.

(The Supernote's own on-device handwriting recognition - what Supernote
calls "RTR" - is already exposed by the `<supernote-viewer>` web
component's own toolbar, so this app doesn't duplicate it.)

Below 700px wide, the sidebar switches from pushing `#viewer-pane` aside to a
fixed-position overlay drawer with a backdrop (`#sidebar-backdrop`, tap to
close) - a 320px sidebar next to the note viewer doesn't fit next to it on a
phone screen. `src/scripts/sidebar-toggle.ts`'s `setSidebarOpen()` is the one
place that keeps the drawer, its backdrop, and `#menu-toggle`'s
`aria-expanded` in sync; the CSS breakpoint in `global.css` is what actually
turns that same toggle into a push vs. an overlay depending on viewport width.

TPX login (`src/lib/tpx/`, `src/scripts/tpx-login.ts`) implements the
[TPX v0.3 OAuth profile](https://tokenpony.dev/spec) as a public,
client-side-only OAuth client: discovery (RFC 9728 + RFC 8414), dynamic
client registration (RFC 7591, cached per provider in `localStorage`), a
PAR + PKCE(S256) authorization request, code exchange, and rotating-refresh
handling. The sidebar's "TPX" panel lets you point at any provider that
advertises the `llm-inference` grant type — tokenpony.dev by default, or a
self-hosted one. tokenpony.dev specifically uses a pre-registered `client_id`
(`KNOWN_CLIENTS` in `src/lib/tpx/client.ts`) scoped to this app's actual
production redirect URIs (`https://supernote.ifup.org/` and `.../test/`), so
visitors to the deployed site don't each silently self-register a fresh
throwaway client - anything else (local dev, a fork, a self-hosted provider)
still dynamically registers itself as before.

Connecting TPX is a full-page redirect away and back (the provider's own
sign-in page), which would otherwise drop whatever `.note` file was loaded
in memory. `src/scripts/note-cache.ts` stashes the current note in
IndexedDB (not `sessionStorage` - a real device capture can run several MB,
past what `sessionStorage` reliably holds as a base64 string) right before
redirecting, and `tpx-login.ts`'s `init()` restores it on the way back.
`src/scripts/note-events.ts` centralizes "load a note into the viewer" for
every source (device browser, upload, test fixture, and this restore path)
so they don't each duplicate that wiring.

Handwriting recognition (`src/lib/ocr/rasterize.ts`, `src/lib/tpx/inference.ts`,
`src/scripts/ocr.ts`) rasterizes each page with `supernote-typescript`'s
`toImage`, flattens it onto white (pages are stored transparent), and sends
it as a vision chat-completion request to the model picked in Settings'
"Model" dropdown. That dropdown (`populateModels()` in `tpx-login.ts`) is
populated from `GET {resource}/models` once TPX connects, filtered to the
grant's own model restriction (if it has one) and then to vision-capable
models only (`supportsVision()` - a text match against the provider's own
`description` field, so it's only as good as that description; on
tokenpony.dev today that leaves exactly one model). "Convert Handwriting to
Text with AI", in the Convert tab's "AI Recognition" section, runs
recognition page by page against whichever model is currently selected and
shows the result alongside the note preview; "Download .txt" saves it
locally as `<orig>-tpx-ocr.txt`. Since this needs TPX, "AI Recognition" and
the AI result panel are marked `.ai-only` and hidden in no-AI mode, same as
the Settings tab.

The Convert tab's other section, "Export" (`src/scripts/export-png.ts`), has
"Download Current Page as PNG" - a local rasterize-and-download of whichever
page is currently on screen, using the same `rasterizePageToDataUrl()` the
AI flow above does, so no TPX/AI involved and it stays available in no-AI
mode. "Currently on screen" comes from `<supernote-viewer>`'s own
`currentPage` property (1-indexed, kept in sync with scroll position, 0
before a note's finished loading - mirrors how the upstream Obsidian plugin's
own "export current page" command reads the same property rather than
tracking scroll position itself). Downloads as `<orig>-page-<N>.png` via
`downloadDataUrl()` (`src/scripts/download-file.ts`), which `fetch()`s the
rasterized `data:` URL to decode it into a real `Blob` before saving -
`downloadBytes()`'s plain `Blob([data])` would otherwise save the URL string
itself rather than the image it points to.

The same section's "Download as PDF" (`src/scripts/export-pdf.ts`) exports
the whole note via `supernote-typescript`'s own `toPdf()` - already a direct
dependency of this project - which rasterizes every page and draws each
page's recognized handwriting (RTR) text invisibly on top at the position it
was written, so the PDF comes out searchable/selectable in a PDF viewer with
no extra work here. Also no TPX/AI involved, so it stays available in no-AI
mode too. Downloads as `<orig>.pdf` via `downloadBytes()` directly - `toPdf`
already returns raw `Uint8Array` bytes, not a `data:` URL, so no decoding
step is needed the way the PNG export above needs one. Also in this section,
"Download .note" (`src/scripts/export-note.ts`) downloads the currently
loaded note's original, unmodified bytes as `<orig>.note` - `supernote-typescript`
has no `.note` write/serialize support (parse/rasterize/PDF only), so this is
a plain copy, not a note with AI-recognized text embedded back into it.

Back in "AI Recognition" (`src/scripts/ocr.ts`), "Download as PDF (AI Text)"
appears once a recognition run finishes, and embeds *that* run's text into a
PDF instead of the note's own on-device RTR data - `buildAiTextPdf()`
(`src/lib/ocr/pdf.ts`) calls the same `createPdfContext()`/`addPdfPage()`
`toPdf()` itself is built from, but with each page's `recognitionElements`
swapped out for one built from the AI's plain-text result instead of the
note's own parsed recognition data. AI OCR has no word-level bounding boxes
(only text, one block per page) to draw the invisible layer at real ink
positions the way genuine RTR data lets `toPdf()` do; splitting on the
line breaks `DEFAULT_PROMPT` asks the model to preserve, and giving each
line its own full-width box, is a deliberate middle ground - not word-level
positioning, but enough that the per-word font size/horizontal-squeeze
`addPdfPage()`'s invisible-text layer applies stays close to a real line
of writing, rather than needing to cram a whole page's text into one box
sized to the whole page (which was tried first and squeezes space
characters down to sub-visible width, making search fail on any query
with more than one word). Downloads as `<orig>-tpx-ocr.pdf`.

Visiting `/noai` (linked from the footer) sets a `localStorage` flag and
redirects to `/`; every page checks it via a synchronous inline script in
`<head>` (`src/layouts/AppShell.astro`, before first paint, so there's no
flash of TPX/OCR UI) that adds a `noai` class to `<html>`. CSS hides the
Settings tab, the OCR toolbar, and the OCR result panel whenever that class
is present, and `tpx-login.ts`/`ocr.ts` check `isNoAiMode()`
(`src/lib/noai.ts`) to skip wiring themselves up at all in that case - not
just hiding controls, but making sure no TPX/inference network request
(discovery, introspection, refresh) can happen for someone who explicitly
asked not to send anything to a third party. The footer link toggles: it
reads "No AI / TPX-free mode" normally, or "Enable AI features" (clearing
the flag) once that mode is already on.

## Deployment

Deploys to [supernote.ifup.org](https://supernote.ifup.org) via GitHub Pages
(`.github/workflows/deploy.yml`, `withastro/action`) on every push to `main`.
The custom domain is set both in the repo's Pages settings and via
`public/CNAME`, so it survives even if Pages settings ever get reset.
`astro.config.mjs`'s `site` matches it; there's no `base` path since this
domain serves the site from `/`, not a `/supernote-tpx-ocr/` subpath.

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
