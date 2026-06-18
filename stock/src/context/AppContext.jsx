import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { supabase, ROLES, syncAgentsRH } from '../lib/supabase'
import { startConnectionWatcher, onSyncChange, syncPending } from '../lib/sync'
import { getPendingCount, getConflicts } from '../lib/db'

const Ctx = createContext(null)

export function AppProvider({ children }) {
  const [user, setUser]               = useState(null)
  const [role, setRole]               = useState(null)
  const [loading, setLoading]         = useState(true)
  const [isOnline, setIsOnline]       = useState(navigator.onLine)
  const [pendingCount, setPending]    = useState(0)
  const [conflicts, setConflicts]     = useState([])
  const [syncState, setSyncState]     = useState({ syncing: false })

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) { setUser(session.user); setRole(session.user.user_metadata?.role || ROLES.TERRAIN) }
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session?.user) { setUser(session.user); setRole(session.user.user_metadata?.role || ROLES.TERRAIN) }
      else { setUser(null); setRole(null) }
      setLoading(false)
    })
    return () => subscription.unsubscribe()
  }, [])

  // Online/offline + sync
  useEffect(() => {
    const on  = () => setIsOnline(true)
    const off = () => setIsOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    const stop = startConnectionWatcher()
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); stop() }
  }, [])

  useEffect(() => {
    const unsub = onSyncChange(async (s) => {
      setSyncState(s)
      setPending(await getPendingCount())
      setConflicts(await getConflicts())
    })
    getPendingCount().then(setPending)
    getConflicts().then(setConflicts)
    return unsub
  }, [])

  // Sync agents RH au démarrage si en ligne
  useEffect(() => {
    if (isOnline && user) syncAgentsRH().catch(() => {})
  }, [isOnline, user])

  const signIn   = (email, pwd) => supabase.auth.signInWithPassword({ email, password: pwd })
  const signOut  = () => supabase.auth.signOut()
  const forceSync = useCallback(async () => {
    await syncPending()
    setPending(await getPendingCount())
    setConflicts(await getConflicts())
  }, [])

  // Mode démo (sans Supabase Auth)
  const setDemoRole = (r) => {
    const names = { terrain: 'Agent Terrain', agent: 'Gestionnaire', direction: 'Direction RDZ' }
    setUser({ id: 'demo-' + r, email: 'demo@rdz.fr', user_metadata: { role: r, nom: names[r] } })
    setRole(r)
    setLoading(false)
  }

  return (
    <Ctx.Provider value={{ user, role, loading, isOnline, pendingCount, conflicts, syncState, signIn, signOut, setDemoRole, forceSync, ROLES }}>
      {children}
    </Ctx.Provider>
  )
}

export const useApp = () => useContext(Ctx)
