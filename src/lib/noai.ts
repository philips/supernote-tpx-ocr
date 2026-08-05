export const NOAI_STORAGE_KEY = 'supernote-tpx-ocr.noai';

/**
 * True once the `.noai` class has been applied to <html> - set by a
 * synchronous inline script in <head> (see AppShell.astro), before any
 * module script runs, so there's no flash of TPX/OCR UI before this class
 * lands, and other scripts can rely on it being already correct by the
 * time they execute.
 */
export function isNoAiMode(): boolean {
  return document.documentElement.classList.contains('noai');
}
