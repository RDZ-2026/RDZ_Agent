// BureauDashboard.jsx
import { useStock, useAgents, usePrets, useInventaires } from '../../hooks/useStock'

export default function BureauDashboard() {
  const { stock }       = useStock()
  const { agents }      = useAgents()
  const { prets }       = usePrets()
  const { inventaires } = useInventaires()

  const totalStock   = stock.reduce((s, i) => s + (i.quantite || 0), 0)
  const alertes      = stock.filter(s => (s.quantite || 0) <= (s.seuil_alerte || 3))
  const totalPrets   = prets.reduce((s, p) => s + (p.quantite || 0), 0)
  const dernierInv   = inventaires[0]

  const KPI = ({ label, value, sub, color }) => (
    <div style={{ background: '#1a1a2e', borderRadius: 12, padding: '16px 18px', border: '0.5px solid #2a2a45' }}>
      <div style={{ fontSize: 12, color: '#6b6b8a', marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: color || '#fff', marginBottom: 2 }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: '#6b6b8a' }}>{sub}</div>}
    </div>
  )

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 4px' }}>Tableau de bord</h1>
        <p style={{ fontSize: 14, color: '#6b6b8a', margin: 0 }}>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginBottom: 28 }}>
        <KPI label="Articles en stock"  value={totalStock}    sub={`${stock.length} références`} />
        <KPI label="Alertes stock bas"  value={alertes.length} sub="sous le seuil" color={alertes.length ? '#EF9F27' : '#1D9E75'} />
        <KPI label="Articles prêtés"    value={totalPrets}    sub={`${prets.length} prêts actifs`} color="#85B7EB" />
        <KPI label="Agents"             value={agents.length} sub="enregistrés" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div style={{ background: '#1a1a2e', borderRadius: 12, padding: 18, border: '0.5px solid #2a2a45' }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>⚠ Stock bas</div>
          {alertes.length === 0
            ? <div style={{ fontSize: 13, color: '#1D9E75' }}>✓ Tous les stocks sont corrects</div>
            : alertes.map(s => (
              <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '0.5px solid #2a2a45', fontSize: 13 }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{s.articles?.nom}</div>
                  <div style={{ fontSize: 11, color: '#6b6b8a' }}>{s.articles?.categorie} {s.articles?.taille ? `· T.${s.articles.taille}` : ''}</div>
                </div>
                <span style={{ fontWeight: 700, color: s.quantite === 0 ? '#E24B4A' : '#EF9F27' }}>{s.quantite}</span>
              </div>
            ))
          }
        </div>
        <div style={{ background: '#1a1a2e', borderRadius: 12, padding: 18, border: '0.5px solid #2a2a45' }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Prêts récents</div>
          {prets.length === 0
            ? <div style={{ fontSize: 13, color: '#6b6b8a' }}>Aucun prêt actif</div>
            : prets.slice(0, 5).map(p => (
              <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '0.5px solid #2a2a45', fontSize: 13 }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{p.agents?.prenom} {p.agents?.nom}</div>
                  <div style={{ fontSize: 11, color: '#6b6b8a' }}>{p.stock?.articles?.nom} × {p.quantite}</div>
                </div>
                <span style={{ fontSize: 11, color: '#6b6b8a' }}>{new Date(p.date_pret).toLocaleDateString('fr-FR')}</span>
              </div>
            ))
          }
        </div>
        {dernierInv && (
          <div style={{ background: '#1a1a2e', borderRadius: 12, padding: 18, border: '0.5px solid #2a2a45', gridColumn: '1 / -1' }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12 }}>Dernier inventaire</div>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <div><div style={{ fontSize: 12, color: '#6b6b8a' }}>Date</div><div style={{ fontSize: 14, fontWeight: 500 }}>{new Date(dernierInv.created_at).toLocaleDateString('fr-FR')}</div></div>
              <div><div style={{ fontSize: 12, color: '#6b6b8a' }}>Articles</div><div style={{ fontSize: 14, fontWeight: 500 }}>{dernierInv.lignes_inventaire?.length || '—'}</div></div>
              <div><div style={{ fontSize: 12, color: '#6b6b8a' }}>Statut</div><span style={{ fontSize: 12, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: '#E1F5EE', color: '#0F6E56' }}>{dernierInv.statut}</span></div>
              {dernierInv.note && <div style={{ flex: 1 }}><div style={{ fontSize: 12, color: '#6b6b8a' }}>Note</div><div style={{ fontSize: 13 }}>{dernierInv.note}</div></div>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
