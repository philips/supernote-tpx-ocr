import { loadNoteIntoViewer } from './note-events';

const FIXTURE_PATH = `${import.meta.env.BASE_URL}fixtures/rtr.note`;
const FIXTURE_NAME = 'rtr.note';

const loadButton = document.getElementById('load-fixture') as HTMLButtonElement;
const statusEl = document.getElementById('status') as HTMLElement;

async function loadFixture(): Promise<void> {
  loadButton.disabled = true;
  statusEl.textContent = `Loading ${FIXTURE_NAME}…`;
  try {
    const res = await fetch(FIXTURE_PATH);
    if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
    const bytes = new Uint8Array(await res.arrayBuffer());
    loadNoteIntoViewer({ path: FIXTURE_NAME, bytes });
    statusEl.textContent = `Loaded ${FIXTURE_NAME} (${bytes.byteLength.toLocaleString()} bytes).`;
  } catch (err) {
    statusEl.textContent = `Failed to load fixture: ${(err as Error).message}`;
  } finally {
    loadButton.disabled = false;
  }
}

loadButton.addEventListener('click', () => void loadFixture());
