import type { Store } from '../../core/store';
import { h } from '../../utils/dom';
import { filterString } from '../player/effects';

export function mountFilmstrip(store: Store, uiLayer: HTMLElement): void {
  const strip = h('div', { id: 'filmstrip' });
  uiLayer.append(strip);

  let dragSrc = -1;

  function render(): void {
    const { frames, currentIndex, settings } = store.getState();
    strip.innerHTML = '';
    frames.forEach((frame, index) => {
      const wrap = h('div', { class: 'thumb-wrap' + (index === currentIndex ? ' active' : ''), draggable: 'true' });
      const img = h('img', { src: frame.src ?? '', alt: '' }) as HTMLImageElement;
      const f = filterString(settings.player.filter);
      if (f !== 'none') img.style.filter = f;
      wrap.append(img);
      wrap.onclick = () => store.setIndex(index);
      wrap.addEventListener('dragstart', () => { dragSrc = index; });
      wrap.addEventListener('dragover', (e) => e.preventDefault());
      wrap.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (dragSrc === -1 || dragSrc === index) return;
        reorder(store, dragSrc, index);
        dragSrc = -1;
      });
      strip.append(wrap);
    });
    const active = strip.children[currentIndex] as HTMLElement | undefined;
    active?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  store.subscribe(s => {
    void s;
    render();
  });
}

function reorder(store: Store, from: number, to: number): void {
  const s = store.getState();
  const frames = [...s.frames];
  const [moved] = frames.splice(from, 1);
  frames.splice(to, 0, moved);
  // persist custom order
  frames.forEach((f, i) => { f.order = i; });
  let nextIndex = s.currentIndex;
  if (s.currentIndex === from) nextIndex = to;
  store.setFrames(frames);
  store.setIndex(nextIndex);
}
