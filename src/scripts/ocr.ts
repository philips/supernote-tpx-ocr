import { loadGrant, saveGrant, listModels, pickVisionModel, recognizePageText, DEFAULT_PROMPT } from '../lib/tpx';
import { parseNote, rasterizePageToDataUrl } from '../lib/ocr/rasterize';
import { NOTE_LOADED_EVENT, type NoteLoadedDetail } from './note-events';
import { setSidebarOpen } from './sidebar-toggle';
import { dispatchOpenSettings } from './sidebar-tabs';

const runButton = document.getElementById('run-ocr') as HTMLButtonElement;
const downloadButton = document.getElementById('download-txt') as HTMLButtonElement;
const ocrStatusEl = document.getElementById('ocr-status') as HTMLElement;
const ocrResultEl = document.getElementById('ocr-result') as HTMLElement;
const ocrTextEl = document.getElementById('ocr-text') as HTMLElement;
const promptEl = document.getElementById('tpx-prompt') as HTMLTextAreaElement;

let currentNote: NoteLoadedDetail | null = null;
let running = false;

function baseName(path: string): string {
  const file = path.split('/').pop() ?? path;
  return file.replace(/\.note$/i, '');
}

type StatusLevel = 'info' | 'warning' | 'error';

function setOcrStatus(text: string, level: StatusLevel = 'info'): void {
  ocrStatusEl.textContent = text;
  ocrStatusEl.classList.toggle('status-warning', level === 'warning');
  ocrStatusEl.classList.toggle('status-error', level === 'error');
}

function updateAvailability(): void {
  runButton.disabled = running || !currentNote;
}

async function runOcr(): Promise<void> {
  if (!currentNote) return;

  let grant = loadGrant();
  if (!grant) {
    setSidebarOpen(true);
    dispatchOpenSettings();
    setOcrStatus('Connect TPX in Settings first.', 'warning');
    return;
  }

  running = true;
  updateAvailability();
  downloadButton.hidden = true;
  ocrResultEl.hidden = false;
  ocrTextEl.textContent = '';

  try {
    const note = parseNote(currentNote.bytes);
    const pageCount = note.pages.length;
    setOcrStatus('Loading model list…');
    const models = await listModels(grant.resource);
    const model = pickVisionModel(models, grant.models);
    const prompt = promptEl.value.trim() || DEFAULT_PROMPT;

    const pageTexts: string[] = [];
    for (let page = 1; page <= pageCount; page++) {
      setOcrStatus(`Recognizing page ${page} of ${pageCount} (${model})…`);
      const imageDataUrl = await rasterizePageToDataUrl(note, page);
      const result = await recognizePageText({ grant, model, imageDataUrl, prompt });
      grant = result.grant;
      saveGrant(grant);
      pageTexts.push(`## Page ${page}\n\n${result.text.trim()}`);
      ocrTextEl.textContent = pageTexts.join('\n\n');
    }

    setOcrStatus(`Done — ${pageCount} page${pageCount === 1 ? '' : 's'} recognized.`);
    downloadButton.hidden = false;
  } catch (err) {
    setOcrStatus(`Recognition failed: ${(err as Error).message}`, 'error');
  } finally {
    running = false;
    updateAvailability();
  }
}

function downloadTxt(): void {
  const text = ocrTextEl.textContent ?? '';
  const blob = new Blob([text], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${currentNote ? baseName(currentNote.path) : 'note'}-tpx-ocr.txt`;
  link.click();
  URL.revokeObjectURL(url);
}

runButton.addEventListener('click', () => void runOcr());
downloadButton.addEventListener('click', downloadTxt);

window.addEventListener(NOTE_LOADED_EVENT, (e) => {
  currentNote = (e as CustomEvent<NoteLoadedDetail>).detail;
  ocrResultEl.hidden = true;
  downloadButton.hidden = true;
  setOcrStatus('');
  updateAvailability();
});

updateAvailability();
