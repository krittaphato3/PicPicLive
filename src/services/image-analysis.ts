import { hueToTemp } from '../utils/color';
import type { Temp } from '../core/types';

export function extractHue(img: HTMLImageElement | HTMLCanvasElement): number {
  const canvas = document.createElement('canvas');
  canvas.width = 30; canvas.height = 30;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, 30, 30);
  const data = ctx.getImageData(0, 0, 30, 30).data;
  let r = 0, g = 0, b = 0, count = 0;
  for (let i = 0; i < data.length; i += 4) { r += data[i]; g += data[i + 1]; b += data[i + 2]; count++; }
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let hue = 0;
  if (max !== min) {
    const d = max - min;
    switch (max) {
      case r: hue = (g - b) / d + (g < b ? 6 : 0); break;
      case g: hue = (b - r) / d + 2; break;
      case b: hue = (r - g) / d + 4; break;
    }
    hue /= 6;
  }
  return hue * 360;
}

export function tempFromHue(hue: number): Temp { return hueToTemp(hue); }

export interface AlbumRatios { modeRatio: number; fullRatio: number; }

export async function analyzeRatios(srcs: string[]): Promise<AlbumRatios> {
  const ratios: number[] = [];
  for (const src of srcs.slice(0, 50)) {
    const r = await new Promise<number | null>(res => {
      const img = new Image();
      img.onload = () => res(img.width / img.height);
      img.onerror = () => res(null);
      img.src = src;
    });
    if (r !== null) ratios.push(r);
  }
  if (!ratios.length) return { modeRatio: 1.77, fullRatio: 1.77 };
  const counts: Record<string, number> = {};
  ratios.forEach(r => { const k = r.toFixed(1); counts[k] = (counts[k] || 0) + 1; });
  const sorted = Object.keys(counts).sort((a, b) => counts[b] - counts[a]);
  const modeRatio = parseFloat(sorted[0]);
  const top3 = sorted.slice(0, 3).map(k => parseFloat(k));
  return { modeRatio, fullRatio: Math.min(...top3) };
}
