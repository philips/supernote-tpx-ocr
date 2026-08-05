import { SupernoteX, toImage } from 'supernote-typescript';
import { Image, ImageColorModel, encodeDataURL } from 'image-js';

export function parseNote(bytes: Uint8Array): SupernoteX {
  return new SupernoteX(bytes);
}

/**
 * Vendored from supernote-typescript's `conversion.ts` (GPL-3.0-or-later,
 * unmodified) - not yet in the npm-published 0.5.3, only on GitHub `main`.
 * Flattens a transparent image onto opaque white: unwritten pixels are
 * packed as black+alpha:0 (see RattaRLEDecoder.buildPackedTranslation()),
 * so a plain alpha-channel drop would reveal them as solid black ink rather
 * than blank page. Standard "flatten onto a background color" alpha
 * compositing instead.
 */
function flattenToWhite(image: Image): Image {
  if (!image.alpha) return image;

  const { width, height, data, channels } = image.getRawImage();
  const colorChannels = channels - 1;
  const out = new Uint8Array(width * height * colorChannels);

  for (let i = 0, o = 0; i < data.length; i += channels, o += colorChannels) {
    const alpha = data[i + colorChannels] / 255;
    for (let c = 0; c < colorChannels; c++) {
      out[o + c] = Math.round(data[i + c] * alpha + 255 * (1 - alpha));
    }
  }

  const colorModel = image.colorModel === 'RGBA' ? ImageColorModel.RGB : ImageColorModel.GREY;
  return new Image(width, height, { colorModel, data: out });
}

/**
 * Rasterizes one page to a PNG data URL, ready to send to a vision model.
 * Pages are transparent (the Supernote plugin's own dark-mode inversion
 * trick relies on that) - flattened onto white first, or a vision backend
 * composites the transparency onto black and reports the page unreadable.
 */
export async function rasterizePageToDataUrl(note: SupernoteX, pageNumber: number): Promise<string> {
  const [image] = await toImage(note, [pageNumber]);
  return encodeDataURL(flattenToWhite(image));
}
