import { describe, it, expect } from 'vitest';
import { createStore } from '../../src/core/store';

describe('store', () => {
  it('initializes with defaults and updates frames', () => {
    const store = createStore();
    expect(store.getState().frames).toHaveLength(0);
    store.setFrames([{ id: 'a', name: 'a', groupName: 'g', hue: 0, temp: 'neutral', addedAt: 0 }]);
    expect(store.getState().frames).toHaveLength(1);
    expect(store.getState().frames[0].id).toBe('a');
  });

  it('notifies subscribers on state change', () => {
    const store = createStore();
    let snap = 0;
    store.subscribe(s => { snap = s.frames.length; });
    expect(snap).toBe(0); // called immediately
    store.setFrames([{ id: 'b', name: 'b', groupName: 'g', hue: 0, temp: 'neutral', addedAt: 0 }]);
    expect(snap).toBe(1);
  });

  it('loadAlbum sets currentAlbumId and frames', () => {
    const store = createStore();
    store.setAlbums([
      { id: 'alb1', name: 'Test', frames: [{ id: 'f1', name: 'x', groupName: 'Test', hue: 0, temp: 'neutral', addedAt: 1 }] },
    ]);
    store.loadAlbum('alb1');
    expect(store.getState().currentAlbumId).toBe('alb1');
    expect(store.getState().frames).toHaveLength(1);
  });

  it('closeAlbum resets to landing', () => {
    const store = createStore();
    store.setAlbums([{ id: 'alb1', name: 'Test', frames: [{ id: 'f1', name: 'x', groupName: 'Test', hue: 0, temp: 'neutral', addedAt: 1 }] }]);
    store.loadAlbum('alb1');
    store.setPlaying(true);
    store.closeAlbum();
    expect(store.getState().currentAlbumId).toBeNull();
    expect(store.getState().frames).toHaveLength(0);
    expect(store.getState().isPlaying).toBe(false);
  });

  it('setView clamps and stores pan', () => {
    const store = createStore();
    store.setView(2.5, 10, 20);
    expect(store.getState().view.scale).toBe(2.5);
    expect(store.getState().view.panX).toBe(10);
  });
});
