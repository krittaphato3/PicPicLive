import type { Album, AppSettings, Frame } from './types';
import { bus } from './event-bus';

export interface AppState {
  albums: Album[];
  currentAlbumId: string | null;
  frames: Frame[];
  currentIndex: number;
  isPlaying: boolean;
  settings: AppSettings;
  view: { scale: number; panX: number; panY: number };
  ui: { idle: boolean; sidebarOpen: boolean; settingsOpen: boolean; gridOpen: boolean };
}

export const DEFAULT_SETTINGS: AppSettings = {
  player: {
    speedMs: 3000, effect: 'blur', filter: 'none', sort: 'name',
    shuffle: 'off', ambient: false, scaleCover: false,
  },
  pip: { ratioMode: 'fit', syncZoom: true, showInfo: false },
  theme: 'dark', masterZoom: 1, uiIdleMs: 3500,
};

export function createStore(initial: Partial<AppState> = {}) {
  let state: AppState = {
    albums: [], currentAlbumId: null, frames: [], currentIndex: 0,
    isPlaying: false, settings: DEFAULT_SETTINGS,
    view: { scale: 1, panX: 0, panY: 0 },
    ui: { idle: false, sidebarOpen: false, settingsOpen: false, gridOpen: false },
    ...initial,
  };
  const subs = new Set<(s: AppState) => void>();

  function setState(patch: Partial<AppState>) {
    state = { ...state, ...patch };
    subs.forEach(fn => fn(state));
  }
  return {
    getState: () => state,
    subscribe(fn: (s: AppState) => void) { subs.add(fn); fn(state); return () => subs.delete(fn); },
    setFrames(frames: Frame[]) { setState({ frames }); bus.emit('frames-changed', { count: frames.length }); },
    setIndex(i: number) { setState({ currentIndex: i }); bus.emit('current-frame-changed', { index: i }); },
    setPlaying(p: boolean) { setState({ isPlaying: p }); },
    setSettings(patch: Partial<AppSettings>) { setState({ settings: { ...state.settings, ...patch } }); bus.emit('settings-changed'); },
    setView(scale: number, panX: number, panY: number) { setState({ view: { scale, panX, panY } }); bus.emit('view-changed', { scale, panX, panY }); },
    setUi(patch: Partial<AppState['ui']>) { setState({ ui: { ...state.ui, ...patch } }); },
    setAlbums(albums: Album[]) { setState({ albums }); bus.emit('albums-changed'); },
    loadAlbum(albumId: string) {
      const album = state.albums.find(a => a.id === albumId);
      if (!album) return;
      setState({ currentAlbumId: albumId, frames: [...album.frames], currentIndex: 0 });
      bus.emit('album-loaded', { albumId });
      bus.emit('frames-changed', { count: album.frames.length });
    },
    closeAlbum() {
      setState({ currentAlbumId: null, frames: [], currentIndex: 0, isPlaying: false });
    },
  };
}

export type Store = ReturnType<typeof createStore>;
