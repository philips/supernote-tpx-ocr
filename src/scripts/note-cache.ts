import type { NoteLoadedDetail } from './note-events';

// IndexedDB, not sessionStorage: a note's bytes can run several MB (real
// device captures do), and sessionStorage both caps out around 5-10MB per
// origin and would need base64 (another ~33% on top) to hold binary data
// as a string at all.

const DB_NAME = 'supernote-tpx-ocr';
const STORE_NAME = 'pending-note';
const KEY = 'current';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/** Call right before redirecting away for TPX sign-in, so the currently-loaded note survives the round trip. */
export async function saveNoteForRedirect(note: NoteLoadedDetail): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).put(note, KEY);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

/** Call once on page load. Consumes (deletes) whatever was saved, so a stale entry can't silently reappear on an unrelated later visit. */
export async function takeNoteForRedirect(): Promise<NoteLoadedDetail | null> {
  const db = await openDb();
  const note = await new Promise<NoteLoadedDetail | null>((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(KEY);
    getReq.onsuccess = () => resolve((getReq.result as NoteLoadedDetail | undefined) ?? null);
    getReq.onerror = () => reject(getReq.error);
    store.delete(KEY);
  });
  db.close();
  return note;
}
