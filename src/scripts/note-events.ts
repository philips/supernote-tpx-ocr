export const NOTE_LOADED_EVENT = 'supernote-tpx:note-loaded';

export interface NoteLoadedDetail {
  path: string;
  bytes: Uint8Array;
}

export function dispatchNoteLoaded(detail: NoteLoadedDetail): void {
  window.dispatchEvent(new CustomEvent<NoteLoadedDetail>(NOTE_LOADED_EVENT, { detail }));
}
