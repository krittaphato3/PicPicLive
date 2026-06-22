import type { Store } from '../../core/store';
import { h } from '../../utils/dom';
import { startPlayer, stopPlayer, renderCurrent } from '../player/loop';
import { EFFECT_LABELS, EFFECT_ORDER, FILTER_ORDER, filterString } from '../player/effects';
import { sortFrames } from '../player/sort';
import { applyShuffle } from '../player/shuffle';
import { formatMs } from '../../utils/format';
import { showToast } from '../../services/toast';
import type { PipController } from '../pip/renderer';

export interface ControlsDeps {
  uiLayer: HTMLElement;
  front: HTMLImageElement;
  back: HTMLImageElement;
  onOpenGrid: () => void;
  onAddFiles: () => void;
  pip: PipController;
}

export function mountControls(store: Store, deps: ControlsDeps): void {
  const playBtn = h('button', { class: 'ctrl-btn', id: 'btn-play', title: 'Play/Pause (Space)' }, [h('i', { class: 'fas fa-play' })]);
  const speedVal = h('span', { class: 'slider-val' }, ['3.0s']);
  const speedSlider = h('input', { type: 'range', min: '100', max: '10000', step: '100', value: '3000' }) as HTMLInputElement;
  const speedGroup = h('div', { class: 'slider-group' }, [
    h('div', { class: 'slider-header' }, [h('span', { class: 'slider-label' }, ['Speed']), speedVal]),
    speedSlider,
  ]);
  const divider = () => h('div', { style: { width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)' } });
  const effectBtn = h('button', { class: 'ctrl-btn', id: 'btn-effect', title: 'Transition Effect' }, [h('i', { class: 'fas fa-magic' })]);
  const filterBtn = h('button', { class: 'ctrl-btn', id: 'btn-filter', title: 'Color Theme' }, [h('i', { class: 'fas fa-temperature-high' })]);
  const sortBtn = h('button', { class: 'ctrl-btn', id: 'btn-sort', title: 'Sort' }, [h('i', { class: 'fas fa-filter' })]);
  const shuffleBtn = h('button', { class: 'ctrl-btn', id: 'btn-shuffle', title: 'Shuffle' }, [h('i', { class: 'fas fa-shuffle' })]);
  const pipBtn = h('button', { class: 'ctrl-btn', title: 'Picture-in-Picture' }, [h('i', { class: 'fas fa-external-link-alt' })]);
  const settingsBtn = h('button', { class: 'ctrl-btn', title: 'Settings' }, [h('i', { class: 'fas fa-cog' })]);
  const gridBtn = h('button', { class: 'ctrl-btn', title: 'Grid View' }, [h('i', { class: 'fas fa-th' })]);
  const addBtn = h('button', { class: 'ctrl-btn', title: 'Add Images' }, [h('i', { class: 'fas fa-plus' })]);

  const controls = h('div', { id: 'controls' }, [
    playBtn, speedGroup, divider(), effectBtn, filterBtn, sortBtn, shuffleBtn, divider(), pipBtn, settingsBtn, gridBtn, addBtn,
  ]);
  deps.uiLayer.append(controls);

  // --- Play ---
  playBtn.onclick = () => togglePlay();

  // --- Speed ---
  speedSlider.addEventListener('input', () => {
    speedVal.textContent = formatMs(Number(speedSlider.value));
    const s = store.getState();
    store.setSettings({ player: { ...s.settings.player, speedMs: Number(speedSlider.value) } });
    if (s.isPlaying) startPlayer(store, { front: deps.front, back: deps.back });
  });

  // --- Effect ---
  effectBtn.onclick = () => {
    const s = store.getState();
    const idx = (EFFECT_ORDER.indexOf(s.settings.player.effect) + 1) % EFFECT_ORDER.length;
    const next = EFFECT_ORDER[idx];
    store.setSettings({ player: { ...s.settings.player, effect: next } });
    showToast(`Transition: ${EFFECT_LABELS[next]}`);
    effectBtn.style.color = next === 'none' ? '' : 'var(--accent)';
  };

  // --- Filter ---
  filterBtn.onclick = () => {
    const s = store.getState();
    const idx = (FILTER_ORDER.indexOf(s.settings.player.filter) + 1) % FILTER_ORDER.length;
    const next = FILTER_ORDER[idx];
    store.setSettings({ player: { ...s.settings.player, filter: next } });
    showToast(`Filter: ${next[0].toUpperCase() + next.slice(1)}`);
  };

  // --- Sort ---
  sortBtn.onclick = () => {
    const s = store.getState();
    const order = ['name', 'color', 'added'] as const;
    const idx = (order.indexOf(s.settings.player.sort === 'custom' ? 'name' : s.settings.player.sort) + 1) % order.length;
    const next = order[idx];
    store.setSettings({ player: { ...s.settings.player, sort: next } });
    const sorted = sortFrames(s.frames, next);
    store.setFrames(sorted);
    store.setIndex(0);
    showToast(`Sort: ${next}`);
  };

  // --- Shuffle ---
  shuffleBtn.onclick = () => {
    const s = store.getState();
    const order = ['off', 'random', 'evenColor', 'gradient'] as const;
    const idx = (order.indexOf(s.settings.player.shuffle) + 1) % order.length;
    const next = order[idx];
    store.setSettings({ player: { ...s.settings.player, shuffle: next } });
    const shuffled = applyShuffle(s.frames, next);
    store.setFrames(shuffled);
    store.setIndex(0);
    showToast(`Shuffle: ${next}`);
    shuffleBtn.style.color = next === 'off' ? '' : 'var(--accent)';
  };

  // --- PiP ---
  pipBtn.onclick = () => deps.pip.toggle();

  // --- Settings ---
  settingsBtn.onclick = () => store.setUi({ settingsOpen: !store.getState().ui.settingsOpen });

  // --- Grid ---
  gridBtn.onclick = () => deps.onOpenGrid();
  addBtn.onclick = () => deps.onAddFiles();

  // --- Reactivity ---
  store.subscribe(s => {
    playBtn.innerHTML = s.isPlaying ? '<i class="fas fa-pause"></i>' : '<i class="fas fa-play"></i>';
    if (Number(speedSlider.value) !== s.settings.player.speedMs) {
      speedSlider.value = String(s.settings.player.speedMs);
      speedVal.textContent = formatMs(s.settings.player.speedMs);
    }
    const f = filterString(s.settings.player.filter);
    deps.front.style.filter = f;
    deps.back.style.filter = f;
  });

  function togglePlay(): void {
    const s = store.getState();
    const next = !s.isPlaying;
    store.setPlaying(next);
    if (next) {
      startPlayer(store, { front: deps.front, back: deps.back });
    } else {
      stopPlayer();
    }
  }

  // Expose nav for main.ts
  (store as any).__nav = {
    next: () => { const s = store.getState(); if (s.frames.length) store.setIndex((s.currentIndex + 1) % s.frames.length); },
    prev: () => { const s = store.getState(); if (s.frames.length) store.setIndex((s.currentIndex - 1 + s.frames.length) % s.frames.length); },
    togglePlay,
    fullscreen: () => { if (!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen(); },
  };

  // Re-render current frame on index/settings change
  store.subscribe(s => {
    void s;
    renderCurrent(store, { front: deps.front, back: deps.back }, false);
  });
}
