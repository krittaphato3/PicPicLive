import type { Store } from '../../core/store';
import type { Frame } from '../../core/types';
import { h } from '../../utils/dom';
import { filterString } from '../player/effects';
import { showConfirm } from '../modals/confirm';
import { deleteFrame as dbDeleteFrame } from '../../services/db';
import { showToast } from '../../services/toast';

export function mountGrid(store: Store, app: HTMLElement): { open: () => void; close: () => void } {
  const headerSpan = h('span', {}, ['Inventory']);
  const closeBtn = h('button', { class: 'ctrl-btn', title: 'Close (Esc)', onclick: () => close() }, [h('i', { class: 'fas fa-times' })]);
  const header = h('div', { id: 'grid-header' }, [headerSpan, h('div', { style: { display: 'flex', gap: '15px' } }, [closeBtn])]);
  const content = h('div', { id: 'grid-content' });
  const view = h('div', { id: 'grid-view' }, [header, content]);
  view.style.display = 'none';
  app.append(view);

  let dragSrc = -1;

  function render(): void {
    const { frames, currentIndex, settings } = store.getState();
    content.innerHTML = '';
    frames.forEach((frame, index) => {
      const item = h('div', { class: 'grid-item' + (index === currentIndex ? ' active' : ''), draggable: 'true' });
      const img = h('img', { src: frame.src ?? '', alt: '', loading: 'lazy' }) as HTMLImageElement;
      const f = filterString(settings.player.filter);
      if (f !== 'none') img.style.filter = f;
      const del = h('button', { class: 'grid-delete', title: 'Delete' }, [h('i', { class: 'fas fa-trash' })]);
      del.onclick = (e) => { e.stopPropagation(); askDelete(store, frame, index); };
      item.onclick = () => { store.setIndex(index); close(); };
      item.addEventListener('dragstart', () => { dragSrc = index; });
      item.addEventListener('dragover', (e) => e.preventDefault());
      item.addEventListener('drop', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (dragSrc === -1 || dragSrc === index) return;
        reorder(store, dragSrc, index);
        dragSrc = -1;
      });
      item.append(img, del);
      content.append(item);
    });
  }

  function open(): void {
    store.setPlaying(false);
    store.setUi({ gridOpen: true });
    view.style.display = 'flex';
    render();
  }
  function close(): void {
    store.setUi({ gridOpen: false });
    view.style.display = 'none';
  }

  store.subscribe(s => {
    void s;
    if (view.style.display === 'flex') render();
  });

  return { open, close };
}

function reorder(store: Store, from: number, to: number): void {
  const s = store.getState();
  const frames = [...s.frames];
  const [moved] = frames.splice(from, 1);
  frames.splice(to, 0, moved);
  frames.forEach((f, i) => { f.order = i; });
  let nextIndex = s.currentIndex;
  if (s.currentIndex === from) nextIndex = to;
  store.setFrames(frames);
  store.setIndex(nextIndex);
}

function askDelete(store: Store, frame: Frame, index: number): void {
  showConfirm('Delete Image?', `Remove "${frame.name}"?`, () => {
    void dbDeleteFrame(frame.id).catch(e => console.error(e));
    const s = store.getState();
    const frames = s.frames.filter((_: Frame, i: number) => i !== index);
    s.albums.forEach(a => { a.frames = a.frames.filter(f => f.id !== frame.id); });
    store.setFrames(frames);
    store.setAlbums(s.albums);
    if (!frames.length) { store.closeAlbum(); }
    else {
      store.setIndex(Math.min(index, frames.length - 1));
    }
    showToast('Image deleted', { label: 'Undo', fn: () => showToast('Restore coming in Phase 6') });
  });
}
