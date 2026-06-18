import { useInventaires } from '../../hooks/useStock'

export function BureauInventaires() {
  const { inventaires } = useInventaires()
  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 20px' }}>Inventaires</h1>
      <div style={{ background: '#1a1a2e', borderRadius: 12, border: '0.5px solid #2a2a45', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', padding: '10px 16px', fontSize: 12, color: '#6b6b8a', fontWeight: 600, borderBottom: '0.5px solid #2a2a45' }}>
          <span>Date</span><span>Articles</span><span>Statut</span><span>Note</span>
        </div>
        {inventaires.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: '#6b6b8a', fontSize: 14 }}>Aucun inventaire enregistré</div>}
        {inventaires.map((inv, i) => (
          <div key={inv.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', padding: '11px 16px', borderBottom: i < inventaires.length - 1 ? '0.5px solid #2a2a45' : 'none', alignItems: 'center', fontSize: 13 }}>
            <span>{new Date(inv.created_at).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' })}</span>
            <span style={{ color: '#6b6b8a' }}>{inv.lignes_inventaire?.length || 0}</span>
            <span><span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 11, fontWeight: 600, background: '#E1F5EE', color: '#0F6E56' }}>{inv.statut}</span></span>
            <span style={{ color: '#6b6b8a', fontSize: 12 }}>{inv.note || '—'}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function BureauCommandes() {
  const { useStock } = require('../../hooks/useStock')
  return <div><h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 20px' }}>Bons de commande</h1><p style={{ color: '#6b6b8a' }}>Module en cours de développement.</p></div>
}

export function BureauParametres() {
  const [saved, setSaved] = useState(false)
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }
  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 24px' }}>Paramètres</h1>
      <div style={{ maxWidth: 540 }}>
        <div style={{ background: '#1a1a2e', borderRadius: 12, border: '0.5px solid #2a2a45', padding: 20, marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px' }}>Connexion Supabase Stock</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#1D9E75' }} />
            <span style={{ fontSize: 13, color: '#9FE1CB' }}>pdewmubikmotqzbxmyeq.supabase.co</span>
          </div>
        </div>
        <div style={{ background: '#1a1a2e', borderRadius: 12, border: '0.5px solid #2a2a45', padding: 20, marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px' }}>Connexion Supabase RH (lecture seule)</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#1D9E75' }} />
            <span style={{ fontSize: 13, color: '#9FE1CB' }}>trdhtlcenmjlcvzuplid.supabase.co</span>
          </div>
          <p style={{ fontSize: 12, color: '#6b6b8a', margin: 0 }}>Accès limité à la vue v_agents_stock uniquement</p>
        </div>
        <div style={{ background: '#1a1a2e', borderRadius: 12, border: '0.5px solid #2a2a45', padding: 20, marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px' }}>Catégories articles</h2>
          <p style={{ fontSize: 13, color: '#6b6b8a', margin: 0 }}>Polos · Pantalons · Vestes · Patchs · Matériel · Autre</p>
        </div>
        <button onClick={save} style={{ padding: '10px 20px', background: saved ? '#0F6E56' : '#185FA5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'background .3s' }}>
          {saved ? '✓ Enregistré' : 'Enregistrer'}
        </button>
      </div>
    </div>
  )
}

import { useState } from 'react'
export default BureauInventaires
