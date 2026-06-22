import { h } from '../../utils/dom';

let overlay: HTMLElement | null = null;

export function mountModal(app: HTMLElement): void {
  overlay = h('div', { id: 'modal-overlay' }, [
    h('div', { class: 'modal-box' }, [
      h('i', { class: 'fas fa-exclamation-triangle modal-icon' }),
      h('div', { class: 'modal-title', id: 'modal-title' }, ['Confirm Action']),
      h('div', { class: 'modal-desc', id: 'modal-desc' }, ['Are you sure?']),
      h('div', { class: 'modal-actions' }, [
        h('button', { class: 'modal-btn btn-cancel', onclick: closeModal }, ['Cancel']),
        h('button', { class: 'modal-btn btn-confirm', id: 'modal-confirm-btn' }, ['Confirm']),
      ]),
    ]),
  ]);
  app.append(overlay);
}

export function showConfirm(title: string, msg: string, onYes: () => void): void {
  if (!overlay) return;
  overlay.querySelector<HTMLElement>('#modal-title')!.textContent = title;
  overlay.querySelector<HTMLElement>('#modal-desc')!.textContent = msg;
  const btn = overlay.querySelector<HTMLElement>('#modal-confirm-btn')!;
  const fresh = btn.cloneNode(true) as HTMLElement;
  btn.replaceWith(fresh);
  fresh.addEventListener('click', () => { onYes(); closeModal(); });
  overlay.style.display = 'flex';
  requestAnimationFrame(() => overlay!.classList.add('active'));
}

export function closeModal(): void {
  if (!overlay) return;
  overlay.classList.remove('active');
  setTimeout(() => { if (overlay && !overlay.classList.contains('active')) overlay.style.display = 'none'; }, 300);
}

export function isModalOpen(): boolean { return !!overlay?.classList.contains('active'); }
