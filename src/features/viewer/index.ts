import type { Store } from '../../core/store';
import { h } from '../../utils/dom';
import { attachZoom } from './zoom';
import { attachIdle } from './idle';
import { attachAmbient } from './ambient';

export interface ViewerEls {
  root: HTMLElement;
  ambient: HTMLElement;
  navLeft: HTMLElement;
  navCenter: HTMLElement;
  navRight: HTMLElement;
  imgFront: HTMLImageElement;
  imgBack: HTMLImageElement;
  uiLayer: HTMLElement;
  homeBtn: HTMLElement;
  navZones: HTMLElement[];
  zoomReadout: HTMLElement;
  zoomSlider: HTMLInputElement;
}

export function mountViewer(store: Store, app: HTMLElement): ViewerEls {
  const ambient = h('div', { id: 'ambient-bg' });
  const navLeft = h('div', { id: 'nav-left', class: 'nav-zone', title: 'Previous' });
  const navRight = h('div', { id: 'nav-right', class: 'nav-zone', title: 'Next' });
  const navCenter = h('div', { id: 'nav-center', class: 'nav-zone', title: 'Click for UI' });
  const imgBack = h('img', { id: 'img-back', class: 'frame-display', src: '' }) as HTMLImageElement;
  const imgFront = h('img', { id: 'img-front', class: 'frame-display', src: '' }) as HTMLImageElement;
  const root = h('div', { id: 'viewer' }, [ambient, navLeft, navCenter, navRight, imgBack, imgFront]);
  root.style.display = 'none';
  app.append(root);

  const uiLayer = h('div', { id: 'ui-layer', class: 'hidden' });
  app.append(uiLayer);
  const homeBtn = h('button', { id: 'btn-home', title: 'Home (Esc)' }, [h('i', { class: 'fas fa-home' })]);
  homeBtn.style.display = 'none';
  app.append(homeBtn);

  const zoomReadout = h('span', { class: 'slider-val' }, ['100%']);
  const zoomSlider = h('input', { type: 'range', min: '100', max: '500', step: '10', value: '100' }) as HTMLInputElement;

  const els: ViewerEls = {
    root, ambient, navLeft, navRight, navCenter,
    imgFront, imgBack, uiLayer, homeBtn,
    navZones: [navLeft, navRight, navCenter],
    zoomReadout, zoomSlider,
  };

  attachZoom(store, { viewer: root, navCenter, imgFront, imgBack, zoomReadout, zoomSlider });
  attachIdle(store, { uiLayer, homeBtn, navZones: els.navZones });
  attachAmbient(store, ambient);

  return els;
}
