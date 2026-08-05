export const TPX_GRANT_CHANGED_EVENT = 'supernote-tpx:grant-changed';

export function dispatchTpxGrantChanged(): void {
  window.dispatchEvent(new Event(TPX_GRANT_CHANGED_EVENT));
}
