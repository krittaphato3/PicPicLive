import { describe, it, expect } from 'vitest';
import { clamp, easeInOutQuad, containScale, coverScale } from '../../src/utils/math';

describe('math', () => {
  it('clamps values', () => { expect(clamp(5, 1, 3)).toBe(3); expect(clamp(0, 1, 3)).toBe(1); expect(clamp(2, 1, 3)).toBe(2); });
  it('easesInOutQuad at boundaries', () => { expect(easeInOutQuad(0)).toBe(0); expect(easeInOutQuad(1)).toBe(1); expect(easeInOutQuad(0.5)).toBeCloseTo(0.5, 4); });
  it('containScale fits image inside container', () => {
    // 1600x900 image in 1280x720 → scale by width: 1280/1600 = 0.8
    expect(containScale(1600, 900, 1280, 720)).toBeCloseTo(0.8, 1);
  });
  it('coverScale: same ratio image fills exactly', () => {
    // 1600x900 in 1280x720 (both 16:9) → scale by width = 1280/1600 = 0.8
    const s = coverScale(1600, 900, 1280, 720);
    expect(s * 1600).toBeGreaterThanOrEqual(1280);
    expect(s * 900).toBeGreaterThanOrEqual(720);
  });
  it('coverScale: wide image in narrow container scales by height', () => {
    // 1600x900 image (wide) in 800x720 container
    // Must cover → scale by height: 720/900 = 0.8 → becomes 1280x720 (covers 800x720)
    const s = coverScale(1600, 900, 800, 720);
    expect(s).toBeCloseTo(0.8, 2);
    expect(s * 1600).toBeGreaterThanOrEqual(800); // covers width
    expect(s * 900).toBeGreaterThanOrEqual(720); // covers height
  });
  it('coverScale: portrait image in landscape container scales by width', () => {
    // 900x1600 image (portrait) in 1280x720 container
    // Must cover → scale by width: 1280/900 ≈ 1.422 → becomes 1280x2275 (covers 1280x720)
    const s = coverScale(900, 1600, 1280, 720);
    expect(s).toBeCloseTo(1.422, 2);
    expect(s * 900).toBeGreaterThanOrEqual(1280); // covers width
    expect(s * 1600).toBeGreaterThanOrEqual(720); // covers height
  });
});
