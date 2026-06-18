import { createClient } from '@supabase/supabase-js'

// Client principal — Supabase Stock
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { auth: { persistSession: true, autoRefreshToken: true } }
)

// Client RH — lecture seule, vue v_agents_stock uniquement
export const supabaseRH = createClient(
  import.meta.env.VITE_SUPABASE_RH_URL,
  import.meta.env.VITE_SUPABASE_RH_ANON_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
)

export const ROLES = {
  TERRAIN:   'terrain',
  AGENT:     'agent',
  DIRECTION: 'direction'
}

// Synchroniser les agents RH → table agents de Stock
export async function syncAgentsRH() {
  try {
    const { data: agentsRH, error } = await supabaseRH
      .from('v_agents_stock')
      .select('id, nom, prenom, fonction, brigade')
      .order('nom')
    if (error || !agentsRH?.length) return { synced: 0 }

    let synced = 0
    for (const a of agentsRH) {
      const { error: e } = await supabase
        .from('agents')
        .upsert({
          rh_agent_id: a.id,
          nom:         a.nom,
          prenom:      a.prenom,
          brigade:     a.brigade || a.fonction || '',
          updated_at:  new Date().toISOString()
        }, { onConflict: 'rh_agent_id' })
      if (!e) synced++
    }
    return { synced }
  } catch (e) {
    console.warn('Sync RH indisponible:', e.message)
    return { synced: 0 }
  }
}
