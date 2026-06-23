import type { Store } from '../../core/store';
import type { Album, Frame } from '../../core/types';
import { h, escapeHtml } from '../../utils/dom';

const thumb = (fr?: Frame): string => fr ? `<img src="${fr.src ?? ''}" class="album-thumb" alt="">` : '';

export function coverGrid(album: Album): string {
  const count = album.frames.length;
  let layout = 'layout-4';
  let html = '';
  const f = album.frames;
  if (count === 1) { layout = 'layout-1'; html = thumb(f[0]); }
  else if (count === 2) { layout = 'layout-2'; html = thumb(f[0]) + thumb(f[1]); }
  else if (count === 3) { layout = 'layout-3'; html = thumb(f[0]) + thumb(f[1]) + thumb(f[2]); }
  else {
    for (let i = 0; i < 4; i++) {
      if (!f[i]) continue;
      html += (i === 3 && count > 4)
        ? `<div class="album-more-wrap"><img src="${f[i].src ?? ''}" alt=""><div class="album-remaining">+${count - 4}</div></div>`
        : thumb(f[i]);
    }
  }
  return `<div class="album-grid ${layout}">${html}</div><div class="album-info"><div class="album-name">${escapeHtml(album.name)}</div><div class="album-meta"><span>${count} items</span></div></div>`;
}

export function mountSidebar(store: Store, app: HTMLElement, onImportFolder: () => void, onDeleteAlbum: (id: string, name: string) => void): void {
  const list = h('div', { id: 'preset-list' });
  const search = h('input', { type: 'text', id: 'preset-search', placeholder: 'Search albums…' });
  const bar = h('div', { id: 'preset-bar' }, [
    h('div', { class: 'sidebar-header' }, [
      h('h3', {}, ['Library']),
      h('button', { class: 'ctrl-btn', title: 'Close', onclick: () => store.setUi({ sidebarOpen: false }) }, [h('i', { class: 'fas fa-chevron-left' })]),
    ]),
    search,
    list,
    h('div', { style: { marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' } }, [
      h('button', { id: 'add-folder-btn', class: 'up-btn', onclick: onImportFolder }, [h('i', { class: 'fas fa-plus' }), ' Import New Folder']),
    ]),
  ]);
  const toggle = h('button', { id: 'btn-presets-toggle', title: 'Open Library', onclick: () => store.setUi({ sidebarOpen: !store.getState().ui.sidebarOpen }) }, [h('i', { class: 'fas fa-folder' })]);
  app.append(toggle, bar);

  store.subscribe(s => {
    bar.classList.toggle('open', s.ui.sidebarOpen);
    toggle.style.opacity = s.ui.sidebarOpen ? '0' : '1';
    toggle.style.pointerEvents = s.ui.sidebarOpen ? 'none' : 'auto';
    void s;
    render();
  });

  search.addEventListener('input', render);

  function render(): void {
    const filter = search.value.trim().toLowerCase();
    list.innerHTML = '';
    const { albums, currentAlbumId } = store.getState();
    albums.forEach((album) => {
      if (filter && !album.name.toLowerCase().includes(filter)) return;
      const c = h('div', { class: 'album-card' + (currentAlbumId === album.id ? ' active' : '') });
      c.innerHTML = coverGrid(album) + `<button class="album-delete-btn" title="Delete album" style="position:absolute;top:8px;right:8px;background:rgba(0,0,0,0.7);color:#ef4444;border:1px solid rgba(239,68,68,0.3);border-radius:6px;width:32px;height:32px;display:flex;align-items:center;justify-content:center;cursor:pointer;opacity:0;transition:0.2s;z-index:50;backdrop-filter:blur(4px)"><i class="fas fa-trash-alt"></i></button>`;
      c.onclick = () => store.loadAlbum(album.id);
      const delBtn = c.querySelector('.album-delete-btn') as HTMLElement;
      if (delBtn) {
        delBtn.onclick = (e) => { e.stopPropagation(); onDeleteAlbum(album.id, album.name); };
        c.addEventListener('mouseenter', () => { delBtn.style.opacity = '1'; });
        c.addEventListener('mouseleave', () => { delBtn.style.opacity = '0'; });
      }
      list.append(c);
    });
  }
}
