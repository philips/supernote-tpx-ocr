import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { parseNote, rasterizePageToDataUrl } from './rasterize';

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const fixturePath = fileURLToPath(new URL('../../../public/fixtures/rtr.note', import.meta.url));

describe('rasterizePageToDataUrl', () => {
  it('parses and rasterizes the bundled rtr.note fixture to a valid PNG data URL', async () => {
    const bytes = new Uint8Array(readFileSync(fixturePath));
    const note = parseNote(bytes);
    expect(note.pages.length).toBeGreaterThan(0);

    const dataUrl = await rasterizePageToDataUrl(note, 1);
    expect(dataUrl.startsWith('data:image/png;base64,')).toBe(true);

    const pngBytes = Buffer.from(dataUrl.slice('data:image/png;base64,'.length), 'base64');
    expect(pngBytes.subarray(0, 8)).toEqual(PNG_SIGNATURE);
  });
});
