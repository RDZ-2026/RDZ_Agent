import { useState } from 'react'
import { useApp } from '../context/AppContext'

const S = {
  wrap:   { minHeight: '100vh', background: '#0f0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', fontFamily: "'DM Sans', system-ui, sans-serif" },
  box:    { width: '100%', maxWidth: 400 },
  logo:   { textAlign: 'center', marginBottom: '2.5rem' },
  card:   { background: '#1a1a2e', borderRadius: 16, border: '0.5px solid #2a2a45', padding: '1.75rem' },
  label:  { display: 'block', fontSize: 13, color: '#9090b0', marginBottom: 6 },
  input:  { width: '100%', padding: '10px 14px', background: '#0f0f1a', border: '0.5px solid #2a2a45', borderRadius: 8, color: '#fff', fontSize: 14, boxSizing: 'border-box', marginBottom: 12, outline: 'none' },
  btn:    { width: '100%', padding: 11, background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' },
  err:    { color: '#f09595', fontSize: 13, padding: '8px 12px', background: '#2a1515', borderRadius: 8, marginBottom: 12 },
  ghost:  { background: 'none', border: 'none', color: '#6b6b8a', fontSize: 13, cursor: 'pointer', textDecoration: 'underline', display: 'block', margin: '14px auto 0', textAlign: 'center' },
}

const DEMOS = [
  { id: 'terrain',   label: '📱 Mobile terrain',   desc: 'Inventaires · Prêts · Retours',           color: '#185FA5', bg: '#E6F1FB' },
  { id: 'agent',     label: '🖥 Bureau agents',      desc: 'Gestion vestiaire · Catalogue · Rapports', color: '#0F6E56', bg: '#E1F5EE' },
  { id: 'direction', label: '👑 Direction',          desc: 'Accès complet · Tableau de bord',          color: '#534AB7', bg: '#EEEDFE' },
]

export default function Login() {
  const { signIn, setDemoRole } = useApp()
  const [email, setEmail]       = useState('')
  const [pwd, setPwd]           = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const [demo, setDemo]         = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await signIn(email, pwd)
    if (error) setError(error.message)
    setLoading(false)
  }

  return (
    <div style={S.wrap}>
      <div style={S.box}>
        <div style={S.logo}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ width: 44, height: 44, background: 'linear-gradient(135deg,#185FA5,#534AB7)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>📦</div>
            <span style={{ fontSize: 26, fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>RDZ Stock</span>
          </div>
          <div style={{ fontSize: 13, color: '#6b6b8a' }}>Gestion de stock et vestiaire</div>
        </div>

        {!demo ? (
          <div style={S.card}>
            <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 600, margin: '0 0 1.5rem', textAlign: 'center' }}>Connexion</h2>
            <form onSubmit={handleLogin}>
              <label style={S.label}>Email</label>
              <input style={S.input} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="votre@email.fr" required />
              <label style={S.label}>Mot de passe</label>
              <input style={S.input} type="password" value={pwd} onChange={e => setPwd(e.target.value)} placeholder="••••••••" required />
              {error && <div style={S.err}>{error}</div>}
              <button style={{ ...S.btn, opacity: loading ? 0.7 : 1 }} type="submit" disabled={loading}>
                {loading ? 'Connexion…' : 'Se connecter'}
              </button>
            </form>
            <button style={S.ghost} onClick={() => setDemo(true)}>Mode démonstration →</button>
          </div>
        ) : (
          <div>
            <h2 style={{ color: '#fff', fontSize: 17, fontWeight: 600, textAlign: 'center', margin: '0 0 1rem' }}>Choisir un profil de démo</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {DEMOS.map(d => (
                <button key={d.id} onClick={() => setDemoRole(d.id)}
                  style={{ background: '#1a1a2e', border: '0.5px solid #2a2a45', borderRadius: 12, padding: '1rem 1.25rem', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 10, background: d.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{d.label.split(' ')[0]}</div>
                  <div>
                    <div style={{ color: '#fff', fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{d.label.slice(3)}</div>
                    <div style={{ color: '#6b6b8a', fontSize: 12 }}>{d.desc}</div>
                  </div>
                </button>
              ))}
            </div>
            <button style={S.ghost} onClick={() => setDemo(false)}>← Retour connexion</button>
          </div>
        )}
      </div>
    </div>
  )
}
