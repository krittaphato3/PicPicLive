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

  it('supports multiple subscribers', () => {
    const a = vi.fn();
    const b = vi.fn();
    const offA = bus.on('albums-changed', a);
    const offB = bus.on('albums-changed', b);
    bus.emit('albums-changed');
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
    offA();
    bus.emit('albums-changed');
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(2);
    offB();
  });
});
