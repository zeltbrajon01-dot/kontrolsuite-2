import React, { useState, useEffect, useRef } from 'react'
import {
  EnvelopeIcon, ChatBubbleLeftRightIcon, ClockIcon,
  PlusIcon, PaperAirplaneIcon, TrashIcon,
  ChatBubbleLeftEllipsisIcon,
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

// ── Chat Interno — WhatsApp-style ────────────────────────────────
// SQL needed: ALTER TABLE mensajes ADD COLUMN IF NOT EXISTS receptor_id uuid;
// receptor_id NULL = mensaje grupal General, uuid = mensaje privado

const GENERAL_CONV = { type: 'general', id: 'general', nombre: 'General', sub: 'Canal de toda la empresa' }

function ConvItem({ active, onClick, nombre, sub, unread, fotoUrl, isGroup }) {
  return (
    <div
      onClick={onClick}
      style={{
        padding: '.6rem .875rem', display: 'flex', gap: '.6rem',
        alignItems: 'center', cursor: 'pointer',
        background: active ? 'var(--primary-light)' : 'transparent',
        borderLeft: `3px solid ${active ? 'var(--primary)' : 'transparent'}`,
        transition: 'background .12s',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'var(--surface-2)' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
        background: isGroup ? 'var(--primary)' : 'var(--primary-light)',
        color: isGroup ? '#fff' : 'var(--primary)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: isGroup ? '1rem' : '.9rem', fontWeight: 700,
      }}>
        {fotoUrl
          ? <img src={fotoUrl} alt={nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : isGroup ? '#' : nombre?.[0]?.toUpperCase() || '?'
        }
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '.855rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {nombre}
        </div>
        {sub && (
          <div style={{ fontSize: '.74rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {sub}
          </div>
        )}
      </div>
      {unread > 0 && (
        <span style={{
          background: 'var(--danger)', color: '#fff', borderRadius: '9999px',
          fontSize: '.68rem', fontWeight: 700, padding: '.1rem .42rem',
          minWidth: 18, textAlign: 'center', flexShrink: 0,
        }}>
          {unread > 99 ? '99+' : unread}
        </span>
      )}
    </div>
  )
}

function ChatTab({ empresaId, perfil }) {
  const [usuarios,   setUsuarios]   = useState([])
  const [activeConv, setActiveConv] = useState(GENERAL_CONV)
  const [msgs,       setMsgs]       = useState([])
  const [input,      setInput]      = useState('')
  const [loading,    setLoading]    = useState(true)
  const [unread,     setUnread]     = useState({})
  const endRef    = useRef(null)
  const activeRef = useRef(GENERAL_CONV)

  const myId = perfil?.id

  // Keep activeConv ref in sync for Realtime handler (avoids stale closure)
  useEffect(() => { activeRef.current = activeConv }, [activeConv])

  // Load team members from perfiles
  useEffect(() => {
    if (!empresaId || !myId) return
    supabase.from('perfiles').select('id,nombre,email,foto_url,puesto')
      .eq('empresa_id', empresaId)
      .order('nombre', { ascending: true })
      .then(({ data }) => setUsuarios((data || []).filter(u => u.id !== myId)))
  }, [empresaId, myId])

  // Load messages whenever active conversation changes
  useEffect(() => {
    if (!empresaId || !myId) return
    setLoading(true)
    setMsgs([])

    const base = supabase.from('mensajes').select('*').eq('empresa_id', empresaId)
    const q = activeConv.type === 'general'
      ? base.is('receptor_id', null)
      : base.or(`and(usuario_id.eq.${myId},receptor_id.eq.${activeConv.id}),and(usuario_id.eq.${activeConv.id},receptor_id.eq.${myId})`)

    q.order('created_at', { ascending: true }).limit(200)
      .then(({ data }) => {
        setMsgs(data || [])
        setLoading(false)
        setUnread(prev => ({ ...prev, [activeConv.id]: 0 }))
      })
  }, [empresaId, myId, activeConv])

  // Single Realtime subscription for all empresa messages
  useEffect(() => {
    if (!empresaId || !myId) return

    const channel = supabase
      .channel(`chat:${empresaId}:${myId}`)
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'mensajes',
        filter: `empresa_id=eq.${empresaId}`,
      }, ({ new: msg }) => {
        const conv   = activeRef.current
        const isGrp  = !msg.receptor_id
        const isPriv = msg.receptor_id === myId || (msg.usuario_id === myId && msg.receptor_id)

        if (isGrp) {
          if (conv.type === 'general') {
            setMsgs(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])
          } else {
            setUnread(prev => ({ ...prev, general: (prev.general || 0) + 1 }))
          }
        } else if (isPriv) {
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

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  const openConv = (conv) => {
    setActiveConv(conv)
    setUnread(prev => ({ ...prev, [conv.id]: 0 }))
  }

  const send = async () => {
    const text = input.trim()
    if (!text || !empresaId || !perfil) return
    setInput('')
    const payload = {
      empresa_id: empresaId, usuario_id: myId,
      usuario_nombre: perfil.nombre, contenido: text,
      receptor_id: activeConv.type === 'private' ? activeConv.id : null,
    }
    const tmp = { ...payload, id: `tmp-${Date.now()}`, created_at: new Date().toISOString(), _sending: true }
    setMsgs(prev => [...prev, tmp])
    const { data } = await supabase.from('mensajes').insert(payload).select().single()
    if (data) setMsgs(prev => prev.map(m => m.id === tmp.id ? data : m))
  }

  const onKey  = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }
  const isMe   = (m) => m.usuario_id === myId
  const fmtTs  = (ts) => new Date(ts).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
  const fmtDay = (ts) => {
    const d = new Date(ts), t = new Date()
    if (d.toDateString() === t.toDateString()) return 'Hoy'
    const y = new Date(t); y.setDate(t.getDate() - 1)
    if (d.toDateString() === y.toDateString()) return 'Ayer'
    return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
  }

  // Group messages by day separator
  const grouped = []
  let lastDay = null
  msgs.forEach(msg => {
    const day = new Date(msg.created_at).toDateString()
    if (day !== lastDay) { grouped.push({ _sep: true, label: fmtDay(msg.created_at), key: `sep-${day}` }); lastDay = day }
    grouped.push(msg)
  })

  const totalUnread = Object.values(unread).reduce((a, b) => a + b, 0)

  return (
    <div style={{
      display: 'flex', height: 580,
      border: '1px solid var(--border)', borderRadius: '.75rem',
      overflow: 'hidden',
    }}>

      {/* ─── Left sidebar: conversation list ─────────────────────── */}
      <div style={{
        width: 260, flexShrink: 0, display: 'flex', flexDirection: 'column',
        borderRight: '1px solid var(--border)', background: 'var(--surface)',
      }}>
        {/* Sidebar header */}
        <div style={{
          padding: '.7rem 1rem', borderBottom: '1px solid var(--border)',
          background: 'var(--surface-2)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontWeight: 700, fontSize: '.85rem', color: 'var(--text)' }}>Mensajes</span>
          {totalUnread > 0 && (
            <span style={{ background: 'var(--danger)', color: '#fff', borderRadius: '9999px', fontSize: '.68rem', fontWeight: 700, padding: '.1rem .45rem' }}>
              {totalUnread}
            </span>
          )}
        </div>

        {/* List */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* General (always first) */}
          <ConvItem
            active={activeConv.id === 'general'}
            onClick={() => openConv(GENERAL_CONV)}
            isGroup nombre="General" sub="Canal de toda la empresa"
            unread={unread.general || 0}
          />

          {/* Section label */}
          {usuarios.length > 0 && (
            <div style={{
              padding: '.3rem .875rem .25rem', fontSize: '.67rem', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '.08em', color: 'var(--text-muted)',
              background: 'var(--surface-2)',
              borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
            }}>
              Mensajes directos
            </div>
          )}

          {/* Users */}
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
            <div style={{ padding: '1.5rem .875rem', fontSize: '.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
              Solo tú en la empresa por ahora.
            </div>
          )}
        </div>
      </div>

      {/* ─── Right: messages panel ───────────────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, background: 'var(--bg)' }}>

        {/* Conversation header */}
        <div style={{
          padding: '.65rem 1.25rem', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: '.75rem',
          background: 'var(--surface)', flexShrink: 0,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
            background: activeConv.type === 'general' ? 'var(--primary)' : 'var(--primary-light)',
            color:      activeConv.type === 'general' ? '#fff' : 'var(--primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '.9rem', fontWeight: 700,
          }}>
            {activeConv.type === 'general' ? '#' : activeConv.nombre?.[0]?.toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '.9rem', color: 'var(--text)' }}>{activeConv.nombre}</div>
            <div style={{ fontSize: '.73rem', color: 'var(--text-muted)' }}>{activeConv.sub}</div>
          </div>
        </div>

        {/* Messages area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '.875rem .75rem', display: 'flex', flexDirection: 'column', gap: '.15rem' }}>
          {loading && <div style={{ textAlign: 'center', padding: '2rem' }}><span className="spinner" /></div>}
          {!loading && msgs.length === 0 && (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 1rem', fontSize: '.875rem' }}>
              {activeConv.type === 'general'
                ? 'Sin mensajes aún en #General. ¡Sé el primero!'
                : `Inicia una conversación privada con ${activeConv.nombre}`}
            </div>
          )}

          {grouped.map((item, idx) => {
            if (item._sep) return (
              <div key={item.key} style={{ textAlign: 'center', margin: '.65rem 0 .4rem' }}>
                <span style={{
                  background: 'var(--surface)', color: 'var(--text-muted)', fontSize: '.7rem',
                  fontWeight: 600, padding: '.2rem .65rem',
                  borderRadius: '9999px', border: '1px solid var(--border)',
                }}>
                  {item.label}
                </span>
              </div>
            )

            const me = isMe(item)
            return (
              <div key={item.id || idx} style={{
                display: 'flex', flexDirection: me ? 'row-reverse' : 'row',
                gap: '.4rem', alignItems: 'flex-end', marginBottom: '.2rem',
              }}>
                {/* Avatar (others only) */}
                {!me && (
                  <div style={{
                    width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: 'var(--primary)', color: '#fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '.7rem', fontWeight: 700,
                  }}>
                    {item.usuario_nombre?.[0]?.toUpperCase() || '?'}
                  </div>
                )}

                <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', alignItems: me ? 'flex-end' : 'flex-start' }}>
                  {/* Sender name (others, group chat only) */}
                  {!me && activeConv.type === 'general' && (
                    <span style={{ fontSize: '.7rem', color: 'var(--primary)', fontWeight: 600, marginBottom: '.15rem', paddingLeft: '.35rem' }}>
                      {item.usuario_nombre}
                    </span>
                  )}

                  {/* Bubble */}
                  <div style={{
                    background:   me ? 'var(--primary)' : 'var(--surface)',
                    color:        me ? '#fff' : 'var(--text)',
                    borderRadius: me ? '1rem 1rem 0 1rem' : '0 1rem 1rem 1rem',
                    padding:      '.5rem .9rem', fontSize: '.875rem', lineHeight: 1.45,
                    opacity:      item._sending ? 0.6 : 1,
                    border:       '1px solid var(--border)',
                    wordBreak:    'break-word',
                  }}>
                    {item.contenido}
                  </div>

                  {/* Timestamp + sent check */}
                  <span style={{
                    fontSize: '.66rem', color: 'var(--text-muted)', marginTop: '.1rem',
                    paddingLeft: me ? 0 : '.35rem', paddingRight: me ? '.35rem' : 0,
                  }}>
                    {fmtTs(item.created_at)}{me && !item._sending ? ' ✓' : ''}
                  </span>
                </div>
              </div>
            )
          })}
          <div ref={endRef} />
        </div>

        {/* Input bar */}
        <div style={{
          padding: '.6rem .875rem', borderTop: '1px solid var(--border)',
          display: 'flex', gap: '.5rem', alignItems: 'flex-end',
          background: 'var(--surface)', flexShrink: 0,
        }}>
          <textarea
            className="input-themed"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={onKey}
            placeholder={activeConv.type === 'general' ? 'Mensaje en #General… (Enter para enviar)' : `Mensaje privado a ${activeConv.nombre}…`}
            rows={1}
            style={{ flex: 1, resize: 'none', minHeight: 38, maxHeight: 96 }}
          />
          <Button onClick={send} disabled={!input.trim()} style={{ flexShrink: 0, padding: '.5rem .75rem' }}>
            <PaperAirplaneIcon style={{ width: '1rem', height: '1rem' }} />
          </Button>
        </div>
      </div>
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
