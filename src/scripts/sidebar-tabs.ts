interface Tab {
  button: HTMLButtonElement;
  panel: HTMLElement;
}

function getTab(buttonId: string, panelId: string): Tab {
  return {
    button: document.getElementById(buttonId) as HTMLButtonElement,
    panel: document.getElementById(panelId) as HTMLElement,
  };
}

const browseTab = getTab('tab-browse', 'browse-panel');
const settingsTab = getTab('tab-settings', 'settings-panel');
const convertTab = getTab('tab-convert', 'convert-panel');
const tabs = [browseTab, settingsTab, convertTab];

export const OPEN_SETTINGS_EVENT = 'supernote-tpx:open-settings';

function showTab(active: Tab): void {
  for (const tab of tabs) {
    const isActive = tab === active;
    tab.panel.hidden = !isActive;
    tab.button.classList.toggle('active', isActive);
    tab.button.setAttribute('aria-selected', String(isActive));
  }
}

export function showSettingsTab(): void {
  showTab(settingsTab);
}

/** Lets other scripts (e.g. ocr.ts, when TPX isn't connected yet) switch the sidebar to Settings without importing DOM internals. */
export function dispatchOpenSettings(): void {
  window.dispatchEvent(new Event(OPEN_SETTINGS_EVENT));
}

for (const tab of tabs) {
  tab.button.addEventListener('click', () => showTab(tab));
}
window.addEventListener(OPEN_SETTINGS_EVENT, showSettingsTab);

showTab(browseTab);
