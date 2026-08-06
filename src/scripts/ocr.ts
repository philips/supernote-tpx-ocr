import { loadGrant, saveGrant, recognizePageText, DEFAULT_PROMPT } from '../lib/tpx';
import { parseNote, rasterizePageToDataUrl } from '../lib/ocr/rasterize';
import { buildAiTextPdf } from '../lib/ocr/pdf';
import { NOTE_LOADED_EVENT, getCurrentNote } from './note-events';
import { setSidebarOpen } from './sidebar-toggle';
import { dispatchOpenSettings } from './sidebar-tabs';
import { downloadBytes } from './download-file';
import { isNoAiMode } from '../lib/noai';

const runButton = document.getElementById('run-ocr') as HTMLButtonElement;
const downloadButton = document.getElementById('download-txt') as HTMLButtonElement;
const downloadPdfButton = document.getElementById('download-pdf-ai') as HTMLButtonElement;
const ocrStatusEl = document.getElementById('ocr-status') as HTMLElement;
const ocrResultEl = document.getElementById('ocr-result') as HTMLElement;
const ocrTextEl = document.getElementById('ocr-text') as HTMLElement;
const promptEl = document.getElementById('tpx-prompt') as HTMLTextAreaElement;
const modelSelect = document.getElementById('tpx-model') as HTMLSelectElement;

let running = false;
// Raw (un-prefixed) per-page recognized text from the last successful run,
// for the AI-text PDF button - cleared on any new note load or re-run so a
// stale result never gets embedded in a PDF for the wrong note.
let lastOcrPages: string[] = [];

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
  downloadPdfButton.disabled = running;
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
  downloadPdfButton.hidden = true;
  lastOcrPages = [];
  ocrResultEl.hidden = false;
  ocrTextEl.textContent = '';

  try {
    const note = parseNote(currentNote.bytes);
    const pageCount = note.pages.length;
    const prompt = promptEl.value.trim() || DEFAULT_PROMPT;

    const pageTexts: string[] = [];
    const rawPages: string[] = [];
    for (let page = 1; page <= pageCount; page++) {
      setOcrStatus(`Recognizing page ${page} of ${pageCount} (${model})…`);
      const imageDataUrl = await rasterizePageToDataUrl(note, page);
      const result = await recognizePageText({ grant, model, imageDataUrl, prompt });
      grant = result.grant;
      saveGrant(grant);
      const text = result.text.trim();
      rawPages.push(text);
      pageTexts.push(`## Page ${page}\n\n${text}`);
      ocrTextEl.textContent = pageTexts.join('\n\n');
    }

    setOcrStatus(`Done — ${pageCount} page${pageCount === 1 ? '' : 's'} recognized.`);
    downloadButton.hidden = false;
    lastOcrPages = rawPages;
    downloadPdfButton.hidden = false;
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

// Embeds the just-recognized AI text as an invisible, searchable layer over
// the note's own page images - see buildAiTextPdf()'s doc comment for how
// this differs from (and is coarser than) the on-device RTR-based PDF
// export (export-pdf.ts) it sits alongside.
async function downloadPdfWithAiText(): Promise<void> {
  const currentNote = getCurrentNote();
  if (!currentNote || lastOcrPages.length === 0) return;

  downloadPdfButton.disabled = true;
  setOcrStatus('Building PDF…');
  try {
    const note = parseNote(currentNote.bytes);
    const pdfBytes = await buildAiTextPdf(note, lastOcrPages);
    downloadBytes(`${baseName(currentNote.path)}-tpx-ocr.pdf`, pdfBytes);
    setOcrStatus(`Downloaded ${note.pages.length} page${note.pages.length === 1 ? '' : 's'} as PDF.`);
  } catch (err) {
    setOcrStatus(`Couldn't build PDF: ${(err as Error).message}`, 'error');
  } finally {
    updateAvailability();
  }
}

// The OCR toolbar is hidden entirely in no-AI mode - skip wiring it up, so
// there's no TPX/inference network activity even from a hidden control.
if (!isNoAiMode()) {
  runButton.addEventListener('click', () => void runOcr());
  downloadButton.addEventListener('click', downloadTxt);
  downloadPdfButton.addEventListener('click', () => void downloadPdfWithAiText());

  window.addEventListener(NOTE_LOADED_EVENT, () => {
    ocrResultEl.hidden = true;
    downloadButton.hidden = true;
    downloadPdfButton.hidden = true;
    lastOcrPages = [];
    setOcrStatus('');
    updateAvailability();
  });

  updateAvailability();
}
