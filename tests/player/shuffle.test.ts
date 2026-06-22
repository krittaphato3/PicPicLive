import { describe, it, expect } from 'vitest';
import { applyShuffle } from '../../src/features/player/shuffle';
import type { Frame } from '../../src/core/types';

const make = (name: string, hue: number): Frame => ({
  id: name, name, groupName: 'test', hue, temp: 'neutral', addedAt: 0,
});

describe('applyShuffle', () => {
  it('returns same array for off', () => {
    const frames = [make('a', 0), make('b', 120), make('c', 240)];
    expect(applyShuffle(frames, 'off')).toBe(frames);
  });

  it('random returns all elements', () => {
    const frames = Array.from({ length: 20 }, (_, i) => make(`img-${i}`, i * 18));
    const result = applyShuffle(frames, 'random');
    expect(result).toHaveLength(20);
    expect(new Set(result.map(f => f.id)).size).toBe(20);
  });

  it('gradient sorts by hue ascending', () => {
    const frames = [make('c', 240), make('a', 10), make('b', 120)];
    const result = applyShuffle(frames, 'gradient');
    expect(result.map(f => f.name)).toEqual(['a', 'b', 'c']);
  });

  it('evenColor distributes hues', () => {
    const frames = [make('a', 0), make('b', 60), make('c', 120), make('d', 180)];
    const result = applyShuffle(frames, 'evenColor');
    // should be ordered by hue % 120
    const hues = result.map(f => f.hue % 120);
    for (let i = 1; i < hues.length; i++) {
      expect(hues[i]).toBeGreaterThanOrEqual(hues[i - 1]);
    }
  });
});
