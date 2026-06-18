import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../context/AppContext'
import { enqueueOperation, getCache } from '../lib/db'

// ── Articles ──────────────────────────────────────────────
export function useArticles() {
  const { isOnline } = useApp()
  const [articles, setArticles] = useState([])
  const [loading, setLoading]   = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    if (isOnline) {
      const { data } = await supabase.from('articles').select('*').order('nom')
      if (data) setArticles(data)
    } else {
      setArticles(await getCache('cache_articles'))
    }
    setLoading(false)
  }, [isOnline])

  useEffect(() => { load() }, [load])

  const createArticle = async (article) => {
    const item = { ...article, id: crypto.randomUUID(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    if (isOnline) {
      const { data, error } = await supabase.from('articles').insert(item).select().single()
      if (!error) setArticles(p => [...p, data])
      return { data, error }
    }
    await enqueueOperation('articles', 'insert', item)
    setArticles(p => [...p, item])
    return { data: item, error: null }
  }

  const updateArticle = async (id, updates) => {
    const updated = { ...updates, id, updated_at: new Date().toISOString() }
    if (isOnline) {
      const { data, error } = await supabase.from('articles').update(updates).eq('id', id).select().single()
      if (!error) setArticles(p => p.map(a => a.id === id ? data : a))
      return { data, error }
    }
    await enqueueOperation('articles', 'update', updated)
    setArticles(p => p.map(a => a.id === id ? { ...a, ...updates } : a))
    return { data: updated, error: null }
  }

  const deleteArticle = async (id) => {
    if (isOnline) {
      const { error } = await supabase.from('articles').delete().eq('id', id)
      if (!error) setArticles(p => p.filter(a => a.id !== id))
      return { error }
    }
    await enqueueOperation('articles', 'delete', { id })
    setArticles(p => p.filter(a => a.id !== id))
    return { error: null }
  }

  return { articles, loading, reload: load, createArticle, updateArticle, deleteArticle }
}

// ── Stock ─────────────────────────────────────────────────
export function useStock() {
  const { isOnline } = useApp()
  const [stock, setStock]     = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    if (isOnline) {
      const { data } = await supabase.from('stock').select('*, articles(*)').order('created_at')
      if (data) setStock(data)
    } else {
      setStock(await getCache('cache_stock'))
    }
    setLoading(false)
  }, [isOnline])

  useEffect(() => { load() }, [load])

  const ajusterStock = async (stockId, delta, motif, type) => {
    const mvt = { id: crypto.randomUUID(), stock_id: stockId, delta, motif, type, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    if (isOnline) {
      await supabase.rpc('ajuster_stock', { p_stock_id: stockId, p_delta: delta })
      await supabase.from('mouvements').insert(mvt)
    } else {
      await enqueueOperation('mouvements', 'insert', mvt)
    }
    setStock(p => p.map(s => s.id === stockId ? { ...s, quantite: (s.quantite || 0) + delta } : s))
  }

  return { stock, loading, reload: load, ajusterStock }
}

// ── Agents ────────────────────────────────────────────────
export function useAgents() {
  const { isOnline } = useApp()
  const [agents, setAgents]   = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    if (isOnline) {
      const { data } = await supabase.from('agents').select('*').eq('actif', true).order('nom')
      if (data) setAgents(data)
    } else {
      setAgents(await getCache('cache_agents'))
    }
    setLoading(false)
  }, [isOnline])

  useEffect(() => { load() }, [load])

  const createAgent = async (agent) => {
    const item = { ...agent, id: crypto.randomUUID(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    if (isOnline) {
      const { data, error } = await supabase.from('agents').insert(item).select().single()
      if (!error) setAgents(p => [...p, data])
      return { data, error }
    }
    await enqueueOperation('agents', 'insert', item)
    setAgents(p => [...p, item])
    return { data: item, error: null }
  }

  const updateAgent = async (id, updates) => {
    if (isOnline) {
      const { data, error } = await supabase.from('agents').update({ ...updates, updated_at: new Date().toISOString() }).eq('id', id).select().single()
      if (!error) setAgents(p => p.map(a => a.id === id ? data : a))
      return { data, error }
    }
    await enqueueOperation('agents', 'update', { id, ...updates })
    setAgents(p => p.map(a => a.id === id ? { ...a, ...updates } : a))
    return { error: null }
  }

  return { agents, loading, reload: load, createAgent, updateAgent }
}

// ── Prêts ─────────────────────────────────────────────────
export function usePrets() {
  const { isOnline } = useApp()
  const [prets, setPrets]     = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    if (isOnline) {
      const { data } = await supabase
        .from('prets')
        .select('*, agents(id,nom,prenom,brigade), stock(*, articles(*))')
        .eq('actif', true)
        .order('created_at', { ascending: false })
      if (data) setPrets(data)
    }
    setLoading(false)
  }, [isOnline])

  useEffect(() => { load() }, [load])

  const creerPret = async (agentId, stockId, quantite) => {
    const pret = { id: crypto.randomUUID(), agent_id: agentId, stock_id: stockId, quantite, actif: true, date_pret: new Date().toISOString(), created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    if (isOnline) {
      const { data, error } = await supabase.from('prets').insert(pret).select().single()
      if (!error) {
        await supabase.rpc('ajuster_stock', { p_stock_id: stockId, p_delta: -quantite })
        setPrets(p => [data, ...p])
      }
      return { data, error }
    }
    await enqueueOperation('prets', 'insert', pret)
    await enqueueOperation('stock_delta', 'update', { id: stockId, delta: -quantite })
    setPrets(p => [pret, ...p])
    return { data: pret, error: null }
  }

  const retournerPret = async (pretId, etat, motif) => {
    const updates = { actif: false, date_retour: new Date().toISOString(), etat_retour: etat, motif_retour: motif, updated_at: new Date().toISOString() }
    const pret = prets.find(p => p.id === pretId)
    if (isOnline) {
      const { error } = await supabase.from('prets').update(updates).eq('id', pretId)
      if (!error && pret && etat !== 'rebus') {
        await supabase.rpc('ajuster_stock', { p_stock_id: pret.stock_id, p_delta: pret.quantite })
      }
      if (!error) setPrets(p => p.filter(x => x.id !== pretId))
      return { error }
    }
    await enqueueOperation('prets', 'update', { id: pretId, ...updates })
    setPrets(p => p.filter(x => x.id !== pretId))
    return { error: null }
  }

  return { prets, loading, reload: load, creerPret, retournerPret }
}

// ── Inventaires ───────────────────────────────────────────
export function useInventaires() {
  const { isOnline } = useApp()
  const [inventaires, setInventaires] = useState([])

  const load = useCallback(async () => {
    if (!isOnline) return
    const { data } = await supabase
      .from('inventaires')
      .select('*, lignes_inventaire(*, stock(*, articles(*)))')
      .order('created_at', { ascending: false })
    if (data) setInventaires(data)
  }, [isOnline])

  useEffect(() => { load() }, [load])

  const creerInventaire = async (lignes, note) => {
    const inv = { id: crypto.randomUUID(), note, statut: 'soumis', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
    const lignesData = lignes.map(l => ({ ...l, id: crypto.randomUUID(), inventaire_id: inv.id, created_at: new Date().toISOString() }))
    if (isOnline) {
      await supabase.from('inventaires').insert(inv)
      await supabase.from('lignes_inventaire').insert(lignesData)
    } else {
      await enqueueOperation('inventaires', 'insert', inv)
      for (const l of lignesData) await enqueueOperation('lignes_inventaire', 'insert', l)
    }
    setInventaires(p => [{ ...inv, lignes_inventaire: lignesData }, ...p])
    return inv
  }

  return { inventaires, reload: load, creerInventaire }
}
