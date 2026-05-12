import React, { useState, useRef, useEffect } from 'react'
import {
  SparklesIcon, PaperAirplaneIcon, TrashIcon,
  UserCircleIcon, CpuChipIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '../contexts/AuthContext'
import Button from '../components/ui/Button'
import Tabs from '../components/ui/Tabs'

/*
 * IA Module — uses Anthropic API directly from the browser.
 * Set REACT_APP_ANTHROPIC_KEY in your .env file.
 *
 * IMPORTANT SECURITY NOTE:
 * Calling the Anthropic API from the browser exposes your API key.
 * For production, route requests through a backend/Edge Function.
 *
 * Model: claude-haiku-4-5-20251001 (fast & cost-effective for chat)
 */

const TABS = [
  { id: 'chat',     label: 'Chat IA',   icon: SparklesIcon  },
  { id: 'analisis', label: 'Análisis',  icon: CpuChipIcon   },
]

const SYSTEM_PROMPT = (empresaNombre) =>
  `Eres un asistente de negocios inteligente para la empresa "${empresaNombre}". ` +
  `Ayudas con análisis empresarial, estrategia, finanzas, operaciones y toma de decisiones. ` +
  `Responde siempre en español de manera profesional, concisa y orientada a resultados. ` +
  `Cuando analices datos, provee insights accionables con cifras cuando sea posible.`

const SUGGESTIONS = [
  '¿Cómo puedo mejorar el flujo de caja de mi empresa?',
  'Analiza las tendencias de ventas y dame recomendaciones.',
  '¿Qué KPIs son más importantes para mi industria?',
  'Crea un plan de reducción de costos operativos.',
  'Dame 5 estrategias para aumentar la retención de clientes.',
  'Explica cómo calcular el punto de equilibrio.',
]

// ── Chat tab ──────────────────────────────────────────────────────
function ChatTab({ empresa }) {
  const [messages, setMessages]   = useState([])
  const [input,    setInput]      = useState('')
  const [loading,  setLoading]    = useState(false)
  const [error,    setError]      = useState('')
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (content) => {
    if (!content.trim() || loading) return
    setError('')

    const userMsg = { role: 'user', content: content.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    const apiKey = process.env.REACT_APP_ANTHROPIC_KEY
    if (!apiKey) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '⚠️ No se encontró la clave de API de Anthropic. Configura `REACT_APP_ANTHROPIC_KEY` en tu archivo `.env`.',
      }])
      setLoading(false)
      return
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type':         'application/json',
          'x-api-key':            apiKey,
          'anthropic-version':    '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model:      'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          system:     SYSTEM_PROMPT(empresa?.nombre || 'tu empresa'),
          messages:   newMessages,
        }),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error?.message || `Error ${response.status}`)
      }

      const data = await response.json()
      const assistantContent = data.content?.[0]?.text || 'Sin respuesta.'
      setMessages(prev => [...prev, { role: 'assistant', content: assistantContent }])
    } catch (err) {
      setError(err.message || 'Error al conectar con la IA.')
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ Error: ${err.message}`,
      }])
    } finally {
      setLoading(false)
    }
  }

  const clearChat = () => setMessages([])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Suggestions (when chat is empty) */}
      <div style={{ display: messages.length > 0 ? 'none' : 'block' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: 'var(--primary)', display: 'inline-flex',
              alignItems: 'center', justifyContent: 'center', marginBottom: '.75rem',
            }}>
              <SparklesIcon style={{ width: '1.5rem', height: '1.5rem', color: '#fff' }} />
            </div>
            <h3 style={{ margin: '0 0 .3rem', fontWeight: 800, fontSize: '1.1rem', color: 'var(--text)' }}>
              Asistente de IA
            </h3>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '.875rem' }}>
              Pregunta sobre tu empresa, analiza datos o pide estrategias de negocio.
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))', gap: '.5rem' }}>
            {SUGGESTIONS.map((s, i) => (
              <button
                key={i}
                onClick={() => sendMessage(s)}
                style={{
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                  borderRadius: '.5rem', padding: '.6rem .875rem',
                  fontSize: '.8rem', color: 'var(--text)', cursor: 'pointer',
                  textAlign: 'left', transition: 'all .15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--primary-light)'; e.currentTarget.style.borderColor = 'var(--primary)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.borderColor = 'var(--border)' }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat messages */}
      <div style={{ display: messages.length > 0 ? 'flex' : 'none', flexDirection: 'column', gap: '.75rem', maxHeight: 480, overflowY: 'auto', padding: '.25rem' }}>
        {messages.map((msg, i) => (
          <div
            key={i}
            style={{
              display:        'flex',
              flexDirection:  msg.role === 'user' ? 'row-reverse' : 'row',
              gap:            '.625rem',
              alignItems:     'flex-start',
            }}
          >
            <div style={{
              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
              background: msg.role === 'user' ? 'var(--primary)' : 'var(--surface-2)',
              border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {msg.role === 'user'
                ? <UserCircleIcon style={{ width: '1.1rem', height: '1.1rem', color: '#fff' }} />
                : <SparklesIcon   style={{ width: '1rem',   height: '1rem',   color: 'var(--primary)' }} />
              }
            </div>
            <div style={{
              background:   msg.role === 'user' ? 'var(--primary)' : 'var(--surface)',
              color:        msg.role === 'user' ? '#fff' : 'var(--text)',
              border:       '1px solid ' + (msg.role === 'user' ? 'var(--primary)' : 'var(--border)'),
              borderRadius: msg.role === 'user' ? '.75rem .2rem .75rem .75rem' : '.2rem .75rem .75rem .75rem',
              padding:      '.6rem .875rem',
              maxWidth:     '75%',
              fontSize:     '.875rem',
              lineHeight:   1.6,
              whiteSpace:   'pre-wrap',
              wordBreak:    'break-word',
            }}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: '.625rem', alignItems: 'center' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--surface-2)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SparklesIcon style={{ width: '1rem', height: '1rem', color: 'var(--primary)' }} />
            </div>
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '.2rem .75rem .75rem .75rem', padding: '.6rem .875rem' }}>
              <span className="spinner" style={{ width: '.85rem', height: '.85rem' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Error banner — always in DOM, CSS toggle */}
      <div role="alert" style={{
        display:      error ? 'block' : 'none',
        background:   'rgba(239,68,68,.1)', border: '1px solid var(--danger)',
        borderRadius: '.5rem', padding: '.6rem 1rem',
        color: 'var(--danger)', fontSize: '.82rem',
      }}>
        {error}
      </div>

      {/* Input */}
      <div className="card" style={{ padding: '.75rem' }}>
        <div style={{ display: 'flex', gap: '.625rem', alignItems: 'flex-end' }}>
          <textarea
            style={{
              flex: 1, resize: 'none', background: 'transparent',
              border: 'none', outline: 'none', fontSize: '.875rem',
              color: 'var(--text)', padding: '.35rem .25rem', minHeight: 40, maxHeight: 120,
            }}
            placeholder="Escribe tu pregunta…"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage(input)
              }
            }}
            rows={1}
          />
          <div style={{ display: 'flex', gap: '.4rem', flexShrink: 0 }}>
            {messages.length > 0 && (
              <button className="btn-ghost" style={{ padding: '.45rem', opacity: .5 }} onClick={clearChat} title="Limpiar chat">
                <TrashIcon style={{ width: '1rem', height: '1rem' }} />
              </button>
            )}
            <Button onClick={() => sendMessage(input)} loading={loading} disabled={!input.trim()}>
              <PaperAirplaneIcon style={{ width: '.9rem', height: '.9rem' }} />
            </Button>
          </div>
        </div>
        <div style={{ fontSize: '.7rem', color: 'var(--text-muted)', marginTop: '.35rem', paddingLeft: '.25rem' }}>
          Enter para enviar · Shift+Enter para nueva línea · Powered by Claude
        </div>
      </div>
    </div>
  )
}

// ── Analysis tab ──────────────────────────────────────────────────
function AnalisisTab({ empresa, empresaId }) {
  const [prompt,   setPrompt]   = useState('')
  const [result,   setResult]   = useState('')
  const [loading,  setLoading]  = useState(false)
  const [template, setTemplate] = useState('')

  const TEMPLATES = [
    { id: 'swot',     label: 'Análisis FODA', prompt: `Genera un análisis FODA completo para la empresa "${empresa?.nombre}". Incluye al menos 4 puntos en cada cuadrante (Fortalezas, Oportunidades, Debilidades, Amenazas) relevantes para una empresa en México.` },
    { id: 'kpi',      label: 'KPIs recomendados', prompt: `¿Qué KPIs debería monitorear la empresa "${empresa?.nombre}" para mejorar su desempeño? Lista los 10 más importantes con su fórmula de cálculo e interpretación.` },
    { id: 'strategy', label: 'Estrategia de crecimiento', prompt: `Crea un plan estratégico de crecimiento para la empresa "${empresa?.nombre}" para los próximos 12 meses. Incluye objetivos SMART, iniciativas clave y métricas de éxito.` },
    { id: 'cost',     label: 'Reducción de costos', prompt: `Propón 10 estrategias concretas para reducir costos operativos en la empresa "${empresa?.nombre}" sin sacrificar calidad ni talento.` },
  ]

  const selectTemplate = (t) => {
    setTemplate(t.id)
    setPrompt(t.prompt)
  }

  const analyze = async () => {
    if (!prompt.trim()) return
    setLoading(true)
    setResult('')

    const apiKey = process.env.REACT_APP_ANTHROPIC_KEY
    if (!apiKey) {
      setResult('⚠️ Configura REACT_APP_ANTHROPIC_KEY en tu archivo .env')
      setLoading(false)
      return
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type':         'application/json',
          'x-api-key':            apiKey,
          'anthropic-version':    '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model:      'claude-haiku-4-5-20251001',
          max_tokens: 2048,
          system:     SYSTEM_PROMPT(empresa?.nombre || 'la empresa'),
          messages:   [{ role: 'user', content: prompt }],
        }),
      })
      const data = await response.json()
      setResult(data.content?.[0]?.text || 'Sin respuesta.')
    } catch (err) {
      setResult(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: 800 }}>
      {/* Templates */}
      <div>
        <p style={{ margin: '0 0 .75rem', fontSize: '.875rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          Plantillas de análisis
        </p>
        <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
          {TEMPLATES.map(t => (
            <button
              key={t.id}
              onClick={() => selectTemplate(t)}
              style={{
                background: template === t.id ? 'var(--primary)' : 'var(--surface-2)',
                color:      template === t.id ? '#fff' : 'var(--text)',
                border:     '1px solid ' + (template === t.id ? 'var(--primary)' : 'var(--border)'),
                borderRadius: '.5rem', padding: '.4rem .875rem',
                fontSize: '.82rem', fontWeight: 600, cursor: 'pointer', transition: 'all .15s',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom prompt */}
      <div>
        <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '.4rem' }}>
          Prompt personalizado
        </label>
        <textarea
          className="input-themed"
          style={{ width: '100%', minHeight: 100, resize: 'vertical' }}
          placeholder="Escribe tu análisis o pregunta específica…"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
        />
      </div>

      <div>
        <Button loading={loading} onClick={analyze} disabled={!prompt.trim()}>
          <SparklesIcon style={{ width: '.9rem', height: '.9rem' }} />
          Generar análisis
        </Button>
      </div>

      {/* Result */}
      {result && (
        <div className="card animate-fadeIn" style={{ padding: '1.5rem' }}>
          <pre style={{
            margin: 0, fontFamily: 'inherit', fontSize: '.875rem',
            lineHeight: 1.7, color: 'var(--text)', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
          }}>
            {result}
          </pre>
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────
export default function IA() {
  const { empresaId, empresa } = useAuth()
  const [activeTab, setActiveTab] = useState('chat')

  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '.75rem' }}>
        <div>
          <h2 style={{ margin: '0 0 .25rem', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)' }}>
            Inteligencia Artificial
          </h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '.875rem' }}>
            Asistente conversacional y análisis estratégico con Claude AI
          </p>
        </div>
        {!process.env.REACT_APP_ANTHROPIC_KEY && (
          <div style={{ background: 'rgba(245,158,11,.12)', border: '1px solid #f59e0b', borderRadius: '.5rem', padding: '.45rem .875rem', fontSize: '.78rem', color: '#d97706', fontWeight: 600 }}>
            ⚠️ Configura REACT_APP_ANTHROPIC_KEY para activar la IA
          </div>
        )}
      </div>

      <Tabs
        tabs={TABS}
        active={activeTab}
        onChange={setActiveTab}
        panels={{
          chat:     <ChatTab empresa={empresa} />,
          analisis: <AnalisisTab empresa={empresa} empresaId={empresaId} />,
        }}
      />
    </div>
  )
}
