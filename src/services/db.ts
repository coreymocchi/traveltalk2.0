import { User, Chat, Message, Place } from '../types';
const DB_NAME = 'traveltalk_v5';
const DB_VERSION = 1;
let dbPromise: Promise<IDBDatabase> | null = null;
export const openDB = (): Promise<IDBDatabase> => {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e: any) => {
      const db = e.target.result;
      ['chats', 'messages', 'users', 'places'].forEach(s => !db.objectStoreNames.contains(s) && db.createObjectStore(s, { keyPath: s === 'users' ? 'username' : 'id' }));
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = reject;
  });
  return dbPromise;
};
export const dbPut = async (s: string, v: any) => { const db = await openDB(); return new Promise(r => { db.transaction(s, 'readwrite').objectStore(s).put(v).onsuccess = () => r(v); }); };
export const dbGet = async <T>(s: string, k: string) => { const db = await openDB(); return new Promise<T | undefined>(r => { db.transaction(s, 'readonly').objectStore(s).get(k).onsuccess = (e: any) => r(e.target.result); }); };
export const dbGetAll = async <T>(s: string) => { const db = await openDB(); return new Promise<T[]>(r => { db.transaction(s, 'readonly').objectStore(s).getAll().onsuccess = (e: any) => r(e.target.result); }); };
export const dbDelete = async (s: string, k: string) => { const db = await openDB(); return new Promise<void>(r => { db.transaction(s, 'readwrite').objectStore(s).delete(k).onsuccess = () => r(); }); };
