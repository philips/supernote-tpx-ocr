# mtp-ts (vendored)

The files in this directory (`mtp.ts`, `fs.ts`, `index.ts`) are vendored
unmodified from [`mtp-ts`](https://github.com/polvi/yolorepo/tree/main/mtp-ts)
by Alex Polvi, at commit
[`120d171`](https://github.com/polvi/yolorepo/tree/120d171dcdba80a864a2b0289e22ca00929031da/mtp-ts).

`mtp-ts` is not published to a package registry — its own docs say to consume
it "by path" from a TS-aware bundler, so this is a source copy rather than a
dependency pin. To pick up upstream changes, re-fetch these three files from
that commit range.

Licensed AGPL-3.0-or-later (see upstream `mtp-ts/README.md`; no separate
LICENSE file exists at that path, so the license is inherited from the
`yolorepo` root). Because of this, this project (`supernote-tpx-ocr`) is
licensed AGPL-3.0-or-later as well — see `/LICENSE`.
