import { describe, it, expect } from 'vitest';
import { groupItems } from '../../src/services/db';

describe('db.groupItems', () => {
  it('groups raw DB rows by groupName', () => {
    const items = [
      { id: '1', groupName: 'A', name: 'a1', hue: 0, temp: 'neutral' as const, addedAt: 1 },
      { id: '2', groupName: 'B', name: 'b1', hue: 0, temp: 'neutral' as const, addedAt: 2 },
      { id: '3', groupName: 'A', name: 'a2', hue: 0, temp: 'neutral' as const, addedAt: 3 },
    ];
    const groups = groupItems(items as any);
    expect(groups.A).toHaveLength(2);
    expect(groups.B).toHaveLength(1);
    expect(groups.A[0].name).toBe('a1');
    expect(groups.A[1].name).toBe('a2');
  });

  it('returns empty object for empty input', () => {
    expect(groupItems([] as any)).toEqual({});
  });
});
