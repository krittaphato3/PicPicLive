import type { Effect, Filter } from '../../core/types';
import { FILTER_INTENSE, FILTER_COOL } from '../../utils/color';

export function filterString(mode: Filter): string {
  if (mode === 'intense') return FILTER_INTENSE;
  if (mode === 'cool') return FILTER_COOL;
  return 'none';
}

export const EFFECT_LABELS: Record<Effect, string> = {
  none: 'Hard Cut',
  crossfade: 'Crossfade',
  blur: 'Blur',
  zoom: 'Zoom',
};

export const EFFECT_ORDER: Effect[] = ['none', 'crossfade', 'blur', 'zoom'];
export const FILTER_ORDER: Filter[] = ['none', 'intense', 'cool'];
