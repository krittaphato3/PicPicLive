import type { Store } from '../../core/store';
import { applyTransition, setLastTransition, getTransition } from './transitions';
import { filterString } from './effects';

let interval: number | undefined;

export function startPlayer(store: Store, _els: { front: HTMLImageElement; back: HTMLImageElement }): void {
  stopPlayer();
  const s = store.getState();
  if (!s.isPlaying || !s.frames.length) return;
  interval = window.setInterval(() => {
    const st = store.getState();
    store.setIndex((st.currentIndex + 1) % st.frames.length);
  }, s.settings.player.speedMs);
}

export function stopPlayer(): void {
  if (interval) { clearInterval(interval); interval = undefined; }
}

export function renderCurrent(store: Store, els: { front: HTMLImageElement; back: HTMLImageElement }, instant: boolean): void {
  const s = store.getState();
  const frame = s.frames[s.currentIndex];
  if (!frame) return;
  const speed = s.settings.player.speedMs;
  const duration = instant ? 0 : Math.min(speed * 0.9, 1500);
  const filter = filterString(s.settings.player.filter);
  const result = applyTransition(els, { src: frame.src ?? '', filter }, s.settings.player.effect, duration);
  setLastTransition(result);
}

export { getTransition };
