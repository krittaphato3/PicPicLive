import type { Store } from '../../core/store';
import { h } from '../../utils/dom';
import { containScale, coverScale } from '../../utils/math';
import { getTransition, progressOf } from '../player/transitions';
import { filterString } from '../player/effects';
import { analyzeRatios, type AlbumRatios } from '../../services/image-analysis';
import { showToast } from '../../services/toast';

export interface PipController {
  toggle: () => Promise<void>;
  isActive: () => boolean;
}

const PIP_MODES = ['fit', 'half-full', 'full', 'dynamic'] as const;
const PIP_LABELS: Record<string, string> = { fit: 'Fit', 'half-full': 'Half-Full', full: 'Full', dynamic: 'Dynamic' };
const BASE_H = 720;

export function mountPip(store: Store, app: HTMLElement, getViewerEls: () => { imgFront: HTMLImageElement; imgBack: HTMLImageElement }): PipController {
  const canvas = h('canvas', { id: 'pip-canvas' }) as HTMLCanvasElement;
  const video = h('video', { id: 'pip-video', muted: '', autoplay: '', playsinline: '' }) as HTMLVideoElement;
  canvas.style.display = 'none';
  video.style.display = 'none';
  app.append(canvas, video);

  const ctx = canvas.getContext('2d')!;
  let active = false;
  let rafId: number | undefined;
  let ratios: AlbumRatios = { modeRatio: 1.77, fullRatio: 1.77 };
  let lastAlbumId: string | null = null;

  store.subscribe(async (s) => {
    if (s.currentAlbumId && s.currentAlbumId !== lastAlbumId && s.frames.length) {
      lastAlbumId = s.currentAlbumId;
      ratios = await analyzeRatios(s.frames.map(f => f.src ?? '').filter(Boolean));
    }
  });

  async function toggle(): Promise<void> {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
      return;
    }
    try {
      await start();
    } catch (err) {
      console.error(err);
      showToast('PiP Failed: ' + (err as Error).message);
    }
  }

  async function start(): Promise<void> {
    if (!store.getState().frames.length) return;
    renderFrame();
    if (video.srcObject === null) {
      const stream = canvas.captureStream(60);
      video.srcObject = stream;
    }
    await video.play();
    await video.requestPictureInPicture();
    active = true;
    showToast('PiP Active');
    loop();
    video.addEventListener('leavepictureinpicture', () => {
      active = false;
      if (rafId) cancelAnimationFrame(rafId);
    }, { once: true });
  }

  function loop(): void {
    if (!active) return;
    renderFrame();
    rafId = requestAnimationFrame(loop);
  }

  function renderFrame(): void {
    const s = store.getState();
    if (!s.frames.length) return;
    const frame = s.frames[s.currentIndex];
    const { imgFront, imgBack } = getViewerEls();
    const front = imgFront;
    const mode = s.settings.pip.ratioMode;

    // Canvas size per ratio mode
    let targetW: number, targetH: number;
    if (mode === 'fit') {
      targetW = front.naturalWidth || 1280;
      targetH = front.naturalHeight || 720;
    } else if (mode === 'half-full') {
      targetH = BASE_H; targetW = BASE_H * ratios.modeRatio;
    } else if (mode === 'full') {
      targetH = BASE_H; targetW = BASE_H * ratios.fullRatio;
    } else { // dynamic
      targetH = BASE_H; targetW = BASE_H * 1.777;
    }
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW; canvas.height = targetH;
    }
    const w = canvas.width, hch = canvas.height;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, hch);
    ctx.save();

    const drawMode = mode === 'full' ? 'cover' : 'contain';
    const imgRatio = front.naturalWidth / front.naturalHeight || 1.77;
    const canvasRatio = w / hch;
    let scaleFactor: number;
    if (drawMode === 'cover') scaleFactor = coverScale(front.naturalWidth || 1280, front.naturalHeight || 720, w, hch);
    else scaleFactor = containScale(front.naturalWidth || 1280, front.naturalHeight || 720, w, hch);
    void imgRatio; void canvasRatio;

    ctx.translate(w / 2, hch / 2);
    if (s.settings.pip.syncZoom) {
      const { scale, panX, panY } = s.view;
      ctx.translate(panX, panY);
      ctx.scale(scale, scale);
    }
    ctx.scale(scaleFactor, scaleFactor);
    ctx.translate(-front.naturalWidth / 2, -front.naturalHeight / 2);

    const transition = getTransition();
    const progress = progressOf(transition);
    const effect = s.settings.player.effect;
    const filter = filterString(s.settings.player.filter);

    const drawImg = (img: HTMLImageElement, alpha: number, extraScale = 1, blurPx = 0): void => {
      if (!img.complete || img.naturalWidth === 0) return;
      ctx.globalAlpha = alpha;
      let applied = filter !== 'none' ? filter : '';
      if (blurPx > 0) applied += ` blur(${blurPx}px)`;
      ctx.filter = applied || 'none';
      if (extraScale !== 1) {
        ctx.save();
        ctx.translate(img.naturalWidth / 2, img.naturalHeight / 2);
        ctx.scale(extraScale, extraScale);
        ctx.translate(-img.naturalWidth / 2, -img.naturalHeight / 2);
        ctx.drawImage(img, 0, 0);
        ctx.restore();
      } else {
        ctx.drawImage(img, 0, 0);
      }
    };

    if (transition.active && progress < 1) {
      drawImg(imgBack, 1.0);
      if (effect === 'crossfade') drawImg(front, progress);
      else if (effect === 'zoom') drawImg(front, progress, 1.1 - (0.1 * progress));
      else if (effect === 'blur') drawImg(front, progress, 1, 15 * (1 - progress));
      else drawImg(front, 1);
    } else {
      drawImg(front, 1.0);
    }

    if (s.settings.pip.showInfo) {
      ctx.restore();
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.filter = 'none';
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(20, hch - 60, 400, 40);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 20px Arial';
      ctx.fillText(frame.name, 40, hch - 32);
    }
    ctx.restore();
  }

  return { toggle, isActive: () => active };
}

export { PIP_MODES, PIP_LABELS };
