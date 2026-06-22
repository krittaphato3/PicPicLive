# PicPicLive — Bun Rewrite & Enhancement Design

**Date:** 2026-06-23
**Status:** Approved (user authorized continuing without approval checkpoints)
**Scope:** Full rewrite of the single-file `index.html` slideshow app as a modular Bun + Vite + TypeScript app, plus UX/UI polish, QOL improvements, a seamless player feature set, and a visual refresh.

---

## 1. Goal

Rebuild PicPicLive (a local-first image album/slideshow viewer with Picture-in-Picture output) as a modern, modular TypeScript application that:

- Keeps 100% feature parity with the current single-file app.
- Runs under `bun run dev` (Vite dev server) and `bun run build` (static SPA).
- Adds the four enhancement buckets the user requested: **UX/UI polish, QOL improvements, seamless player features, visual refresh.**

The original experience — dark, cinematic, local-only, idle-UI-hiding, PiP-capable — is preserved and elevated, not replaced.

## 2. Non-goals

- No backend/server. Storage stays client-side (IndexedDB + localStorage). The Bun runtime is used only as the dev/build toolchain.
- No account system, no cloud sync, no sharing service.
- No mobile-native build (it is a responsive web app).
- No AI/ML features.

## 3. Tech stack

- **Runtime/PM:** Bun (package manager + dev command).
- **Bundler:** Vite 5.
- **Language:** TypeScript (strict).
- **UI:** Vanilla TS + a thin DOM helper module. No React/Vue/Svelte — keeps the app faithful to the original imperative, direct-DOM style and lightweight.
- **Styling:** Plain CSS using CSS custom properties (design tokens). Modules imported per feature.
- **Icons:** Font Awesome 6 (CDN, same as today) — kept for parity; only swapped where a refresh demands it.
- **Dev tooling:** `eslint` (optional, deferred), `prettier` (optional, deferred). Format checks via editor; not added unless needed.
- **Testing:** Vitest for pure-logic units (sort, hue extraction, aspect math, PiP sizing, settings store). DOM/visual behavior verified manually by the user via `bun run dev`.

## 4. Project structure

```
PicPicLive/
├─ index.html                    # Vite entry (minimal shell, mounts #app)
├─ package.json                  # bun-managed; scripts: dev, build, preview, test
├─ tsconfig.json
├─ vite.config.ts
├─ docs/                         # this spec + future plans
└─ src/
   ├─ main.ts                    # bootstrap: wire modules, attach global listeners
   ├─ styles/
   │  ├─ tokens.css              # design tokens (colors, radii, motion, spacing)
   │  ├─ base.css                # reset, body, scrollbars, focus states
   │  ├─ components.css          # buttons, switches, sliders, modals, toasts
   │  ├─ viewer.css              # viewer, ambient bg, frames, nav zones
   │  ├─ chrome.css              # filmstrip, control bar, settings panel, top buttons
   │  └─ landings.css            # upload zone, album cards, grid view
   ├─ core/
   │  ├─ types.ts                # Frame, Album, Settings, AppState, Mode types
   │  ├─ event-bus.ts            # tiny pub/sub for decoupled module comms
   │  ├─ store.ts                # central mutable store + subscribe() + selectors
   │  └─ ids.ts                  # id generation helpers
   ├─ services/
   │  ├─ db.ts                   # IndexedDB wrapper (open, getAll, put, deleteByGroup, clear)
   │  ├─ import.ts               # file/folder/drag/paste import + chunked processing
   │  ├─ image-analysis.ts       # hue extraction, album ratio analysis, thumbnails
   │  ├─ settings-store.ts       # localStorage-backed persistent settings
   │  ├─ keyboard.ts             # keymap registry, Escape layering, ignore-when-typing
   │  └─ toast.ts                # toast queue + Undo-capable action toasts
   ├─ features/
   │  ├─ library/                # album list sidebar, landing grid, search/filter
   │  ├─ viewer/                 # frame rendering, ambient bg, zoom/pan, idle UI
   │  ├─ player/                 # play loop, speed, transitions, effects, sort, shuffle
   │  ├─ pip/                    # PiP canvas renderer + ratio modes + sync
   │  ├─ filmstrip/              # thumbnails, drag reorder, jump
   │  ├─ grid/                   # inventory grid view, drag reorder, multi-select
   │  ├─ settings-panel/         # Control Center: PiP, player, system
   │  ├─ favorites/              # star/unstar, favorites album (virtual)
   │  └─ modals/                 # confirm dialog, rename/merge album, undo
   └─ utils/
      ├─ dom.ts                  # h()/qs()/on()/debounce/throttle/raf
      ├─ math.ts                 # clamp, easing, ratio math
      ├─ color.ts                # hue→temperature, contrast helpers
      └─ format.ts               # file sizes, counts, durations
```

**Module boundaries (each answers: what does it do, how is it used, what does it depend on):**

- `core/store.ts` — single source of truth for `{ albums, currentAlbumId, frames, currentFrame, isPlaying, settings, ui }`. Used by every feature. Depends only on `types.ts`. Emits change events on the `event-bus`.
- `services/db.ts` — owns all IndexedDB access; nothing else touches IDB. Used by `import.ts`, `library/`, `settings-store.ts` (settings use localStorage, not IDB). Depends on `types.ts`.
- `features/player/` — drives playback timing and transitions; reads `frames`/`currentFrame` from store, writes playback state. Depends on `store`, `utils`, not on DOM rendering modules.
- `features/pip/` — consumes `frames`/`currentFrame`/`settings`/`viewTransform`; owns the pip canvas/video lifecycle. Depends on `store`, `viewer` view-transform (read-only), `utils/math`.
- `features/viewer/` — owns the main viewer DOM, ambient bg, zoom/pan, idle-hide. Depends on `store`, `utils`.
- Render modules (`filmstrip`, `grid`, `library`) subscribe to the store and re-render on relevant slice changes — so a delete from anywhere updates every view.

## 5. Design tokens (visual refresh)

A unified token system in `tokens.css`, replacing the ad-hoc `:root` of the original:

- **Palette:** near-black base `#070708`, elevated panels `#111114`/`#16161a`, hairline `#26262c`. Accent `#5b8cff` (slightly brighter, more cinematic blue than the original `#3b82f6`). Danger `#ef4444`. Success `#22c55e`. Warm/cool filter accents reused from player.
- **Radii:** `--r-sm 8px / --r-md 14px / --r-lg 20px / --r-pill 999px`.
- **Motion:** `--ease-out cubic-bezier(.2,.8,.2,1)`, `--ease-spring cubic-bezier(.34,1.56,.64,1)`, `--dur-fast .15s / --dur .25s / --dur-slow .4s`.
- **Blur:** `--blur-panel 24px`, `--blur-overlay 8px`.
- **Spacing scale:** 4/8/12/16/24/32/48.
- **Typography:** system stack (kept); tighter letter-spacing on labels; mono for numeric readouts.
- **Optional light theme** via `[data-theme="light"]` overrides of the same tokens (toggle in Settings, persisted).
- **Reduced motion:** all non-essential transitions gated behind `@media (prefers-reduced-motion: no-preference)`.

## 6. UX/UI polish

- **Idle behavior:** auto-hide controls + cursor after 3.5s of inactivity during playback (existing), extended to also hide the **mouse cursor** (custom cursor-off state) and fade ambient chrome. Any mouse move / key restores.
- **Loading states:** skeleton placeholders while DB loads; per-image fade-in on first decode; progress toast for imports with counts.
- **Empty states:** friendly empty Library message with a call-to-action button; empty grid with hint text.
- **Focus & accessibility:** visible focus rings on all interactive controls; full keyboard navigation; ARIA labels on icon buttons; `prefers-reduced-motion` respected for transitions; Escape follows a clear layer stack (PiP → Grid → Sidebar → Settings → Viewer → Home).
- **Responsiveness:** control bar wraps on narrow widths; sidebar becomes an overlay on small screens; filmstrip scales thumb size to viewport.
- **Micro-interactions:** button hover lift, active press, icon swap on toggle, toast slide-in, modal spring-in.
- **Transition fixes:** clean up the current manual CSS-transition juggling by routing all frame swaps through a single `applyTransition()` path that resets styles deterministically (removes the fragile `cssText` copying).

## 7. QOL improvements

- **Persistent settings:** speed, effect, filter, sort mode, zoom, PiP mode/sync/info, ambient, scale mode, theme — all saved to localStorage and restored on load.
- **Per-album settings:** each album optionally stores its own speed/effect/filter; defaults fall back to global. Selected automatically on album load.
- **Undo:** deleting an image or album shows a toast with "Undo" for 6s; delete is deferred until the toast expires (soft-delete) so undo is instant and lossless.
- **Favorites:** star any image; a virtual "★ Favorites" album aggregates starred items across all albums. Star toggled from grid, filmstrip context, or a quick action.
- **Album management:** rename album; merge two albums; split (move selected into new album); all via a small album action menu. Persists to DB (updates `groupName`).
- **Drag-reorder persistence:** manual reorder in filmstrip/grid persists a custom order key per album (stored alongside album metadata), honored on next load.
- **Multi-select in grid:** shift-click range, ctrl-click individual; bulk delete, bulk move-to-album, bulk star.
- **Search & filter:** existing album-name search enhanced with sort options (name, color, date-added, count) and a frame-level search by filename inside grid view.
- **Quick actions:** keyboard shortcuts overlay (`?`), and a command-palette-lite (`Ctrl/Cmd+K`) to jump to album, toggle settings, start/stop, fullscreen.
- **Toasts v2:** queued, non-overwriting, action-capable (Undo), auto-dismiss.

## 8. Seamless player features

- **Smart shuffle:** shuffle modes — off / random / "even color" (spreads hues so consecutive frames contrast) / "gradient" (sorts into a smooth hue flow). Toggle in control bar.
- **Background audio per album:** optional audio file attached to an album; plays during slideshow, respects autoplay policy (starts on first user gesture), volume + mute in settings, fades with play/pause. Loop by default.
- **Per-album speed presets:** quick-swap between Slow/Normal/Fast presets in addition to the fine slider.
- **Transition tuning:** expose transition duration separately from slide duration; pick effect per album; crossfade strength slider.
- **Playback queue:** the current album's frames become a queue with next/prev jump, "play from here", and "add to up-next" from grid.
- **Slideshow export:** export the current album as a webm (via MediaRecorder on the PiP canvas+audio) — seeded as best-effort; if the browser blocks it, show a clear message. Not a primary path.
- **Fullscreen auto-advance:** entering fullscreen auto-starts playback if not already playing; leaving fullscreen preserves state.
- **Seamless PiP:** when PiP is active, playback continues even if the main tab is backgrounded (PiP video keeps the canvas stream); PiP respects the same transition/effect pipeline as the main viewer.

## 9. Architecture & data flow

```
import.ts ──▶ db.ts ──▶ store (albums/frames) ──┬─▶ viewer (renders current frame)
                                                ├─▶ filmstrip / grid / library (re-render)
                                                ├─▶ player (timing loop) ──▶ store.currentFrame
                                                └─▶ pip (renders to canvas/video)

settings-store ──▶ store.settings ◀──── UI toggles
keyboard ──▶ action registry ──▶ store / features
event-bus ──▶ decoupled notifications (album-loaded, frames-changed, settings-changed)
```

- **State changes** go through `store` mutators; features subscribe to slices and reconcile their DOM.
- **Rendering** is imperative and minimal: each view re-renders only its slice when that slice changes (e.g. deleting a frame triggers filmstrip + grid + viewer, but not settings panel).
- **Persistence** is async and fire-and-forget for writes (with console error on failure); reads are awaited at startup.

## 10. Data model

```ts
type Frame = {
  id: string;            // stable id (was Date.now()+random; now crypto.randomUUID())
  name: string;
  groupName: string;
  hue: number;
  temp: 'warm' | 'cool' | 'neutral';
  starred?: boolean;
  order?: number;        // manual order within album (optional)
  addedAt: number;
  // blob + objectURL live only in memory; DB stores blob, URL regenerated on load
};

type Album = {
  name: string;
  frames: Frame[];
  // per-album overrides (optional)
  settings?: Partial<PlayerSettings>;
  audioId?: string | null;
  coverFrameId?: string;
};

type PlayerSettings = {
  speedMs: number;
  effect: 'none' | 'crossfade' | 'blur' | 'zoom';
  filter: 'none' | 'intense' | 'cool';
  sort: 'name' | 'color' | 'added' | 'custom';
  shuffle: 'off' | 'random' | 'evenColor' | 'gradient';
  ambient: boolean;
  scaleCover: boolean;
};

type PipSettings = {
  ratioMode: 'fit' | 'half-full' | 'full' | 'dynamic';
  syncZoom: boolean;
  showInfo: boolean;
};

type AppSettings = {
  player: PlayerSettings;
  pip: PipSettings;
  theme: 'dark' | 'light';
  masterZoom: number;     // 1..5
  uiIdleMs: number;
};
```

IndexedDB schema unchanged in spirit (store `images`, keyPath `id`, index `groupName`), but we add fields on write: `starred`, `order`, `addedAt`. A small migration on open backfills `addedAt`/`id` for legacy rows.

## 11. Phasing (kept app-always-working)

Each phase ends with a runnable `bun run dev` state.

1. **Scaffold** — Bun+Vite+TS project, scripts, tokens, empty `#app` shell rendering a "coming soon" so dev server works. Backup commit of original `index.html`.
2. **Core + parity skeleton** — store, db, event-bus, keyboard, toast; port import + library + viewer (no transitions yet) + basic player. Achieves feature parity (sans PiP) with the original.
3. **Player & transitions** — speed, effects (cut/crossfade/blur/zoom), filters, sort, filmstrip, grid. Reaches full parity.
4. **PiP renderer** — port canvas→video PiP with all four ratio modes + sync + info overlay. Full parity complete.
5. **UX polish + visual refresh** — tokens, idle cursor, loading/empty states, focus/a11y, responsive, micro-interactions, optional light theme.
6. **QOL** — persistent + per-album settings, undo, favorites, album management, reorder persistence, multi-select, search/sort/filter, command palette, shortcuts overlay.
7. **Seamless player** — smart shuffle, background audio, presets, transition tuning, playback queue, fullscreen auto-advance, export (best-effort).
8. **Hardening** — error boundaries around PiP/IndexedDB, console→toast for user-facing errors, reduced-motion pass, final parity QA against the original.

## 12. Risks & mitigations

- **PiP is fragile** (browser-specific, autoplay, canvas stream quirks) → isolate behind `pip/` module, guard every API call, degrade to a toast on failure. Keep the original's successful code path as the reference.
- **IndexedDB migrations** → version-bump + `onupgradeneeded` backfill; never destructive.
- **Scope creep** → buckets are itemized; anything not listed here is deferred. QOL "command palette" is intentionally lightweight.
- **Performance with large albums** → virtualize grid thumbnails (lazy `<img loading=lazy>`, cap filmstrip DOM to a sliding window if >200 items).
- **Audio autoplay policy** → only start audio after a user gesture; if blocked, queue and start on next interaction with a toast.

## 13. Out-of-scope (explicit)

Cloud sync, accounts, server, mobile-native, AI features, video source frames (images only, as today), collaborative editing.

## 14. Acceptance criteria

- `bun install && bun run dev` serves the app; `bun run build` produces a working static dist.
- All original features present and working: import (file/folder/paste/drag), album grouping, viewer, zoom/pan, transitions, filters, sort, filmstrip, grid, PiP (4 modes + sync + info), ambient bg, scale modes, idle UI, keyboard nav.
- New: persistent settings, per-album settings, undo-delete, favorites, album rename/merge/split, reorder persistence, multi-select, command palette, smart shuffle, background audio, presets, transition tuning, playback queue, light theme.
- Visual refresh applied consistently; reduced-motion respected; keyboard accessible.
