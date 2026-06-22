import type { Temp } from '../core/types';

export function hueToTemp(hue: number): Temp {
  if (hue < 60 || hue > 300) return 'warm';
  if (hue > 150 && hue < 270) return 'cool';
  return 'neutral';
}

export const FILTER_INTENSE = 'contrast(1.3) saturate(1.4) brightness(1.1)';
export const FILTER_COOL = 'sepia(0.2) contrast(0.9) brightness(0.9) hue-rotate(190deg)';
