import { supabase } from './supabase'
import { getPendingOperations, markDone, markConflict, setCache, getCache } from './db'

let syncing = false
const listeners = new Set()

export const onSyncChange = (fn) => { listeners.add(fn); return () => listeners.delete(fn) }
const notify = (s) => listeners.forEach(fn => fn(s))

export async function syncPending() {
  if (syncing) return
  syncing = true
  notify({ syncing: true })

  const ops = await getPendingOperations()
  let synced = 0, conflicts = 0

  for (const op of ops) {
    try {
      if (op.operation === 'insert') {
        const { error } = await supabase.from(op.table).insert(op.data)
        if (!error) { await markDone(op.id); synced++ }
      } else if (op.operation === 'update') {
        const { data: remote } = await supabase.from(op.table).select('updated_at').eq('id', op.data.id).single()
        if (remote?.updated_at > op.created_at) {
          await markConflict(op.id, op.data, remote); conflicts++
        } else {
          const { error } = await supabase.from(op.table).update(op.data).eq('id', op.data.id)
          if (!error) { await markDone(op.id); synced++ }
        }
      } else if (op.operation === 'delete') {
        const { error } = await supabase.from(op.table).delete().eq('id', op.data.id)
        if (!error) { await markDone(op.id); synced++ }
      }
    } catch (e) { console.error('Sync error', op.id, e) }
  }

  syncing = false
  notify({ syncing: false, synced, conflicts })
  return { synced, conflicts }
}

export async function refreshCache() {
  try {
    const [{ data: articles }, { data: stock }, { data: agents }] = await Promise.all([
      supabase.from('articles').select('*'),
      supabase.from('stock').select('*, articles(*)'),
      supabase.from('agents').select('*')
    ])
    if (articles) await setCache('cache_articles', articles)
    if (stock)    await setCache('cache_stock', stock)
    if (agents)   await setCache('cache_agents', agents)
  } catch (e) { console.warn('Cache refresh error', e) }
}

export function startConnectionWatcher() {
  const handleOnline = async () => {
    await syncPending()
    await refreshCache()
  }
  window.addEventListener('online', handleOnline)
  if (navigator.onLine) { syncPending(); refreshCache() }
  return () => window.removeEventListener('online', handleOnline)
}
