import type { Effect } from '../../core/types';
import { easeInOutQuad } from '../../utils/math';

export interface TransitionState { startTime: number; duration: number; active: boolean; }

export function applyTransition(
  els: { front: HTMLImageElement; back: HTMLImageElement },
  next: { src: string; filter: string },
  effect: Effect,
  durationMs: number,
): TransitionState {
  const { front, back } = els;
  // Back becomes the current front deterministically.
  back.src = front.src;
  back.style.transition = 'none';
  back.style.opacity = '1';
  back.style.filter = front.style.filter;

  front.src = next.src;
  front.style.transition = 'none';
  front.style.opacity = effect === 'none' ? '1' : '0';
  front.style.filter = next.filter;
  // Force reflow so the upcoming transition animates from this state.
  void front.offsetWidth;

  if (effect === 'none' || durationMs <= 0) {
    front.style.opacity = '1';
    front.style.filter = next.filter;
    return { startTime: Date.now(), duration: 0, active: false };
  }

  front.style.transition = `opacity ${durationMs}ms ease-in-out, filter ${durationMs}ms ease-in-out`;
  if (effect === 'blur') front.style.filter = next.filter ? `${next.filter} blur(15px)` : 'blur(15px)';
  front.style.opacity = '1';
  if (effect === 'blur') front.style.filter = next.filter ? `${next.filter} blur(0px)` : 'blur(0px)';
  return { startTime: Date.now(), duration: durationMs, active: true };
}

export function progressOf(state: TransitionState): number {
  if (!state.active) return 1;
  const p = (Date.now() - state.startTime) / state.duration;
  if (p >= 1) { state.active = false; return 1; }
  return easeInOutQuad(p);
}

let lastTransition: TransitionState = { startTime: 0, duration: 0, active: false };
export function setLastTransition(state: TransitionState): void { lastTransition = state; }
export function getTransition(): TransitionState { return lastTransition; }
