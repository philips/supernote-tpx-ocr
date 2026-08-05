const tabBrowse = document.getElementById('tab-browse') as HTMLButtonElement;
const tabSettings = document.getElementById('tab-settings') as HTMLButtonElement;
const browsePanel = document.getElementById('browse-panel') as HTMLElement;
const settingsPanel = document.getElementById('settings-panel') as HTMLElement;

export const OPEN_SETTINGS_EVENT = 'supernote-tpx:open-settings';

export function showSettingsTab(): void {
  browsePanel.hidden = true;
  settingsPanel.hidden = false;
  tabBrowse.classList.remove('active');
  tabSettings.classList.add('active');
  tabBrowse.setAttribute('aria-selected', 'false');
  tabSettings.setAttribute('aria-selected', 'true');
}

function showBrowseTab(): void {
  browsePanel.hidden = false;
  settingsPanel.hidden = true;
  tabBrowse.classList.add('active');
  tabSettings.classList.remove('active');
  tabBrowse.setAttribute('aria-selected', 'true');
  tabSettings.setAttribute('aria-selected', 'false');
}

/** Lets other scripts (e.g. ocr.ts, when TPX isn't connected yet) switch the sidebar to Settings without importing DOM internals. */
export function dispatchOpenSettings(): void {
  window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT));
}

tabBrowse.addEventListener('click', showBrowseTab);
tabSettings.addEventListener('click', showSettingsTab);
window.addEventListener(OPEN_SETTINGS_EVENT, showSettingsTab);

showBrowseTab();
