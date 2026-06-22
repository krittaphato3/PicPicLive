import type { Store } from '../../core/store';
import { h } from '../../utils/dom';
import { coverGrid } from './sidebar';

export function mountLanding(store: Store, app: HTMLElement, actions: { onPickFiles: () => void; onPickFolder: () => void }): void {
  const scanStatus = h('p', { id: 'scan-status', style: { color: 'var(--text-mute)' } }, ['Accessing Local Storage…']);
  const grid = h('div', { id: 'landing-grid' }, [scanStatus]);
  const zone = h('div', { id: 'upload-zone' }, [
    h('div', { class: 'landing-section upload-content' }, [
      h('i', { class: 'fas fa-cloud-upload-alt main-icon' }),
      h('h2', { style: { fontWeight: '300', margin: '0 0 10px 0' } }, ['Import Media']),
      h('p', { style: { color: 'var(--text-mute)', fontSize: '0.9rem', marginBottom: '25px' } }, ['Files stored locally. No server upload.']),
      h('div', { class: 'upload-options' }, [
        h('button', { class: 'up-btn', onclick: actions.onPickFiles }, [h('i', { class: 'fas fa-images' }), ' Select Images']),
        h('button', { class: 'up-btn', onclick: actions.onPickFolder }, [h('i', { class: 'fas fa-folder-open' }), ' Import Folder']),
      ]),
    ]),
    h('div', { class: 'landing-section', id: 'landing-grid-container' }, [
      h('div', { id: 'landing-header' }, [h('i', { class: 'fas fa-compact-disc' }), h('span', {}, ['Detected Albums'])]),
      grid,
    ]),
  ]);
  app.append(zone);

  store.subscribe(s => {
    if (s.albums.length) { scanStatus.style.display = 'none'; }
    else {
      scanStatus.textContent = 'No local albums found.';
      scanStatus.style.display = '';
    }
    grid.querySelectorAll('.landing-card').forEach(n => n.remove());
    s.albums.forEach((album) => {
      const c = h('div', { class: 'landing-card' });
      c.innerHTML = coverGrid(album);
      c.onclick = () => store.loadAlbum(album.id);
      grid.append(c);
    });
    zone.style.display = s.currentAlbumId ? 'none' : 'flex';
  });
}
