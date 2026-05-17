import React, { useState, useEffect, useCallback } from 'react'
import { PlusIcon, PencilIcon, XMarkIcon, CheckIcon, TrashIcon } from '@heroicons/react/24/outline'
import supabase from '../../lib/supabase'
import Button from './Button'

/*
 * KanbanBoard — HTML5 DnD kanban with dynamic column management.
 *
 * Column definitions are stored in `tabla_config`.
 * Cards are rows from `tableName` with a `columna` field holding the column id.
 *
 * Required Supabase table:
 *   [tableName] (id uuid PK, empresa_id uuid, columna text, orden int DEFAULT 0,
 *                [titleField] text, ...other fields, created_at timestamptz)
 */
export default function KanbanBoard({
  tableName,
  empresaId,
  configKey,            // key in tabla_config for column defs
  defaultColumns = [],  // [{ id, label }]
  cardFields    = [],   // [{ key, label }] shown under title
  defaultCard   = {},   // default values for new cards
  titleField    = 'titulo',
  onCardClick,          // optional fn(card) for detail panel
}) {
  const [columns,       setColumns]       = useState(defaultColumns)
  const [cards,         setCards]         = useState([])
  const [loading,       setLoading]       = useState(true)
  const [editingColIdx, setEditingColIdx] = useState(null)
  const [colDraft,      setColDraft]      = useState('')
  const [addingCol,     setAddingCol]     = useState(false)
  const [newColName,    setNewColName]    = useState('')
  const [dragging,      setDragging]      = useState(null) // { cardId }
  const [dragOverCol,   setDragOverCol]   = useState(null)
  const [cardError,     setCardError]     = useState(null)

  // ── Load column config ─────────────────────────────────────────
  useEffect(() => {
    if (!empresaId || !configKey) return
    supabase
      .from('tabla_config')
      .select('columnas')
      .eq('empresa_id', empresaId)
      .eq('tabla', configKey)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.columnas?.length) setColumns(data.columnas)
      })
  }, [empresaId, configKey])

  // ── Load cards ─────────────────────────────────────────────────
  const fetchCards = useCallback(async () => {
    if (!empresaId) return
    setLoading(true)
    const { data } = await supabase
      .from(tableName)
      .select('*')
      .eq('empresa_id', empresaId)
      .order('orden', { ascending: true })
    setCards(data || [])
    setLoading(false)
  }, [tableName, empresaId])

  useEffect(() => { fetchCards() }, [fetchCards])

  // ── Persist column config ──────────────────────────────────────
  const saveColumnConfig = useCallback(async (cols) => {
    if (!empresaId || !configKey) return
    await supabase
      .from('tabla_config')
      .upsert(
        { empresa_id: empresaId, tabla: configKey, columnas: cols, updated_at: new Date().toISOString() },
        { onConflict: 'empresa_id,tabla' }
      )
  }, [empresaId, configKey])

  // ── Column CRUD ────────────────────────────────────────────────
  const renameColumn = async (idx, newLabel) => {
    const next = columns.map((c, i) => i === idx ? { ...c, label: newLabel } : c)
    setColumns(next)
    setEditingColIdx(null)
    await saveColumnConfig(next)
  }

  const addColumn = async () => {
    if (!newColName.trim()) return
    const id   = 'col_' + Date.now()
    const next = [...columns, { id, label: newColName.trim() }]
    setColumns(next)
    setNewColName('')
    setAddingCol(false)
    await saveColumnConfig(next)
  }

  const deleteColumn = async (idx) => {
    const col  = columns[idx]
    const next = columns.filter((_, i) => i !== idx)
    setColumns(next)
    if (next.length > 0) {
      const affected = cards.filter(c => c.columna === col.id)
      for (const card of affected) {
        await supabase.from(tableName).update({ columna: next[0].id }).eq('id', card.id)
      }
      setCards(prev => prev.map(c => c.columna === col.id ? { ...c, columna: next[0].id } : c))
    }
    await saveColumnConfig(next)
  }

  // ── Card CRUD ──────────────────────────────────────────────────
  const addCard = async (colId) => {
    if (!empresaId) { setCardError('empresa_id es null — usuario sin empresa activa'); return }
    setCardError(null)
    const payload = {
      ...defaultCard,
      empresa_id: empresaId,
      columna:    colId,
      orden:      cards.filter(c => c.columna === colId).length,
    }
    const { error: err } = await supabase.from(tableName).insert(payload)
    if (err) setCardError(err.message || err.details || JSON.stringify(err))
    else await fetchCards()
  }

  const deleteCard = async (cardId, e) => {
    e.stopPropagation()
    await supabase.from(tableName).delete().eq('id', cardId)
    setCards(prev => prev.filter(c => c.id !== cardId))
  }

  const moveCard = async (cardId, toColId) => {
    await supabase.from(tableName).update({ columna: toColId }).eq('id', cardId)
    setCards(prev => prev.map(c => c.id === cardId ? { ...c, columna: toColId } : c))
  }

  // ── Drag handlers ──────────────────────────────────────────────
  const onDragStart = (e, cardId) => {
    setDragging({ cardId })
    e.dataTransfer.setData('text/plain', cardId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const onDragOver = (e, colId) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverCol(colId)
  }

  const onDrop = (e, colId) => {
    e.preventDefault()
    if (dragging) moveCard(dragging.cardId, colId)
    setDragging(null)
    setDragOverCol(null)
  }

  const onDragEnd = () => {
    setDragging(null)
    setDragOverCol(null)
  }

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center' }}>
        <span className="spinner" style={{ width: '2rem', height: '2rem' }} />
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: '.75rem' }}>
      {cardError && (
        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '.75rem', marginBottom: '.75rem',
          padding: '.75rem 1rem', background: 'rgba(239,68,68,.08)',
          border: '1px solid var(--danger)', borderRadius: '.5rem', fontSize: '.82rem',
        }}>
          <span style={{ color: 'var(--danger)', fontWeight: 700, whiteSpace: 'nowrap' }}>Error al guardar:</span>
          <span style={{ color: 'var(--danger)', flex: 1, wordBreak: 'break-word', fontFamily: 'monospace' }}>{cardError}</span>
          <button onClick={() => setCardError(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)', padding: 0 }}>✕</button>
        </div>
      )}
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start', minWidth: 'max-content' }}>

        {columns.map((col, idx) => {
          const colCards = cards.filter(c => c.columna === col.id)
          const isOver   = dragOverCol === col.id

          return (
            <div
              key={col.id}
              style={{
                width:        280,
                flexShrink:   0,
                background:   isOver ? 'var(--primary-light)' : 'transparent',
                borderRadius: '.75rem',
                transition:   'background .15s',
                padding:      '.25rem',
              }}
              onDragOver={e => onDragOver(e, col.id)}
              onDrop={e     => onDrop(e, col.id)}
            >
              {/* Column header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: '.4rem',
                marginBottom: '.6rem', padding: '.5rem .6rem',
                background: 'var(--surface-2)', borderRadius: '.5rem',
              }}>
                {editingColIdx === idx ? (
                  <>
                    <input
                      className="input-themed"
                      style={{ flex: 1, padding: '.25rem .4rem', fontSize: '.85rem' }}
                      value={colDraft}
                      onChange={e => setColDraft(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter')  renameColumn(idx, colDraft)
                        if (e.key === 'Escape') setEditingColIdx(null)
                      }}
                      autoFocus
                    />
                    <button className="btn-ghost" style={{ padding: '.2rem' }} onClick={() => renameColumn(idx, colDraft)}>
                      <CheckIcon style={{ width: '.8rem', height: '.8rem', color: 'var(--success)' }} />
                    </button>
                    <button className="btn-ghost" style={{ padding: '.2rem' }} onClick={() => setEditingColIdx(null)}>
                      <XMarkIcon style={{ width: '.8rem', height: '.8rem' }} />
                    </button>
                  </>
                ) : (
                  <>
                    <span style={{ flex: 1, fontWeight: 700, fontSize: '.875rem', color: 'var(--text)' }}>
                      {col.label}
                    </span>
                    <span style={{
                      background: 'var(--primary-light)', color: 'var(--primary)',
                      borderRadius: '9999px', fontSize: '.7rem', fontWeight: 700,
                      padding: '.1rem .45rem',
                    }}>
                      {colCards.length}
                    </span>
                    <button className="btn-ghost" style={{ padding: '.2rem', opacity: .55 }}
                      onClick={() => { setEditingColIdx(idx); setColDraft(col.label) }}>
                      <PencilIcon style={{ width: '.7rem', height: '.7rem' }} />
                    </button>
                    <button className="btn-ghost" style={{ padding: '.2rem', opacity: .45 }}
                      onClick={() => deleteColumn(idx)}>
                      <XMarkIcon style={{ width: '.7rem', height: '.7rem', color: 'var(--danger)' }} />
                    </button>
                  </>
                )}
              </div>

              {/* Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem', minHeight: 50 }}>
                {colCards.map(card => (
                  <div
                    key={card.id}
                    draggable
                    onDragStart={e => onDragStart(e, card.id)}
                    onDragEnd={onDragEnd}
                    onClick={() => onCardClick && onCardClick(card)}
                    style={{
                      background:   'var(--surface)',
                      border:       '1px solid var(--border)',
                      borderRadius: '.5rem',
                      padding:      '.75rem',
                      cursor:       onCardClick ? 'pointer' : 'grab',
                      opacity:      dragging?.cardId === card.id ? .35 : 1,
                      transition:   'opacity .15s, box-shadow .15s',
                      boxShadow:    dragging?.cardId === card.id ? 'none' : '0 1px 3px rgba(0,0,0,.08)',
                    }}
                    onMouseEnter={e => { if (!dragging) e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,.15)' }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,.08)' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '.4rem', marginBottom: cardFields.length ? '.4rem' : 0 }}>
                      <span style={{ fontWeight: 600, fontSize: '.875rem', color: 'var(--text)', lineHeight: 1.35 }}>
                        {card[titleField] || '(sin título)'}
                      </span>
                      <button
                        className="btn-ghost"
                        style={{ padding: '.1rem', flexShrink: 0, opacity: .4 }}
                        onClick={e => deleteCard(card.id, e)}
                        title="Eliminar tarjeta"
                      >
                        <TrashIcon style={{ width: '.75rem', height: '.75rem', color: 'var(--danger)' }} />
                      </button>
                    </div>
                    {cardFields.map(f => (
                      <div key={f.key} style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginTop: '.15rem' }}>
                        <span style={{ fontWeight: 600 }}>{f.label}:</span> {card[f.key] || '—'}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {/* Add card */}
              <button
                className="btn-ghost"
                style={{
                  width: '100%', marginTop: '.5rem', padding: '.45rem',
                  fontSize: '.8rem', color: 'var(--text-muted)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.3rem',
                }}
                onClick={() => addCard(col.id)}
              >
                <PlusIcon style={{ width: '.8rem', height: '.8rem' }} />
                Agregar tarjeta
              </button>
            </div>
          )
        })}

        {/* Add column */}
        <div style={{ width: 240, flexShrink: 0, paddingTop: '.5rem' }}>
          {addingCol ? (
            <div style={{ background: 'var(--surface-2)', borderRadius: '.6rem', padding: '.75rem' }}>
              <input
                className="input-themed"
                style={{ width: '100%', padding: '.35rem .6rem', fontSize: '.85rem', marginBottom: '.5rem' }}
                placeholder="Nombre de la columna…"
                value={newColName}
                onChange={e => setNewColName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter')  addColumn()
                  if (e.key === 'Escape') { setAddingCol(false); setNewColName('') }
                }}
                autoFocus
              />
              <div style={{ display: 'flex', gap: '.5rem' }}>
                <Button size="sm" onClick={addColumn}>Agregar</Button>
                <button className="btn-ghost" onClick={() => { setAddingCol(false); setNewColName('') }}>Cancelar</button>
              </div>
            </div>
          ) : (
            <button
              className="btn-ghost"
              style={{
                width: '100%', padding: '.75rem', fontSize: '.875rem', color: 'var(--text-muted)',
                display: 'flex', alignItems: 'center', gap: '.5rem', justifyContent: 'center',
                border: '1px dashed var(--border)', borderRadius: '.6rem',
              }}
              onClick={() => setAddingCol(true)}
            >
              <PlusIcon style={{ width: '1rem', height: '1rem' }} />
              Agregar columna
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
