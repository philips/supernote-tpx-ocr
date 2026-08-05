const menuToggle = document.getElementById('menu-toggle') as HTMLButtonElement;
const sidebarEl = document.getElementById('sidebar') as HTMLElement;
const backdropEl = document.getElementById('sidebar-backdrop') as HTMLElement;

export function setSidebarOpen(open: boolean): void {
  sidebarEl.classList.toggle('collapsed', !open);
  menuToggle.setAttribute('aria-expanded', String(open));
  // Only ever visible within the mobile breakpoint (see global.css) - harmless to keep in sync unconditionally.
  backdropEl.hidden = !open;
}

menuToggle.addEventListener('click', () => {
  setSidebarOpen(sidebarEl.classList.contains('collapsed'));
});

// Mobile only (see global.css): tapping the dimmed area behind the drawer closes it.
backdropEl.addEventListener('click', () => setSidebarOpen(false));
