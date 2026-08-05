import { loadNoteIntoViewer } from './note-events';

const fileInput = document.getElementById('upload-note') as HTMLInputElement;
const statusEl = document.getElementById('upload-status') as HTMLElement;

async function loadFile(file: File): Promise<void> {
  statusEl.textContent = `Loading ${file.name}…`;
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    loadNoteIntoViewer({ path: file.name, bytes });
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
