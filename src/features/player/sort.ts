import type { Frame, SortMode } from '../../core/types';

export function sortFrames(frames: Frame[], mode: SortMode): Frame[] {
  const out = [...frames];
  switch (mode) {
    case 'name':
      out.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
      break;
    case 'color':
      out.sort((a, b) => {
        const ga = Math.floor(a.hue / 30), gb = Math.floor(b.hue / 30);
        return ga !== gb ? ga - gb : a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
      });
      break;
    case 'added':
      out.sort((a, b) => a.addedAt - b.addedAt);
      break;
    case 'custom':
      out.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      break;
  }
  return out;
}
