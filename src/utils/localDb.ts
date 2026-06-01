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
