import { useState } from 'react'
import { useApp } from '../../context/AppContext'
import { StatusBar } from '../layout/StatusBar'
import BureauDashboard  from './BureauDashboard'
import BureauStock      from './BureauStock'
import BureauArticles   from './BureauArticles'
import BureauAgents     from './BureauAgents'
import BureauInventaires from './BureauInventaires'
import BureauCommandes  from './BureauCommandes'
import BureauParametres from './BureauParametres'

const NAV = [
  { id: 'dashboard',   label: 'Tableau de bord', icon: '⊞', roles: ['agent','direction'] },
  { id: 'stock',       label: 'Stock',            icon: '📦', roles: ['agent','direction'] },
  { id: 'articles',    label: 'Articles',          icon: '✏', roles: ['agent','direction'] },
  { id: 'agents',      label: 'Agents & prêts',   icon: '👥', roles: ['agent','direction'] },
  { id: 'inventaires', label: 'Inventaires',       icon: '✓', roles: ['agent','direction'] },
  { id: 'commandes',   label: 'Commandes',         icon: '🛒', roles: ['direction'] },
  { id: 'parametres',  label: 'Paramètres',        icon: '⚙', roles: ['direction'] },
]

const PAGES = { dashboard: BureauDashboard, stock: BureauStock, articles: BureauArticles, agents: BureauAgents, inventaires: BureauInventaires, commandes: BureauCommandes, parametres: BureauParametres }

export default function BureauLayout() {
  const { user, role, signOut, ROLES } = useApp()
  const [page, setPage] = useState('dashboard')
  const [open, setOpen] = useState(true)

  const nav   = NAV.filter(n => n.roles.includes(role))
  const Page  = PAGES[page] || BureauDashboard

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0f0f1a', fontFamily: "'DM Sans', system-ui, sans-serif", color: '#fff' }}>
      <StatusBar />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Sidebar */}
        <div style={{ width: open ? 220 : 56, background: '#1a1a2e', borderRight: '0.5px solid #2a2a45', display: 'flex', flexDirection: 'column', transition: 'width 0.2s', flexShrink: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 14px', borderBottom: '0.5px solid #2a2a45', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#185FA5,#534AB7)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0, cursor: 'pointer' }} onClick={() => setOpen(o => !o)}>📦</div>
            {open && <span style={{ fontSize: 15, fontWeight: 700, whiteSpace: 'nowrap' }}>RDZ Stock</span>}
          </div>
          <div style={{ flex: 1, padding: '8px 0', overflowY: 'auto' }}>
            {nav.map(n => (
              <button key={n.id} onClick={() => setPage(n.id)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', background: page === n.id ? '#0d2a45' : 'transparent', border: 'none', cursor: 'pointer', color: page === n.id ? '#85B7EB' : '#6b6b8a', borderLeft: `2px solid ${page === n.id ? '#185FA5' : 'transparent'}`, transition: 'all .15s' }}>
                <span style={{ fontSize: 16, flexShrink: 0 }}>{n.icon}</span>
                {open && <span style={{ fontSize: 13, fontWeight: page === n.id ? 600 : 400, whiteSpace: 'nowrap' }}>{n.label}</span>}
              </button>
            ))}
          </div>
          <div style={{ borderTop: '0.5px solid #2a2a45', padding: '12px 14px' }}>
            {open ? (
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#fff', marginBottom: 1 }}>{user?.user_metadata?.nom || user?.email}</div>
                <div style={{ fontSize: 11, color: '#6b6b8a', marginBottom: 8, textTransform: 'capitalize' }}>{role}</div>
                <button onClick={signOut} style={{ fontSize: 12, color: '#6b6b8a', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>Déconnexion →</button>
              </div>
            ) : (
              <button onClick={signOut} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#6b6b8a' }}>→</button>
            )}
          </div>
        </div>
        {/* Contenu */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>
          <Page />
        </div>
      </div>
    </div>
  )
}
