import { loadGrant, saveGrant, recognizePageText, DEFAULT_PROMPT } from '../lib/tpx';
import { parseNote, rasterizePageToDataUrl } from '../lib/ocr/rasterize';
import { NOTE_LOADED_EVENT, getCurrentNote } from './note-events';
import { setSidebarOpen } from './sidebar-toggle';
import { dispatchOpenSettings } from './sidebar-tabs';
import { downloadBytes } from './download-file';
import { isNoAiMode } from '../lib/noai';

const runButton = document.getElementById('run-ocr') as HTMLButtonElement;
const downloadButton = document.getElementById('download-txt') as HTMLButtonElement;
const ocrStatusEl = document.getElementById('ocr-status') as HTMLElement;
const ocrResultEl = document.getElementById('ocr-result') as HTMLElement;
const ocrTextEl = document.getElementById('ocr-text') as HTMLElement;
const promptEl = document.getElementById('tpx-prompt') as HTMLTextAreaElement;
const modelSelect = document.getElementById('tpx-model') as HTMLSelectElement;

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
  runButton.disabled = running || !getCurrentNote();
}

async function runOcr(): Promise<void> {
  const currentNote = getCurrentNote();
  if (!currentNote) return;

  let grant = loadGrant();
  if (!grant) {
    setSidebarOpen(true);
    dispatchOpenSettings();
    setOcrStatus('Connect TPX in Settings first.', 'warning');
    return;
  }

  const model = modelSelect.value;
  if (!model) {
    setSidebarOpen(true);
    dispatchOpenSettings();
    setOcrStatus('No model selected - check Settings.', 'warning');
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
  const currentNote = getCurrentNote();
  const filename = `${currentNote ? baseName(currentNote.path) : 'note'}-tpx-ocr.txt`;
  downloadBytes(filename, ocrTextEl.textContent ?? '');
}

// The OCR toolbar is hidden entirely in no-AI mode - skip wiring it up, so
// there's no TPX/inference network activity even from a hidden control.
if (!isNoAiMode()) {
  runButton.addEventListener('click', () => void runOcr());
  downloadButton.addEventListener('click', downloadTxt);

  window.addEventListener(NOTE_LOADED_EVENT, () => {
    ocrResultEl.hidden = true;
    downloadButton.hidden = true;
    setOcrStatus('');
    updateAvailability();
  });

  updateAvailability();
}
