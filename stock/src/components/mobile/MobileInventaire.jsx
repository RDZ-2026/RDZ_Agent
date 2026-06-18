import { useState } from 'react'
import { useStock, useInventaires } from '../../hooks/useStock'

export default function MobileInventaire() {
  const { stock, loading } = useStock()
  const { creerInventaire } = useInventaires()
  const [step, setStep]     = useState(1)
  const [comptes, setComptes] = useState({})
  const [note, setNote]     = useState('')
  const [saving, setSaving] = useState(false)

  const ecart = (s) => comptes[s.id] !== undefined ? comptes[s.id] - (s.quantite || 0) : null
  const avecEcart = stock.filter(s => comptes[s.id] !== undefined && ecart(s) !== 0)
  const conformes = stock.filter(s => comptes[s.id] !== undefined && ecart(s) === 0)

  const submit = async () => {
    setSaving(true)
    const lignes = stock.filter(s => comptes[s.id] !== undefined).map(s => ({
      stock_id: s.id, quantite_theorique: s.quantite || 0, quantite_comptee: comptes[s.id], ecart: ecart(s)
    }))
    await creerInventaire(lignes, note)
    setSaving(false); setStep(3)
  }

  const reset = () => { setStep(1); setComptes({}); setNote('') }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#6b6b8a' }}>Chargement…</div>

  return (
    <div style={{ color: '#fff', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div style={{ background: '#1a1a2e', borderBottom: '0.5px solid #2a2a45', padding: '14px 16px' }}>
        <div style={{ fontSize: 16, fontWeight: 600 }}>Inventaire vestiaire</div>
        <div style={{ fontSize: 12, color: '#6b6b8a', marginTop: 2 }}>{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 12 }}>
          {[1, 2, 3].map(s => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 24, height: 24, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, background: step > s ? '#1D9E75' : step === s ? '#185FA5' : '#2a2a45', color: step > s ? '#E1F5EE' : '#fff' }}>{step > s ? '✓' : s}</div>
              {s < 3 && <div style={{ width: 20, height: 0.5, background: '#2a2a45' }} />}
            </div>
          ))}
          <span style={{ fontSize: 11, color: '#6b6b8a', marginLeft: 4 }}>{['', 'Saisie', 'Récapitulatif', 'Confirmé'][step]}</span>
        </div>
      </div>

      {step === 1 && (
        <div style={{ paddingBottom: 80 }}>
          <div style={{ padding: '10px 16px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 12, color: '#6b6b8a' }}>Théorique / Saisi / Écart</span>
            <span style={{ fontSize: 12, color: '#6b6b8a' }}>{Object.keys(comptes).length}/{stock.length}</span>
          </div>
          {stock.map(s => {
            const e = ecart(s)
            const saisi = comptes[s.id] ?? s.quantite ?? 0
            return (
              <div key={s.id} style={{ borderBottom: '0.5px solid #2a2a45', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{s.articles?.nom || 'Article'}</div>
                  <div style={{ fontSize: 11, color: '#6b6b8a' }}>{s.articles?.reference} · Théo: {s.quantite ?? 0}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => setComptes(p => ({ ...p, [s.id]: Math.max(0, (p[s.id] ?? s.quantite ?? 0) - 1) }))} style={{ width: 30, height: 30, borderRadius: 6, background: '#2a2a45', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer' }}>−</button>
                  <span style={{ fontSize: 16, fontWeight: 600, minWidth: 24, textAlign: 'center' }}>{saisi}</span>
                  <button onClick={() => setComptes(p => ({ ...p, [s.id]: (p[s.id] ?? s.quantite ?? 0) + 1 }))} style={{ width: 30, height: 30, borderRadius: 6, background: '#2a2a45', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer' }}>+</button>
                </div>
                <div style={{ minWidth: 36, textAlign: 'center' }}>
                  {comptes[s.id] !== undefined && (
                    <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 6px', borderRadius: 99, background: e === 0 ? '#E1F5EE' : e < 0 ? '#FCEBEB' : '#EAF3DE', color: e === 0 ? '#0F6E56' : e < 0 ? '#A32D2D' : '#3B6D11' }}>
                      {e === 0 ? '=' : e > 0 ? '+' + e : e}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
          <div style={{ padding: 16, position: 'sticky', bottom: 0, background: '#0f0f1a', borderTop: '0.5px solid #2a2a45' }}>
            <button onClick={() => setStep(2)} style={{ width: '100%', padding: 12, background: '#185FA5', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Voir le récapitulatif →</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div style={{ padding: 16 }}>
          <div style={{ background: '#1a1a2e', borderRadius: 10, padding: '12px 16px', marginBottom: 16 }}>
            {[
              { l: 'Articles contrôlés', v: Object.keys(comptes).length, c: '#fff' },
              { l: 'Sans écart', v: conformes.length, c: '#1D9E75' },
              { l: 'Avec écart', v: avecEcart.length, c: avecEcart.length ? '#E24B4A' : '#1D9E75' },
              { l: 'Taux de conformité', v: Object.keys(comptes).length ? Math.round(conformes.length / Object.keys(comptes).length * 100) + '%' : '—', c: '#fff' },
            ].map(r => (
              <div key={r.l} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b6b8a', padding: '4px 0' }}>
                <span>{r.l}</span><span style={{ fontWeight: 600, color: r.c }}>{r.v}</span>
              </div>
            ))}
          </div>
          {avecEcart.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Écarts détectés</div>
              {avecEcart.map(s => {
                const e = ecart(s)
                return (
                  <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '0.5px solid #2a2a45' }}>
                    <div style={{ width: 28, height: 28, borderRadius: 6, background: e < 0 ? '#FCEBEB' : '#EAF3DE', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{e < 0 ? '↓' : '↑'}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500 }}>{s.articles?.nom}</div>
                      <div style={{ fontSize: 11, color: '#6b6b8a' }}>Théo: {s.quantite ?? 0} · Compté: {comptes[s.id]}</div>
                    </div>
                    <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: e < 0 ? '#FCEBEB' : '#EAF3DE', color: e < 0 ? '#A32D2D' : '#3B6D11' }}>{e > 0 ? '+' : ''}{e}</span>
                  </div>
                )
              })}
            </div>
          )}
          <label style={{ fontSize: 13, color: '#6b6b8a', display: 'block', marginBottom: 6 }}>Note</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} placeholder="Observations…" style={{ width: '100%', background: '#1a1a2e', border: '0.5px solid #2a2a45', borderRadius: 8, color: '#fff', fontSize: 13, padding: '8px 12px', boxSizing: 'border-box', resize: 'none', marginBottom: 16 }} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setStep(1)} style={{ flex: 1, padding: 12, background: 'none', color: '#6b6b8a', border: '0.5px solid #2a2a45', borderRadius: 10, fontSize: 14, cursor: 'pointer' }}>← Modifier</button>
            <button onClick={submit} disabled={saving} style={{ flex: 2, padding: 12, background: '#185FA5', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
              {saving ? 'Envoi…' : 'Soumettre ✓'}
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div style={{ padding: '40px 24px', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#E1F5EE', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, margin: '0 auto 16px' }}>✓</div>
          <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Inventaire enregistré</div>
          <div style={{ fontSize: 13, color: '#6b6b8a', marginBottom: 24 }}>Disponible sur le bureau pour traitement des écarts</div>
          <button onClick={reset} style={{ width: '100%', padding: 12, background: '#185FA5', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>Nouvel inventaire</button>
        </div>
      )}
    </div>
  )
}
