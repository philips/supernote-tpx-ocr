import { createPdfContext, addPdfPage, toImage, type SupernoteX, type IRecognitionElement } from 'supernote-typescript';

// Matches supernote-typescript's own (unexported) RECOGNITION_COORDINATE_SCALE
// in its pdf.ts - recognized-word bounding boxes are stored in raster-pixel
// units divided by this factor. Duplicated here since it isn't part of the
// package's public API; see that file's own comment for how it was
// empirically confirmed.
const RECOGNITION_COORDINATE_SCALE = 11.9;

/**
 * Builds a recognition element with one invisible "word" per line of
 * `text`, each spanning the page's full width and stacked evenly down its
 * height - unlike real on-device recognition (a bounding box per actual
 * word, at the position it was actually written), AI OCR only returns
 * plain text, so this is a coarse approximation, not a positional match.
 * Splitting per *line* rather than treating the whole page as one giant
 * "word" matters for more than positioning, though: `drawRecognitionText`
 * sizes each word's invisible font to its box height and horizontally
 * squeezes it (the PDF `Tz` operator) to fit the box width, and DEFAULT_PROMPT
 * (src/lib/tpx/inference.ts) asks the model to preserve line breaks, so a
 * whole multi-line page crammed into one "word" needs a font sized to the
 * *entire page height* squeezed down to page width - extreme enough that
 * space characters collapse to sub-visible width and words that were
 * actually separate get extracted as one run-together string. Per-line
 * boxes keep the font size (and squeeze) close to what a real line of
 * writing would need, which keeps inter-word spaces distinguishable in the
 * extracted text.
 */
function layoutPageRecognitionElement(text: string, pageWidth: number, pageHeight: number): IRecognitionElement {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  if (lines.length === 0) return { label: text, type: 'Text', words: [] };

  const lineHeightPx = pageHeight / lines.length;
  return {
    label: text,
    type: 'Text',
    words: lines.map((line, i) => ({
      label: line,
      'bounding-box': {
        x: 0,
        y: (i * lineHeightPx) / RECOGNITION_COORDINATE_SCALE,
        width: pageWidth / RECOGNITION_COORDINATE_SCALE,
        height: lineHeightPx / RECOGNITION_COORDINATE_SCALE,
      },
    })),
  };
}

/**
 * Renders `note` to a PDF the same way `toPdf()` does, except each page's
 * invisible searchable-text layer comes from `pageTexts` (AI OCR results,
 * one entry per page) instead of the note's own on-device recognition data.
 */
export async function buildAiTextPdf(note: SupernoteX, pageTexts: string[]): Promise<Uint8Array> {
  const images = await toImage(note);
  const ctx = await createPdfContext();
  for (let i = 0; i < note.pages.length; i++) {
    const text = pageTexts[i]?.trim();
    const page = {
      ...note.pages[i],
      recognitionElements: text ? [layoutPageRecognitionElement(text, note.pageWidth, note.pageHeight)] : [],
    };
    await addPdfPage(ctx, page, images[i]);
  }
  return ctx.pdfDoc.save();
}
