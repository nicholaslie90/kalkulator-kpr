const DB_NAME = 'KprCalculatorDB';
const DB_VERSION = 1;
const STORE_NAME = 'kpr_state';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Retrieve a value from IndexedDB by its key.
 * If the key doesn't exist or an error occurs, returns the defaultValue.
 */
export async function getDbValue<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const db = await openDb();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(key);
      request.onsuccess = () => {
        resolve(request.result !== undefined ? (request.result as T) : defaultValue);
      };
      request.onerror = () => {
        resolve(defaultValue);
      };
    });
  } catch (error) {
    console.error(`Failed to read key "${key}" from IndexedDB:`, error);
    return defaultValue;
  }
}

/**
 * Store a value in IndexedDB.
 */
export async function setDbValue<T>(key: string, value: T): Promise<void> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const request = store.put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error(`Failed to write key "${key}" to IndexedDB:`, error);
  }
}

/**
 * Export ALL key-value pairs from IndexedDB as a plain JSON object.
 */
export async function exportAllData(): Promise<Record<string, unknown>> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const getAllKeys = store.getAllKeys();
      const getAllValues = store.getAll();

      tx.oncomplete = () => {
        const keys = getAllKeys.result as string[];
        const values = getAllValues.result;
        const data: Record<string, unknown> = {};
        keys.forEach((key, i) => {
          data[key] = values[i];
        });
        resolve(data);
      };
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error('Failed to export all data from IndexedDB:', error);
    return {};
  }
}

/**
 * Import a full JSON snapshot into IndexedDB, overwriting all existing keys.
 */
export async function importAllData(data: Record<string, unknown>): Promise<void> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      // Clear existing data first
      store.clear();
      for (const [key, value] of Object.entries(data)) {
        store.put(value, key);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (error) {
    console.error('Failed to import data into IndexedDB:', error);
  }
}
