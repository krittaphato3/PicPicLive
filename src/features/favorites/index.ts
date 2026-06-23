import type { Store } from '../../core/store';
import type { Album, Frame } from '../../core/types';
import { uid } from '../../core/ids';
import { showToast } from '../../services/toast';

const FAVORITES_ID = '__favorites__';
const FAVORITES_NAME = '★ Favorites';

export function initFavorites(store: Store): void {
  // Ensure favorites album exists
  store.subscribe(s => {
    if (!s.albums.some(a => a.id === FAVORITES_ID)) {
      store.setAlbums([{ id: FAVORITES_ID, name: FAVORITES_NAME, frames: [] }, ...s.albums]);
    }
  });
}

export function isFavorite(store: Store, frameId: string): boolean {
  const fav = store.getState().albums.find(a => a.id === FAVORITES_ID);
  return fav?.frames.some(f => f.id === frameId) ?? false;
}

export function toggleFavorite(store: Store, frame: Frame): void {
  const s = store.getState();
  const fav = s.albums.find(a => a.id === FAVORITES_ID);
  if (!fav) return;
  
  const isFav = fav.frames.some(f => f.id === frame.id);
  if (isFav) {
    fav.frames = fav.frames.filter(f => f.id !== frame.id);
    showToast('Removed from Favorites');
  } else {
    fav.frames.unshift({ ...frame, id: uid() }); // copy with new ID for virtual album
    showToast('Added to Favorites', { label: 'Undo', fn: () => toggleFavorite(store, frame) });
  }
  store.setAlbums(s.albums);
}

export function getFavoritesAlbum(store: Store): Album | undefined {
  return store.getState().albums.find(a => a.id === FAVORITES_ID);
}
