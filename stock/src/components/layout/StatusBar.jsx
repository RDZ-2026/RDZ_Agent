import { useApp } from '../../context/AppContext'

export function StatusBar() {
  const { isOnline, pendingCount, conflicts, syncState, forceSync } = useApp()
  if (isOnline && pendingCount === 0 && conflicts.length === 0) return null
  const color  = !isOnline ? '#854F0B' : conflicts.length ? '#A32D2D' : '#0F6E56'
  const dotClr = !isOnline ? '#EF9F27' : conflicts.length ? '#E24B4A' : '#1D9E75'
  const msg    = !isOnline
    ? `Hors-ligne — ${pendingCount} opération${pendingCount > 1 ? 's' : ''} en attente`
    : conflicts.length
    ? `${conflicts.length} conflit${conflicts.length > 1 ? 's' : ''} à résoudre`
    : syncState.syncing ? 'Synchronisation…' : `${pendingCount} opération${pendingCount > 1 ? 's' : ''} à synchroniser`

  return (
    <div style={{ background: !isOnline ? '#1a0f00' : conflicts.length ? '#1a0a0a' : '#0f1a10', borderBottom: `0.5px solid ${color}`, padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, flexShrink: 0 }}>
      <span style={{ width: 7, height: 7, borderRadius: '50%', background: dotClr, flexShrink: 0 }} />
      <span style={{ color: dotClr, flex: 1 }}>{msg}</span>
      {isOnline && !syncState.syncing && pendingCount > 0 && (
        <button onClick={forceSync} style={{ background: 'none', border: `0.5px solid ${color}`, color: dotClr, borderRadius: 4, padding: '2px 8px', fontSize: 11, cursor: 'pointer' }}>Sync</button>
      )}
    </div>
  )
}
