import { toPdf } from 'supernote-typescript';
import { parseNote } from '../lib/ocr/rasterize';
import { NOTE_LOADED_EVENT, getCurrentNote } from './note-events';
import { downloadBytes } from './download-file';

const button = document.getElementById('download-pdf') as HTMLButtonElement;
const statusEl = document.getElementById('pdf-status') as HTMLElement;

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

// toPdf() rasterizes every page and draws each page's recognized
// handwriting (RTR) text invisibly on top at the position it was written,
// so the resulting PDF is searchable/selectable in a PDF viewer - same
// approach supernote-typescript's own README describes for toPdf's PDF
// output. No AI/TPX involved, so this stays available in no-AI mode.
async function downloadPdf(): Promise<void> {
  const currentNote = getCurrentNote();
  if (!currentNote) return;

  button.disabled = true;
  setStatus('Building PDF…');
  try {
    const note = parseNote(currentNote.bytes);
    const pdfBytes = await toPdf(note);
    downloadBytes(`${baseName(currentNote.path)}.pdf`, pdfBytes);
    const pageCount = note.pages.length;
    setStatus(`Downloaded ${pageCount} page${pageCount === 1 ? '' : 's'} as PDF.`);
  } catch (err) {
    setStatus(`Couldn't build PDF: ${(err as Error).message}`, 'error');
  } finally {
    updateAvailability();
  }
}

button.addEventListener('click', () => void downloadPdf());

window.addEventListener(NOTE_LOADED_EVENT, () => {
  setStatus('');
  updateAvailability();
});

updateAvailability();
