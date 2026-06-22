export function qs<T extends Element = HTMLElement>(sel: string, root: ParentNode = document): T {
  return root.querySelector(sel) as T;
}
export function qsa<T extends Element = HTMLElement>(sel: string, root: ParentNode = document): T[] {
  return Array.from(root.querySelectorAll(sel) as NodeListOf<T>);
}

type Attrs = Record<string, any> & { class?: string; html?: string };

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  children: (Node | string)[] = [],
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of children) el.append(typeof c === 'string' ? document.createTextNode(c) : c);
  return el;
}

export const debounce = <T extends (...a: any[]) => void>(fn: T, ms: number) => {
  let t: number | undefined;
  return (...a: Parameters<T>) => { window.clearTimeout(t); t = window.setTimeout(() => fn(...a), ms); };
};

export const rafThrottle = <T extends (...a: any[]) => void>(fn: T) => {
  let scheduled = false;
  let lastArgs: Parameters<T>;
  return (...a: Parameters<T>) => {
    lastArgs = a;
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => { fn(...lastArgs); scheduled = false; });
  };
};

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
}
