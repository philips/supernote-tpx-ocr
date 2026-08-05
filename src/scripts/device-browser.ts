import {
  usbSupported,
  requestMtpDevice,
  connectMtp,
  mountedStorageIds,
  MtpFs,
  type MtpDevice,
  type ObjectInfo,
} from '../lib/mtp-ts';
import { loadNoteIntoViewer } from './note-events';
import { downloadBytes } from './download-file';

const connectButton = document.getElementById('connect') as HTMLButtonElement;
const statusEl = document.getElementById('status') as HTMLElement;
const crumbsEl = document.getElementById('crumbs') as HTMLElement;
const listingEl = document.getElementById('listing') as HTMLElement;
const uploadInput = document.getElementById('device-upload') as HTMLInputElement;

let mtp: MtpDevice | null = null;
let fs: MtpFs | null = null;
let path = '';

function setStatus(message: string): void {
  statusEl.textContent = message;
}

function renderCrumbs(): void {
  crumbsEl.replaceChildren();
  const segments = path.split('/').filter(Boolean);

  const root = document.createElement('a');
  root.textContent = 'root';
  root.href = '#';
  root.addEventListener('click', (e) => {
    e.preventDefault();
    void navigate('');
  });
  crumbsEl.append(root);

  let built = '';
  for (const segment of segments) {
    built += (built ? '/' : '') + segment;
    const target = built;
    crumbsEl.append(' / ');
    const link = document.createElement('a');
    link.textContent = segment;
    link.href = '#';
    link.addEventListener('click', (e) => {
      e.preventDefault();
      void navigate(target);
    });
    crumbsEl.append(link);
  }
}

function renderListing(entries: ObjectInfo[]): void {
  listingEl.replaceChildren();

  const sorted = [...entries].sort((a, b) => {
    if (a.isFolder !== b.isFolder) return a.isFolder ? -1 : 1;
    return a.filename.localeCompare(b.filename);
  });

  if (sorted.length === 0) {
    const empty = document.createElement('p');
    empty.textContent = '(empty folder)';
    listingEl.append(empty);
    return;
  }

  const table = document.createElement('table');
  for (const entry of sorted) {
    const row = document.createElement('tr');

    const nameCell = document.createElement('td');
    const link = document.createElement('a');
    link.href = '#';
    link.textContent = (entry.isFolder ? '📁 ' : '📄 ') + entry.filename;
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const childPath = path ? `${path}/${entry.filename}` : entry.filename;
      if (entry.isFolder) {
        void navigate(childPath);
      } else if (entry.filename.toLowerCase().endsWith('.note')) {
        void previewNote(childPath);
      }
    });
    nameCell.append(link);
    row.append(nameCell);

    const sizeCell = document.createElement('td');
    sizeCell.textContent = entry.isFolder ? '' : formatSize(entry.size);
    row.append(sizeCell);

    const actionsCell = document.createElement('td');
    if (!entry.isFolder) {
      const downloadLink = document.createElement('a');
      downloadLink.href = '#';
      downloadLink.textContent = '⬇';
      downloadLink.title = `Download ${entry.filename}`;
      downloadLink.setAttribute('aria-label', `Download ${entry.filename}`);
      downloadLink.addEventListener('click', (e) => {
        e.preventDefault();
        const childPath = path ? `${path}/${entry.filename}` : entry.filename;
        void downloadFile(childPath, entry.filename);
      });
      actionsCell.append(downloadLink);
    }
    row.append(actionsCell);

    table.append(row);
  }
  listingEl.append(table);
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

async function navigate(newPath: string): Promise<void> {
  if (!fs) return;
  path = newPath;
  renderCrumbs();
  setStatus(`Loading /${path}…`);
  try {
    const entries = await fs.readdir(path);
    renderListing(entries);
    setStatus(`/${path || ''}`);
  } catch (err) {
    setStatus(`Failed to list /${path}: ${(err as Error).message}`);
  }
}

async function previewNote(notePath: string): Promise<void> {
  if (!fs) return;
  setStatus(`Loading ${notePath}…`);
  try {
    const bytes = await fs.readFile(notePath);
    loadNoteIntoViewer({ path: notePath, bytes });
    setStatus(`/${path || ''}`);
  } catch (err) {
    setStatus(`Failed to load ${notePath}: ${(err as Error).message}`);
  }
}

async function downloadFile(filePath: string, filename: string): Promise<void> {
  if (!fs) return;
  setStatus(`Downloading ${filePath}…`);
  try {
    const bytes = await fs.readFile(filePath);
    downloadBytes(filename, bytes);
    setStatus(`/${path || ''}`);
  } catch (err) {
    setStatus(`Failed to download ${filePath}: ${(err as Error).message}`);
  }
}

async function uploadToDevice(file: File): Promise<void> {
  if (!fs) return;
  const targetPath = path ? `${path}/${file.name}` : file.name;
  setStatus(`Uploading ${file.name}…`);
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    await fs.writeFile(targetPath, bytes);
    await navigate(path);
    setStatus(`Uploaded ${file.name} to /${path || ''}`);
  } catch (err) {
    setStatus(`Failed to upload ${file.name}: ${(err as Error).message}`);
  } finally {
    uploadInput.value = '';
  }
}

async function connect(): Promise<void> {
  if (!usbSupported()) {
    setStatus('WebUSB is not available in this browser. Use Chrome, Edge, or another Chromium browser.');
    return;
  }

  connectButton.disabled = true;
  setStatus('Requesting device…');
  try {
    const device = await requestMtpDevice();
    setStatus('Opening MTP session…');
    mtp = await connectMtp(device);

    const storageIds = mountedStorageIds(await mtp.getStorageIDs());
    if (storageIds.length === 0) throw new Error('no mounted storage found on device');

    fs = new MtpFs(mtp, storageIds[0]);
    connectButton.textContent = 'Connected';
    uploadInput.disabled = false;
    await navigate('');
  } catch (err) {
    setStatus(`Connection failed: ${(err as Error).message}`);
    connectButton.disabled = false;
  }
}

connectButton.addEventListener('click', () => void connect());
uploadInput.addEventListener('change', () => {
  const file = uploadInput.files?.[0];
  if (file) void uploadToDevice(file);
});

if (!usbSupported()) {
  setStatus('WebUSB is not available in this browser. Use Chrome, Edge, or another Chromium browser.');
  connectButton.disabled = true;
}
