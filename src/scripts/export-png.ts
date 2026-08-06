import { parseNote, rasterizePageToDataUrl } from '../lib/ocr/rasterize';
import { NOTE_LOADED_EVENT, getCurrentNote, type SupernoteViewerElement } from './note-events';
import { downloadDataUrl } from './download-file';

const button = document.getElementById('download-page-png') as HTMLButtonElement;
const statusEl = document.getElementById('page-png-status') as HTMLElement;
const viewerEl = document.getElementById('viewer') as SupernoteViewerElement;

function baseName(path: string): string {
  const file = path.split('/').pop() ?? path;
  return file.replace(/\.note$/i, '');
}

type StatusLevel = 'info' | 'warning' | 'error';

function setStatus(text: string, level: StatusLevel = 'info'): void {
  statusEl.textContent = text;
  statusEl.classList.toggle('status-warning', level === 'warning');
  statusEl.classList.toggle('status-error', level === 'error');
}

function updateAvailability(): void {
  button.disabled = !getCurrentNote();
}

// Independently re-parses and rasterizes just the one page rather than
// reaching into the live <supernote-viewer>'s own internal state, mirroring
// how the AI recognition flow (ocr.ts) already re-parses instead of trying
// to read a rendered image back out of the component.
async function downloadCurrentPage(): Promise<void> {
  const currentNote = getCurrentNote();
  if (!currentNote) return;

  // currentPage is scroll-driven and kept in sync asynchronously as the
  // component builds its page list - 0 until that's finished.
  const pageNumber = viewerEl.currentPage;
  if (pageNumber === 0) {
    setStatus('Note is still loading - try again in a moment.', 'warning');
    return;
  }

  button.disabled = true;
  setStatus(`Rendering page ${pageNumber}…`);
  try {
    const note = parseNote(currentNote.bytes);
    const dataUrl = await rasterizePageToDataUrl(note, pageNumber);
    const filename = `${baseName(currentNote.path)}-page-${pageNumber}.png`;
    await downloadDataUrl(filename, dataUrl);
    setStatus(`Downloaded page ${pageNumber}.`);
  } catch (err) {
    setStatus(`Couldn't render page: ${(err as Error).message}`, 'error');
  } finally {
    updateAvailability();
  }
}

button.addEventListener('click', () => void downloadCurrentPage());

window.addEventListener(NOTE_LOADED_EVENT, () => {
  setStatus('');
  updateAvailability();
});

updateAvailability();
