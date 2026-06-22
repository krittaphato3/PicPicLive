import type { Store } from '../../core/store';

export function attachAmbient(store: Store, bg: HTMLElement): void {
  store.subscribe(s => {
    const on = s.settings.player.ambient;
    bg.style.opacity = on ? '1' : '0';
    if (on) {
      const frame = s.frames[s.currentIndex];
      if (frame?.src) bg.style.backgroundImage = `url(${frame.src})`;
    }
  });
}
