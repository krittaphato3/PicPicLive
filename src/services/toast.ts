let toastEl: HTMLElement | null = null;
const queue: { msg: string; action?: { label: string; fn: () => void }; ttl: number }[] = [];
let timer: number | undefined;

function render(): void {
  if (!toastEl) return;
  const next = queue[0];
  if (!next) { toastEl.style.opacity = '0'; return; }
  toastEl.innerHTML = '';
  const span = document.createElement('span');
  span.textContent = next.msg;
  toastEl.append(span);
  if (next.action) {
    const btn = document.createElement('button');
    btn.className = 'toast-action';
    btn.textContent = next.action.label;
    btn.onclick = () => { next.action!.fn(); queue.shift(); window.clearTimeout(timer); render(); };
    toastEl.append(btn);
  }
  toastEl.style.opacity = '1';
  timer = window.setTimeout(() => { queue.shift(); render(); }, next.ttl);
}

export function mountToast(root: HTMLElement): void {
  toastEl = document.createElement('div');
  toastEl.id = 'toast';
  root.append(toastEl);
}

export function showToast(msg: string, action?: { label: string; fn: () => void }, ttl = 2000): void {
  queue.push({ msg, action, ttl });
  if (queue.length === 1) render();
}
