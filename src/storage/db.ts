import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Bean, Shot } from '../types';

export const DB_NAME = 'coffee-shot-journal';
export const DB_VERSION = 1;
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
  photoBlobs: {
    key: string;
    value: { mimeType: string; data: ArrayBuffer };
  };
}

let dbPromise: Promise<IDBPDatabase<JournalDB>> | null = null;

export function getDb(): Promise<IDBPDatabase<JournalDB>> {
  if (!dbPromise) {
    dbPromise = openDB<JournalDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('beans')) {
          db.createObjectStore('beans');
        }
        if (!db.objectStoreNames.contains('shots')) {
          db.createObjectStore('shots');
        }
        if (!db.objectStoreNames.contains('photoBlobs')) {
          db.createObjectStore('photoBlobs');
        }
      },
    });
  }
  return dbPromise;
}

/** Reset cached connection (for tests). */
export function resetDbForTests(): void {
  dbPromise = null;
}
