import type { Store } from '../../core/store';

export interface IdleEls {
  uiLayer: HTMLElement;
  homeBtn: HTMLElement;
  navZones: HTMLElement[];
}

export function attachIdle(store: Store, els: IdleEls): { poke: () => void } {
  let timer: number | undefined;

  function show(): void {
    els.uiLayer.classList.remove('hidden');
    els.homeBtn.style.display = 'flex';
    els.navZones.forEach(z => z.style.display = 'block');
    document.body.style.cursor = '';
    store.setUi({ idle: false });
  }

  function scheduleHide(): void {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      const s = store.getState();
      if (!s.frames.length || s.ui.gridOpen || s.ui.sidebarOpen || s.ui.settingsOpen) return;
      els.uiLayer.classList.add('hidden');
      els.homeBtn.style.display = 'none';
      els.navZones.forEach(z => z.style.display = 'none');
      document.body.style.cursor = 'none';
      store.setUi({ idle: true });
    }, store.getState().settings.uiIdleMs);
  }

  function poke(): void {
    const s = store.getState();
    if (!s.frames.length || s.ui.gridOpen) return;
    show();
    scheduleHide();
  }

  ['mousemove', 'keydown', 'click', 'wheel', 'touchstart'].forEach(ev => window.addEventListener(ev, poke));
  return { poke };
}
