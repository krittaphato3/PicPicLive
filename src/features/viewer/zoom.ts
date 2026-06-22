import type { Store } from '../../core/store';
import { clamp } from '../../utils/math';

export interface ZoomEls {
  viewer: HTMLElement;
  navCenter: HTMLElement;
  imgFront: HTMLImageElement;
  imgBack: HTMLImageElement;
  zoomReadout?: HTMLElement;
  zoomSlider?: HTMLInputElement;
}

export function attachZoom(store: Store, els: ZoomEls): () => void {
  let dragging = false;
  let startX = 0, startY = 0, baseX = 0, baseY = 0;

  function sync(): void {
    const { scale, panX, panY } = store.getState().view;
    const t = `translate(${panX}px,${panY}px) scale(${scale})`;
    els.imgFront.style.transform = t;
    els.imgBack.style.transform = t;
    if (els.zoomReadout) els.zoomReadout.textContent = `${Math.round(scale * 100)}%`;
    if (els.zoomSlider) els.zoomSlider.value = String(scale * 100);
  }

  els.viewer.addEventListener('wheel', (e) => {
    e.preventDefault();
    const v = store.getState().view;
    const next = clamp(v.scale + (e.deltaY > 0 ? -0.1 : 0.1), 1, 5);
    const panX = next === 1 ? 0 : v.panX;
    const panY = next === 1 ? 0 : v.panY;
    store.setView(next, panX, panY);
  }, { passive: false });

  els.navCenter.addEventListener('mousedown', (e) => {
    dragging = true;
    const v = store.getState().view;
    startX = e.clientX; startY = e.clientY; baseX = v.panX; baseY = v.panY;
    els.viewer.style.cursor = 'grabbing';
  });
  const onMove = (e: MouseEvent): void => {
    if (!dragging) return;
    store.setView(store.getState().view.scale, baseX + (e.clientX - startX), baseY + (e.clientY - startY));
  };
  const onUp = (): void => {
    if (!dragging) return;
    dragging = false;
    els.viewer.style.cursor = 'grab';
  };
  window.addEventListener('mousemove', onMove);
  window.addEventListener('mouseup', onUp);

  els.navCenter.addEventListener('dblclick', () => { store.setView(1, 0, 0); });

  if (els.zoomSlider) {
    els.zoomSlider.addEventListener('input', () => {
      const val = Number(els.zoomSlider!.value) / 100;
      const panX = val === 1 ? 0 : store.getState().view.panX;
      const panY = val === 1 ? 0 : store.getState().view.panY;
      store.setView(val, panX, panY);
    });
  }

  const off = store.subscribe(() => { if (!dragging) sync(); });
  sync();
  return () => {
    off();
    window.removeEventListener('mousemove', onMove);
    window.removeEventListener('mouseup', onUp);
  };
}
