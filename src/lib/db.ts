import { openDB, IDBPDatabase } from 'idb';

const DB_NAME = 'auto-apply-ai-db';
const PROFILE_STORE = 'profile';
const APPS_STORE = 'applications';

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

export interface JobApplication {
  id: string;
  jobId: string;
  title: string;
  company: string;
  location: string;
  url: string;
  source: string;
  status: 'applied' | 'pending' | 'failed';
  appliedAt: number;
}

let dbPromise: Promise<IDBPDatabase>;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, 2, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          db.createObjectStore(PROFILE_STORE, { keyPath: 'id' });
        }
        if (oldVersion < 2) {
          db.createObjectStore(APPS_STORE, { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

export async function saveProfile(profile: UserProfile) {
  const db = await getDB();
  return db.put(PROFILE_STORE, profile);
}

export async function getProfile(): Promise<UserProfile | undefined> {
  const db = await getDB();
  return db.get(PROFILE_STORE, 'current');
}

export async function saveApplication(app: JobApplication) {
  const db = await getDB();
  return db.put(APPS_STORE, app);
}

export async function getApplications(): Promise<JobApplication[]> {
  const db = await getDB();
  return db.getAll(APPS_STORE);
}
