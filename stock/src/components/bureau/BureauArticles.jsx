import { useState } from 'react'
import { useArticles } from '../../hooks/useStock'

const CATS = ['Polos','Pantalons','Vestes','Patchs','Matériel','Autre']
const EMPTY = { nom:'', reference:'', categorie:'Polos', taille:'', couleur:'', description:'' }

export default function BureauArticles() {
  const { articles, loading, createArticle, updateArticle, deleteArticle } = useArticles()
  const [editing, setEditing] = useState(null)
  const [form, setForm]       = useState(EMPTY)
  const [saving, setSaving]   = useState(false)
  const [search, setSearch]   = useState('')

  const filtered = articles.filter(a => `${a.nom} ${a.reference}`.toLowerCase().includes(search.toLowerCase()))

  const openNew  = () => { setEditing('new'); setForm(EMPTY) }
  const openEdit = (a) => { setEditing(a); setForm({ nom: a.nom||'', reference: a.reference||'', categorie: a.categorie||'Polos', taille: a.taille||'', couleur: a.couleur||'', description: a.description||'' }) }

  const save = async () => {
    setSaving(true)
    if (editing === 'new') await createArticle(form)
    else await updateArticle(editing.id, form)
    setSaving(false); setEditing(null)
  }

  const del = async (a) => {
    if (!window.confirm(`Supprimer "${a.nom}" ?`)) return
    await deleteArticle(a.id)
  }

  if (loading) return <div style={{ color: '#6b6b8a', padding: 40 }}>Chargement…</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>Catalogue articles</h1>
        <button onClick={openNew} style={{ padding: '8px 16px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>+ Nouvel article</button>
      </div>
      <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…" style={{ width: '100%', padding: '10px 14px', background: '#1a1a2e', border: '0.5px solid #2a2a45', borderRadius: 8, color: '#fff', fontSize: 14, boxSizing: 'border-box', marginBottom: 16, outline: 'none' }} />
      <div style={{ background: '#1a1a2e', borderRadius: 12, border: '0.5px solid #2a2a45', overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', padding: '10px 16px', fontSize: 12, color: '#6b6b8a', fontWeight: 600, borderBottom: '0.5px solid #2a2a45' }}>
          <span>Nom</span><span>Référence</span><span>Catégorie</span><span>Taille</span><span>Couleur</span><span></span>
        </div>
        {filtered.length === 0 && <div style={{ padding: 32, textAlign: 'center', color: '#6b6b8a' }}>Aucun article</div>}
        {filtered.map((a, i) => (
          <div key={a.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', padding: '11px 16px', borderBottom: i < filtered.length - 1 ? '0.5px solid #2a2a45' : 'none', alignItems: 'center', fontSize: 13 }}>
            <span style={{ fontWeight: 500 }}>{a.nom}</span>
            <span style={{ color: '#6b6b8a', fontFamily: 'monospace', fontSize: 12 }}>{a.reference}</span>
            <span><span style={{ background: '#2a2a45', padding: '2px 8px', borderRadius: 99, fontSize: 11 }}>{a.categorie}</span></span>
            <span style={{ color: '#6b6b8a' }}>{a.taille || '—'}</span>
            <span style={{ color: '#6b6b8a' }}>{a.couleur || '—'}</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => openEdit(a)} style={{ padding: '4px 10px', background: 'none', border: '0.5px solid #2a2a45', color: '#6b6b8a', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Modifier</button>
              <button onClick={() => del(a)} style={{ padding: '4px 10px', background: 'none', border: '0.5px solid #A32D2D', color: '#f09595', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>Suppr.</button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }} onClick={() => setEditing(null)}>
          <div style={{ background: '#1a1a2e', borderRadius: 16, padding: 24, width: '100%', maxWidth: 480, border: '0.5px solid #2a2a45' }} onClick={e => e.stopPropagation()}>
            <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 20px' }}>{editing === 'new' ? 'Nouvel article' : 'Modifier'}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              {[['nom','Nom *',true],['reference','Référence',false],['taille','Taille',false],['couleur','Couleur',false]].map(([k, l, full]) => (
                <div key={k} style={{ gridColumn: full ? '1 / -1' : undefined }}>
                  <label style={{ fontSize: 12, color: '#6b6b8a', display: 'block', marginBottom: 4 }}>{l}</label>
                  <input value={form[k]} onChange={e => setForm(p => ({ ...p, [k]: e.target.value }))} style={{ width: '100%', padding: '9px 12px', background: '#0f0f1a', border: '0.5px solid #2a2a45', borderRadius: 8, color: '#fff', fontSize: 13, boxSizing: 'border-box', outline: 'none' }} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: 12, color: '#6b6b8a', display: 'block', marginBottom: 4 }}>Catégorie</label>
                <select value={form.categorie} onChange={e => setForm(p => ({ ...p, categorie: e.target.value }))} style={{ width: '100%', padding: '9px 12px', background: '#0f0f1a', border: '0.5px solid #2a2a45', borderRadius: 8, color: '#fff', fontSize: 13 }}>
                  {CATS.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: '#6b6b8a', display: 'block', marginBottom: 4 }}>Description</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} style={{ width: '100%', padding: '9px 12px', background: '#0f0f1a', border: '0.5px solid #2a2a45', borderRadius: 8, color: '#fff', fontSize: 13, boxSizing: 'border-box', resize: 'none', outline: 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setEditing(null)} style={{ padding: '9px 18px', background: 'none', border: '0.5px solid #2a2a45', color: '#6b6b8a', borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>Annuler</button>
              <button onClick={save} disabled={saving || !form.nom} style={{ padding: '9px 18px', background: '#185FA5', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', opacity: form.nom ? 1 : 0.5 }}>
                {saving ? 'Enregistrement…' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
