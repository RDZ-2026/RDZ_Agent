import { useState } from 'react'

export default function BureauParametres() {
  const [saved, setSaved] = useState(false)
  const save = () => { setSaved(true); setTimeout(() => setSaved(false), 2000) }

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 24px' }}>Paramètres</h1>
      <div style={{ maxWidth: 540 }}>
        <div style={{ background: '#1a1a2e', borderRadius: 12, border: '0.5px solid #2a2a45', padding: 20, marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px' }}>Base de données Stock</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#1D9E75' }} />
            <span style={{ fontSize: 13, color: '#9FE1CB' }}>pdewmubikmotqzbxmyeq.supabase.co</span>
          </div>
          <p style={{ fontSize: 12, color: '#6b6b8a', margin: 0 }}>Projet Supabase principal — stock, agents, prêts, inventaires</p>
        </div>
        <div style={{ background: '#1a1a2e', borderRadius: 12, border: '0.5px solid #2a2a45', padding: 20, marginBottom: 16 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px' }}>Liaison module RH</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#1D9E75' }} />
            <span style={{ fontSize: 13, color: '#9FE1CB' }}>trdhtlcenmjlcvzuplid.supabase.co</span>
          </div>
          <p style={{ fontSize: 12, color: '#6b6b8a', margin: '0 0 8px' }}>Lecture seule — vue v_agents_stock uniquement</p>
          <p style={{ fontSize: 12, color: '#6b6b8a', margin: 0 }}>⚠ Aucune donnée sensible (AVS, salaires, permis) n'est accessible depuis RDZ Stock</p>
        </div>
        <div style={{ background: '#1a1a2e', borderRadius: 12, border: '0.5px solid #2a2a45', padding: 20, marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px' }}>Catégories articles</h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {['Polos','Pantalons','Vestes','Patchs','Matériel','Autre'].map(c => (
              <span key={c} style={{ padding: '4px 12px', background: '#2a2a45', borderRadius: 99, fontSize: 12, color: '#9090b0' }}>{c}</span>
            ))}
          </div>
          <p style={{ fontSize: 12, color: '#6b6b8a', margin: '8px 0 0' }}>Catégories personnalisées — prochaine version</p>
        </div>
        <button onClick={save} style={{ padding: '10px 20px', background: saved ? '#0F6E56' : '#185FA5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'background .3s' }}>
          {saved ? '✓ Enregistré' : 'Enregistrer les paramètres'}
        </button>
      </div>
    </div>
  )
}
