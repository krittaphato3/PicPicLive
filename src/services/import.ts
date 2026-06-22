import type { Frame } from '../core/types';
import { uid } from '../core/ids';
import { putFrame } from './db';
import { extractHue, tempFromHue } from './image-analysis';
import { showToast } from './toast';

export interface ImportResult {
  groups: Record<string, Frame[]>;
  singles: Frame[];
}

export async function handleFiles(
  fileList: FileList | File[],
  opts: { presetName?: string | null; isFolder?: boolean } = {},
): Promise<ImportResult> {
  const files = Array.from(fileList).filter(f => f.type.startsWith('image/'));
  if (!files.length) return { groups: {}, singles: [] };
  showToast(`Processing ${files.length} images…`);
  const groups: Record<string, Frame[]> = {};
  const singles: Frame[] = [];
  const CHUNK = 10;
  for (let i = 0; i < files.length; i += CHUNK) {
    const chunk = files.slice(i, i + CHUNK);
    await Promise.all(chunk.map(async (file) => {
      let groupName = 'Imported';
      if (opts.isFolder && (file as any).webkitRelativePath) {
        const parts = (file as any).webkitRelativePath.split('/');
        if (parts.length >= 2) groupName = parts[parts.length - 2];
      } else if (opts.presetName) {
        groupName = opts.presetName;
      }
      const dataUrl = await readAsDataURL(file);
      const img = await loadImage(dataUrl);
      const hue = extractHue(img);
      const frame: Frame = {
        id: uid(),
        name: file.name,
        groupName,
        hue,
        temp: tempFromHue(hue),
        addedAt: Date.now(),
        src: URL.createObjectURL(file),
        blob: file,
      };
      void putFrame(frame);
      if (opts.isFolder || opts.presetName) (groups[groupName] ??= []).push(frame);
      else singles.push(frame);
    }));
  }
  return { groups, singles };
}

function readAsDataURL(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = () => rej(r.error);
    r.readAsDataURL(file);
  });
}
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}
