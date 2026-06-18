import { useState } from 'react'
import { useStock } from '../../hooks/useStock'

const CATS = ['Tous', 'Polos', 'Pantalons', 'Vestes', 'Patchs', 'Matériel', 'Autre']

export default function MobileStock() {
  const { stock, loading, ajusterStock } = useStock()
  const [cat, setCat]           = useState('Tous')
  const [modal, setModal]       = useState(null)
  const [qty, setQty]           = useState(1)
  const [motif, setMotif]       = useState('achat')
  const [saving, setSaving]     = useState(false)

  const filtered = cat === 'Tous' ? stock : stock.filter(s => s.articles?.categorie === cat)

  const handleEntree = async () => {
    setSaving(true)
    await ajusterStock(modal.id, qty, motif, 'entree')
    setModal(null); setQty(1); setSaving(false)
  }
  const handleRebus = async (s) => {
    if (!window.confirm(`Mettre 1 unité de "${s.articles?.nom}" au rebus ?`)) return
    await ajusterStock(s.id, -1, 'rebus', 'rebus')
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#6b6b8a' }}>Chargement…</div>

  return (
    <div style={{ color: '#fff', fontFamily: "'DM Sans', system-ui, sans-serif", position: 'relative' }}>
      <div style={{ background: '#1a1a2e', borderBottom: '0.5px solid #2a2a45', padding: '14px 16px' }}>
        <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 10 }}>Stock vestiaire</div>
        <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
          {CATS.map(c => (
            <button key={c} onClick={() => setCat(c)} style={{ padding: '5px 12px', borderRadius: 99, fontSize: 12, fontWeight: cat === c ? 600 : 400, border: 'none', cursor: 'pointer', background: cat === c ? '#185FA5' : '#2a2a45', color: cat === c ? '#fff' : '#9090b0', whiteSpace: 'nowrap', flexShrink: 0 }}>{c}</button>
          ))}
        </div>
      </div>

      {filtered.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: '#6b6b8a', fontSize: 14 }}>Aucun article</div>}
      {filtered.map(s => {
        const qty2 = s.quantite || 0
        const alert = qty2 <= (s.seuil_alerte || 3)
        return (
          <div key={s.id} style={{ padding: '12px 16px', borderBottom: '0.5px solid #2a2a45', background: alert ? '#1a0f0044' : 'transparent' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{s.articles?.nom || 'Article'}</span>
                  {alert && <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 99, background: '#FAEEDA', color: '#854F0B', fontWeight: 600 }}>Bas</span>}
                </div>
                <div style={{ fontSize: 11, color: '#6b6b8a' }}>{s.articles?.reference} {s.articles?.taille ? `· T.${s.articles.taille}` : ''}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: alert ? '#EF9F27' : '#fff', lineHeight: 1 }}>{qty2}</div>
                <div style={{ fontSize: 10, color: '#6b6b8a' }}>en stock</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
              <button onClick={() => { setModal(s); setQty(1) }} style={{ flex: 1, padding: 6, background: '#0a1f12', border: '0.5px solid #0F6E56', color: '#9FE1CB', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>↑ Entrée</button>
              <button onClick={() => handleRebus(s)} style={{ flex: 1, padding: 6, background: '#1a0a0a', border: '0.5px solid #A32D2D', color: '#F09595', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>↓ Rebus</button>
            </div>
          </div>
        )
      })}

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'flex-end', zIndex: 50 }} onClick={() => setModal(null)}>
          <div style={{ background: '#1a1a2e', borderRadius: '16px 16px 0 0', padding: '20px 16px', width: '100%', boxSizing: 'border-box' }} onClick={e => e.stopPropagation()}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 4, color: '#fff' }}>Entrée de stock</div>
            <div style={{ fontSize: 13, color: '#6b6b8a', marginBottom: 16 }}>{modal.articles?.nom}</div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, color: '#6b6b8a', display: 'block', marginBottom: 6 }}>Quantité</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button onClick={() => setQty(q => Math.max(1, q - 1))} style={{ width: 36, height: 36, borderRadius: 8, background: '#2a2a45', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>−</button>
                <span style={{ fontSize: 24, fontWeight: 700, flex: 1, textAlign: 'center', color: '#fff' }}>{qty}</span>
                <button onClick={() => setQty(q => q + 1)} style={{ width: 36, height: 36, borderRadius: 8, background: '#2a2a45', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' }}>+</button>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
              {['achat', 'reintegration'].map(m => (
                <button key={m} onClick={() => setMotif(m)} style={{ flex: 1, padding: 8, borderRadius: 8, border: '0.5px solid', borderColor: motif === m ? '#185FA5' : '#2a2a45', background: motif === m ? '#0d2a45' : 'transparent', color: motif === m ? '#85B7EB' : '#6b6b8a', fontSize: 13, cursor: 'pointer' }}>
                  {m === 'achat' ? 'Achat' : 'Réintégration'}
                </button>
              ))}
            </div>
            <button onClick={handleEntree} disabled={saving} style={{ width: '100%', padding: 12, background: '#185FA5', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              {saving ? 'Enregistrement…' : "Confirmer l'entrée"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
