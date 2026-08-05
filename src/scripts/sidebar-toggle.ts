const menuToggle = document.getElementById('menu-toggle') as HTMLButtonElement;
const sidebarEl = document.getElementById('sidebar') as HTMLElement;

function setSidebarOpen(open: boolean): void {
  sidebarEl.classList.toggle('collapsed', !open);
  menuToggle.setAttribute('aria-expanded', String(open));
}

menuToggle.addEventListener('click', () => {
  setSidebarOpen(sidebarEl.classList.contains('collapsed'));
});
