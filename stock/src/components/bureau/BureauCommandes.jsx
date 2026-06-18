import { useState } from 'react'
import { useStock } from '../../hooks/useStock'

export default function BureauCommandes() {
  const { stock } = useStock()
  const alertes   = stock.filter(s => (s.quantite || 0) <= (s.seuil_alerte || 3))
  const [lignes, setLignes] = useState(() =>
    alertes.map(s => ({
      stock_id: s.id,
      nom: s.articles?.nom,
      reference: s.articles?.reference,
      qty_actuelle: s.quantite || 0,
      qty_commander: Math.max(1, (s.seuil_alerte || 3) * 3 - (s.quantite || 0))
    }))
  )

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Bon de commande</h1>
        <button onClick={() => window.print()} style={{ padding: '8px 16px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Imprimer / Exporter</button>
      </div>
      {lignes.length === 0 ? (
        <div style={{ background: '#1a1a2e', borderRadius: 12, border: '0.5px solid #2a2a45', padding: 32, textAlign: 'center', color: '#1D9E75', fontSize: 14 }}>
          ✓ Aucun article à commander
        </div>
      ) : (
        <div style={{ background: '#1a1a2e', borderRadius: 12, border: '0.5px solid #2a2a45', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '10px 16px', fontSize: 12, color: '#6b6b8a', fontWeight: 600, borderBottom: '0.5px solid #2a2a45' }}>
            <span>Article</span><span>Référence</span><span>Stock actuel</span><span>À commander</span>
          </div>
          {lignes.map((l, i) => (
            <div key={l.stock_id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '11px 16px', borderBottom: i < lignes.length - 1 ? '0.5px solid #2a2a45' : 'none', alignItems: 'center', fontSize: 13 }}>
              <span style={{ fontWeight: 500 }}>{l.nom}</span>
              <span style={{ color: '#6b6b8a', fontFamily: 'monospace', fontSize: 12 }}>{l.reference}</span>
              <span style={{ color: '#EF9F27', fontWeight: 600 }}>{l.qty_actuelle}</span>
              <input type="number" value={l.qty_commander} min={1}
                onChange={e => setLignes(p => p.map((x, j) => j === i ? { ...x, qty_commander: parseInt(e.target.value) || 1 } : x))}
                style={{ width: 70, padding: '4px 8px', background: '#0f0f1a', border: '0.5px solid #2a2a45', borderRadius: 6, color: '#fff', fontSize: 13, outline: 'none' }} />
            </div>
          ))}
          <div style={{ padding: '12px 16px', borderTop: '0.5px solid #2a2a45', display: 'flex', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: 13, color: '#6b6b8a' }}>Total : <strong style={{ color: '#fff' }}>{lignes.reduce((s, l) => s + l.qty_commander, 0)}</strong> articles</span>
          </div>
        </div>
      )}
    </div>
  )
}
