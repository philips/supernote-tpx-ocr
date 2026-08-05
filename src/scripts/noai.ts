import { NOAI_STORAGE_KEY, isNoAiMode } from '../lib/noai';

const link = document.getElementById('noai-link') as HTMLAnchorElement;

if (isNoAiMode()) {
  link.textContent = 'Enable AI features';
  link.href = '#';
  link.addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.removeItem(NOAI_STORAGE_KEY);
    window.location.reload();
  });
}
