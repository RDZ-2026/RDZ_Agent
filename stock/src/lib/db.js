import { openDB } from 'idb'

const DB_NAME = 'rdz-stock'
const DB_VERSION = 1

export async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('sync_queue')) {
        const q = db.createObjectStore('sync_queue', { keyPath: 'id', autoIncrement: true })
        q.createIndex('status', 'status')
        q.createIndex('created_at', 'created_at')
      }
      if (!db.objectStoreNames.contains('conflicts')) {
        db.createObjectStore('conflicts', { keyPath: 'id', autoIncrement: true })
      }
      if (!db.objectStoreNames.contains('cache_articles')) {
        db.createObjectStore('cache_articles', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('cache_stock')) {
        db.createObjectStore('cache_stock', { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains('cache_agents')) {
        db.createObjectStore('cache_agents', { keyPath: 'id' })
      }
    }
  })
}

export async function enqueueOperation(table, operation, data) {
  const db = await getDB()
  return db.add('sync_queue', {
    table, operation, data,
    status: 'pending',
    created_at: new Date().toISOString()
  })
}

export async function getPendingOperations() {
  const db = await getDB()
  const all = await db.getAllFromIndex('sync_queue', 'status', 'pending')
  return all.sort((a, b) => a.created_at.localeCompare(b.created_at))
}

export async function markDone(id) {
  const db = await getDB()
  const item = await db.get('sync_queue', id)
  if (item) { item.status = 'done'; item.synced_at = new Date().toISOString(); await db.put('sync_queue', item) }
}

export async function markConflict(id, local, remote) {
  const db = await getDB()
  const item = await db.get('sync_queue', id)
  if (item) { item.status = 'conflict'; await db.put('sync_queue', item) }
  await db.add('conflicts', { operation_id: id, local_data: local, remote_data: remote, detected_at: new Date().toISOString(), resolved: false })
}

export async function getPendingCount() {
  const db = await getDB()
  return (await db.getAllFromIndex('sync_queue', 'status', 'pending')).length
}

export async function getConflicts() {
  const db = await getDB()
  return (await db.getAll('conflicts')).filter(c => !c.resolved)
}

export async function setCache(store, items) {
  const db = await getDB()
  const tx = db.transaction(store, 'readwrite')
  for (const i of items) await tx.store.put(i)
  await tx.done
}

export async function getCache(store) {
  const db = await getDB()
  return db.getAll(store)
}
