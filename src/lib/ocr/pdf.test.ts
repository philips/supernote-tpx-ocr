import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parseNote } from './rasterize';
import { buildAiTextPdf } from './pdf';

const PDF_SIGNATURE = Buffer.from('%PDF-');
const fixturePath = fileURLToPath(new URL('../../../public/fixtures/rtr.note', import.meta.url));

describe('buildAiTextPdf', () => {
  it('builds a valid PDF with AI-recognized text embedded per page', async () => {
    const bytes = new Uint8Array(readFileSync(fixturePath));
    const note = parseNote(bytes);
    expect(note.pages.length).toBeGreaterThan(0);

    const pageTexts = note.pages.map((_, i) => `AI recognized text for page ${i + 1}`);
    const pdfBytes = await buildAiTextPdf(note, pageTexts);

    expect(pdfBytes.length).toBeGreaterThan(0);
    expect(Buffer.from(pdfBytes.subarray(0, 5))).toEqual(PDF_SIGNATURE);
  });

  it('still builds a valid PDF when a page has no recognized text', async () => {
    const bytes = new Uint8Array(readFileSync(fixturePath));
    const note = parseNote(bytes);

    const pdfBytes = await buildAiTextPdf(note, ['']);
    expect(pdfBytes.length).toBeGreaterThan(0);
    expect(Buffer.from(pdfBytes.subarray(0, 5))).toEqual(PDF_SIGNATURE);
  });
});
