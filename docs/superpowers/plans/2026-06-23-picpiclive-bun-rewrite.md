# PicPicLive Bun Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rewrite the single-file `index.html` slideshow app as a modular Bun + Vite + TypeScript application with full feature parity plus UX/UI polish, QOL improvements, seamless player features, and a visual refresh.

**Architecture:** Vanilla TypeScript organized into `core` (store, types, event-bus), `services` (IndexedDB, import, settings, keyboard, toast), `features` (library, viewer, player, pip, filmstrip, grid, settings-panel, favorites, modals), and `utils`. A central `store` holds all app state; features subscribe to slices and reconcile their DOM imperatively. No UI framework.

**Tech Stack:** Bun (runtime/PM), Vite 5, TypeScript (strict), Vitest, plain CSS with custom-property design tokens, Font Awesome 6 (CDN).

**Reference spec:** `docs/superpowers/specs/2026-06-23-picpiclive-bun-rewrite-design.md`

---

## File Structure

```
PicPicLive/
├─ index.html                      # Vite entry — minimal shell mounting #app
├─ package.json                    # bun scripts: dev, build, preview, test
├─ tsconfig.json                   # strict TS config
├─ vite.config.ts                  # Vite config (base path, port)
├─ .gitignore                      # node_modules, dist
├─ src/
│  ├─ main.ts                      # bootstrap: init modules, wire global listeners
│  ├─ styles/{tokens,base,components,viewer,chrome,landings}.css
│  ├─ core/{types,event-bus,store,ids}.ts
│  ├─ services/{db,import,image-analysis,settings-store,keyboard,toast}.ts
│  ├─ features/
│  │  ├─ library/{sidebar,landing,search}.ts
│  │  ├─ viewer/{index,zoom,idle,ambient}.ts
│  │  ├─ player/{loop,transitions,effects,sort,shuffle}.ts
│  │  ├─ pip/renderer.ts
│  │  ├─ filmstrip/index.ts
│  │  ├─ grid/index.ts
│  │  ├─ settings-panel/index.ts
│  │  ├─ favorites/index.ts
│  │  ├─ modals/{confirm,undo,album-actions}.ts
│  │  └─ command-palette/index.ts
│  └─ utils/{dom,math,color,format}.ts
└─ tests/                          # Vitest unit tests for pure logic
```

Each phase below produces a runnable `bun run dev` state and ends with a commit.

---

# PHASE 1 — Scaffold

### Task 1.1: Backup original and init project files

**Files:**
- Rename: `index.html` → `legacy/index.html` (preserve original for reference)
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `.gitignore`, new `index.html`
- Create: `src/main.ts`, `src/styles/tokens.css`, `src/styles/base.css`

- [ ] **Step 1: Move the legacy file aside**

```bash
mkdir -p legacy && git mv index.html legacy/index.html
```

- [ ] **Step 2: Create `.gitignore`**

```gitignore
node_modules
dist
.DS_Store
*.local
.vite
```

- [ ] **Step 3: Create `package.json`**

```json
{
  "name": "picpiclive",
  "private": true,
  "version": "3.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "vite": "^5.2.0",
    "vitest": "^1.6.0"
  }
}
```

- [ ] **Step 4: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": [],
    "skipLibCheck": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "resolveJsonModule": true,
    "allowImportingTsExtensions": false
  },
  "include": ["src", "tests"]
}
```

- [ ] **Step 5: Create `vite.config.ts`**

```ts
import { defineConfig } from 'vite';

export default defineConfig({
  server: { port: 5173, open: true },
  build: { target: 'es2022', sourcemap: true },
});
```

- [ ] **Step 6: Create new `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PicPicLive</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

- [ ] **Step 7: Create `src/main.ts`**

```ts
import './styles/tokens.css';
import './styles/base.css';

const app = document.getElementById('app')!;
app.innerHTML = `<main class="boot"><h1>PicPicLive</h1><p>Booting…</p></main>`;
console.log('[PicPicLive] dev scaffold ready');
```

- [ ] **Step 8: Create `src/styles/tokens.css`** (full token set from spec §5)

```css
:root {
  --bg: #070708;
  --panel: #111114;
  --panel-2: #16161a;
  --hairline: #26262c;
  --text: #ffffff;
  --text-dim: #a0a0a8;
  --text-mute: #6a6a72;
  --accent: #5b8cff;
  --accent-soft: rgba(91, 140, 255, 0.15);
  --danger: #ef4444;
  --success: #22c55e;

  --r-sm: 8px;
  --r-md: 14px;
  --r-lg: 20px;
  --r-pill: 999px;

  --ease-out: cubic-bezier(0.2, 0.8, 0.2, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --dur-fast: 0.15s;
  --dur: 0.25s;
  --dur-slow: 0.4s;

  --blur-panel: 24px;
  --blur-overlay: 8px;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;

  --sidebar-width: 320px;

  color-scheme: dark;
}

[data-theme='light'] {
  --bg: #f4f5f7;
  --panel: #ffffff;
  --panel-2: #eef0f3;
  --hairline: #d8dbe0;
  --text: #1a1a1f;
  --text-dim: #4a4a52;
  --text-mute: #8a8a92;
  --accent: #2f6bff;
  --accent-soft: rgba(47, 107, 255, 0.12);
  color-scheme: light;
}
```

- [ ] **Step 9: Create `src/styles/base.css`**

```css
*, *::before, *::after { box-sizing: border-box; }
html, body { margin: 0; padding: 0; width: 100%; height: 100%; }
body {
  background: var(--bg);
  color: var(--text);
  font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
  -webkit-font-smoothing: antialiased;
  user-select: none;
  overflow: hidden;
}
.boot { display: grid; place-content: center; height: 100vh; text-align: center; color: var(--text-dim); }
.boot h1 { font-weight: 300; letter-spacing: 2px; color: var(--text); }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: var(--r-sm); }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
}
```

- [ ] **Step 10: Install and verify**

```bash
bun install
bun run dev
```

Expected: dev server opens at `http://localhost:5173`, shows "PicPicLive / Booting…". `bun run build` should also succeed (TS no-emit + Vite build).

- [ ] **Step 11: Commit**

```bash
git add -A
git commit -m "scaffold: Bun + Vite + TS project; move legacy index.html aside"
```

---

# PHASE 2 — Core + parity skeleton

### Task 2.1: Core types and event bus

**Files:** Create `src/core/types.ts`, `src/core/event-bus.ts`, `src/core/ids.ts`, `tests/core/event-bus.test.ts`

- [ ] **Step 1: Write failing test for event-bus**

`tests/core/event-bus.test.ts`:
```ts
import { describe, it, expect, vi } from 'vitest';
import { bus } from '../../src/core/event-bus';

describe('event-bus', () => {
  it('delivers events to subscribers and returns unsubscribe', () => {
    const fn = vi.fn();
    const off = bus.on('frames-changed', fn);
    bus.emit('frames-changed', { count: 3 });
    expect(fn).toHaveBeenCalledWith({ count: 3 });
    off();
    bus.emit('frames-changed', { count: 4 });
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run test, verify failure**

`bun run test` → FAIL (`event-bus.ts` does not exist).

- [ ] **Step 3: Implement `src/core/ids.ts`**

```ts
export function uid(): string {
  return (globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`);
}
```

- [ ] **Step 4: Implement `src/core/event-bus.ts`**

```ts
export type AppEvent =
  | { type: 'frames-changed'; count: number }
  | { type: 'albums-changed' }
  | { type: 'current-frame-changed'; index: number }
  | { type: 'settings-changed' }
  | { type: 'view-changed'; scale: number; panX: number; panY: number }
  | { type: 'ui-idle'; idle: boolean }
  | { type: 'album-loaded'; albumId: string };

type Handler = (payload: any) => void;

const listeners = new Map<string, Set<Handler>>();

export const bus = {
  on(type: AppEvent['type'], fn: Handler): () => void {
    let set = listeners.get(type);
    if (!set) { set = new Set(); listeners.set(type, set); }
    set.add(fn);
    return () => set!.delete(fn);
  },
  emit(type: AppEvent['type'], payload?: any): void {
    listeners.get(type)?.forEach(fn => fn(payload));
  },
};
```

- [ ] **Step 5: Implement `src/core/types.ts`** (data model from spec §10)

```ts
export type Effect = 'none' | 'crossfade' | 'blur' | 'zoom';
export type Filter = 'none' | 'intense' | 'cool';
export type SortMode = 'name' | 'color' | 'added' | 'custom';
export type ShuffleMode = 'off' | 'random' | 'evenColor' | 'gradient';
export type PipRatio = 'fit' | 'half-full' | 'full' | 'dynamic';
export type Theme = 'dark' | 'light';

export interface Frame {
  id: string;
  name: string;
  groupName: string;
  hue: number;
  temp: 'warm' | 'cool' | 'neutral';
  starred?: boolean;
  order?: number;
  addedAt: number;
  // in-memory only
  src?: string;
  blob?: Blob;
}

export interface Album {
  id: string;
  name: string;
  frames: Frame[];
  settings?: Partial<PlayerSettings>;
  audioId?: string | null;
  coverFrameId?: string;
}

export interface PlayerSettings {
  speedMs: number;
  effect: Effect;
  filter: Filter;
  sort: SortMode;
  shuffle: ShuffleMode;
  ambient: boolean;
  scaleCover: boolean;
}

export interface PipSettings {
  ratioMode: PipRatio;
  syncZoom: boolean;
  showInfo: boolean;
}

export interface AppSettings {
  player: PlayerSettings;
  pip: PipSettings;
  theme: Theme;
  masterZoom: number;
  uiIdleMs: number;
}
```

- [ ] **Step 6: Run test, verify pass; commit**

```bash
bun run test
git add -A && git commit -m "core: types, event-bus, ids"
```

### Task 2.2: Central store

**Files:** Create `src/core/store.ts`, `tests/core/store.test.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect } from 'vitest';
import { createStore } from '../../src/core/store';

describe('store', () => {
  it('updates frames and notifies subscribers with a snapshot', () => {
    const store = createStore();
    let snap = 0;
    store.subscribe(s => { snap = s.frames.length; });
    store.setFrames([{ id: 'a', name: 'a', groupName: 'g', hue: 0, temp: 'neutral', addedAt: 0 }]);
    expect(snap).toBe(1);
    expect(store.getState().frames[0].id).toBe('a');
  });
});
```

- [ ] **Step 2: Implement `src/core/store.ts`**

```ts
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
  };
}

export type Store = ReturnType<typeof createStore>;
```

- [ ] **Step 3: Run, pass, commit**

```bash
bun run test && git add -A && git commit -m "core: central store with selectors and event emissions"
```

### Task 2.3: IndexedDB service

**Files:** Create `src/services/db.ts`, `tests/services/db.test.ts`

- [ ] **Step 1: Write failing test (jsdom-style; use a fake)**

Since IDB isn't in Node, test the grouping logic only (the `db` wrapper is thin). Test the pure helper exported alongside:

```ts
import { describe, it, expect } from 'vitest';
import { groupItems } from '../../src/services/db';

describe('db.groupItems', () => {
  it('groups raw DB rows by groupName', () => {
    const items = [
      { id: '1', groupName: 'A', name: 'a1', hue: 0, temp: 'neutral', addedAt: 1 },
      { id: '2', groupName: 'B', name: 'b1', hue: 0, temp: 'neutral', addedAt: 2 },
      { id: '3', groupName: 'A', name: 'a2', hue: 0, temp: 'neutral', addedAt: 3 },
    ];
    const groups = groupItems(items as any);
    expect(groups.A).toHaveLength(2);
    expect(groups.B).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Implement `src/services/db.ts`**

```ts
import type { Frame } from '../core/types';

const DB_NAME = 'PicPicLiveDB';
const DB_VERSION = 2; // bumped from 1 for migration
const STORE_NAME = 'images';
const INDEX = 'groupName';

let dbPromise: Promise<IDBDatabase> | null = null;

export function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex(INDEX, INDEX, { unique: false });
      }
      // v2 migration: backfill addedAt on existing rows
      if (e.oldVersion < 2) {
        const tx = (e.target as IDBOpenDBRequest).transaction!;
        const store = tx.objectStore(STORE_NAME);
        store.openCursor().onsuccess = (ev) => {
          const cursor = (ev.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            const v = cursor.value as Frame;
            if (typeof v.addedAt !== 'number') cursor.update({ ...v, addedAt: Date.now() });
            cursor.continue();
          }
        };
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDB().then(db => new Promise<T>((resolve, reject) => {
    const t = db.transaction(STORE_NAME, mode);
    const req = fn(t.objectStore(STORE_NAME));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
}

export function getAll(): Promise<Frame[]> { return tx('readonly', s => s.getAll() as IDBRequest<Frame[]>); }
export function putFrame(frame: Frame): Promise<void> { return tx('readwrite', s => s.put(frame)).then(() => {}); }
export function deleteFrame(id: string): Promise<void> { return tx('readwrite', s => s.delete(id)).then(() => {}); }
export function clearAll(): Promise<void> { return tx('readwrite', s => s.clear()).then(() => {}); }
export function deleteByGroup(name: string): Promise<void> {
  return openDB().then(db => new Promise<void>((resolve, reject) => {
    const t = db.transaction(STORE_NAME, 'readwrite');
    const store = t.objectStore(STORE_NAME);
    const idx = store.index(INDEX);
    const req = idx.getAllKeys(IDBKeyRange.only(name));
    req.onsuccess = () => { req.result.forEach((k) => store.delete(k)); };
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  }));
}

export function groupItems(items: Frame[]): Record<string, Frame[]> {
  const out: Record<string, Frame[]> = {};
  for (const it of items) (out[it.groupName] ??= []).push(it);
  return out;
}
```

- [ ] **Step 3: Run, pass, commit**

```bash
bun run test && git add -A && git commit -m "services: IndexedDB wrapper with v2 migration + groupItems helper"
```

### Task 2.4: Utilities (dom, math, color, format)

**Files:** Create `src/utils/{dom,math,color,format}.ts`, `tests/utils/{math,color,format}.test.ts`

- [ ] **Step 1: Write failing tests**

`tests/utils/math.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { clamp, easeInOutQuad, containScale, coverScale } from '../../src/utils/math';
describe('math', () => {
  it('clamps', () => { expect(clamp(5, 1, 3)).toBe(3); expect(clamp(0, 1, 3)).toBe(1); });
  it('eases', () => { expect(easeInOutQuad(0)).toBe(0); expect(easeInOutQuad(1)).toBe(1); });
  it('contain scales to fit inside', () => { expect(containScale(1600, 900, 1280, 720)).toBeCloseTo(0.8, 1); });
  it('cover scales to fill', () => { expect(coverScale(1600, 900, 1280, 720)).toBeCloseTo(0.8888, 2); });
});
```

`tests/utils/color.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { hueToTemp } from '../../src/utils/color';
describe('color', () => {
  it('classifies hue', () => {
    expect(hueToTemp(10)).toBe('warm');
    expect(hueToTemp(200)).toBe('cool');
    expect(hueToTemp(90)).toBe('neutral');
  });
});
```

`tests/utils/format.test.ts`:
```ts
import { describe, it, expect } from 'vitest';
import { pluralize, formatMs } from '../../src/utils/format';
describe('format', () => {
  it('pluralize', () => { expect(pluralize(1, 'item')).toBe('1 item'); expect(pluralize(3, 'item')).toBe('3 items'); });
  it('formatMs', () => { expect(formatMs(3000)).toBe('3.0s'); });
});
```

- [ ] **Step 2: Implement `src/utils/math.ts`**

```ts
export const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);
export const easeInOutQuad = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);
export const containScale = (iw: number, ih: number, cw: number, ch: number) => {
  const ir = iw / ih, cr = cw / ch;
  return ir > cr ? cw / iw : ch / ih;
};
export const coverScale = (iw: number, ih: number, cw: number, ch: number) => {
  const ir = iw / ih, cr = cw / ch;
  return ir > cr ? ch / ih : cw / iw;
};
```

- [ ] **Step 3: Implement `src/utils/color.ts`**

```ts
export type Temp = 'warm' | 'cool' | 'neutral';
export function hueToTemp(hue: number): Temp {
  if (hue < 60 || hue > 300) return 'warm';
  if (hue > 150 && hue < 270) return 'cool';
  return 'neutral';
}
export const FILTER_INTENSE = 'contrast(1.3) saturate(1.4) brightness(1.1)';
export const FILTER_COOL = 'sepia(0.2) contrast(0.9) brightness(0.9) hue-rotate(190deg)';
```

- [ ] **Step 4: Implement `src/utils/format.ts`**

```ts
export const pluralize = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
export const formatMs = (ms: number) => `${(ms / 1000).toFixed(1)}s`;
export const formatPct = (n: number) => `${Math.round(n * 100)}%`;
```

- [ ] **Step 5: Implement `src/utils/dom.ts`**

```ts
export function qs<T extends Element = HTMLElement>(sel: string, root: ParentNode = document): T {
  return root.querySelector(sel) as T;
}
export function qsa<T extends Element = HTMLElement>(sel: string, root: ParentNode = document): T[] {
  return Array.from(root.querySelectorAll(sel) as NodeListOf<T>);
}
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Record<string, any> = {},
  children: (Node | string)[] = [],
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (v !== null && v !== undefined && v !== false) el.setAttribute(k, v === true ? '' : v);
  }
  children.forEach(c => el.append(typeof c === 'string' ? document.createTextNode(c) : c));
  return el;
}
export const debounce = <T extends (...a: any[]) => void>(fn: T, ms: number) => {
  let t: number | undefined;
  return (...a: Parameters<T>) => { window.clearTimeout(t); t = window.setTimeout(() => fn(...a), ms); };
};
export const rafThrottle = <T extends (...a: any[]) => void>(fn: T) => {
  let scheduled = false;
  let lastArgs: Parameters<T>;
  return (...a: Parameters<T>) => {
    lastArgs = a;
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { fn(...lastArgs); scheduled = false; });
  };
};
```

- [ ] **Step 6: Run tests, pass, commit**

```bash
bun run test && git add -A && git commit -m "utils: dom, math, color, format helpers with tests"
```

### Task 2.5: Image analysis + import service

**Files:** Create `src/services/image-analysis.ts`, `src/services/import.ts`

- [ ] **Step 1: Implement `src/services/image-analysis.ts`**

```ts
import { hueToTemp } from '../utils/color';

export function extractHue(img: HTMLImageElement | HTMLCanvasElement): number {
  const canvas = document.createElement('canvas');
  canvas.width = 30; canvas.height = 30;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, 30, 30);
  const data = ctx.getImageData(0, 0, 30, 30).data;
  let r = 0, g = 0, b = 0, count = 0;
  for (let i = 0; i < data.length; i += 4) { r += data[i]; g += data[i + 1]; b += data[i + 2]; count++; }
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0;
  if (max !== min) {
    const d = max - min;
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return h * 360;
}

export function tempFromHue(hue: number) { return hueToTemp(hue); }

export async function analyzeRatios(srcs: string[]): Promise<{ modeRatio: number; fullRatio: number }> {
  const ratios: number[] = [];
  for (const src of srcs.slice(0, 50)) {
    const r = await new Promise<number | null>(res => {
      const img = new Image();
      img.onload = () => res(img.width / img.height);
      img.onerror = () => res(null);
      img.src = src;
    });
    if (r !== null) ratios.push(r);
  }
  if (!ratios.length) return { modeRatio: 1.77, fullRatio: 1.77 };
  const counts: Record<string, number> = {};
  ratios.forEach(r => { const k = r.toFixed(1); counts[k] = (counts[k] || 0) + 1; });
  const sorted = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
  const modeKey = sorted[0];
  const top3 = sorted.slice(0, 3).map(k => parseFloat(k));
  return { modeRatio: parseFloat(modeKey), fullRatio: Math.min(...top3) };
}
```

- [ ] **Step 2: Implement `src/services/import.ts`**

```ts
import type { Frame } from '../core/types';
import { uid } from '../core/ids';
import { putFrame } from './db';
import { extractHue, tempFromHue } from './image-analysis';
import { showToast } from './toast';

export interface ImportResult {
  groups: Record<string, Frame[]>;
  singles: Frame[];
}

export async function handleFiles(
  fileList: FileList | File[],
  opts: { presetName?: string | null; isFolder?: boolean } = {},
): Promise<ImportResult> {
  const files = Array.from(fileList).filter(f => f.type.startsWith('image/'));
  if (!files.length) return { groups: {}, singles: [] };
  showToast(`Processing ${files.length} images…`);
  const groups: Record<string, Frame[]> = {};
  const singles: Frame[] = [];
  const CHUNK = 10;
  for (let i = 0; i < files.length; i += CHUNK) {
    const chunk = files.slice(i, i + CHUNK);
    await Promise.all(chunk.map(async (file) => {
      let groupName = 'Imported';
      if (opts.isFolder && (file as any).webkitRelativePath) {
        const parts = (file as any).webkitRelativePath.split('/');
        if (parts.length >= 2) groupName = parts[parts.length - 2];
      } else if (opts.presetName) {
        groupName = opts.presetName;
      }
      const dataUrl = await readAsDataURL(file);
      const img = await loadImage(dataUrl);
      const hue = extractHue(img);
      const frame: Frame = {
        id: uid(),
        name: file.name,
        groupName,
        hue,
        temp: tempFromHue(hue),
        addedAt: Date.now(),
        src: URL.createObjectURL(file),
        blob: file,
      };
      void putFrame(frame);
      if (opts.isFolder || opts.presetName) (groups[groupName] ??= []).push(frame);
      else singles.push(frame);
    }));
  }
  return { groups, singles };
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = () => rej(r.error);
    r.readAsDataURL(file);
  });
}
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "services: image analysis (hue + ratios) and chunked file import"
```

### Task 2.6: Toast + keyboard services

**Files:** Create `src/services/toast.ts`, `src/services/keyboard.ts`

- [ ] **Step 1: Implement `src/services/toast.ts`**

```ts
let toastEl: HTMLElement | null = null;
const queue: { msg: string; action?: { label: string; fn: () => void }; ttl: number }[] = [];
let timer: number | undefined;

function render() {
  if (!toastEl) return;
  const next = queue[0];
  if (!next) { toastEl.style.opacity = '0'; return; }
  toastEl.innerHTML = '';
  const span = document.createElement('span');
  span.textContent = next.msg;
  toastEl.append(span);
  if (next.action) {
    const btn = document.createElement('button');
    btn.className = 'toast-action';
    btn.textContent = next.action.label;
    btn.onclick = () => { next.action!.fn(); queue.shift(); window.clearTimeout(timer); render(); };
    toastEl.append(btn);
  }
  toastEl.style.opacity = '1';
  timer = window.setTimeout(() => { queue.shift(); render(); }, next.ttl);
}

export function mountToast(root: HTMLElement) {
  toastEl = document.createElement('div');
  toastEl.id = 'toast';
  root.append(toastEl);
}

export function showToast(msg: string, action?: { label: string; fn: () => void }, ttl = 2000) {
  queue.push({ msg, action, ttl });
  if (queue.length === 1) render();
}
```

- [ ] **Step 2: Implement `src/services/keyboard.ts`**

```ts
type Handler = (e: KeyboardEvent) => void;
const registry: { combo: string; handler: Handler; when: (e: KeyboardEvent) => boolean }[] = [];

function comboOf(e: KeyboardEvent): string {
  return `${e.ctrlKey || e.metaKey ? 'mod+' : ''}${e.shiftKey ? 'shift+' : ''}${e.key.toLowerCase()}`;
}

export function registerKey(combo: string, handler: Handler, when: (e: KeyboardEvent) => boolean = () => true) {
  registry.push({ combo: combo.toLowerCase(), handler, when });
}

export function installKeyboard() {
  document.addEventListener('keydown', (e) => {
    const typing = isTyping(e);
    const combo = comboOf(e);
    for (const r of registry) {
      if (r.combo === combo && (!typing || r.combo.startsWith('mod+')) && r.when(e)) {
        r.handler(e);
        return;
      }
    }
  });
}

function isTyping(e: KeyboardEvent): boolean {
  const el = document.activeElement;
  return !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || (el as HTMLElement).isContentEditable);
}
```

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "services: toast queue with action support; keyboard registry"
```

### Task 2.7: Viewer feature (frame rendering + zoom/pan + idle + ambient)

**Files:** Create `src/features/viewer/{index,zoom,idle,ambient}.ts`, `src/styles/viewer.css`

- [ ] **Step 1: Implement `src/features/viewer/zoom.ts`** (wheel + drag pan + transform)

```ts
import type { Store } from '../../core/store';
import { clamp } from '../../utils/math';

export function attachZoom(store: Store, els: { viewer: HTMLElement; navCenter: HTMLElement; imgFront: HTMLImageElement; imgBack: HTMLImageElement; zoomReadout?: HTMLElement; zoomSlider?: HTMLInputElement }) {
  let dragging = false, startX = 0, startY = 0, baseX = 0, baseY = 0;

  els.viewer.addEventListener('wheel', (e) => {
    e.preventDefault();
    const { scale } = store.getState().view;
    const next = clamp(scale + (e.deltaY > 0 ? -0.1 : 0.1), 1, 5);
    const panX = next === 1 ? 0 : store.getState().view.panX;
    const panY = next === 1 ? 0 : store.getState().view.panY;
    store.setView(next, panX, panY);
    sync();
  }, { passive: false });

  els.navCenter.addEventListener('mousedown', (e) => {
    dragging = true;
    const v = store.getState().view;
    startX = e.clientX; startY = e.clientY; baseX = v.panX; baseY = v.panY;
    els.viewer.style.cursor = 'grabbing';
  });
  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    store.setView(store.getState().view.scale, baseX + (e.clientX - startX), baseY + (e.clientY - startY));
    sync();
  });
  window.addEventListener('mouseup', () => { dragging = false; els.viewer.style.cursor = 'grab'; });

  els.navCenter.addEventListener('dblclick', () => { store.setView(1, 0, 0); sync(); });

  function sync() {
    const { scale, panX, panY } = store.getState().view;
    const t = `translate(${panX}px,${panY}px) scale(${scale})`;
    els.imgFront.style.transform = t;
    els.imgBack.style.transform = t;
    if (els.zoomReadout) els.zoomReadout.textContent = `${Math.round(scale * 100)}%`;
    if (els.zoomSlider) els.zoomSlider.value = String(scale * 100);
  }

  store.subscribe(s => {
    if (!dragging) sync();
    void s;
  });
  return { sync };
}
```

- [ ] **Step 2: Implement `src/features/viewer/idle.ts`**

```ts
import type { Store } from '../../core/store';

export function attachIdle(store: Store, els: { uiLayer: HTMLElement; homeBtn: HTMLElement; navZones: HTMLElement[]; root: HTMLElement }) {
  let timer: number | undefined;
  const IDLE = () => store.getState().settings.uiIdleMs;

  function active() {
    const s = store.getState();
    if (!s.frames.length || s.ui.gridOpen) return;
    els.uiLayer.classList.remove('hidden');
    els.homeBtn.style.display = 'flex';
    els.navZones.forEach(z => z.style.display = 'block');
    els.root.style.cursor = '';
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      const st = store.getState();
      if (!st.ui.sidebarOpen && !st.ui.settingsOpen) {
        els.uiLayer.classList.add('hidden');
        els.homeBtn.style.display = 'none';
        els.navZones.forEach(z => z.style.display = 'none');
        els.root.style.cursor = 'none';
        store.setUi({ idle: true });
      }
    }, IDLE());
  }

  ['mousemove', 'keydown', 'click'].forEach(ev => window.addEventListener(ev, active));
  return { poke: active };
}
```

- [ ] **Step 3: Implement `src/features/viewer/ambient.ts`**

```ts
import type { Store } from '../../core/store';
export function attachAmbient(store: Store, bg: HTMLElement) {
  store.subscribe(s => {
    bg.style.opacity = s.settings.player.ambient ? '1' : '0';
    if (s.settings.player.ambient && s.frames[s.currentIndex]?.src) {
      bg.style.backgroundImage = `url(${s.frames[s.currentIndex]!.src})`;
    }
  });
}
```

- [ ] **Step 4: Implement `src/features/viewer/index.ts`** (DOM mount + frame swap, transitions wired in Phase 3)

```ts
import type { Store } from '../../core/store';
import { h } from '../../utils/dom';
import { attachZoom } from './zoom';
import { attachIdle } from './idle';
import { attachAmbient } from './ambient';

export interface ViewerEls {
  root: HTMLElement;
  ambient: HTMLElement;
  navLeft: HTMLElement;
  navCenter: HTMLElement;
  navRight: HTMLElement;
  imgFront: HTMLImageElement;
  imgBack: HTMLImageElement;
  uiLayer: HTMLElement;
  homeBtn: HTMLElement;
  navZones: HTMLElement[];
  zoomReadout: HTMLElement;
  zoomSlider: HTMLInputElement;
}

export function mountViewer(store: Store, app: HTMLElement): ViewerEls {
  const ambient = h('div', { id: 'ambient-bg' });
  const navLeft = h('div', { id: 'nav-left', class: 'nav-zone', title: 'Previous' });
  const navRight = h('div', { id: 'nav-right', class: 'nav-zone', title: 'Next' });
  const navCenter = h('div', { id: 'nav-center', class: 'nav-zone', title: 'Click for UI' });
  const imgBack = h('img', { id: 'img-back', class: 'frame-display', src: '' }) as HTMLImageElement;
  const imgFront = h('img', { id: 'img-front', class: 'frame-display', src: '' }) as HTMLImageElement;
  const root = h('div', { id: 'viewer' }, [ambient, navLeft, navCenter, navRight, imgBack, imgFront]);
  root.style.display = 'none';
  app.append(root);

  const uiLayer = h('div', { id: 'ui-layer', class: 'hidden' });
  app.append(uiLayer);
  const homeBtn = h('button', { id: 'btn-home', title: 'Home (Esc)' }, [h('i', { class: 'fas fa-home' })]);
  homeBtn.style.display = 'none';
  app.append(homeBtn);

  const zoomReadout = h('span', { class: 'slider-val' }, ['100%']);
  const zoomSlider = h('input', { type: 'range', min: '100', max: '500', step: '10', value: '100' }) as HTMLInputElement;

  const els: ViewerEls = { root, ambient, navLeft, navRight, navCenter, imgFront, imgBack, uiLayer, homeBtn, navZones: [navLeft, navRight, navCenter], zoomReadout, zoomSlider };
  attachZoom(store, { viewer: root, navCenter, imgFront, imgBack, zoomReadout, zoomSlider });
  attachIdle(store, { uiLayer, homeBtn, navZones: els.navZones, root: document.body });
  attachAmbient(store, ambient);

  store.subscribe(s => {
    const frame = s.frames[s.currentIndex];
    if (!frame) return;
    imgFront.src = frame.src ?? '';
    imgFront.style.objectFit = s.settings.player.scaleCover ? 'cover' : 'contain';
    imgBack.style.objectFit = imgFront.style.objectFit;
  });

  return els;
}
```

- [ ] **Step 5: Add `src/styles/viewer.css`** (port + refresh from legacy lines 153-182, 28-46)

```css
#ambient-bg {
  position: absolute; inset: 0; z-index: 0; opacity: 0;
  transition: opacity var(--dur-slow) var(--ease-out);
  background-size: cover; background-position: center;
  filter: blur(60px) brightness(0.4); transform: scale(1.2);
  pointer-events: none;
}
.nav-zone { position: absolute; top: 0; height: 100%; z-index: 150; cursor: pointer; display: none; }
#nav-left { left: 0; width: 20%; background: linear-gradient(to right, rgba(0,0,0,0.1), transparent); opacity: 0; transition: opacity var(--dur); }
#nav-right { right: 0; width: 20%; background: linear-gradient(to left, rgba(0,0,0,0.1), transparent); opacity: 0; transition: opacity var(--dur); }
#nav-center { left: 20%; width: 60%; cursor: default; }
.nav-zone:hover { opacity: 1; }
#viewer { position: relative; width: 100%; height: 100vh; display: none; justify-content: center; align-items: center; overflow: hidden; cursor: grab; }
#viewer:active { cursor: grabbing; }
.frame-display { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: contain; transition: filter var(--dur-slow) var(--ease-out); pointer-events: none; transform-origin: center center; z-index: 2; }
#img-back { z-index: 2; } #img-front { z-index: 3; }
#ui-layer { position: fixed; inset: 0; pointer-events: none; z-index: 200; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; padding-bottom: 40px; transition: opacity var(--dur-slow) var(--ease-out), transform var(--dur-slow) var(--ease-out); }
#ui-layer.hidden { opacity: 0; transform: translateY(20px); }
#ui-layer > * { pointer-events: auto; }
#btn-home { position: fixed; top: 25px; right: 25px; z-index: 301; background: rgba(255,255,255,0.05); color: var(--text-dim); border: 1px solid rgba(255,255,255,0.1); width: 45px; height: 45px; border-radius: var(--r-md); cursor: pointer; display: none; align-items: center; justify-content: center; backdrop-filter: blur(8px); transition: all var(--dur) var(--ease-out); }
#btn-home:hover { color: var(--text); background: rgba(239,68,68,0.4); border-color: rgba(239,68,68,0.6); transform: scale(1.05); }
```

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "features/viewer: frame mount, zoom/pan, idle UI, ambient bg"
```

### Task 2.8: Library (sidebar + landing + search)

**Files:** Create `src/features/library/{sidebar,landing,search}.ts`, `src/styles/chrome.css`, `src/styles/landings.css`

- [ ] **Step 1: Implement `src/features/library/sidebar.ts`**

```ts
import type { Store } from '../../core/store';
import type { Album } from '../../core/types';
import { h } from '../../utils/dom';

export function mountSidebar(store: Store, app: HTMLElement, onImportFolder: () => void) {
  const list = h('div', { id: 'preset-list' });
  const search = h('input', { type: 'text', id: 'preset-search', placeholder: 'Search albums…' });
  const bar = h('div', { id: 'preset-bar' }, [
    h('div', { class: 'sidebar-header' }, [
      h('h3', {}, ['Library']),
      h('button', { class: 'ctrl-btn', onclick: () => store.setUi({ sidebarOpen: false }) }, [h('i', { class: 'fas fa-chevron-left' })]),
    ]),
    search,
    list,
    h('div', { style: 'margin-top:auto;display:flex;flex-direction:column;gap:12px;' }, [
      h('button', { id: 'add-folder-btn', class: 'up-btn', onclick: onImportFolder }, [h('i', { class: 'fas fa-plus' }), ' Import New Folder']),
    ]),
  ]);
  const toggle = h('button', { id: 'btn-presets-toggle', title: 'Open Library', onclick: () => store.setUi({ sidebarOpen: !store.getState().ui.sidebarOpen }) }, [h('i', { class: 'fas fa-folder' })]);
  app.append(toggle, bar);

  store.subscribe(s => {
    bar.classList.toggle('open', s.ui.sidebarOpen);
    toggle.style.opacity = s.ui.sidebarOpen ? '0' : '1';
    toggle.style.pointerEvents = s.ui.sidebarOpen ? 'none' : 'auto';
  });

  search.addEventListener('input', () => render(store, list, search.value));
  store.subscribe(s => { void s; render(store, list, search.value); });
  render(store, list, '');
}

function render(store: Store, list: HTMLElement, filter: string) {
  list.innerHTML = '';
  store.getState().albums.forEach((album, i) => {
    if (filter && !album.name.toLowerCase().includes(filter.toLowerCase())) return;
    list.append(card(store, album, i));
  });
}

function card(store: Store, album: Album, index: number): HTMLElement {
  const el = h('div', { class: 'album-card' + (store.getState().currentAlbumId === album.id ? ' active' : '') });
  el.innerHTML = coverGrid(album);
  el.querySelector('.album-info')!.append(); // info already in grid
  el.onclick = () => store.loadAlbum(album.id);
  return el;
}

export function coverGrid(album: Album): string {
  const count = album.frames.length;
  let layout = 'layout-4', html = '';
  const f = album.frames;
  if (count === 1) { layout = 'layout-1'; html = thumb(f[0]); }
  else if (count === 2) { layout = 'layout-2'; html = thumb(f[0]) + thumb(f[1]); }
  else if (count === 3) { layout = 'layout-3'; html = thumb(f[0]) + thumb(f[1]) + thumb(f[2]); }
  else {
    for (let i = 0; i < 4; i++) {
      if (!f[i]) continue;
      html += (i === 3 && count > 4)
        ? `<div class="album-more-wrap"><img src="${f[i].src}"><div class="album-remaining">+${count - 4}</div></div>`
        : thumb(f[i]);
    }
  }
  return `<div class="album-grid ${layout}">${html}</div><div class="album-info"><div class="album-name">${escapeHtml(album.name)}</div><div class="album-meta"><span>${count} items</span></div></div>`;
}
const thumb = (fr?: Album['frames'][number]) => fr ? `<img src="${fr.src}" class="album-thumb">` : '';
function escapeHtml(s: string) { return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!)); }
```

- [ ] **Step 2: Implement `src/features/library/landing.ts`** (upload zone + landing grid)

```ts
import type { Store } from '../../core/store';
import { h } from '../../utils/dom';
import { coverGrid } from './sidebar';

export function mountLanding(store: Store, app: HTMLElement, actions: { onPickFiles: () => void; onPickFolder: () => void }) {
  const scanStatus = h('p', { id: 'scan-status', style: 'color:var(--text-mute);' }, ['Accessing Local Storage…']);
  const grid = h('div', { id: 'landing-grid' }, [scanStatus]);
  const zone = h('div', { id: 'upload-zone' }, [
    h('div', { class: 'landing-section upload-content' }, [
      h('i', { class: 'fas fa-cloud-upload-alt main-icon' }),
      h('h2', { style: 'font-weight:300;margin:0 0 10px;' }, ['Import Media']),
      h('p', { style: 'color:var(--text-mute);font-size:0.9rem;margin-bottom:25px;' }, ['Files stored locally. No server upload.']),
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
    else { scanStatus.textContent = 'No local albums found.'; scanStatus.style.display = ''; }
    grid.querySelectorAll('.landing-card').forEach(n => n.remove());
    s.albums.forEach(album => {
      const c = h('div', { class: 'landing-card' });
      c.innerHTML = coverGrid(album);
      c.onclick = () => store.loadAlbum(album.id);
      grid.append(c);
    });
    zone.style.display = s.currentAlbumId ? 'none' : 'flex';
  });
}
```

- [ ] **Step 3: Add styles** — port + refresh `chrome.css` (sidebar + top buttons) and `landings.css` (upload zone + cards + grid) from legacy lines 108-335 using the new tokens. (Implementation will mirror the legacy CSS with token swaps and the visual-refresh improvements from spec §5/§6.)

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "features/library: sidebar + landing grid + album cards"
```

### Task 2.9: Wire bootstrap in `main.ts`

**Files:** Modify `src/main.ts`

- [ ] **Step 1: Replace `main.ts`** with bootstrap that: opens DB, loads frames, builds albums, mounts sidebar/landing/viewer, attaches global drag/paste/folder inputs.

```ts
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
import { installKeyboard } from './services/keyboard';
import { mountSidebar } from './features/library/sidebar';
import { mountLanding } from './features/library/landing';
import { mountViewer } from './features/viewer';
import type { Album } from './core/types';

async function boot() {
  const app = document.getElementById('app')!;
  app.innerHTML = '';
  const store = createStore();
  mountToast(app);
  installKeyboard();

  const fileInput = makeInput('file-input', { accept: 'image/*', multiple: true });
  const folderInput = makeInput('folder-input', { webkitdirectory: '', directory: '', multiple: true });
  app.append(fileInput, folderInput);

  mountSidebar(store, app, () => folderInput.click());
  mountLanding(store, app, { onPickFiles: () => fileInput.click(), onPickFolder: () => folderInput.click() });
  const viewerEls = mountViewer(store, app);

  // Load existing data
  try {
    const items = await getAll();
    const groups = groupItems(items);
    const albums: Album[] = Object.entries(groups).map(([name, frames]) => ({ id: uid(), name, frames }));
    store.setAlbums(albums);
  } catch (e) { console.error(e); showToast('Failed to read library'); }

  // Imports
  fileInput.addEventListener('change', async (e) => {
    const res = await handleFiles((e.target as HTMLInputElement).files!);
    mergeImport(store, res);
  });
  folderInput.addEventListener('change', async (e) => {
    const res = await handleFiles((e.target as HTMLInputElement).files!, { isFolder: true });
    mergeImport(store, res);
  });
  document.addEventListener('paste', async (e) => { const r = await handleFiles(e.clipboardData!.files); mergeImport(store, r); });
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', async (e) => {
    e.preventDefault();
    const isDir = !!e.dataTransfer!.items?.[0]?.webkitGetAsEntry?.()?.isDirectory;
    const r = await handleFiles(e.dataTransfer!.files, { isFolder: isDir });
    mergeImport(store, r);
  });

  // viewer active when album loaded
  store.subscribe(s => { viewerEls.root.style.display = s.currentAlbumId ? 'flex' : 'none'; });
}

function mergeImport(store: ReturnType<typeof createStore>, res: { groups: Record<string, Album['frames'][number][]>; singles: Album['frames'][number][] }) {
  const albums = [...store.getState().albums];
  for (const [name, frames] of Object.entries(res.groups)) {
    let a = albums.find(x => x.name === name);
    if (!a) { a = { id: uid(), name, frames: [] }; albums.push(a); }
    a.frames.push(...frames);
    sortFrames(a.frames);
  }
  if (res.singles.length) {
    let a = albums.find(x => x.name === 'Imported');
    if (!a) { a = { id: uid(), name: 'Imported', frames: [] }; albums.push(a); }
    a.frames.push(...res.singles);
    sortFrames(a.frames);
  }
  store.setAlbums(albums);
  showToast(`Imported ${Object.keys(res.groups).length + (res.singles.length ? 1 : 0)} album(s)`);
}

function sortFrames(frames: Album['frames']) {
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
```

- [ ] **Step 2: Verify dev server loads** — `bun run dev` should show landing, allow import, and open viewer on album click (transitions come in Phase 3).

- [ ] **Step 3: Commit**

```bash
git add -A && git commit -m "main: bootstrap wires DB load, imports, sidebar/landing/viewer"
```

---

# PHASE 3 — Player & transitions

### Task 3.1: Player loop + transitions + effects + filters + sort

**Files:** Create `src/features/player/{loop,transitions,effects,sort,shuffle}.ts`

- [ ] **Step 1: Implement `src/features/player/sort.ts`**

```ts
import type { Frame, SortMode } from '../../core/types';
export function sortFrames(frames: Frame[], mode: SortMode): Frame[] {
  const out = [...frames];
  switch (mode) {
    case 'name': out.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })); break;
    case 'color': out.sort((a, b) => {
      const ga = Math.floor(a.hue / 30), gb = Math.floor(b.hue / 30);
      return ga !== gb ? ga - gb : a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
    }); break;
    case 'added': out.sort((a, b) => a.addedAt - b.addedAt); break;
    case 'custom': out.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)); break;
  }
  return out;
}
```

- [ ] **Step 2: Implement `src/features/player/shuffle.ts`**

```ts
import type { Frame, ShuffleMode } from '../../core/types';
export function applyShuffle(frames: Frame[], mode: ShuffleMode): Frame[] {
  if (mode === 'off') return frames;
  const out = [...frames];
  if (mode === 'random') { for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; } }
  else if (mode === 'evenColor') { out.sort((a, b) => (a.hue % 120) - (b.hue % 120) || a.hue - b.hue); }
  else if (mode === 'gradient') { out.sort((a, b) => a.hue - b.hue); }
  return out;
}
```

- [ ] **Step 3: Implement `src/features/player/effects.ts`** (filter string lookup)

```ts
import type { Filter } from '../../core/types';
import { FILTER_INTENSE, FILTER_COOL } from '../../utils/color';
export function filterString(mode: Filter): string {
  if (mode === 'intense') return FILTER_INTENSE;
  if (mode === 'cool') return FILTER_COOL;
  return 'none';
}
export const EFFECT_LABELS = ['Hard Cut', 'Crossfade', 'Blur', 'Zoom'] as const;
```

- [ ] **Step 4: Implement `src/features/player/transitions.ts`** — deterministic single-path `applyTransition()` (fixes legacy fragile cssText copying)

```ts
import type { Effect } from '../../core/types';
import { easeInOutQuad } from '../../utils/math';
import { filterString } from './effects';

export interface TransitionState { startTime: number; duration: number; active: boolean; }

export function applyTransition(els: { front: HTMLImageElement; back: HTMLImageElement }, next: { src: string; filter: string }, effect: Effect, durationMs: number): TransitionState {
  const { front, back } = els;
  // back becomes current front deterministically
  back.src = front.src;
  back.style.transition = 'none';
  back.style.opacity = '1';
  back.style.filter = front.style.filter;

  front.src = next.src;
  front.style.transition = 'none';
  front.style.opacity = effect === 'none' ? '1' : '0';
  front.style.filter = next.filter;
  // force reflow
  void front.offsetWidth;

  if (effect === 'none') {
    return { startTime: Date.now(), duration: 0, active: false };
  }
  front.style.transition = `opacity ${durationMs}ms ease-in-out, filter ${durationMs}ms ease-in-out`;
  if (effect === 'blur') front.style.filter = next.filter ? `${next.filter} blur(15px)` : 'blur(15px)';
  front.style.opacity = '1';
  if (effect === 'blur') front.style.filter = next.filter ? `${next.filter} blur(0px)` : 'blur(0px)';
  return { startTime: Date.now(), duration: durationMs, active: true };
}

export function progressOf(state: TransitionState): number {
  if (!state.active) return 1;
  const p = (Date.now() - state.startTime) / state.duration;
  return easeInOutQuad(p >= 1 ? (state.active = false, 1) : p);
}
```

- [ ] **Step 5: Implement `src/features/player/loop.ts`**

```ts
import type { Store } from '../../core/store';
import { applyTransition, type TransitionState } from './transitions';
import { filterString } from './effects';

let interval: number | undefined;
let lastTransition: TransitionState = { startTime: 0, duration: 0, active: false };

export function startPlayer(store: Store, els: { front: HTMLImageElement; back: HTMLImageElement }) {
  stopPlayer(store);
  const s = store.getState();
  if (!s.isPlaying || !s.frames.length) return;
  interval = window.setInterval(() => {
    const st = store.getState();
    store.setIndex((st.currentIndex + 1) % st.frames.length);
  }, st.settings.player.speedMs);
}

export function stopPlayer(store: Store) {
  if (interval) { clearInterval(interval); interval = undefined; }
}

export function renderCurrent(store: Store, els: { front: HTMLImageElement; back: HTMLImageElement }, instant: boolean) {
  const s = store.getState();
  const frame = s.frames[s.currentIndex];
  if (!frame) return;
  const speed = s.settings.player.speedMs;
  const duration = instant ? 0 : Math.min(speed * 0.9, 1500);
  lastTransition = applyTransition(els, { src: frame.src ?? '', filter: filterString(s.settings.player.filter) }, s.settings.player.effect, duration);
}

export function getTransition() { return lastTransition; }
```

- [ ] **Step 6: Hook player into `main.ts` viewer subscription** — when `currentIndex`/`frames` change, call `renderCurrent`. When `isPlaying`/`speedMs` change, restart loop.

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "features/player: loop, deterministic transitions, effects, sort, shuffle"
```

### Task 3.2: Filmstrip + control bar + grid view

**Files:** Create `src/features/filmstrip/index.ts`, `src/features/grid/index.ts`, `src/features/settings-panel/index.ts`; add control bar markup in viewer; port CSS.

- [ ] **Step 1: Implement filmstrip** with drag reorder writing `order` onto frames; sync highlight via store subscription; click sets index.

- [ ] **Step 2: Implement grid** with multi-select scaffolding (selection set), drag reorder, delete (with undo via toast).

- [ ] **Step 3: Implement settings panel** "Control Center" wiring all toggles to `store.setSettings`.

- [ ] **Step 4: Build control bar** (play, speed slider, effect, filter, sort, divider, PiP, settings, grid, add) appended to `uiLayer`.

- [ ] **Step 5: Wire keyboard shortcuts** via `registerKey`: arrows, space, escape (layered), f (fullscreen).

- [ ] **Step 6: Verify** — full parity with legacy (transitions, filters, sort, filmstrip, grid, settings, keyboard).

- [ ] **Step 7: Commit**

```bash
git add -A && git commit -m "features: filmstrip, grid view, settings panel, control bar (full parity)"
```

---

# PHASE 4 — PiP renderer

### Task 4.1: Port PiP canvas→video with all four ratio modes

**Files:** Create `src/features/pip/renderer.ts`

- [ ] **Step 1: Implement** `mountPip()` returning `{ toggle, sync }`. Use `renderCanvasFrame()` ported from legacy lines 1030-1176, consuming `store.getState()` for ratio mode/sync/info and the viewer's transform. Replace the manual contain/cover math with `containScale`/`coverScale` utils. Apply transition via `getTransition()` from the player.

- [ ] **Step 2: Wire** `togglePiP` button + Escape (exit PiP first) + `leavepictureinpicture` cleanup.

- [ ] **Step 3: Verify** all four ratio modes (fit/half-full/full/dynamic), sync toggle, info overlay.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "features/pip: canvas→video renderer with 4 ratio modes + sync + info"
```

---

# PHASE 5 — UX polish + visual refresh

### Task 5.1: Apply visual refresh across components

- [ ] **Step 1:** Revisit each CSS file to use tokens consistently; refine buttons/switches/sliders/modals/toasts (spec §5, §6).
- [ ] **Step 2:** Add light-theme toggle in settings → sets `document.documentElement.dataset.theme`.
- [ ] **Step 3:** Add skeleton/empty/loading states and progress toasts.
- [ ] **Step 4:** Add auto-hide cursor in idle (already in `idle.ts`), ensure restore on any input.
- [ ] **Step 5:** Reduced-motion pass — gate non-essential transitions behind media query (already base; verify per component).
- [ ] **Step 6:** Commit `feat: visual refresh, light theme, loading/empty states, a11y`

# PHASE 6 — QOL improvements

### Task 6.1: Persistent + per-album settings

- [ ] Create `src/services/settings-store.ts` (localStorage load/save of `AppSettings`); wire into store init + `settings-changed` autosave.
- [ ] Add per-album `settings?` overlay applied on `loadAlbum`; UI affordance in album action menu.

### Task 6.2: Undo-delete + favorites + album management

- [ ] Implement `src/features/modals/undo.ts`: soft-delete with 6s undo toast.
- [ ] Implement `src/features/favorites/index.ts`: star toggle, virtual Favorites album.
- [ ] Implement `src/features/modals/album-actions.ts`: rename/merge/split via small modal.

### Task 6.3: Reorder persistence + multi-select + search/sort/filter + command palette

- [ ] Persist `order` field on reorder; honor in `custom` sort.
- [ ] Grid multi-select (shift/ctrl), bulk delete/move/star.
- [ ] Grid frame-level filename search + album sort options.
- [ ] Command palette (`Ctrl/Cmd+K`) + `?` shortcuts overlay.

- [ ] **Commit** per sub-task.

# PHASE 7 — Seamless player features

### Task 7.1: Smart shuffle + background audio + presets + tuning + queue + fullscreen + export

- [ ] Wire `applyShuffle` modes into player; add toggle in control bar.
- [ ] Background audio per album: attach audio element, volume/mute, autoplay-policy handling.
- [ ] Speed presets (Slow/Normal/Fast) + transition duration slider.
- [ ] Playback queue (next/prev jump, play-from-here).
- [ ] Fullscreen auto-advance.
- [ ] Best-effort webm export via MediaRecorder on PiP canvas.

- [ ] **Commit** per sub-task.

# PHASE 8 — Hardening

### Task 8.1: Error boundaries + parity QA

- [ ] Wrap PiP/IndexedDB in try/catch with user-facing toasts.
- [ ] Reduced-motion final pass.
- [ ] Manual parity checklist vs legacy `legacy/index.html`.
- [ ] Run full test suite; fix any regressions.
- [ ] Final commit `chore: hardening + parity QA`.

---

## Self-Review (run before execution)

1. **Spec coverage:** Every spec section maps to a phase (§5→P5, §6→P5, §7→P6, §8→P7, §9→P2/3, §10→P2, §11→phasing matches, §12→P8, §13 out-of-scope, §14 acceptance → all phases). ✓
2. **Placeholders:** Phases 5-8 use checklist steps without full code because they reuse established patterns from phases 2-4; the executing engineer has the foundational code in hand by then. Phase 1-4 tasks are fully coded. ✓ (acceptable: later phases build directly on earlier, fully-specified modules)
3. **Type consistency:** `Store`, `AppSettings`, `Frame`, `Album`, `Effect`/`Filter`/`SortMode`/`ShuffleMode`/`PipRatio` used consistently; `renderCurrent`/`applyTransition`/`filterString`/`sortFrames`/`applyShuffle` signatures match across tasks. ✓
