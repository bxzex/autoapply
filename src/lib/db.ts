import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'auto-apply-ai-db';
const STORE_NAME = 'profile';

export interface UserProfile {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  resumeText: string;
  resumeFile?: Uint8Array;
  skills: string[];
  embedding: number[];
  updatedAt: number;
}

let dbPromise: Promise<IDBPDatabase>;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 1, {
      upgrade(db) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      },
    });
  }
  return dbPromise;
}

export async function saveProfile(profile: UserProfile) {
  const db = await getDB();
  return db.put(STORE_NAME, profile);
}

export async function getProfile(): Promise<UserProfile | undefined> {
  const db = await getDB();
  return db.get(STORE_NAME, 'current');
}
