import './styles/tokens.css';
import './styles/base.css';
import './styles/components.css';
import './styles/viewer.css';
import './styles/chrome.css';
import './styles/landings.css';

import { createStore } from './core/store';
import { uid } from './core/ids';
import { getAll, groupItems } from './services/db';
import { handleFiles } from './services/import';
import { mountToast, showToast } from './services/toast';
import { installKeyboard, registerKey } from './services/keyboard';
import { mountSidebar } from './features/library/sidebar';
import { mountLanding } from './features/library/landing';
import { mountViewer } from './features/viewer';
import { mountControls } from './features/viewer/controls';
import { mountFilmstrip } from './features/filmstrip';
import { mountGrid } from './features/grid';
import { mountSettingsPanel } from './features/settings-panel';
import { mountModal, isModalOpen } from './features/modals/confirm';
import { mountPip } from './features/pip/renderer';
import { startPlayer, stopPlayer, renderCurrent } from './features/player/loop';
import type { Album, Frame } from './core/types';

async function boot(): Promise<void> {
  const app = document.getElementById('app')!;
  app.innerHTML = '';
  const store = createStore();
  mountToast(app);
  installKeyboard();
  mountModal(app);

  const fileInput = makeInput('file-input', { accept: 'image/*', multiple: '' });
  const folderInput = makeInput('folder-input', { webkitdirectory: '', directory: '', multiple: '' });
  app.append(fileInput, folderInput);

  mountSidebar(store, app, () => folderInput.click());
  mountLanding(store, app, { onPickFiles: () => fileInput.click(), onPickFolder: () => folderInput.click() });
  const viewerEls = mountViewer(store, app);
  const grid = mountGrid(store, app);
  mountFilmstrip(store, viewerEls.uiLayer);
  const settings = mountSettingsPanel(store, app);
  const pip = mountPip(store, app, () => ({ imgFront: viewerEls.imgFront, imgBack: viewerEls.imgBack }));

  mountControls(store, {
    uiLayer: viewerEls.uiLayer,
    front: viewerEls.imgFront,
    back: viewerEls.imgBack,
    onOpenGrid: () => grid.open(),
    onAddFiles: () => fileInput.click(),
    pip,
  });

  // Show viewer when album loaded; hide landing
  store.subscribe(s => {
    viewerEls.root.style.display = s.currentAlbumId ? 'flex' : 'none';
    if (s.currentAlbumId && !s.isPlaying && s.frames.length) {
      // autoplay on album open
      store.setPlaying(true);
      renderCurrent(store, { front: viewerEls.imgFront, back: viewerEls.imgBack }, true);
      startPlayer(store, { front: viewerEls.imgFront, back: viewerEls.imgBack });
    }
  });

  // Home button
  viewerEls.homeBtn.onclick = () => goHome();

  function goHome(): void {
    stopPlayer();
    store.setPlaying(false);
    if (document.pictureInPictureElement) void document.exitPictureInPicture();
    store.closeAlbum();
    store.setUi({ gridOpen: false, settingsOpen: false, sidebarOpen: false });
    viewerEls.navZones.forEach(z => z.style.display = 'none');
    viewerEls.uiLayer.classList.add('hidden');
    viewerEls.homeBtn.style.display = 'none';
    store.setView(1, 0, 0);
  }
  (window as any).goHome = goHome;

  // Keyboard
  registerKey('arrowright', () => { const s = store.getState(); if (s.frames.length) store.setIndex((s.currentIndex + 1) % s.frames.length); });
  registerKey('arrowleft', () => { const s = store.getState(); if (s.frames.length) store.setIndex((s.currentIndex - 1 + s.frames.length) % s.frames.length); });
  registerKey(' ', (e) => { e.preventDefault(); const nav = (store as any).__nav; nav?.togglePlay(); });
  registerKey('escape', () => {
    if (document.pictureInPictureElement) void document.exitPictureInPicture();
    else if (store.getState().ui.gridOpen) grid.close();
    else if (store.getState().ui.sidebarOpen) store.setUi({ sidebarOpen: false });
    else if (settings.isOpen()) settings.toggle();
    else if (isModalOpen()) { /* modal handles itself */ }
    else if (store.getState().currentAlbumId) goHome();
  });
  registerKey('f', () => { if (!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen(); });

  // Load existing library
  try {
    const items = await getAll();
    const groups = groupItems(items);
    const albums: Album[] = Object.entries(groups).map(([name, frames]) => ({ id: uid(), name, frames }));
    store.setAlbums(albums);
  } catch (e) {
    console.error(e);
    showToast('Failed to read library');
  }

  // Imports
  fileInput.addEventListener('change', async (e) => {
    const res = await handleFiles((e.target as HTMLInputElement).files!);
    mergeImport(store, res);
    (e.target as HTMLInputElement).value = '';
  });
  folderInput.addEventListener('change', async (e) => {
    const res = await handleFiles((e.target as HTMLInputElement).files!, { isFolder: true });
    mergeImport(store, res);
    (e.target as HTMLInputElement).value = '';
  });
  document.addEventListener('paste', async (e) => {
    const res = await handleFiles(e.clipboardData!.files);
    mergeImport(store, res);
  });
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', async (e) => {
    e.preventDefault();
    const isDir = !!e.dataTransfer!.items?.[0]?.webkitGetAsEntry?.()?.isDirectory;
    const r = await handleFiles(e.dataTransfer!.files, { isFolder: isDir });
    mergeImport(store, r);
  });
}

function mergeImport(store: ReturnType<typeof createStore>, res: { groups: Record<string, Frame[]>; singles: Frame[] }): void {
  const albums = [...store.getState().albums];
  let importedCount = 0;
  for (const [name, frames] of Object.entries(res.groups)) {
    let a = albums.find(x => x.name === name);
    if (!a) { a = { id: uid(), name, frames: [] }; albums.push(a); }
    const existing = new Set(a.frames.map(f => f.id));
    for (const f of frames) if (!existing.has(f.id)) a.frames.push(f);
    sortFramesByName(a.frames);
    importedCount++;
  }
  if (res.singles.length) {
    let a = albums.find(x => x.name === 'Imported');
    if (!a) { a = { id: uid(), name: 'Imported', frames: [] }; albums.push(a); }
    const existing = new Set(a.frames.map(f => f.id));
    for (const f of res.singles) if (!existing.has(f.id)) a.frames.push(f);
    sortFramesByName(a.frames);
    importedCount++;
  }
  store.setAlbums(albums);
  showToast(`Imported ${importedCount} album(s)`);
}

function sortFramesByName(frames: Frame[]): void {
  frames.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
}

function makeInput(id: string, attrs: Record<string, string>): HTMLInputElement {
  const el = document.createElement('input');
  el.type = 'file';
  el.id = id;
  el.style.display = 'none';
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

void boot();
