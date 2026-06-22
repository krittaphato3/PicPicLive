import type { Frame } from '../core/types';

const DB_NAME = 'PicPicLiveDB';
const DB_VERSION = 2;
const STORE_NAME = 'images';
const INDEX = 'groupName';

let dbPromise: Promise<IDBDatabase> | null = null;

export function openDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex(INDEX, INDEX, { unique: false });
      }
      if (e.oldVersion < 2) {
        const tx = (e.target as IDBOpenDBRequest).transaction!;
        const store = tx.objectStore(STORE_NAME);
        store.openCursor().onsuccess = (ev) => {
          const cursor = (ev.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            const v = cursor.value as Frame;
            if (typeof v.addedAt !== 'number') cursor.update({ ...v, addedAt: Date.now() });
            cursor.continue();
          }
        };
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDB().then(db => new Promise<T>((resolve, reject) => {
    const t = db.transaction(STORE_NAME, mode);
    const req = fn(t.objectStore(STORE_NAME));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
}

export function getAll(): Promise<Frame[]> {
  return tx('readonly', s => s.getAll() as IDBRequest<Frame[]>);
}
export function putFrame(frame: Frame): Promise<void> {
  return tx('readwrite', s => s.put(frame)).then(() => {});
}
export function deleteFrame(id: string): Promise<void> {
  return tx('readwrite', s => s.delete(id)).then(() => {});
}
export function clearAll(): Promise<void> {
  return tx('readwrite', s => s.clear()).then(() => {});
}
export function deleteByGroup(name: string): Promise<void> {
  return openDB().then(db => new Promise<void>((resolve, reject) => {
    const t = db.transaction(STORE_NAME, 'readwrite');
    const store = t.objectStore(STORE_NAME);
    const idx = store.index(INDEX);
    const req = idx.getAllKeys(IDBKeyRange.only(name));
    req.onsuccess = () => { req.result.forEach((k) => store.delete(k)); };
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  }));
}

export function groupItems(items: Frame[]): Record<string, Frame[]> {
  const out: Record<string, Frame[]> = {};
  for (const it of items) (out[it.groupName] ??= []).push(it);
  return out;
}
