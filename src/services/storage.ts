import { openDB, type IDBPDatabase } from 'idb'
import type { ScrapbookEntry } from '../types/bird'

const DB_NAME = 'winged-journal'
const STORE = 'entries'
const VERSION = 1

let dbPromise: Promise<IDBPDatabase> | null = null

function getDb() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) {
          const store = db.createObjectStore(STORE, { keyPath: 'id' })
          store.createIndex('createdAt', 'createdAt')
        }
      },
    })
  }
  return dbPromise
}

export async function listEntries(): Promise<ScrapbookEntry[]> {
  const db = await getDb()
  const all = await db.getAll(STORE)
  return (all as ScrapbookEntry[]).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export async function getEntry(id: string): Promise<ScrapbookEntry | undefined> {
  const db = await getDb()
  return db.get(STORE, id) as Promise<ScrapbookEntry | undefined>
}

export async function saveEntry(entry: ScrapbookEntry): Promise<void> {
  const db = await getDb()
  await db.put(STORE, entry)
}

export async function deleteEntry(id: string): Promise<void> {
  const db = await getDb()
  await db.delete(STORE, id)
}

export function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `entry-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'))
    reader.readAsDataURL(file)
  })
}
