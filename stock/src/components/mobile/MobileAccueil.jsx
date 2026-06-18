import { useApp } from '../../context/AppContext'
import { useStock } from '../../hooks/useStock'

const ACTIONS = [
  { id: 'inventaire', label: 'Faire un inventaire',  desc: 'Contrôle article par article', icon: '✓',  bg: '#E1F5EE', color: '#0F6E56' },
  { id: 'prets',      label: 'Prêt à un agent',       desc: 'Attribuer vêtements / matériel', icon: '👤', bg: '#E6F1FB', color: '#185FA5' },
  { id: 'prets',      label: 'Retour agent',           desc: 'Retour + état à la réception',   icon: '↩', bg: '#FAEEDA', color: '#854F0B' },
  { id: 'stock',      label: 'Entrée de stock',        desc: 'Achat ou réintégration',         icon: '↑', bg: '#EAF3DE', color: '#3B6D11' },
]

export default function MobileAccueil({ onNavigate }) {
  const { user, isOnline, pendingCount } = useApp()
  const { stock } = useStock()
  const alertes = stock.filter(s => (s.quantite || 0) <= (s.seuil_alerte || 3))
  const h = new Date().getHours()
  const salut = h < 12 ? 'Bonjour' : h < 18 ? 'Bon après-midi' : 'Bonsoir'
  const prenom = (user?.user_metadata?.nom || 'Agent').split(' ')[0]

  return (
    <div style={{ padding: '20px 16px', color: '#fff' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 2 }}>{salut}, {prenom} 👋</div>
        <div style={{ fontSize: 13, color: '#6b6b8a' }}>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
      </div>

      <div style={{ background: '#1a1a2e', border: `0.5px solid ${isOnline ? '#0F6E56' : '#854F0B'}`, borderRadius: 10, padding: '10px 14px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: isOnline ? '#1D9E75' : '#EF9F27', flexShrink: 0 }} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: isOnline ? '#9FE1CB' : '#FAC775' }}>
            {isOnline ? 'En ligne — données synchronisées' : 'Hors-ligne — saisie locale active'}
          </div>
          {pendingCount > 0 && <div style={{ fontSize: 12, color: '#6b6b8a', marginTop: 2 }}>{pendingCount} opération{pendingCount > 1 ? 's' : ''} en attente</div>}
        </div>
      </div>

      {alertes.length > 0 && (
        <div style={{ background: '#1a0f00', border: '0.5px solid #854F0B', borderRadius: 10, padding: '10px 14px', marginBottom: 20 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#FAC775', marginBottom: 6 }}>⚠ {alertes.length} article{alertes.length > 1 ? 's' : ''} en stock bas</div>
          {alertes.slice(0, 3).map(s => (
            <div key={s.id} style={{ fontSize: 12, color: '#EF9F27', display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
              <span>{s.articles?.nom || 'Article'}</span>
              <span style={{ fontWeight: 600 }}>{s.quantite} restant{s.quantite > 1 ? 's' : ''}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ fontSize: 12, fontWeight: 600, color: '#6b6b8a', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Actions rapides</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {ACTIONS.map((a, i) => (
          <button key={i} onClick={() => onNavigate(a.id)} style={{ background: '#1a1a2e', border: '0.5px solid #2a2a45', borderRadius: 12, padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', width: '100%' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{a.icon}</div>
            <div>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: 14, marginBottom: 1 }}>{a.label}</div>
              <div style={{ color: '#6b6b8a', fontSize: 12 }}>{a.desc}</div>
            </div>
            <span style={{ marginLeft: 'auto', color: '#6b6b8a', fontSize: 18 }}>›</span>
          </button>
        ))}
      </div>
    </div>
  )
}
