import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Bean, Cafe, Shot } from '../types';

export const DB_NAME = 'coffee-shot-journal';
export const DB_VERSION = 5;
export const JOURNAL_KEY = 'journal' as const;

export interface JournalDB extends DBSchema {
  beans: {
    key: typeof JOURNAL_KEY;
    value: Bean[];
  };
  shots: {
    key: typeof JOURNAL_KEY;
    value: Shot[];
  };
  cafes: {
    key: typeof JOURNAL_KEY;
    value: Cafe[];
  };
  photoBlobs: {
    key: string;
    value: { mimeType: string; data: ArrayBuffer };
  };
}

let dbPromise: Promise<IDBPDatabase<JournalDB>> | null = null;

export function getDb(): Promise<IDBPDatabase<JournalDB>> {
  if (!dbPromise) {
    dbPromise = openDB<JournalDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (!db.objectStoreNames.contains('beans')) {
          db.createObjectStore('beans');
        }
        if (!db.objectStoreNames.contains('shots')) {
          db.createObjectStore('shots');
        }
        if (!db.objectStoreNames.contains('photoBlobs')) {
          db.createObjectStore('photoBlobs');
        }
        if (oldVersion < 5 && !db.objectStoreNames.contains('cafes')) {
          db.createObjectStore('cafes');
        }
      },
    }).catch((err) => {
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise;
}

/** Reset cached connection (for tests). */
export function resetDbForTests(): void {
  dbPromise = null;
}
