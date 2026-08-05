# Supernote TPX OCR

Enrich and improve your Supernote handwriting recognition without installing any apps. This fully web based application can use any TPX LLM provider (including one you self-host) to do the word recognition.

## Technical Architecture

- Fully client-side javascript using Astro static deploy
- Preview .note files client side using https://github.com/philips/supernote-obsidian-plugin#supernote-viewer-web-component-experimental
- Uses MTP-TS and WebUSB to access Supernote files https://github.com/polvi/yolorepo/tree/main/mtp-ts
- Uses TPX to get access to an LLM for doing the OCR

## Roadmap

- [ ] Web based file browser of Supernote device using supernote viewer web component and mtp-ts
- [ ] TPX login for users to access their LLM
- [ ] Rasterizes .note files, uploads to LLM with prompt to recognize handwriting, and writes recognized text back to a new note named <orig>-tpx-ocr.note with https://github.com/philips/supernote-typescript and uploaded to device over MTP
