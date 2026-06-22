import type { Store } from '../../core/store';
import { h } from '../../utils/dom';
import { showConfirm } from '../modals/confirm';
import { clearAll } from '../../services/db';
import { showToast } from '../../services/toast';

const PIP_MODES = ['fit', 'half-full', 'full', 'dynamic'] as const;
const PIP_LABELS: Record<string, string> = { fit: 'Fit', 'half-full': 'Half-Full', full: 'Full', dynamic: 'Dynamic' };

export function mountSettingsPanel(store: Store, app: HTMLElement): { toggle: () => void; isOpen: () => boolean } {
  const pipRatioBtn = h('button', { class: 'up-btn', style: { padding: '4px 10px', fontSize: '0.8rem' } }, ['Fit']);
  const scaleModeBtn = h('button', { class: 'up-btn', style: { padding: '4px 10px', fontSize: '0.8rem' } }, ['Fit']);
  const pipSync = h('input', { type: 'checkbox' }) as HTMLInputElement;
  const pipInfo = h('input', { type: 'checkbox' }) as HTMLInputElement;
  const ambient = h('input', { type: 'checkbox' }) as HTMLInputElement;
  const zoomReadout = h('span', { class: 'slider-val', id: 'zoom-val' }, ['100%']);
  const masterZoom = h('input', { type: 'range', min: '100', max: '500', step: '10', value: '100' }) as HTMLInputElement;

  function close(): void { store.setUi({ settingsOpen: false }); }

  const panel = h('div', { id: 'settings-panel' }, [
    h('div', { class: 'settings-header' }, [
      h('h3', {}, ['Control Center']),
      h('button', { class: 'ctrl-btn', style: { width: '32px', height: '32px', fontSize: '0.9rem' }, title: 'Close', onclick: () => close() }, [h('i', { class: 'fas fa-times' })]),
    ]),
    h('div', { class: 'setting-title' }, ['Picture-in-Picture']),
    h('div', { class: 'setting-group' }, [
      row('Aspect Ratio', pipRatioBtn),
      row('Sync Zoom', switchEl(pipSync)),
      row('Show Info', switchEl(pipInfo)),
    ]),
    h('div', { class: 'setting-title' }, ['Main Player']),
    h('div', { class: 'setting-group' }, [
      row('Ambient Background', switchEl(ambient)),
      row('Scale Mode', scaleModeBtn),
      h('div', { class: 'setting-row', style: { marginTop: '5px' } }, [h('span', {}, ['Remote Zoom']), zoomReadout]),
      masterZoom,
    ]),
    h('div', { class: 'setting-title' }, ['System']),
    h('div', { class: 'setting-group' }, [
      h('button', { class: 'up-btn', style: { width: '100%', justifyContent: 'center', background: '#3f1010', borderColor: '#501010', color: 'var(--danger)' }, onclick: askClear }, [h('i', { class: 'fas fa-trash' }), ' Clear Database']),
    ]),
  ]);
  app.append(panel);

  // Wire controls
  pipRatioBtn.onclick = () => {
    const s = store.getState();
    const idx = (PIP_MODES.indexOf(s.settings.pip.ratioMode) + 1) % PIP_MODES.length;
    const next = PIP_MODES[idx];
    store.setSettings({ pip: { ...s.settings.pip, ratioMode: next } });
  };
  pipSync.onchange = () => { const s = store.getState(); store.setSettings({ pip: { ...s.settings.pip, syncZoom: pipSync.checked } }); };
  pipInfo.onchange = () => { const s = store.getState(); store.setSettings({ pip: { ...s.settings.pip, showInfo: pipInfo.checked } }); };
  ambient.onchange = () => { const s = store.getState(); store.setSettings({ player: { ...s.settings.player, ambient: ambient.checked } }); };
  scaleModeBtn.onclick = () => {
    const s = store.getState();
    store.setSettings({ player: { ...s.settings.player, scaleCover: !s.settings.player.scaleCover } });
  };
  masterZoom.oninput = () => {
    const v = Number(masterZoom.value) / 100;
    store.setView(v, v === 1 ? 0 : store.getState().view.panX, v === 1 ? 0 : store.getState().view.panY);
  };

  store.subscribe(s => {
    panel.classList.toggle('active', s.ui.settingsOpen);
    if (s.ui.settingsOpen) {
      pipRatioBtn.textContent = PIP_LABELS[s.settings.pip.ratioMode];
      pipSync.checked = s.settings.pip.syncZoom;
      pipInfo.checked = s.settings.pip.showInfo;
      ambient.checked = s.settings.player.ambient;
      scaleModeBtn.textContent = s.settings.player.scaleCover ? 'Fill' : 'Fit';
      zoomReadout.textContent = `${Math.round(s.view.scale * 100)}%`;
      masterZoom.value = String(s.view.scale * 100);
    }
  });

  function toggle(): void { store.setUi({ settingsOpen: !store.getState().ui.settingsOpen }); }
  function isOpen(): boolean { return store.getState().ui.settingsOpen; }

  function askClear(): void {
    showConfirm('Reset All Data?', 'Delete all imported images?', () => {
      void clearAll().then(() => { showToast('Database Cleared'); setTimeout(() => location.reload(), 500); });
    });
  }

  return { toggle, isOpen };
}

function row(label: string, control: HTMLElement): HTMLElement {
  return h('div', { class: 'setting-row' }, [h('span', {}, [label]), control]);
}
function switchEl(input: HTMLInputElement): HTMLElement {
  return h('label', { class: 'switch' }, [input, h('span', { class: 'slider' })]);
}
