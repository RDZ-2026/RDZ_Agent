import { useState } from 'react'
import { useStock } from '../../hooks/useStock'

export default function BureauStock() {
  const { stock, loading, ajusterStock } = useStock()
  const [search, setSearch] = useState('')

  const filtered = stock.filter(s => `${s.articles?.nom} ${s.articles?.reference}`.toLowerCase().includes(search.toLowerCase()))
  const total    = stock.reduce((s, i) => s + (i.quantite || 0), 0)
  const alertes  = stock.filter(s => (s.quantite || 0) <= (s.seuil_alerte || 3)).length

  if (loading) return <div style={{ color: '#6b6b8a', padding: 40 }}>Chargement…</div>

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Stock vestiaire</h1>
        <p style={{ fontSize: 13, color: '#6b6b8a', margin: 0 }}>{total} articles · {alertes} alerte{alertes !== 1 ? 's' : ''}</p>
      </div>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…" style={{ width: '100%', padding: '10px 14px', background: '#1a1a2e', border: '0.5px solid #2a2a45', borderRadius: 8, color: '#fff', fontSize: 14, boxSizing: 'border-box', marginBottom: 16, outline: 'none' }} />
      <div style={{ background: '#1a1a2e', borderRadius: 12, border: '0.5px solid #2a2a45', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', padding: '10px 16px', fontSize: 12, color: '#6b6b8a', fontWeight: 600, borderBottom: '0.5px solid #2a2a45' }}>
          <span>Article</span><span>Catégorie</span><span>Taille</span><span>Quantité</span><span>Seuil</span><span>Actions</span>
        </div>
        {filtered.map((s, i) => {
          const q = s.quantite || 0
          const alert = q <= (s.seuil_alerte || 3)
          return (
            <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', padding: '11px 16px', borderBottom: i < filtered.length - 1 ? '0.5px solid #2a2a45' : 'none', alignItems: 'center', fontSize: 13, background: alert ? '#1a0f0033' : 'transparent' }}>
              <span style={{ fontWeight: 500 }}>{s.articles?.nom}</span>
              <span style={{ color: '#6b6b8a' }}>{s.articles?.categorie}</span>
              <span style={{ color: '#6b6b8a' }}>{s.articles?.taille || '—'}</span>
              <span style={{ fontWeight: 700, color: alert ? '#EF9F27' : '#fff' }}>{q} {alert && '⚠'}</span>
              <span style={{ color: '#6b6b8a' }}>{s.seuil_alerte || 3}</span>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => ajusterStock(s.id, 1, 'entree_manuelle', 'entree')} style={{ padding: '3px 8px', background: '#0a1f12', border: '0.5px solid #0F6E56', color: '#9FE1CB', borderRadius: 5, fontSize: 11, cursor: 'pointer' }}>+1</button>
                <button onClick={() => q > 0 && ajusterStock(s.id, -1, 'sortie_manuelle', 'sortie')} style={{ padding: '3px 8px', background: '#1a0a0a', border: '0.5px solid #A32D2D', color: '#F09595', borderRadius: 5, fontSize: 11, cursor: 'pointer' }}>−1</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
