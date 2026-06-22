import type { Frame, ShuffleMode } from '../../core/types';

export function applyShuffle(frames: Frame[], mode: ShuffleMode): Frame[] {
  if (mode === 'off') return frames;
  const out = [...frames];
  if (mode === 'random') {
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
  } else if (mode === 'evenColor') {
    out.sort((a, b) => (a.hue % 120) - (b.hue % 120) || a.hue - b.hue);
  } else if (mode === 'gradient') {
    out.sort((a, b) => a.hue - b.hue);
  }
  return out;
}
