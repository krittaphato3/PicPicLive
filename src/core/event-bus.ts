export type AppEvent =
  | { type: 'frames-changed'; count: number }
  | { type: 'albums-changed' }
  | { type: 'current-frame-changed'; index: number }
  | { type: 'settings-changed' }
  | { type: 'view-changed'; scale: number; panX: number; panY: number }
  | { type: 'ui-idle'; idle: boolean }
  | { type: 'album-loaded'; albumId: string };

type Handler = (payload: any) => void;

const listeners = new Map<string, Set<Handler>>();

export const bus = {
  on(type: AppEvent['type'], fn: Handler): () => void {
    let set = listeners.get(type);
    if (!set) { set = new Set(); listeners.set(type, set); }
    set.add(fn);
    return () => { set!.delete(fn); };
  },
  emit(type: AppEvent['type'], payload?: any): void {
    listeners.get(type)?.forEach(fn => fn(payload));
  },
};
