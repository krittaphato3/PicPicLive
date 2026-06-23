import type { Store } from '../../core/store';
import type { Album } from '../../core/types';
import { h, escapeHtml } from '../../utils/dom';
import { showToast } from '../../services/toast';

export function showRenameModal(store: Store, album: Album, onRename: (newName: string) => void): void {
  const overlay = h('div', { id: 'modal-overlay', class: 'active', style: { display: 'flex' } });
  const input = h('input', { type: 'text', value: album.name, style: { width: '100%', padding: '12px', marginBottom: '20px', borderRadius: 'var(--r-md)', border: '1px solid var(--hairline)', background: 'var(--panel)', color: 'var(--text)', fontSize: '1rem', boxSizing: 'border-box' } }) as HTMLInputElement;
  const box = h('div', { class: 'modal-box', style: { width: '350px' } }, [
    h('h3', { class: 'modal-title' }, ['Rename Album']),
    input,
    h('div', { class: 'modal-actions' }, [
      h('button', { class: 'modal-btn btn-cancel', onclick: close }, ['Cancel']),
      h('button', { class: 'modal-btn btn-confirm', onclick: submit }, ['Rename']),
    ]),
  ]);
  overlay.append(box);
  document.body.append(overlay);
  input.focus();
  input.select();

  function close(): void {
    document.body.removeChild(overlay);
  }
  function submit(): void {
    const newName = input.value.trim();
    if (newName && newName !== album.name) {
      onRename(newName);
    }
    close();
  }
  overlay.onclick = (e) => { if (e.target === overlay) close(); };
}

export function showMergeModal(store: Store, targetAlbum: Album, onMerge: (sourceAlbumId: string) => void): void {
  const otherAlbums = store.getState().albums.filter(a => a.id !== targetAlbum.id && a.id !== '__favorites__');
  if (!otherAlbums.length) { showToast('No other albums to merge'); return; }

  const overlay = h('div', { id: 'modal-overlay', class: 'active', style: { display: 'flex' } });
  const select = h('select', { style: { width: '100%', padding: '12px', marginBottom: '20px', borderRadius: 'var(--r-md)', border: '1px solid var(--hairline)', background: 'var(--panel)', color: 'var(--text)', fontSize: '1rem' } });
  otherAlbums.forEach(a => select.append(h('option', { value: a.id }, [escapeHtml(a.name)])));
  const box = h('div', { class: 'modal-box' }, [
    h('h3', { class: 'modal-title' }, [`Merge into "${escapeHtml(targetAlbum.name)}"`]),
    h('p', { class: 'modal-desc' }, ['Select album to merge from (will be deleted):']),
    select,
    h('div', { class: 'modal-actions' }, [
      h('button', { class: 'modal-btn btn-cancel', onclick: close }, ['Cancel']),
      h('button', { class: 'modal-btn btn-confirm', onclick: submit }, ['Merge']),
    ]),
  ]);
  overlay.append(box);
  document.body.append(overlay);

  function close(): void { document.body.removeChild(overlay); }
  function submit(): void {
    if (select.value) { onMerge(select.value); }
    close();
  }
  overlay.onclick = (e) => { if (e.target === overlay) close(); };
}

export function showSplitModal(store: Store, sourceAlbum: Album, onSplit: (frameIds: string[], newAlbumName: string) => void): void {
  if (sourceAlbum.frames.length < 2) { showToast('Need at least 2 images to split'); return; }

  const overlay = h('div', { id: 'modal-overlay', class: 'active', style: { display: 'flex' } });
  const nameInput = h('input', { type: 'text', placeholder: 'New album name', style: { width: '100%', padding: '12px', marginBottom: '12px', borderRadius: 'var(--r-md)', border: '1px solid var(--hairline)', background: 'var(--panel)', color: 'var(--text)', fontSize: '1rem', boxSizing: 'border-box' } }) as HTMLInputElement;
  const framesDiv = h('div', { style: { maxHeight: '200px', overflowY: 'auto', marginBottom: '20px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' } });
  sourceAlbum.frames.forEach(f => {
    const label = h('label', { style: { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '4px', borderRadius: 'var(--r-sm)' } });
    const checkbox = h('input', { type: 'checkbox', value: f.id, style: { accentColor: 'var(--accent)' } }) as HTMLInputElement;
    const img = h('img', { src: f.src ?? '', alt: '', style: { width: '32px', height: '32px', objectFit: 'cover', borderRadius: 'var(--r-sm)' } });
    label.append(checkbox, img, h('span', { style: { fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } }, [escapeHtml(f.name)]));
    framesDiv.append(label);
  });
  const box = h('div', { class: 'modal-box', style: { width: '400px', maxHeight: '80vh', overflow: 'auto' } }, [
    h('h3', { class: 'modal-title' }, ['Split Album']),
    h('p', { class: 'modal-desc' }, ['Select images for new album:']),
    nameInput,
    framesDiv,
    h('div', { class: 'modal-actions' }, [
      h('button', { class: 'modal-btn btn-cancel', onclick: close }, ['Cancel']),
      h('button', { class: 'modal-btn btn-confirm', onclick: submit }, ['Create']),
    ]),
  ]);
  overlay.append(box);
  document.body.append(overlay);
  nameInput.focus();

  function close(): void { document.body.removeChild(overlay); }
  function submit(): void {
    const name = nameInput.value.trim() || 'New Album';
    const selected = Array.from(framesDiv.querySelectorAll('input:checked')).map(cb => cb.value);
    if (!selected.length) { showToast('Select at least one image'); return; }
    onSplit(selected, name);
    close();
  }
  overlay.onclick = (e) => { if (e.target === overlay) close(); };
}
