import { useState } from 'react'
import { StatusBar } from '../layout/StatusBar'
import MobileAccueil from './MobileAccueil'
import MobileStock from './MobileStock'
import MobileInventaire from './MobileInventaire'
import MobilePrets from './MobilePrets'

const TABS = [
  { id: 'accueil',    label: 'Accueil',    icon: '⌂' },
  { id: 'stock',      label: 'Stock',      icon: '📦' },
  { id: 'inventaire', label: 'Inventaire', icon: '✓' },
  { id: 'prets',      label: 'Agents',     icon: '👤' },
]

export default function MobileLayout() {
  const [tab, setTab] = useState('accueil')
  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#0f0f1a', fontFamily: "'DM Sans', system-ui, sans-serif", maxWidth: 480, margin: '0 auto' }}>
      <StatusBar />
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {tab === 'accueil'    && <MobileAccueil onNavigate={setTab} />}
        {tab === 'stock'      && <MobileStock />}
        {tab === 'inventaire' && <MobileInventaire />}
        {tab === 'prets'      && <MobilePrets />}
      </div>
      <div style={{ display: 'flex', borderTop: '0.5px solid #2a2a45', background: '#1a1a2e', flexShrink: 0 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '8px 4px 10px', background: 'none', border: 'none', cursor: 'pointer', color: tab === t.id ? '#378ADD' : '#6b6b8a' }}>
            <span style={{ fontSize: 20 }}>{t.icon}</span>
            <span style={{ fontSize: 10, fontWeight: tab === t.id ? 600 : 400 }}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
