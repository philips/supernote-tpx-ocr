function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadBytes(filename: string, data: Uint8Array | string): void {
  // Uint8Array<ArrayBufferLike> (from an arbitrary buffer source) doesn't
  // structurally satisfy BlobPart's ArrayBufferView<ArrayBuffer> - every
  // caller here only ever passes a real ArrayBuffer-backed view, never a
  // SharedArrayBuffer one, so this is a type-system-only gap.
  triggerDownload(new Blob([data as BlobPart]), filename);
}

/** Decodes a `data:` URL (e.g. a rasterized page PNG) and downloads it as a file. */
export async function downloadDataUrl(filename: string, dataUrl: string): Promise<void> {
  const blob = await (await fetch(dataUrl)).blob();
  triggerDownload(blob, filename);
}
