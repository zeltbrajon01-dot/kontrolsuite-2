import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  EnvelopeIcon, ChatBubbleLeftRightIcon, ClockIcon,
  PlusIcon, PaperAirplaneIcon, TrashIcon,
  ChatBubbleLeftEllipsisIcon, XMarkIcon, PencilIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '../contexts/AuthContext'
import supabase from '../lib/supabase'
import DynamicTable from '../components/ui/DynamicTable'
import Tabs from '../components/ui/Tabs'
import Button from '../components/ui/Button'

/*
 * Required Supabase tables:
 *   campanas (id uuid PK, empresa_id uuid, asunto text, cuerpo text,
 *             destinatarios text, tipo text DEFAULT 'email',
 *             estado text DEFAULT 'borrador', enviada_en timestamptz,
 *             extras jsonb DEFAULT '{}', created_at timestamptz)
 *   plantillas_email (id uuid PK, empresa_id uuid, nombre text, asunto text,
 *                     cuerpo text, categoria text,
 *                     extras jsonb DEFAULT '{}', created_at timestamptz)
 *   tabla_config ...
 *
 * Note: Email sending requires a backend endpoint with Resend SDK.
 *       Configure REACT_APP_SEND_ENDPOINT in .env to point to your
 *       Supabase Edge Function or API route.
 *       WhatsApp links use wa.me deep links (no API key required).
 */

const TABS = [
  { id: 'campanas',   label: 'Campañas Email', icon: EnvelopeIcon                    },
  { id: 'chat',       label: 'Chat Interno',   icon: ChatBubbleLeftEllipsisIcon      },
  { id: 'whatsapp',   label: 'WhatsApp',       icon: ChatBubbleLeftRightIcon         },
  { id: 'historial',  label: 'Historial',      icon: ClockIcon                       },
]

const HISTORIAL_COLS = [
  { key: 'titulo',    label: 'Asunto',   type: 'text', editable: false, width: '240px', builtin: true },
  { key: 'tipo',      label: 'Tipo',     type: 'text', editable: false, width: '100px', builtin: true },
  { key: 'fecha',     label: 'Fecha',    type: 'date', editable: false, width: '130px', builtin: true },
  { key: 'contenido', label: 'Mensaje',  type: 'text', editable: false, width: '300px', builtin: true },
]

// ── Email campaign composer ───────────────────────────────────────
function CampanasTab({ empresaId, perfil }) {
  const [campanas,    setCampanas]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [composing,   setComposing]   = useState(false)
  const [sending,     setSending]     = useState(null)
  const [saveError,   setSaveError]   = useState(null)
  const [draft, setDraft] = useState({ titulo: '', contenido: '', destinatarios: '' })

  useEffect(() => {
    if (!empresaId) return
    supabase.from('comunicados').select('*').eq('empresa_id', empresaId)
      .order('created_at', { ascending: false })
      .then(({ data }) => { setCampanas(data || []); setLoading(false) })
  }, [empresaId])

  const saveDraft = async () => {
    if (!empresaId) { setSaveError('empresa_id es null — usuario sin empresa activa'); return }
    setSaveError(null)
    const { titulo, contenido, destinatarios } = draft
    const { data, error: err } = await supabase.from('comunicados').insert({
      titulo, contenido, empresa_id: empresaId, tipo: 'email',
      fecha: new Date().toISOString().split('T')[0],
      extras: { destinatarios },
    }).select().single()
    if (err) { setSaveError(err.message || err.details || JSON.stringify(err)); return }
    if (data) setCampanas(prev => [data, ...prev])
    setDraft({ titulo: '', contenido: '', destinatarios: '' })
    setComposing(false)
  }

  const sendCampana = async (campana) => {
    setSending(campana.id)
    const endpoint = process.env.REACT_APP_SEND_ENDPOINT
    const destinatarios = campana.extras?.destinatarios || ''
    if (endpoint) {
      try {
        await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            from:    'noreply@kontrolsuite.com',
            to:      destinatarios.split(',').map(e => e.trim()).filter(Boolean),
            subject: campana.titulo,
            html:    campana.contenido,
          }),
        })
      } catch (err) {
        console.error('Send error:', err)
      }
    }
    // Mark as sent inside extras (no estado/enviada_en columns in comunicados schema)
    const now = new Date().toISOString()
    const newExtras = { ...(campana.extras || {}), estado: 'enviada', enviada_en: now }
    await supabase.from('comunicados').update({ extras: newExtras }).eq('id', campana.id)
    setCampanas(prev => prev.map(c => c.id === campana.id ? { ...c, extras: newExtras } : c))
    setSending(null)
  }

  const deleteCampana = async (id) => {
    await supabase.from('comunicados').delete().eq('id', id)
    setCampanas(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Compose */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button onClick={() => setComposing(v => !v)}>
          <PlusIcon style={{ width: '.9rem', height: '.9rem' }} />
          Nueva campaña
        </Button>
      </div>

      {composing && (
        <div className="card animate-fadeIn" style={{ padding: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1.25rem', fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>
            Nueva campaña de email
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.875rem', maxWidth: 600 }}>
            <div>
              <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '.3rem' }}>Destinatarios (separados por coma)</label>
              <input className="input-themed" style={{ width: '100%' }} placeholder="email1@empresa.com, email2@empresa.com" value={draft.destinatarios} onChange={e => setDraft(d => ({ ...d, destinatarios: e.target.value }))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '.3rem' }}>Asunto</label>
              <input className="input-themed" style={{ width: '100%' }} placeholder="Asunto del mensaje" value={draft.titulo} onChange={e => setDraft(d => ({ ...d, titulo: e.target.value }))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '.3rem' }}>Mensaje</label>
              <textarea
                className="input-themed"
                style={{ width: '100%', minHeight: 160, resize: 'vertical' }}
                placeholder="Escribe el cuerpo del email aquí…"
                value={draft.contenido}
                onChange={e => setDraft(d => ({ ...d, contenido: e.target.value }))}
              />
            </div>
            {saveError && (
              <div style={{ padding: '.6rem .75rem', background: 'rgba(239,68,68,.08)', border: '1px solid var(--danger)', borderRadius: '.4rem', fontSize: '.8rem', color: 'var(--danger)', fontFamily: 'monospace', wordBreak: 'break-word' }}>
                Error: {saveError}
              </div>
            )}
            <div style={{ display: 'flex', gap: '.75rem' }}>
              <Button onClick={saveDraft} disabled={!draft.titulo || !draft.destinatarios}>
                Guardar borrador
              </Button>
              <button className="btn-ghost" onClick={() => setComposing(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Campaign list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}><span className="spinner" /></div>
      ) : campanas.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Sin campañas. Crea una nueva campaña de email.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          {campanas.map(c => (
            <div key={c.id} className="card animate-fadeIn" style={{ padding: '1rem 1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '.75rem' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: '.9rem', color: 'var(--text)', marginBottom: '.25rem' }}>
                    {c.titulo || '(sin asunto)'}
                  </div>
                  <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginBottom: '.35rem' }}>
                    Para: {c.extras?.destinatarios || '—'}
                  </div>
                  <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.contenido}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '.5rem', flexShrink: 0 }}>
                  <span style={{
                    background: c.extras?.estado === 'enviada' ? 'rgba(16,185,129,.15)' : 'var(--surface-2)',
                    color:      c.extras?.estado === 'enviada' ? 'var(--success)' : 'var(--text-muted)',
                    borderRadius: '9999px', fontSize: '.72rem', fontWeight: 700,
                    padding: '.2rem .6rem',
                  }}>
                    {c.extras?.estado === 'enviada' ? 'Enviada' : 'Borrador'}
                  </span>
                  <div style={{ display: 'flex', gap: '.4rem' }}>
                    {c.extras?.estado !== 'enviada' && (
                      <Button
                        size="sm"
                        loading={sending === c.id}
                        onClick={() => sendCampana(c)}
                        disabled={!c.titulo || !c.extras?.destinatarios}
                      >
                        <PaperAirplaneIcon style={{ width: '.85rem', height: '.85rem' }} />
                        Enviar
                      </Button>
                    )}
                    <button className="btn-ghost" style={{ padding: '.3rem', opacity: .6 }} onClick={() => deleteCampana(c.id)}>
                      <TrashIcon style={{ width: '.85rem', height: '.85rem', color: 'var(--danger)' }} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Chat Interno — WhatsApp/Slack-style with groups ──────────────
// SQL needed:
//   ALTER TABLE mensajes ADD COLUMN IF NOT EXISTS receptor_id uuid;
//   ALTER TABLE mensajes ADD COLUMN IF NOT EXISTS grupo_id uuid REFERENCES grupos_chat(id) ON DELETE CASCADE;
//   CREATE TABLE grupos_chat (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), empresa_id uuid REFERENCES empresas(id) ON DELETE CASCADE NOT NULL, nombre text NOT NULL, descripcion text, creado_por uuid, avatar_color text, created_at timestamptz DEFAULT now());
//   CREATE TABLE grupos_miembros (grupo_id uuid REFERENCES grupos_chat(id) ON DELETE CASCADE NOT NULL, usuario_id uuid NOT NULL, PRIMARY KEY (grupo_id, usuario_id));

const GENERAL_CONV  = { type: 'general', id: 'general', nombre: 'General', sub: 'Canal de toda la empresa' }
const AVATAR_COLORS = ['#2563eb','#7c3aed','#db2777','#059669','#d97706','#dc2626','#0891b2','#65a30d']
const pickColor = (str) => AVATAR_COLORS[(str || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length]

const SB_BG     = '#1a1d24'
const SB_HOVER  = 'rgba(255,255,255,.06)'
const SB_ACTIVE = 'rgba(255,255,255,.12)'
const SB_TEXT   = 'rgba(255,255,255,.85)'
const SB_MUTED  = 'rgba(255,255,255,.42)'

function ConvItem({ active, onClick, nombre, sub, unread, fotoUrl, isGroup, avatarColor, onEdit }) {
  const [hov, setHov] = useState(false)
  const color = avatarColor || pickColor(nombre)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '.55rem .875rem', display: 'flex', gap: '.6rem',
        alignItems: 'center', cursor: 'pointer', position: 'relative',
        background: active ? SB_ACTIVE : hov ? SB_HOVER : 'transparent',
        transition: 'background .12s',
      }}
    >
      <div style={{
        width: 36, height: 36, flexShrink: 0, overflow: 'hidden',
        borderRadius: isGroup ? '.4rem' : '50%',
        background: fotoUrl ? 'transparent' : color, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: isGroup ? '1rem' : '.85rem', fontWeight: 700,
      }}>
        {fotoUrl
          ? <img src={fotoUrl} alt={nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : isGroup ? '#' : nombre?.[0]?.toUpperCase() || '?'
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '.845rem', color: SB_TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {nombre}
        </div>
        {sub && (
          <div style={{ fontSize: '.72rem', color: SB_MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {sub}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem', flexShrink: 0 }}>
        {unread > 0 && (
          <span style={{ background: 'var(--danger)', color: '#fff', borderRadius: '9999px', fontSize: '.65rem', fontWeight: 700, padding: '.1rem .38rem', minWidth: 16, textAlign: 'center' }}>
            {unread > 99 ? '99+' : unread}
          </span>
        )}
        {onEdit && (hov || active) && (
          <button
            onClick={e => { e.stopPropagation(); onEdit() }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '.15rem', color: SB_MUTED, display: 'flex', alignItems: 'center', borderRadius: '.25rem' }}
          >
            <PencilIcon style={{ width: '.75rem', height: '.75rem' }} />
          </button>
        )}
      </div>
    </div>
  )
}

function GroupModal({ mode, grupo, usuarios, myId, empresaId, onSave, onClose }) {
  const [nombre,     setNombre]     = useState(grupo?.nombre || '')
  const [desc,       setDesc]       = useState(grupo?.descripcion || '')
  const [members,    setMembers]    = useState([])
  const [saving,     setSaving]     = useState(false)
  const [deleting,   setDeleting]   = useState(false)
  const [confirmDel, setConfirmDel] = useState(false)
  const [err,        setErr]        = useState('')

  useEffect(() => {
    if (mode === 'edit' && grupo?.id) {
      supabase.from('grupos_miembros').select('usuario_id').eq('grupo_id', grupo.id)
        .then(({ data }) => setMembers((data || []).map(r => r.usuario_id)))
    }
  }, [mode, grupo])

  const toggleMember = (uid) => setMembers(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid])

  const save = async () => {
    if (!nombre.trim()) { setErr('El nombre del grupo es obligatorio.'); return }
    setSaving(true); setErr('')
    const color = grupo?.avatar_color || pickColor(nombre)
    if (mode === 'create') {
      const { data: g, error: e1 } = await supabase.from('grupos_chat').insert({
        empresa_id: empresaId, nombre: nombre.trim(),
        descripcion: desc.trim() || null, creado_por: myId, avatar_color: color,
      }).select().single()
      if (e1) { setErr(e1.message); setSaving(false); return }
      const all = [...new Set([myId, ...members])]
      await supabase.from('grupos_miembros').insert(all.map(uid => ({ grupo_id: g.id, usuario_id: uid })))
      onSave(g, all)
    } else {
      const { error: e1 } = await supabase.from('grupos_chat').update({
        nombre: nombre.trim(), descripcion: desc.trim() || null,
      }).eq('id', grupo.id)
      if (e1) { setErr(e1.message); setSaving(false); return }
      const all = [...new Set([myId, ...members])]
      await supabase.from('grupos_miembros').delete().eq('grupo_id', grupo.id)
      await supabase.from('grupos_miembros').insert(all.map(uid => ({ grupo_id: grupo.id, usuario_id: uid })))
      onSave({ ...grupo, nombre: nombre.trim(), descripcion: desc.trim() || null }, all)
    }
    setSaving(false)
  }

  const deleteGroup = async () => {
    setDeleting(true)
    await supabase.from('grupos_chat').delete().eq('id', grupo.id)
    onSave(grupo, null, true)
  }

  const isCreator = mode === 'edit' && grupo?.creado_por === myId

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: '1rem' }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="card animate-fadeIn"
        style={{ width: '100%', maxWidth: 440, padding: '1.5rem', maxHeight: '80vh', overflowY: 'auto' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>
            {mode === 'create' ? 'Crear grupo' : 'Editar grupo'}
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '.2rem' }}>
            <XMarkIcon style={{ width: '1.1rem', height: '1.1rem' }} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '.875rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '.3rem' }}>Nombre del grupo *</label>
            <input className="input-themed" style={{ width: '100%' }} placeholder="Ej. Equipo de ventas" value={nombre} onChange={e => setNombre(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '.3rem' }}>Descripción (opcional)</label>
            <input className="input-themed" style={{ width: '100%' }} placeholder="Ej. Coordinación del equipo comercial" value={desc} onChange={e => setDesc(e.target.value)} />
          </div>
          {usuarios.length > 0 && (
            <div>
              <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '.5rem' }}>
                Miembros ({members.length} seleccionados)
              </label>
              <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '.3rem', border: '1px solid var(--border)', borderRadius: '.5rem', padding: '.5rem' }}>
                {usuarios.map(u => (
                  <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: '.6rem', cursor: 'pointer', padding: '.3rem .4rem', borderRadius: '.35rem' }}>
                    <input type="checkbox" checked={members.includes(u.id)} onChange={() => toggleMember(u.id)} style={{ flexShrink: 0 }} />
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
                      background: pickColor(u.nombre), color: '#fff',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '.72rem', fontWeight: 700,
                    }}>
                      {u.foto_url
                        ? <img src={u.foto_url} alt={u.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : u.nombre?.[0]?.toUpperCase() || '?'
                      }
                    </div>
                    <span style={{ fontSize: '.85rem', color: 'var(--text)', flex: 1, minWidth: 0 }}>{u.nombre}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {err && (
            <div style={{ fontSize: '.8rem', color: 'var(--danger)', background: 'rgba(239,68,68,.08)', border: '1px solid var(--danger)', borderRadius: '.4rem', padding: '.5rem .75rem' }}>
              {err}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '.25rem' }}>
            <div>
              {isCreator && !confirmDel && (
                <button onClick={() => setConfirmDel(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', fontSize: '.82rem', fontWeight: 600, padding: '.35rem .5rem' }}>
                  Eliminar grupo
                </button>
              )}
              {isCreator && confirmDel && (
                <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '.8rem', color: 'var(--danger)' }}>¿Confirmar?</span>
                  <Button size="sm" loading={deleting} onClick={deleteGroup} style={{ background: 'var(--danger)', color: '#fff' }}>Sí, eliminar</Button>
                  <button onClick={() => setConfirmDel(false)} className="btn-ghost" style={{ fontSize: '.8rem' }}>No</button>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '.6rem' }}>
              <button className="btn-ghost" onClick={onClose} style={{ fontSize: '.84rem' }}>Cancelar</button>
              <Button loading={saving} onClick={save} disabled={!nombre.trim()}>
                {mode === 'create' ? 'Crear grupo' : 'Guardar cambios'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ChatTab({ empresaId, perfil }) {
  const [usuarios,   setUsuarios]   = useState([])
  const [grupos,     setGrupos]     = useState([])
  const [activeConv, setActiveConv] = useState(GENERAL_CONV)
  const [msgs,       setMsgs]       = useState([])
  const [input,      setInput]      = useState('')
  const [loading,    setLoading]    = useState(true)
  const [unread,     setUnread]     = useState({})
  const [groupModal, setGroupModal] = useState(null)
  const endRef      = useRef(null)
  const activeRef   = useRef(GENERAL_CONV)
  const grupoIdsRef = useRef(new Set())

  const myId = perfil?.id

  useEffect(() => { activeRef.current = activeConv }, [activeConv])
  useEffect(() => { grupoIdsRef.current = new Set(grupos.map(g => g.id)) }, [grupos])

  useEffect(() => {
    if (!empresaId || !myId) return
    supabase.from('perfiles').select('id,nombre,email,foto_url,puesto')
      .eq('empresa_id', empresaId).order('nombre', { ascending: true })
      .then(({ data }) => setUsuarios((data || []).filter(u => u.id !== myId)))
  }, [empresaId, myId])

  const loadGrupos = useCallback(async () => {
    if (!empresaId || !myId) return
    const { data: memberOf } = await supabase.from('grupos_miembros').select('grupo_id').eq('usuario_id', myId)
    if (!memberOf?.length) { setGrupos([]); return }
    const ids = memberOf.map(r => r.grupo_id)
    const { data } = await supabase.from('grupos_chat').select('*').in('id', ids).eq('empresa_id', empresaId).order('created_at', { ascending: true })
    setGrupos(data || [])
  }, [empresaId, myId])

  useEffect(() => { loadGrupos() }, [loadGrupos])

  useEffect(() => {
    if (!empresaId || !myId) return
    setLoading(true); setMsgs([])
    const base = supabase.from('mensajes').select('*').eq('empresa_id', empresaId)
    let q
    if (activeConv.type === 'general')      q = base.is('receptor_id', null).is('grupo_id', null)
    else if (activeConv.type === 'group')   q = base.eq('grupo_id', activeConv.id)
    else q = base.or(`and(usuario_id.eq.${myId},receptor_id.eq.${activeConv.id}),and(usuario_id.eq.${activeConv.id},receptor_id.eq.${myId})`)
    q.order('created_at', { ascending: true }).limit(200)
      .then(({ data }) => { setMsgs(data || []); setLoading(false); setUnread(prev => ({ ...prev, [activeConv.id]: 0 })) })
  }, [empresaId, myId, activeConv])

  useEffect(() => {
    if (!empresaId || !myId) return
    const channel = supabase
      .channel(`chat:${empresaId}:${myId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensajes', filter: `empresa_id=eq.${empresaId}` }, ({ new: msg }) => {
        const conv = activeRef.current
        if (msg.grupo_id) {
          if (!grupoIdsRef.current.has(msg.grupo_id)) return
          if (conv.type === 'group' && conv.id === msg.grupo_id) {
            setMsgs(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])
          } else {
            setUnread(prev => ({ ...prev, [msg.grupo_id]: (prev[msg.grupo_id] || 0) + 1 }))
          }
        } else if (!msg.receptor_id) {
          if (conv.type === 'general') {
            setMsgs(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])
          } else {
            setUnread(prev => ({ ...prev, general: (prev.general || 0) + 1 }))
          }
        } else {
          const isForMe = msg.receptor_id === myId || msg.usuario_id === myId
          if (!isForMe) return
          const otherId = msg.usuario_id === myId ? msg.receptor_id : msg.usuario_id
          if (conv.type === 'private' && conv.id === otherId) {
            setMsgs(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])
          } else if (msg.usuario_id !== myId) {
            setUnread(prev => ({ ...prev, [otherId]: (prev[otherId] || 0) + 1 }))
          }
        }
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [empresaId, myId])

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  const openConv = (conv) => { setActiveConv(conv); setUnread(prev => ({ ...prev, [conv.id]: 0 })) }

  const onGroupSaved = (g, _members, deleted = false) => {
    setGroupModal(null)
    if (deleted) {
      setGrupos(prev => prev.filter(x => x.id !== g?.id))
      if (activeConv.type === 'group' && activeConv.id === g?.id) setActiveConv(GENERAL_CONV)
    } else if (groupModal?.mode === 'create') {
      setGrupos(prev => [...prev, g])
      openConv({ type: 'group', id: g.id, nombre: g.nombre, sub: g.descripcion || '', avatarColor: g.avatar_color })
    } else {
      setGrupos(prev => prev.map(x => x.id === g.id ? g : x))
      if (activeConv.type === 'group' && activeConv.id === g.id) {
        setActiveConv(prev => ({ ...prev, nombre: g.nombre, sub: g.descripcion || '' }))
      }
    }
  }

  const send = async () => {
    const text = input.trim()
    if (!text || !empresaId || !perfil) return
    setInput('')
    const payload = {
      empresa_id: empresaId, usuario_id: myId,
      usuario_nombre: perfil.nombre, contenido: text,
      receptor_id: activeConv.type === 'private' ? activeConv.id : null,
      grupo_id:    activeConv.type === 'group'   ? activeConv.id : null,
    }
    const tmp = { ...payload, id: `tmp-${Date.now()}`, created_at: new Date().toISOString(), _sending: true }
    setMsgs(prev => [...prev, tmp])
    const { data } = await supabase.from('mensajes').insert(payload).select().single()
    if (data) setMsgs(prev => prev.map(m => m.id === tmp.id ? data : m))
  }

  const onKey    = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }
  const isMe     = (m) => m.usuario_id === myId
  const fmtTs    = (ts) => new Date(ts).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  const fmtDay   = (ts) => {
    const d = new Date(ts), t = new Date()
    if (d.toDateString() === t.toDateString()) return 'Hoy'
    const y = new Date(t); y.setDate(t.getDate() - 1)
    if (d.toDateString() === y.toDateString()) return 'Ayer'
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
  }

  const grouped = []; let lastDay = null
  msgs.forEach(msg => {
    const day = new Date(msg.created_at).toDateString()
    if (day !== lastDay) { grouped.push({ _sep: true, label: fmtDay(msg.created_at), key: `sep-${day}` }); lastDay = day }
    grouped.push(msg)
  })

  const totalUnread    = Object.values(unread).reduce((a, b) => a + b, 0)
  const showSenderName = activeConv.type !== 'private'

  return (
    <div style={{ display: 'flex', height: 580, border: '1px solid var(--border)', borderRadius: '.75rem', overflow: 'hidden' }}>

      {/* ─── Left sidebar ─────────────────────────────────────── */}
      <div style={{ width: 252, flexShrink: 0, display: 'flex', flexDirection: 'column', borderRight: '1px solid rgba(255,255,255,.07)', background: SB_BG }}>

        {/* Header */}
        <div style={{ padding: '.7rem 1rem', borderBottom: '1px solid rgba(255,255,255,.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontWeight: 700, fontSize: '.85rem', color: SB_TEXT }}>Mensajes</span>
          {totalUnread > 0 && (
            <span style={{ background: 'var(--danger)', color: '#fff', borderRadius: '9999px', fontSize: '.66rem', fontWeight: 700, padding: '.1rem .42rem' }}>
              {totalUnread}
            </span>
          )}
        </div>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* General */}
          <ConvItem
            active={activeConv.id === 'general'} onClick={() => openConv(GENERAL_CONV)}
            isGroup nombre="General" sub="Toda la empresa"
            unread={unread.general || 0} avatarColor="#2563eb"
          />

          {/* Grupos */}
          <div style={{ padding: '.45rem .875rem .2rem', fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: SB_MUTED, borderTop: '1px solid rgba(255,255,255,.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>Grupos</span>
            <button onClick={() => setGroupModal({ mode: 'create' })} style={{ background: 'none', border: 'none', cursor: 'pointer', color: SB_MUTED, padding: '.1rem', lineHeight: 1, borderRadius: '.25rem' }} title="Crear grupo">
              <PlusIcon style={{ width: '.8rem', height: '.8rem' }} />
            </button>
          </div>
          {grupos.map(g => (
            <ConvItem
              key={g.id}
              active={activeConv.id === g.id}
              onClick={() => openConv({ type: 'group', id: g.id, nombre: g.nombre, sub: g.descripcion || '', avatarColor: g.avatar_color })}
              isGroup nombre={g.nombre} sub={g.descripcion || ''}
              unread={unread[g.id] || 0} avatarColor={g.avatar_color || pickColor(g.nombre)}
              onEdit={() => setGroupModal({ mode: 'edit', grupo: g })}
            />
          ))}
          {grupos.length === 0 && (
            <div style={{ padding: '.5rem .875rem 1rem', fontSize: '.75rem', color: SB_MUTED }}>Sin grupos. Presiona + para crear uno.</div>
          )}

          {/* Directos */}
          <div style={{ padding: '.45rem .875rem .2rem', fontSize: '.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: SB_MUTED, borderTop: '1px solid rgba(255,255,255,.07)' }}>
            Mensajes directos
          </div>
          {usuarios.map(u => (
            <ConvItem
              key={u.id}
              active={activeConv.id === u.id}
              onClick={() => openConv({ type: 'private', id: u.id, nombre: u.nombre, sub: u.puesto || u.email || '' })}
              nombre={u.nombre} sub={u.puesto || u.email || ''}
              unread={unread[u.id] || 0} fotoUrl={u.foto_url}
            />
          ))}
          {usuarios.length === 0 && (
            <div style={{ padding: '.5rem .875rem 1rem', fontSize: '.75rem', color: SB_MUTED }}>Solo tú en la empresa.</div>
          )}
        </div>
      </div>

      {/* ─── Right: messages panel ────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg)' }}>

        {/* Conv header */}
        <div style={{ padding: '.65rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '.75rem', background: 'var(--surface)', flexShrink: 0 }}>
          <div style={{
            width: 34, height: 34, flexShrink: 0, overflow: 'hidden',
            borderRadius: activeConv.type === 'private' ? '50%' : '.4rem',
            background: activeConv.type === 'private' ? 'var(--primary-light)' : (activeConv.avatarColor || pickColor(activeConv.nombre)),
            color: activeConv.type === 'private' ? 'var(--primary)' : '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '.9rem', fontWeight: 700,
          }}>
            {activeConv.type === 'private' ? activeConv.nombre?.[0]?.toUpperCase() : '#'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '.9rem', color: 'var(--text)' }}>{activeConv.nombre}</div>
            {activeConv.sub && <div style={{ fontSize: '.73rem', color: 'var(--text-muted)' }}>{activeConv.sub}</div>}
          </div>
          {activeConv.type === 'group' && (
            <button
              onClick={() => { const g = grupos.find(x => x.id === activeConv.id); if (g) setGroupModal({ mode: 'edit', grupo: g }) }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '.3rem', borderRadius: '.35rem' }}
              title="Editar grupo"
            >
              <PencilIcon style={{ width: '.9rem', height: '.9rem' }} />
            </button>
          )}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '.875rem .75rem', display: 'flex', flexDirection: 'column', gap: '.15rem' }}>
          {loading && <div style={{ textAlign: 'center', padding: '2rem' }}><span className="spinner" /></div>}
          {!loading && msgs.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 1rem', fontSize: '.875rem' }}>
              {activeConv.type === 'general' ? 'Sin mensajes en #General. ¡Sé el primero!'
               : activeConv.type === 'group'  ? `Sin mensajes en ${activeConv.nombre} aún.`
               : `Inicia una conversación con ${activeConv.nombre}`}
            </div>
          )}
          {grouped.map((item, idx) => {
            if (item._sep) return (
              <div key={item.key} style={{ textAlign: 'center', margin: '.65rem 0 .4rem' }}>
                <span style={{ background: 'var(--surface)', color: 'var(--text-muted)', fontSize: '.7rem', fontWeight: 600, padding: '.2rem .65rem', borderRadius: '9999px', border: '1px solid var(--border)' }}>
                  {item.label}
                </span>
              </div>
            )
            const me = isMe(item)
            return (
              <div key={item.id || idx} style={{ display: 'flex', flexDirection: me ? 'row-reverse' : 'row', gap: '.4rem', alignItems: 'flex-end', marginBottom: '.2rem' }}>
                {!me && (
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: pickColor(item.usuario_nombre || ''), color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '.7rem', fontWeight: 700,
                  }}>
                    {item.usuario_nombre?.[0]?.toUpperCase() || '?'}
                  </div>
                )}
                <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', alignItems: me ? 'flex-end' : 'flex-start' }}>
                  {!me && showSenderName && (
                    <span style={{ fontSize: '.7rem', color: pickColor(item.usuario_nombre || ''), fontWeight: 600, marginBottom: '.15rem', paddingLeft: '.35rem' }}>
                      {item.usuario_nombre}
                    </span>
                  )}
                  <div style={{
                    background: me ? 'var(--primary)' : 'var(--surface)',
                    color: me ? '#fff' : 'var(--text)',
                    borderRadius: me ? '1rem 1rem 0 1rem' : '0 1rem 1rem 1rem',
                    padding: '.5rem .9rem', fontSize: '.875rem', lineHeight: 1.45,
                    opacity: item._sending ? 0.6 : 1, border: '1px solid var(--border)', wordBreak: 'break-word',
                  }}>
                    {item.contenido}
                  </div>
                  <span style={{ fontSize: '.66rem', color: 'var(--text-muted)', marginTop: '.1rem', paddingLeft: me ? 0 : '.35rem', paddingRight: me ? '.35rem' : 0 }}>
                    {fmtTs(item.created_at)}{me && !item._sending ? ' ✓' : ''}
                  </span>
                </div>
              </div>
            )
          })}
          <div ref={endRef} />
        </div>

        {/* Input bar */}
        <div style={{ padding: '.6rem .875rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '.5rem', alignItems: 'flex-end', background: 'var(--surface)', flexShrink: 0 }}>
          <textarea
            className="input-themed"
            value={input} onChange={e => setInput(e.target.value)} onKeyDown={onKey}
            placeholder={
              activeConv.type === 'general' ? 'Mensaje en #General… (Enter envía)'
              : activeConv.type === 'group' ? `Mensaje en ${activeConv.nombre}…`
              : `Mensaje privado a ${activeConv.nombre}…`
            }
            rows={1} style={{ flex: 1, resize: 'none', minHeight: 38, maxHeight: 96 }}
          />
          <Button onClick={send} disabled={!input.trim()} style={{ flexShrink: 0, padding: '.5rem .75rem' }}>
            <PaperAirplaneIcon style={{ width: '1rem', height: '1rem' }} />
          </Button>
        </div>
      </div>

      {groupModal && (
        <GroupModal
          mode={groupModal.mode} grupo={groupModal.grupo || null}
          usuarios={usuarios} myId={myId} empresaId={empresaId}
          onSave={onGroupSaved} onClose={() => setGroupModal(null)}
        />
      )}
    </div>
  )
}

// ── WhatsApp links ────────────────────────────────────────────────
function WhatsAppTab({ empresaId }) {
  const [numero, setNumero]   = useState('')
  const [mensaje, setMensaje] = useState('')
  const [saved,   setSaved]   = useState([])

  useEffect(() => {
    if (!empresaId) return
    supabase.from('leads').select('nombre,telefono').eq('empresa_id', empresaId)
      .then(({ data }) => setSaved(data || []))
  }, [empresaId])

  const waLink = (tel, msg) => {
    const clean = tel.replace(/\D/g, '')
    const encoded = encodeURIComponent(msg)
    return `https://wa.me/${clean}?text=${encoded}`
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Composer */}
      <div className="card" style={{ padding: '1.5rem', maxWidth: 560 }}>
        <h3 style={{ margin: '0 0 1.25rem', fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>
          Enviar mensaje de WhatsApp
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '.3rem' }}>Número (con código de país)</label>
            <input className="input-themed" style={{ width: '100%' }} placeholder="+52 55 1234 5678" value={numero} onChange={e => setNumero(e.target.value)} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '.3rem' }}>Mensaje</label>
            <textarea
              className="input-themed"
              style={{ width: '100%', minHeight: 100, resize: 'vertical' }}
              placeholder="Hola, te contactamos de…"
              value={mensaje}
              onChange={e => setMensaje(e.target.value)}
            />
          </div>
          <a
            href={numero ? waLink(numero, mensaje) : '#'}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '.5rem',
              background: '#25d366', color: '#fff', fontWeight: 700,
              borderRadius: '.6rem', padding: '.6rem 1.25rem', fontSize: '.875rem',
              textDecoration: 'none', width: 'fit-content',
              opacity: numero ? 1 : .5, pointerEvents: numero ? 'auto' : 'none',
            }}
          >
            <ChatBubbleLeftRightIcon style={{ width: '1rem', height: '1rem' }} />
            Abrir WhatsApp
          </a>
        </div>
      </div>

      {/* Quick links from contacts */}
      {saved.filter(c => c.telefono).length > 0 && (
        <div className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontWeight: 700, fontSize: '.9rem', color: 'var(--text)' }}>
            Acceso rápido — Contactos con teléfono
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.5rem' }}>
            {saved.filter(c => c.telefono).map((c, i) => (
              <a
                key={i}
                href={waLink(c.telefono, mensaje || '')}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '.4rem',
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  borderRadius: '9999px', padding: '.3rem .75rem',
                  fontSize: '.8rem', fontWeight: 600, color: 'var(--text)',
                  textDecoration: 'none', transition: 'background .15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#25d36622'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-2)'}
              >
                <ChatBubbleLeftRightIcon style={{ width: '.8rem', height: '.8rem', color: '#25d366' }} />
                {c.nombre} — {c.telefono}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────
export default function Comunicaciones() {
  const { empresaId, perfil } = useAuth()
  const [activeTab, setActiveTab] = useState('campanas')

  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ margin: '0 0 .25rem', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)' }}>
          Comunicaciones
        </h2>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '.875rem' }}>
          Campañas de email, mensajes WhatsApp e historial de comunicaciones
        </p>
      </div>

      <Tabs
        tabs={TABS}
        active={activeTab}
        onChange={setActiveTab}
        panels={{
          campanas:  <CampanasTab empresaId={empresaId} perfil={perfil} />,
          chat:      <ChatTab empresaId={empresaId} perfil={perfil} />,
          whatsapp:  <WhatsAppTab empresaId={empresaId} />,
          historial: (
            <DynamicTable
              tableName="comunicados"
              empresaId={empresaId}
              tableKey="comunicados_historial"
              defaultColumns={HISTORIAL_COLS}
              defaultRow={{}}
              title="Historial de comunicaciones"
              orderBy="created_at"
              ascending={false}
              allowAdd={false}
            />
          ),
        }}
      />
    </div>
  )
}
