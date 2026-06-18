import { useApp } from './context/AppContext'
import Login from './pages/Login'
import MobileLayout from './components/mobile/MobileLayout'
import BureauLayout from './components/bureau/BureauLayout'

export default function App() {
  const { user, role, loading, ROLES } = useApp()

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', color: '#6b6b8a', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>📦</div>
        <div style={{ fontSize: 14 }}>Chargement RDZ Stock…</div>
      </div>
    </div>
  )

  if (!user) return <Login />
  if (role === ROLES.TERRAIN) return <MobileLayout />
  return <BureauLayout />
}
