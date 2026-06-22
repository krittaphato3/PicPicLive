import { describe, it, expect } from 'vitest';
import { sortFrames } from '../../src/features/player/sort';
import type { Frame } from '../../src/core/types';

const make = (name: string, hue: number, addedAt: number): Frame => ({
  id: name, name, groupName: 'test', hue, temp: 'neutral', addedAt,
});

describe('sortFrames', () => {
  it('sorts by name numerically', () => {
    const frames = [make('img-10', 0, 0), make('img-2', 0, 0), make('img-1', 0, 0)];
    const result = sortFrames(frames, 'name');
    expect(result.map(f => f.name)).toEqual(['img-1', 'img-2', 'img-10']);
  });

  it('sorts by color hue buckets then name within bucket', () => {
    // hue 30 → bucket 1 (warm), hue 190 → bucket 6 (cool), hue 200 → bucket 6 (cool)
    const frames = [make('b', 200, 0), make('a', 30, 0), make('c', 190, 0)];
    const result = sortFrames(frames, 'color');
    expect(result[0].name).toBe('a'); // warm first
    // b and c are in same bucket (floor(200/30)=6, floor(190/30)=6), sorted by name
    expect(result[1].name).toBe('b');
    expect(result[2].name).toBe('c');
  });

  it('sorts by addedAt ascending', () => {
    const frames = [make('c', 0, 300), make('a', 0, 100), make('b', 0, 200)];
    const result = sortFrames(frames, 'added');
    expect(result.map(f => f.name)).toEqual(['a', 'b', 'c']);
  });

  it('sorts by custom order field', () => {
    const frames = [make('c', 0, 0), make('a', 0, 0), make('b', 0, 0)];
    frames[0].order = 2;
    frames[1].order = 0;
    frames[2].order = 1;
    const result = sortFrames(frames, 'custom');
    expect(result.map(f => f.name)).toEqual(['a', 'b', 'c']);
  });

  it('does not mutate the original array', () => {
    const frames = [make('c', 0, 0), make('a', 0, 0)];
    sortFrames(frames, 'name');
    expect(frames[0].name).toBe('c');
  });
});
