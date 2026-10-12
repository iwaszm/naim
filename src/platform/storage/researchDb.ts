import { SIGNAL_SCHEMA_VERSION, type DisplaySnapshot } from '../../domain/signals/contracts';

const DB_NAME = 'naim-research';
const STORE = 'records';

export type ResearchRecord = {
  id?: number;
  sessionId: string;
  kind: 'frame' | 'marker';
  recordedAt: string;
  schemaVersion: typeof SIGNAL_SCHEMA_VERSION;
  frame?: DisplaySnapshot;
  label?: string;
};

function request<T>(value: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    value.onsuccess = () => resolve(value.result);
    value.onerror = () => reject(value.error);
  });
}

async function openDb(): Promise<IDBDatabase> {
  const open = indexedDB.open(DB_NAME, 1);
  open.onupgradeneeded = () => {
    const db = open.result;
    if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
  };
  return request(open);
}

export async function saveRecord(record: ResearchRecord) {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE, 'readwrite');
    await request(tx.objectStore(STORE).add(record));
  } finally { db.close(); }
}

export async function readRecords(): Promise<ResearchRecord[]> {
  const db = await openDb();
  try { return await request(db.transaction(STORE, 'readonly').objectStore(STORE).getAll()); }
  finally { db.close(); }
}

export async function clearRecords() {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE, 'readwrite');
    await request(tx.objectStore(STORE).clear());
  } finally { db.close(); }
}
