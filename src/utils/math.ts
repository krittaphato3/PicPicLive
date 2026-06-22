export const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);
export const easeInOutQuad = (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t);

export function containScale(iw: number, ih: number, cw: number, ch: number): number {
  const ir = iw / ih, cr = cw / ch;
  return ir > cr ? cw / iw : ch / ih;
}
export function coverScale(iw: number, ih: number, cw: number, ch: number): number {
  const ir = iw / ih, cr = cw / ch;
  return ir > cr ? ch / ih : cw / iw;
}
