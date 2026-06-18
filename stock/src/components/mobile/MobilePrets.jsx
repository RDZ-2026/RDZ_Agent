import { useState } from 'react'
import { useAgents, usePrets, useStock } from '../../hooks/useStock'

const ETATS = [
  { id: 'bon',   label: 'Bon état',          color: '#0F6E56', bg: '#E1F5EE' },
  { id: 'use',   label: 'Usé',               color: '#854F0B', bg: '#FAEEDA' },
  { id: 'rebus', label: 'Détérioré → rebus', color: '#A32D2D', bg: '#FCEBEB' },
]
const COLORS = ['#E6F1FB', '#E1F5EE', '#EEEDFE', '#FAEEDA', '#FAECE7']
const ini = (n, p) => ((p?.[0] || '') + (n?.[0] || '')).toUpperCase() || '?'

export default function MobilePrets() {
  const { agents, loading } = useAgents()
  const { prets, creerPret, retournerPret } = usePrets()
  const { stock } = useStock()
  const [mode, setMode]         = useState('list')
  const [step, setStep]         = useState(1)
  const [agent, setAgent]       = useState(null)
  const [qtys, setQtys]         = useState({})
  const [retours, setRetours]   = useState({})
  const [saving, setSaving]     = useState(false)

  const agentPrets = (id) => prets.filter(p => p.agent_id === id)
  const stockDispo = stock.filter(s => (s.quantite || 0) > 0)

  const handlePret = async () => {
    setSaving(true)
    for (const [sid, q] of Object.entries(qtys)) { if (q > 0) await creerPret(agent.id, sid, q) }
    setSaving(false); setMode('list'); setStep(1); setAgent(null); setQtys({})
  }

  const handleRetour = async () => {
    setSaving(true)
    for (const [pid, info] of Object.entries(retours)) { if (info.checked) await retournerPret(pid, info.etat || 'bon', '') }
    setSaving(false); setMode('list'); setRetours({})
  }

  if (loading) return <div style={{ padding: 40, textAlign: 'center', color: '#6b6b8a' }}>Chargement…</div>

  const hdr = (title, sub, back) => (
    <div style={{ background: '#1a1a2e', borderBottom: '0.5px solid #2a2a45', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
      {back && <button onClick={back} style={{ background: 'none', border: 'none', color: '#6b6b8a', fontSize: 20, cursor: 'pointer' }}>←</button>}
      <div>
        <div style={{ fontSize: 16, fontWeight: 600, color: '#fff' }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: '#6b6b8a' }}>{sub}</div>}
      </div>
    </div>
  )

  const agentRow = (a, i, onClick) => (
    <div key={a.id} onClick={onClick} style={{ padding: '12px 16px', borderBottom: '0.5px solid #2a2a45', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
      <div style={{ width: 38, height: 38, borderRadius: '50%', background: COLORS[i % COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#185FA5', flexShrink: 0 }}>{ini(a.nom, a.prenom)}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: '#fff' }}>{a.prenom} {a.nom}</div>
        <div style={{ fontSize: 12, color: '#6b6b8a' }}>{a.brigade || '—'}</div>
      </div>
      <span style={{ fontSize: 12, color: '#6b6b8a' }}>›</span>
    </div>
  )

  // Retour — liste agents
  if (mode === 'retour' && !agent) return (
    <div style={{ color: '#fff', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {hdr('Retour — choisir agent', null, () => setMode('list'))}
      {agents.filter(a => agentPrets(a.id).length > 0).map((a, i) => agentRow(a, i, () => setAgent(a)))}
    </div>
  )

  // Retour — articles de l'agent
  if (mode === 'retour' && agent) {
    const ap = agentPrets(agent.id)
    return (
      <div style={{ color: '#fff', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        {hdr(`Retour — ${agent.prenom} ${agent.nom}`, 'Cocher les articles rendus', () => setAgent(null))}
        {ap.map(p => (
          <div key={p.id}>
            <div onClick={() => setRetours(prev => ({ ...prev, [p.id]: { ...prev[p.id], checked: !prev[p.id]?.checked, etat: prev[p.id]?.etat || 'bon' } }))}
              style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', borderBottom: '0.5px solid #2a2a45' }}>
              <div style={{ width: 22, height: 22, borderRadius: 5, border: `0.5px solid ${retours[p.id]?.checked ? '#185FA5' : '#2a2a45'}`, background: retours[p.id]?.checked ? '#185FA5' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 13, flexShrink: 0 }}>
                {retours[p.id]?.checked ? '✓' : ''}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{p.stock?.articles?.nom || 'Article'} × {p.quantite}</div>
                <div style={{ fontSize: 11, color: '#6b6b8a' }}>Prêté le {new Date(p.date_pret).toLocaleDateString('fr-FR')}</div>
              </div>
            </div>
            {retours[p.id]?.checked && (
              <div style={{ padding: '8px 16px 12px 50px', borderBottom: '0.5px solid #2a2a45' }}>
                <div style={{ fontSize: 12, color: '#6b6b8a', marginBottom: 6 }}>État au retour :</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {ETATS.map(e => (
                    <button key={e.id} onClick={() => setRetours(prev => ({ ...prev, [p.id]: { ...prev[p.id], etat: e.id } }))}
                      style={{ padding: '4px 10px', borderRadius: 99, fontSize: 12, fontWeight: 500, border: '0.5px solid', cursor: 'pointer', borderColor: retours[p.id]?.etat === e.id ? e.color : '#2a2a45', background: retours[p.id]?.etat === e.id ? e.bg : 'transparent', color: retours[p.id]?.etat === e.id ? e.color : '#6b6b8a' }}>
                      {e.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        <div style={{ padding: 16 }}>
          <button onClick={handleRetour} disabled={saving || !Object.values(retours).some(r => r.checked)}
            style={{ width: '100%', padding: 12, background: '#185FA5', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer', opacity: Object.values(retours).some(r => r.checked) ? 1 : 0.5 }}>
            {saving ? 'Enregistrement…' : 'Valider le retour ✓'}
          </button>
        </div>
      </div>
    )
  }

  // Prêt — liste agents
  if (mode === 'pret' && step === 1) return (
    <div style={{ color: '#fff', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {hdr('Nouveau prêt', 'Choisir un agent', () => setMode('list'))}
      {agents.map((a, i) => agentRow(a, i, () => { setAgent(a); setStep(2) }))}
    </div>
  )

  // Prêt — articles
  if (mode === 'pret' && step === 2) return (
    <div style={{ color: '#fff', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {hdr(`${agent?.prenom} ${agent?.nom}`, 'Articles à prêter', () => setStep(1))}
      {stockDispo.map(s => (
        <div key={s.id} style={{ padding: '12px 16px', borderBottom: '0.5px solid #2a2a45', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{s.articles?.nom}</div>
            <div style={{ fontSize: 11, color: '#6b6b8a' }}>{s.articles?.taille ? `T.${s.articles.taille}` : ''} · Dispo: {s.quantite}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={() => setQtys(p => ({ ...p, [s.id]: Math.max(0, (p[s.id] || 0) - 1) }))} style={{ width: 28, height: 28, borderRadius: 6, background: '#2a2a45', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer' }}>−</button>
            <span style={{ fontSize: 15, fontWeight: 600, minWidth: 20, textAlign: 'center' }}>{qtys[s.id] || 0}</span>
            <button onClick={() => setQtys(p => ({ ...p, [s.id]: Math.min(s.quantite, (p[s.id] || 0) + 1) }))} style={{ width: 28, height: 28, borderRadius: 6, background: '#2a2a45', border: 'none', color: '#fff', fontSize: 16, cursor: 'pointer' }}>+</button>
          </div>
        </div>
      ))}
      <div style={{ padding: 16 }}>
        <button onClick={handlePret} disabled={saving || !Object.values(qtys).some(q => q > 0)}
          style={{ width: '100%', padding: 12, background: '#185FA5', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: 'pointer', opacity: Object.values(qtys).some(q => q > 0) ? 1 : 0.5 }}>
          {saving ? 'Enregistrement…' : 'Confirmer le prêt ✓'}
        </button>
      </div>
    </div>
  )

  // Liste agents
  return (
    <div style={{ color: '#fff', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <div style={{ background: '#1a1a2e', borderBottom: '0.5px solid #2a2a45', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontSize: 16, fontWeight: 600 }}>Agents</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { setMode('pret'); setStep(1) }} style={{ padding: '6px 12px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+ Prêt</button>
          <button onClick={() => { setMode('retour'); setAgent(null) }} style={{ padding: '6px 12px', background: '#2a2a45', color: '#9090b0', border: 'none', borderRadius: 7, fontSize: 12, cursor: 'pointer' }}>↩ Retour</button>
        </div>
      </div>
      {agents.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: '#6b6b8a', fontSize: 14 }}>Aucun agent</div>}
      {agents.map((a, i) => {
        const nb = agentPrets(a.id).length
        return (
          <div key={a.id} style={{ padding: '12px 16px', borderBottom: '0.5px solid #2a2a45', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: '50%', background: COLORS[i % COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: '#185FA5', flexShrink: 0 }}>{ini(a.nom, a.prenom)}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{a.prenom} {a.nom}</div>
              <div style={{ fontSize: 12, color: '#6b6b8a' }}>{a.brigade || '—'}</div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 8px', borderRadius: 99, background: nb > 0 ? '#0d2a45' : '#2a2a45', color: nb > 0 ? '#85B7EB' : '#6b6b8a' }}>{nb} art.</span>
          </div>
        )
      })}
    </div>
  )
}
