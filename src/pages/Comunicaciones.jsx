import React, { useState, useEffect } from 'react'
import {
  EnvelopeIcon, ChatBubbleLeftRightIcon, ClockIcon,
  PlusIcon, PaperAirplaneIcon, TrashIcon,
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
  { id: 'campanas',   label: 'Campañas Email', icon: EnvelopeIcon              },
  { id: 'whatsapp',   label: 'WhatsApp',       icon: ChatBubbleLeftRightIcon   },
  { id: 'historial',  label: 'Historial',      icon: ClockIcon                 },
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
