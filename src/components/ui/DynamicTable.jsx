import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  PlusIcon, TrashIcon, ArrowPathIcon,
  PencilIcon, CheckIcon, XMarkIcon,
} from '@heroicons/react/24/outline'
import { useSupabaseTable } from '../../hooks/useSupabaseTable'
import EditableCell from './EditableCell'
import Button from './Button'
import supabase from '../../lib/supabase'

/*
 * DynamicTable — table backed by Supabase with dynamic column management.
 *
 * Columns config is persisted in `tabla_config` (empresa_id, tabla TEXT, columnas JSONB).
 * Custom columns store their values in an `extras JSONB` field on each row.
 *
 * Required Supabase tables:
 *   tabla_config (id uuid PK, empresa_id uuid, tabla text, columnas jsonb, updated_at timestamptz,
 *                 UNIQUE(empresa_id, tabla))
 *   [tableName]  (id uuid PK, empresa_id uuid, extras jsonb DEFAULT '{}', created_at timestamptz, ...)
 */
export default function DynamicTable({
  tableName,
  empresaId,
  tableKey,           // unique key for tabla_config (defaults to tableName)
  defaultColumns = [],// [{ key, label, type, editable, width, options, formatter, builtin }]
  defaultRow = {},
  title,
  orderBy    = 'created_at',
  ascending  = false,
  filters    = [],
  allowAdd    = true,
  allowDelete = true,
}) {
  const configKey = tableKey || tableName
  const [columns,          setColumns]          = useState(defaultColumns)
  const [editingHeaderIdx, setEditingHeaderIdx] = useState(null)
  const [headerDraft,      setHeaderDraft]      = useState('')
  const [addingCol,        setAddingCol]        = useState(false)
  const [newColName,       setNewColName]       = useState('')
  const addColInputRef = useRef(null)

  const { rows, loading, error, updateRow, addRow, deleteRow, refetch } =
    useSupabaseTable(tableName, { empresaId, filters, orderBy, ascending })

  const [adding,       setAdding]       = useState(false)
  const [deletingId,   setDeletingId]   = useState(null)
  const [searchTerm,   setSearchTerm]   = useState('')
  const [insertError,  setInsertError]  = useState(null)
  const [showAddForm,  setShowAddForm]  = useState(false)
  const [formData,     setFormData]     = useState({})

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

  const saveColumnConfig = useCallback(async (cols) => {
    if (!empresaId || !configKey) return
    await supabase
      .from('tabla_config')
      .upsert(
        { empresa_id: empresaId, tabla: configKey, columnas: cols, updated_at: new Date().toISOString() },
        { onConflict: 'empresa_id,tabla' }
      )
  }, [empresaId, configKey])

  // ── Column management ──────────────────────────────────────────
  const renameColumn = async (idx, newLabel) => {
    const next = columns.map((c, i) => i === idx ? { ...c, label: newLabel } : c)
    setColumns(next)
    setEditingHeaderIdx(null)
    await saveColumnConfig(next)
  }

  const addColumn = async () => {
    if (!newColName.trim()) return
    const key  = 'col_' + Date.now()
    const next = [...columns, { key, label: newColName.trim(), type: 'text', editable: true, builtin: false }]
    setColumns(next)
    setNewColName('')
    setAddingCol(false)
    await saveColumnConfig(next)
  }

  const deleteColumn = async (idx) => {
    const next = columns.filter((_, i) => i !== idx)
    setColumns(next)
    await saveColumnConfig(next)
  }

  // ── Cell value helpers ─────────────────────────────────────────
  const getCellValue = (row, col) =>
    col.builtin === false ? (row.extras?.[col.key] ?? '') : row[col.key]

  const saveCellValue = async (row, col, newVal) => {
    if (col.builtin === false) {
      await updateRow(row.id, { extras: { ...(row.extras || {}), [col.key]: newVal } })
    } else {
      await updateRow(row.id, { [col.key]: newVal })
    }
  }

  // ── Search filter ──────────────────────────────────────────────
  const filteredRows = searchTerm
    ? rows.filter(r => columns.some(col => {
        const val = getCellValue(r, col)
        return String(val ?? '').toLowerCase().includes(searchTerm.toLowerCase())
      }))
    : rows

  const openAddForm = () => {
    setFormData({ ...defaultRow })
    setInsertError(null)
    setShowAddForm(true)
  }

  const closeAddForm = () => {
    setShowAddForm(false)
    setFormData({})
    setInsertError(null)
  }

  const handleAdd = async () => {
    setAdding(true)
    setInsertError(null)

    // Build payload: builtin cols → direct fields; builtin:false → extras JSONB
    const direct  = {}
    const extrasP = {}
    columns.forEach(col => {
      const val = formData[col.key]
      if (val === undefined || val === '') return
      if (col.builtin === false) extrasP[col.key] = val
      else direct[col.key] = val
    })
    const payload = { ...defaultRow, ...direct }
    if (Object.keys(extrasP).length) payload.extras = { ...(payload.extras || {}), ...extrasP }

    const { error: addErr } = await addRow(payload)
    setAdding(false)
    if (addErr) {
      setInsertError(addErr.message || addErr.details || addErr.hint || JSON.stringify(addErr))
    } else {
      closeAddForm()
    }
  }

  const handleDelete = async (id) => {
    setDeletingId(id)
    await deleteRow(id)
    setDeletingId(null)
  }

  if (error) {
    return <div style={{ color: 'var(--danger)', padding: '1rem' }}>Error: {error.message}</div>
  }

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {/* ── Toolbar ──────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)',
        flexWrap: 'wrap', gap: '.75rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
          {title && <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>{title}</h3>}
          <span style={{
            background: 'var(--primary-light)', color: 'var(--primary)',
            borderRadius: '9999px', fontSize: '.75rem', fontWeight: 700, padding: '.15rem .55rem',
          }}>
            {filteredRows.length}
          </span>
        </div>
        <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
          <input
            className="input-themed"
            style={{ width: 200, padding: '.4rem .75rem', fontSize: '.8rem' }}
            placeholder="Buscar..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <button className="btn-ghost" onClick={refetch} title="Actualizar" style={{ padding: '.45rem' }}>
            <ArrowPathIcon style={{ width: '1rem', height: '1rem' }} />
          </button>
          {allowAdd && (
            <Button
              size="sm"
              loading={adding}
              onClick={showAddForm ? closeAddForm : openAddForm}
              style={showAddForm ? { background: 'var(--surface-2)', color: 'var(--text)' } : {}}
            >
              {showAddForm
                ? <><XMarkIcon style={{ width: '.9rem', height: '.9rem' }} /> Cancelar</>
                : <><PlusIcon  style={{ width: '.9rem', height: '.9rem' }} /> Nuevo</>
              }
            </Button>
          )}
        </div>
      </div>

      {/* ── Add form panel ────────────────────────────────────────── */}
      {showAddForm && (
        <div className="animate-fadeIn" style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border)',
          background: 'var(--surface-2)',
        }}>
          <div style={{ fontWeight: 700, fontSize: '.85rem', color: 'var(--text)', marginBottom: '1rem' }}>
            Nuevo registro
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: '.75rem',
            marginBottom: '1rem',
          }}>
            {columns.filter(col => col.editable !== false).map(col => (
              <div key={col.key}>
                <label style={{
                  display: 'block', fontSize: '.7rem', fontWeight: 700,
                  color: 'var(--text-muted)', marginBottom: '.25rem',
                  textTransform: 'uppercase', letterSpacing: '.04em',
                }}>
                  {col.label}
                </label>
                {col.type === 'select' ? (
                  <select
                    className="input-themed"
                    style={{ width: '100%', padding: '.35rem .6rem', fontSize: '.875rem' }}
                    value={formData[col.key] ?? ''}
                    onChange={e => setFormData(d => ({ ...d, [col.key]: e.target.value }))}
                  >
                    <option value="">— seleccionar —</option>
                    {(col.options || []).map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    className="input-themed"
                    type={
                      col.type === 'number' ? 'number' :
                      col.type === 'date'   ? 'date'   :
                      col.type === 'email'  ? 'email'  : 'text'
                    }
                    style={{ width: '100%', padding: '.35rem .6rem', fontSize: '.875rem' }}
                    value={formData[col.key] ?? ''}
                    onChange={e => setFormData(d => ({
                      ...d,
                      [col.key]: col.type === 'number'
                        ? (e.target.value === '' ? '' : Number(e.target.value))
                        : e.target.value,
                    }))}
                    onKeyDown={e => {
                      if (e.key === 'Enter')  handleAdd()
                      if (e.key === 'Escape') closeAddForm()
                    }}
                  />
                )}
              </div>
            ))}
          </div>

          {insertError && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '.5rem',
              marginBottom: '.875rem', padding: '.6rem .875rem',
              background: 'rgba(239,68,68,.08)', border: '1px solid var(--danger)',
              borderRadius: '.4rem', fontSize: '.8rem',
            }}>
              <span style={{ color: 'var(--danger)', fontWeight: 700, whiteSpace: 'nowrap' }}>Error:</span>
              <span style={{ color: 'var(--danger)', flex: 1, wordBreak: 'break-word', fontFamily: 'monospace' }}>{insertError}</span>
            </div>
          )}

          <div style={{ display: 'flex', gap: '.625rem' }}>
            <Button size="sm" loading={adding} onClick={handleAdd}>
              <CheckIcon style={{ width: '.85rem', height: '.85rem' }} />
              Guardar
            </Button>
            <button className="btn-ghost" onClick={closeAddForm}>Cancelar</button>
          </div>
        </div>
      )}

      {/* ── Table ─────────────────────────────────────────────────── */}
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <span className="spinner" style={{ width: '2rem', height: '2rem' }} />
          </div>
        ) : filteredRows.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '.9rem' }}>
            {searchTerm ? 'Sin resultados para la búsqueda.' : 'Sin registros. Haz clic en "Nuevo" para agregar.'}
          </div>
        ) : (
          <table className="table-themed">
            <thead>
              <tr>
                {columns.map((col, idx) => (
                  <th key={col.key} style={{ width: col.width, whiteSpace: 'nowrap' }}>
                    {editingHeaderIdx === idx ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.25rem' }}>
                        <input
                          className="input-themed"
                          style={{ padding: '.2rem .4rem', fontSize: '.8rem', minWidth: 70 }}
                          value={headerDraft}
                          onChange={e => setHeaderDraft(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter')  renameColumn(idx, headerDraft)
                            if (e.key === 'Escape') setEditingHeaderIdx(null)
                          }}
                          autoFocus
                        />
                        <button className="btn-ghost" style={{ padding: '.2rem' }} onClick={() => renameColumn(idx, headerDraft)}>
                          <CheckIcon style={{ width: '.8rem', height: '.8rem', color: 'var(--success)' }} />
                        </button>
                        <button className="btn-ghost" style={{ padding: '.2rem' }} onClick={() => setEditingHeaderIdx(null)}>
                          <XMarkIcon style={{ width: '.8rem', height: '.8rem' }} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                        <span style={{ flex: 1 }}>{col.label}</span>
                        <button
                          className="btn-ghost"
                          style={{ padding: '.15rem', opacity: .45 }}
                          title="Renombrar columna"
                          onClick={() => { setEditingHeaderIdx(idx); setHeaderDraft(col.label) }}
                        >
                          <PencilIcon style={{ width: '.65rem', height: '.65rem' }} />
                        </button>
                        {col.builtin === false && (
                          <button
                            className="btn-ghost"
                            style={{ padding: '.15rem', opacity: .45 }}
                            title="Eliminar columna personalizada"
                            onClick={() => deleteColumn(idx)}
                          >
                            <XMarkIcon style={{ width: '.65rem', height: '.65rem', color: 'var(--danger)' }} />
                          </button>
                        )}
                      </div>
                    )}
                  </th>
                ))}

                {/* Add column header */}
                <th style={{ width: addingCol ? 220 : '2.5rem', transition: 'width .15s' }}>
                  {addingCol ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.25rem' }}>
                      <input
                        ref={addColInputRef}
                        className="input-themed"
                        style={{ flex: 1, padding: '.2rem .4rem', fontSize: '.8rem', minWidth: 80 }}
                        placeholder="Nombre columna…"
                        value={newColName}
                        onChange={e => setNewColName(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter')  addColumn()
                          if (e.key === 'Escape') { setAddingCol(false); setNewColName('') }
                        }}
                        autoFocus
                      />
                      <button className="btn-ghost" style={{ padding: '.2rem' }} onClick={addColumn}>
                        <CheckIcon style={{ width: '.8rem', height: '.8rem', color: 'var(--success)' }} />
                      </button>
                      <button className="btn-ghost" style={{ padding: '.2rem' }} onClick={() => { setAddingCol(false); setNewColName('') }}>
                        <XMarkIcon style={{ width: '.8rem', height: '.8rem' }} />
                      </button>
                    </div>
                  ) : (
                    <button
                      className="btn-ghost"
                      style={{ padding: '.25rem', width: '100%', display: 'flex', justifyContent: 'center' }}
                      title="Agregar columna personalizada"
                      onClick={() => setAddingCol(true)}
                    >
                      <PlusIcon style={{ width: '.85rem', height: '.85rem' }} />
                    </button>
                  )}
                </th>

                {allowDelete && <th style={{ width: '3rem' }} />}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map(row => (
                <tr key={row.id} className="animate-fadeIn">
                  {columns.map(col => (
                    <td key={col.key}>
                      <EditableCell
                        value={getCellValue(row, col)}
                        type={col.type || 'text'}
                        options={col.options}
                        editable={col.editable !== false}
                        formatter={col.formatter}
                        onSave={async newVal => saveCellValue(row, col, newVal)}
                      />
                    </td>
                  ))}
                  {/* empty cell for add-col column */}
                  <td />
                  {allowDelete && (
                    <td>
                      <button
                        className="btn-ghost"
                        style={{ padding: '.3rem', color: 'var(--danger)' }}
                        disabled={deletingId === row.id}
                        onClick={() => handleDelete(row.id)}
                        title="Eliminar fila"
                      >
                        {deletingId === row.id
                          ? <span className="spinner" />
                          : <TrashIcon style={{ width: '.9rem', height: '.9rem' }} />
                        }
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <div style={{ padding: '.6rem 1.25rem', borderTop: '1px solid var(--border)', fontSize: '.75rem', color: 'var(--text-muted)' }}>
        Doble clic en celda para editar · Lápiz en encabezado para renombrar · + para agregar columna
      </div>
    </div>
  )
}
