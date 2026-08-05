const STORAGE_KEY = 'supernote-tpx-ocr.welcome-dismissed';

const dialog = document.getElementById('welcome-dialog') as HTMLDialogElement;
const dismissButton = document.getElementById('welcome-dismiss') as HTMLButtonElement;

dismissButton.addEventListener('click', () => dialog.close());

// Fires on Escape too, not just the button - one place to persist "seen" either way.
dialog.addEventListener('close', () => {
  localStorage.setItem(STORAGE_KEY, '1');
});

// A click that lands on the <dialog> element itself (not a child) is a click on the
// backdrop area - the standard native-<dialog> "click outside to close" trick.
dialog.addEventListener('click', (e) => {
  if (e.target === dialog) dialog.close();
});

if (!localStorage.getItem(STORAGE_KEY)) {
  dialog.showModal();
}
