import { useState } from 'react'
import { useAgents, usePrets } from '../../hooks/useStock'

const COLORS = ['#E6F1FB','#E1F5EE','#EEEDFE','#FAEEDA','#FAECE7']
const ini = (n, p) => ((p?.[0]||'')+(n?.[0]||'')).toUpperCase()||'?'

export default function BureauAgents() {
  const { agents, loading, createAgent } = useAgents()
  const { prets } = usePrets()
  const [sel, setSel]       = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [form, setForm]     = useState({ nom:'', prenom:'', brigade:'', email:'' })
  const [saving, setSaving] = useState(false)

  const ap = (id) => prets.filter(p => p.agent_id === id)

  const create = async () => {
    setSaving(true)
    await createAgent(form)
    setSaving(false); setShowNew(false); setForm({ nom:'', prenom:'', brigade:'', email:'' })
  }

  if (loading) return <div style={{ color: '#6b6b8a', padding: 40 }}>Chargement…</div>

  return (
    <div style={{ display: 'grid', gridTemplateColumns: sel ? '300px 1fr' : '1fr', gap: 20 }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Agents</h1>
          <button onClick={() => setShowNew(true)} style={{ padding: '7px 14px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>+ Agent</button>
        </div>
        <div style={{ background: '#1a1a2e', borderRadius: 12, border: '0.5px solid #2a2a45', overflow: 'hidden' }}>
          {agents.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: '#6b6b8a', fontSize: 14 }}>Aucun agent enregistré</div>}
          {agents.map((a, i) => {
            const nb = ap(a.id).length
            const isSel = sel?.id === a.id
            return (
              <div key={a.id} onClick={() => setSel(isSel ? null : a)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: i < agents.length - 1 ? '0.5px solid #2a2a45' : 'none', cursor: 'pointer', background: isSel ? '#0d2a45' : 'transparent', borderLeft: isSel ? '2px solid #185FA5' : '2px solid transparent' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: COLORS[i%COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#185FA5', flexShrink: 0 }}>{ini(a.nom, a.prenom)}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{a.prenom} {a.nom}</div>
                  <div style={{ fontSize: 12, color: '#6b6b8a' }}>{a.brigade || '—'}</div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: nb > 0 ? '#0d2a45' : '#2a2a45', color: nb > 0 ? '#85B7EB' : '#6b6b8a', flexShrink: 0 }}>{nb} art.</span>
              </div>
            )
          })}
        </div>
      </div>

      {sel && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 16px' }}>Fiche — {sel.prenom} {sel.nom}</h2>
          <div style={{ background: '#1a1a2e', borderRadius: 12, border: '0.5px solid #2a2a45', padding: 18, marginBottom: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[['Brigade', sel.brigade],['Email', sel.email],['Créé le', new Date(sel.created_at).toLocaleDateString('fr-FR')]].map(([l,v]) => (
                <div key={l}><div style={{ fontSize: 12, color: '#6b6b8a', marginBottom: 2 }}>{l}</div><div style={{ fontSize: 14 }}>{v || '—'}</div></div>
              ))}
            </div>
          </div>
          <h3 style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px' }}>Dotation actuelle ({ap(sel.id).length})</h3>
          <div style={{ background: '#1a1a2e', borderRadius: 12, border: '0.5px solid #2a2a45', overflow: 'hidden' }}>
            {ap(sel.id).length === 0 && <div style={{ padding: 20, color: '#6b6b8a', fontSize: 13 }}>Aucun article en dotation</div>}
            {ap(sel.id).map((p, i) => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: i < ap(sel.id).length - 1 ? '0.5px solid #2a2a45' : 'none' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{p.stock?.articles?.nom || 'Article'}</div>
                  <div style={{ fontSize: 11, color: '#6b6b8a' }}>Prêté le {new Date(p.date_pret).toLocaleDateString('fr-FR')} · Qté: {p.quantite}</div>
                </div>
                <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 99, background: '#E6F1FB', color: '#185FA5' }}>Actif</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {showNew && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setShowNew(false)}>
          <div style={{ background: '#1a1a2e', borderRadius: 16, padding: 24, width: '100%', maxWidth: 440, border: '0.5px solid #2a2a45' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 20px' }}>Nouvel agent</h2>
            {[['prenom','Prénom *'],['nom','Nom *'],['brigade','Brigade'],['email','Email']].map(([k,l]) => (
              <div key={k} style={{ marginBottom: 12 }}>
                <label style={{ fontSize: 12, color: '#6b6b8a', display: 'block', marginBottom: 4 }}>{l}</label>
                <input value={form[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} style={{ width: '100%', padding: '9px 12px', background: '#0f0f1a', border: '0.5px solid #2a2a45', borderRadius: 8, color: '#fff', fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button onClick={() => setShowNew(false)} style={{ padding: '9px 18px', background: 'none', border: '0.5px solid #2a2a45', color: '#6b6b8a', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>Annuler</button>
              <button onClick={create} disabled={saving || !form.nom || !form.prenom} style={{ padding: '9px 18px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: form.nom && form.prenom ? 1 : 0.5 }}>
                {saving ? 'Création…' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
