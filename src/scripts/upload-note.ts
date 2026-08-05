import { dispatchNoteLoaded } from './note-events';

interface SupernoteViewerElement extends HTMLElement {
  noteData: ArrayBuffer | Uint8Array | null;
}

const fileInput = document.getElementById('upload-note') as HTMLInputElement;
const statusEl = document.getElementById('upload-status') as HTMLElement;
const emptyStateEl = document.getElementById('empty-state') as HTMLElement;
const viewerEl = document.getElementById('viewer') as SupernoteViewerElement;

async function loadFile(file: File): Promise<void> {
  statusEl.textContent = `Loading ${file.name}…`;
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    viewerEl.noteData = bytes;
    emptyStateEl.hidden = true;
    viewerEl.hidden = false;
    dispatchNoteLoaded({ path: file.name, bytes });
    statusEl.textContent = `Loaded ${file.name}.`;
  } catch (err) {
    statusEl.textContent = `Failed to load ${file.name}: ${(err as Error).message}`;
  } finally {
    fileInput.value = '';
  }
}

fileInput.addEventListener('change', () => {
  const file = fileInput.files?.[0];
  if (file) void loadFile(file);
});
