export const NOTE_LOADED_EVENT = 'supernote-tpx:note-loaded';

export interface NoteLoadedDetail {
  path: string;
  bytes: Uint8Array;
}

export interface SupernoteViewerElement extends HTMLElement {
  noteData: ArrayBuffer | Uint8Array | null;
}

let current: NoteLoadedDetail | null = null;

export function getCurrentNote(): NoteLoadedDetail | null {
  return current;
}

/**
 * Loads a note's bytes into the shared <supernote-viewer>, updates
 * empty-state visibility, and notifies listeners (ocr.ts) - the one place
 * every note source (device browser, upload, test fixture, and a note
 * restored after a TPX redirect) goes through, so they don't each
 * duplicate this DOM wiring.
 */
export function loadNoteIntoViewer(detail: NoteLoadedDetail): void {
  current = detail;

  const viewerEl = document.getElementById('viewer') as SupernoteViewerElement;
  const emptyStateEl = document.getElementById('empty-state') as HTMLElement;
  viewerEl.noteData = detail.bytes;
  emptyStateEl.hidden = true;
  viewerEl.hidden = false;

  window.dispatchEvent(new CustomEvent<NoteLoadedDetail>(NOTE_LOADED_EVENT, { detail }));
}
