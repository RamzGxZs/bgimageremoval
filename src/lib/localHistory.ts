export interface StoredHistoryRecord {
  id: string;
  originalFilename: string;
  cutoutBlob: Blob;
  originalBlob?: Blob;
  mimeType: string;
  width: number;
  height: number;
  fileSizeBytes: number;
  modelUsed: string;
  bgConfigJson?: string;
  createdAt: number;
}

const DB_NAME = 'bg_remover_local_db';
const DB_VERSION = 1;
const STORE_NAME = 'history_records';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      return reject(new Error('IndexedDB tidak didukung pada browser ini.'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveLocalHistory(
  record: Omit<StoredHistoryRecord, 'id' | 'createdAt'>
): Promise<StoredHistoryRecord> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const id =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const fullRecord: StoredHistoryRecord = {
      ...record,
      id,
      createdAt: Math.floor(Date.now() / 1000),
    };

    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.add(fullRecord);

    req.onsuccess = () => resolve(fullRecord);
    req.onerror = () => reject(req.error);
  });
}

export async function getLocalHistory(limit = 50): Promise<StoredHistoryRecord[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('createdAt');
    const req = index.openCursor(null, 'prev');

    const results: StoredHistoryRecord[] = [];
    req.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor && results.length < limit) {
        results.push(cursor.value);
        cursor.continue();
      } else {
        resolve(results);
      }
    };
    req.onerror = () => reject(req.error);
  });
}

export async function deleteLocalHistoryItem(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function clearAllLocalHistory(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.clear();

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
