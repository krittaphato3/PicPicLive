import { describe, it, expect } from 'vitest';
import { hueToTemp } from '../../src/utils/color';

describe('color', () => {
  it('classifies warm hues', () => { expect(hueToTemp(10)).toBe('warm'); expect(hueToTemp(350)).toBe('warm'); });
  it('classifies cool hues', () => { expect(hueToTemp(200)).toBe('cool'); expect(hueToTemp(250)).toBe('cool'); });
  it('classifies neutral hues', () => { expect(hueToTemp(90)).toBe('neutral'); expect(hueToTemp(0)).toBe('warm'); });
});
