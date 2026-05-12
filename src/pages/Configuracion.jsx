import React, { useState, useRef, useEffect } from 'react'
import {
  Bars3Icon, PencilIcon, CheckIcon, XMarkIcon,
  HomeIcon, UsersIcon, ShoppingCartIcon, ArchiveBoxIcon,
  BanknotesIcon, UserGroupIcon, ChartBarIcon, Cog6ToothIcon,
  ChartPieIcon, CubeIcon, ClipboardDocumentListIcon,
  WrenchScrewdriverIcon, ChatBubbleLeftRightIcon,
  ShieldCheckIcon, SparklesIcon,
} from '@heroicons/react/24/outline'
import { useAuth }    from '../contexts/AuthContext'
import { useTheme }   from '../contexts/ThemeContext'
import { useModulos } from '../contexts/ModulosContext'
import Button  from '../components/ui/Button'
import Input   from '../components/ui/Input'

const ICON_LIST = [
  'HomeIcon', 'UsersIcon', 'ShoppingCartIcon', 'ArchiveBoxIcon',
  'BanknotesIcon', 'UserGroupIcon', 'ChartBarIcon', 'Cog6ToothIcon',
  'ChartPieIcon', 'CubeIcon', 'ClipboardDocumentListIcon',
  'WrenchScrewdriverIcon', 'ChatBubbleLeftRightIcon',
  'ShieldCheckIcon', 'SparklesIcon',
]
const ICON_MAP = {
  HomeIcon, UsersIcon, ShoppingCartIcon, ArchiveBoxIcon,
  BanknotesIcon, UserGroupIcon, ChartBarIcon, Cog6ToothIcon,
  ChartPieIcon, CubeIcon, ClipboardDocumentListIcon,
  WrenchScrewdriverIcon, ChatBubbleLeftRightIcon,
  ShieldCheckIcon, SparklesIcon,
}

// ── Fila de módulo (editable inline) ─────────────────────────────
function ModuloRow({ modulo, onToggle, onUpdate, dragHandlers }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState({
    nombre: modulo.nombre,
    icono:  modulo.icono,
    ruta:   modulo.ruta,
  })
  const Icon = ICON_MAP[modulo.icono] || HomeIcon

  const saveEdit = () => {
    onUpdate(modulo.modulo_id, draft)
    setEditing(false)
  }

  const cancelEdit = () => {
    setDraft({ nombre: modulo.nombre, icono: modulo.icono, ruta: modulo.ruta })
    setEditing(false)
  }

  return (
    <div
      {...dragHandlers}
      style={{
        display:      'flex',
        alignItems:   'center',
        gap:          '.75rem',
        background:   'var(--surface-2)',
        borderRadius: '.5rem',
        padding:      '.75rem 1rem',
        border:       '1px solid var(--border)',
        opacity:      modulo.activo ? 1 : .5,
        cursor:       'default',
        userSelect:   'none',
      }}
    >
      {/* Drag handle */}
      <span
        style={{
          cursor:     'grab',
          color:      'var(--text-muted)',
          flexShrink: 0,
          display:    'flex',
          alignItems: 'center',
        }}
        title="Arrastrar para reordenar"
      >
        <Bars3Icon style={{ width: '1rem', height: '1rem' }} />
      </span>

      {/* Icono actual */}
      <Icon style={{ width: '1.1rem', height: '1.1rem', color: 'var(--primary)', flexShrink: 0 }} />

      {/* Nombre / icono / ruta — editable inline, siempre en DOM */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Panel edición — display toggle, no montaje/desmontaje condicional */}
        <div style={{ display: editing ? 'flex' : 'none', gap: '.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            className="input-themed"
            style={{ flex: '1 1 120px', padding: '.35rem .6rem', fontSize: '.8rem' }}
            value={draft.nombre}
            onChange={e => setDraft(d => ({ ...d, nombre: e.target.value }))}
            placeholder="Nombre"
          />
          <select
            className="input-themed"
            style={{ flex: '0 0 auto', padding: '.35rem .6rem', fontSize: '.8rem' }}
            value={draft.icono}
            onChange={e => setDraft(d => ({ ...d, icono: e.target.value }))}
          >
            {ICON_LIST.map(ic => (
              <option key={ic} value={ic}>{ic.replace('Icon', '')}</option>
            ))}
          </select>
          <input
            className="input-themed"
            style={{ flex: '1 1 100px', padding: '.35rem .6rem', fontSize: '.8rem' }}
            value={draft.ruta}
            onChange={e => setDraft(d => ({ ...d, ruta: e.target.value }))}
            placeholder="/ruta"
          />
          <button className="btn-ghost" style={{ padding: '.35rem' }} onClick={saveEdit} title="Guardar">
            <CheckIcon style={{ width: '.9rem', height: '.9rem', color: 'var(--success)' }} />
          </button>
          <button className="btn-ghost" style={{ padding: '.35rem' }} onClick={cancelEdit} title="Cancelar">
            <XMarkIcon style={{ width: '.9rem', height: '.9rem' }} />
          </button>
        </div>

        {/* Panel lectura */}
        <div style={{ display: editing ? 'none' : 'flex', alignItems: 'center', gap: '.5rem', flex: 1 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: '.875rem', color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {modulo.nombre}
            </div>
            <div style={{ fontSize: '.7rem', color: 'var(--text-muted)' }}>
              {modulo.ruta}
            </div>
          </div>
          <button
            className="btn-ghost"
            style={{ padding: '.35rem', flexShrink: 0 }}
            onClick={() => {
              setDraft({ nombre: modulo.nombre, icono: modulo.icono, ruta: modulo.ruta })
              setEditing(true)
            }}
            title="Editar módulo"
          >
            <PencilIcon style={{ width: '.85rem', height: '.85rem' }} />
          </button>
        </div>
      </div>

      {/* Toggle activo */}
      <button
        onClick={() => onToggle(modulo.modulo_id)}
        style={{
          width:      38,
          height:     22,
          borderRadius: 11,
          border:     'none',
          cursor:     'pointer',
          background: modulo.activo ? 'var(--primary)' : 'var(--border)',
          position:   'relative',
          transition: 'background .2s',
          flexShrink: 0,
        }}
        title={modulo.activo ? 'Desactivar' : 'Activar'}
      >
        <span style={{
          position:   'absolute',
          top:        3,
          left:       modulo.activo ? 19 : 3,
          width:      16,
          height:     16,
          borderRadius: '50%',
          background: '#fff',
          transition: 'left .2s',
          boxShadow:  '0 1px 3px rgba(0,0,0,.3)',
        }} />
      </button>
    </div>
  )
}

// ── Lista reordenable con DnD nativo HTML5 ────────────────────────
function DraggableList({ items, onReorder, onToggle, onUpdate }) {
  const [localItems, setLocalItems] = useState(items)
  const dragIdxRef  = useRef(null)
  const [dropIdx, setDropIdx] = useState(null)

  // Sincronizar cuando el padre actualiza los items
  useEffect(() => { setLocalItems(items) }, [items])

  const handleDragStart = (e, index) => {
    dragIdxRef.current = index
    e.dataTransfer.setData('text/plain', String(index))
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDropIdx(index)

    const from = dragIdxRef.current
    if (from === null || from === index) return

    const next = [...localItems]
    const [moved] = next.splice(from, 1)
    next.splice(index, 0, moved)
    dragIdxRef.current = index
    setLocalItems(next)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDropIdx(null)
    onReorder(localItems)
  }

  const handleDragEnd = () => {
    dragIdxRef.current = null
    setDropIdx(null)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
      {localItems.map((mod, index) => (
        <ModuloRow
          key={mod.modulo_id}
          modulo={mod}
          onToggle={onToggle}
          onUpdate={onUpdate}
          dragHandlers={{
            draggable:   true,
            onDragStart: (e) => handleDragStart(e, index),
            onDragOver:  (e) => handleDragOver(e, index),
            onDrop:      handleDrop,
            onDragEnd:   handleDragEnd,
            style: {
              opacity:    dragIdxRef.current === index ? 0.35 : 1,
              outline:    dropIdx === index && dragIdxRef.current !== index
                            ? '2px dashed var(--primary)' : 'none',
              transition: 'opacity .12s',
            },
          }}
        />
      ))}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────
export default function Configuracion() {
  const { empresa, perfil, updateEmpresaConfig }           = useAuth()
  const { theme, setTheme, themes }                        = useTheme()
  const { modulos, toggleModulo, reorderModulos, updateModulo } = useModulos()

  const [empresaNombre, setEmpresaNombre] = useState(empresa?.nombre || '')
  const [savingEmpresa, setSavingEmpresa] = useState(false)
  const [savedMsg,      setSavedMsg]      = useState(false)

  const saveEmpresa = async () => {
    setSavingEmpresa(true)
    await updateEmpresaConfig({ nombre: empresaNombre })
    setSavingEmpresa(false)
    setSavedMsg(true)
    setTimeout(() => setSavedMsg(false), 2000)
  }

  return (
    <div
      className="animate-fadeIn"
      style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 760 }}
    >

      {/* ── Información de la empresa ───────────────────────── */}
      <section className="card" style={{ padding: '1.5rem' }}>
        <h2 style={{ margin: '0 0 1.25rem', fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>
          Información de la empresa
        </h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: 400 }}>
          <Input
            label="Nombre de la empresa"
            value={empresaNombre}
            onChange={e => setEmpresaNombre(e.target.value)}
          />
          <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center' }}>
            <Button size="sm" loading={savingEmpresa} onClick={saveEmpresa}>
              Guardar cambios
            </Button>
            <span style={{
              color: 'var(--success)', fontSize: '.8rem', fontWeight: 600,
              display: savedMsg ? 'inline' : 'none',
            }}>
              ✓ Guardado
            </span>
          </div>
          <div style={{
            fontSize: '.8rem', color: 'var(--text-muted)',
            background: 'var(--surface-2)', borderRadius: '.5rem', padding: '.75rem 1rem',
          }}>
            <strong style={{ color: 'var(--text)' }}>Admin:</strong> {perfil?.nombre} ({perfil?.email})
            <br />
            <strong style={{ color: 'var(--text)' }}>ID empresa:</strong>{' '}
            <code style={{ fontSize: '.7rem' }}>{empresa?.id}</code>
          </div>
        </div>
      </section>

      {/* ── Tema visual ─────────────────────────────────────── */}
      <section className="card" style={{ padding: '1.5rem' }}>
        <h2 style={{ margin: '0 0 1.25rem', fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>
          Tema visual
        </h2>
        <div style={{ display: 'flex', gap: '.75rem', flexWrap: 'wrap' }}>
          {themes.map(t => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              style={{
                display:        'flex',
                flexDirection:  'column',
                alignItems:     'center',
                gap:            '.5rem',
                padding:        '.75rem 1rem',
                borderRadius:   '.75rem',
                cursor:         'pointer',
                border:         theme === t.id ? '2px solid var(--primary)' : '2px solid var(--border)',
                background:     theme === t.id ? 'var(--primary-light)' : 'var(--surface-2)',
                transition:     'all .15s',
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: '.5rem',
                background: t.preview, boxShadow: '0 2px 6px rgba(0,0,0,.3)',
              }} />
              <span style={{
                fontSize: '.75rem', fontWeight: 600,
                color: theme === t.id ? 'var(--primary)' : 'var(--text-muted)',
              }}>
                {t.nombre}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* ── Módulos ──────────────────────────────────────────── */}
      <section className="card" style={{ padding: '1.5rem' }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <h2 style={{ margin: '0 0 .25rem', fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>
            Módulos del sistema
          </h2>
          <span style={{ display: 'block', fontSize: '.8rem', color: 'var(--text-muted)' }}>
            Arrastra para reordenar · Edita nombre, icono y ruta · Activa o desactiva cada módulo
          </span>
        </div>

        <DraggableList
          items={modulos}
          onReorder={reorderModulos}
          onToggle={toggleModulo}
          onUpdate={updateModulo}
        />
      </section>
    </div>
  )
}
