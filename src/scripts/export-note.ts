import { NOTE_LOADED_EVENT, getCurrentNote } from './note-events';
import { downloadBytes } from './download-file';

const button = document.getElementById('download-note') as HTMLButtonElement;

function baseName(path: string): string {
  const file = path.split('/').pop() ?? path;
  return file.replace(/\.note$/i, '');
}

function updateAvailability(): void {
  button.disabled = !getCurrentNote();
}

// The unmodified original bytes - there's no supernote-typescript write/
// serialize support yet, so this can't embed AI-recognized text the way the
// PDF exports next to it do; it's a plain copy/backup of what was loaded.
function downloadNote(): void {
  const currentNote = getCurrentNote();
  if (!currentNote) return;
  downloadBytes(`${baseName(currentNote.path)}.note`, currentNote.bytes);
}

button.addEventListener('click', downloadNote);
window.addEventListener(NOTE_LOADED_EVENT, updateAvailability);
updateAvailability();
