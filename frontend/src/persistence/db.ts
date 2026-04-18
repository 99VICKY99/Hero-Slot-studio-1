import { openDB, type IDBPDatabase, type DBSchema } from "idb";

/**
 * Browser persistence layer. Backend is stateless (CLAUDE.md §4.7);
 * all user data lives here. See docs/ARCHITECTURE.md §12 for schema.
 */
export const DB_NAME = "hero-studio";
export const DB_VERSION = 1;

export const STORE_HEROES = "heroes";
export const STORE_ACTIVE = "active";
export const STORE_SETTINGS = "settings";
export const STORE_META = "meta";

export const ACTIVE_KEY = "current";
export const SETTINGS_KEY = "prefs";
export const META_SCHEMA_VERSION_KEY = "schema_version";

interface HeroStudioDB extends DBSchema {
  [STORE_HEROES]: {
    key: string;
    value: unknown;
  };
  [STORE_ACTIVE]: {
    key: string;
    value: { heroId: string };
  };
  [STORE_SETTINGS]: {
    key: string;
    value: unknown;
  };
  [STORE_META]: {
    key: string;
    value: string;
  };
}

let dbPromise: Promise<IDBPDatabase<HeroStudioDB>> | null = null;

export function getDb(): Promise<IDBPDatabase<HeroStudioDB>> {
  if (!dbPromise) {
    dbPromise = openDB<HeroStudioDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_HEROES)) {
          db.createObjectStore(STORE_HEROES);
        }
        if (!db.objectStoreNames.contains(STORE_ACTIVE)) {
          db.createObjectStore(STORE_ACTIVE);
        }
        if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
          db.createObjectStore(STORE_SETTINGS);
        }
        if (!db.objectStoreNames.contains(STORE_META)) {
          db.createObjectStore(STORE_META);
        }
      },
    });
  }
  return dbPromise;
}
