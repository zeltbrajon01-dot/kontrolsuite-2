import React, { useState } from 'react'
import { PlusIcon, TrashIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { useSupabaseTable } from '../../hooks/useSupabaseTable'
import EditableCell from './EditableCell'
import Button from './Button'

/**
 * Full-featured editable table backed by Supabase.
 *
 * columns: [
 *   { key: 'nombre', label: 'Nombre', type: 'text', editable: true, width: '200px' },
 *   { key: 'estado', label: 'Estado', type: 'select', options: [{value:'activo',label:'Activo'}], editable: true },
 *   { key: 'monto',  label: 'Monto',  type: 'number', editable: true, formatter: v => `$${v}` },
 * ]
 */
export default function EditableTable({
  tableName,
  empresaId,
  columns = [],
  defaultRow = {},
  filters = [],
  title,
  allowAdd = true,
  allowDelete = true,
  orderBy = 'created_at',
}) {
  const { rows, loading, error, updateRow, addRow, deleteRow, refetch } = useSupabaseTable(tableName, {
    empresaId,
    filters,
    orderBy,
  })

  const [adding, setAdding] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')

  const filteredRows = searchTerm
    ? rows.filter(r =>
        columns.some(col => String(r[col.key] ?? '').toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : rows

  const handleAdd = async () => {
    setAdding(true)
    await addRow(defaultRow)
    setAdding(false)
  }

  const handleDelete = async (id) => {
    setDeletingId(id)
    await deleteRow(id)
    setDeletingId(null)
  }

  if (error) {
    return (
      <div style={{ color: 'var(--danger)', padding: '1rem' }}>
        Error al cargar datos: {error.message}
      </div>
    )
  }

  return (
    <div className="card" style={{ overflow: 'hidden' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '1rem 1.25rem', borderBottom: '1px solid var(--border)',
        flexWrap: 'wrap', gap: '.75rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
          {title && <h3 style={{ margin: 0, fontWeight: 700, fontSize: '1rem', color: 'var(--text)' }}>{title}</h3>}
          <span style={{
            background: 'var(--primary-light)', color: 'var(--primary)',
            borderRadius: '9999px', fontSize: '.75rem', fontWeight: 700,
            padding: '.15rem .55rem',
          }}>
            {filteredRows.length}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '.5rem', alignItems: 'center' }}>
          <input
            className="input-themed"
            style={{ width: '200px', padding: '.4rem .75rem', fontSize: '.8rem' }}
            placeholder="Buscar..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <button
            className="btn-ghost"
            onClick={refetch}
            title="Actualizar"
            style={{ padding: '.45rem' }}
          >
            <ArrowPathIcon style={{ width: '1rem', height: '1rem' }} />
          </button>
          {allowAdd && (
            <Button size="sm" loading={adding} onClick={handleAdd}>
              <PlusIcon style={{ width: '.9rem', height: '.9rem' }} />
              Nuevo
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto' }}>
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <span className="spinner" style={{ width: '2rem', height: '2rem' }} />
          </div>
        ) : filteredRows.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '.9rem' }}>
            {searchTerm ? 'Sin resultados para la búsqueda.' : 'No hay registros aún. Haz clic en "Nuevo" para agregar.'}
          </div>
        ) : (
          <table className="table-themed">
            <thead>
              <tr>
                {columns.map(col => (
                  <th key={col.key} style={{ width: col.width }}>
                    {col.label}
                  </th>
                ))}
                {allowDelete && <th style={{ width: '3rem' }} />}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map(row => (
                <tr key={row.id} className="animate-fadeIn">
                  {columns.map(col => (
                    <td key={col.key}>
                      <EditableCell
                        value={row[col.key]}
                        type={col.type || 'text'}
                        options={col.options}
                        editable={col.editable !== false}
                        formatter={col.formatter}
                        onSave={async (newVal) => {
                          await updateRow(row.id, { [col.key]: newVal })
                        }}
                      />
                    </td>
                  ))}
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

      {/* Footer */}
      <div style={{
        padding: '.6rem 1.25rem',
        borderTop: '1px solid var(--border)',
        fontSize: '.75rem',
        color: 'var(--text-muted)',
      }}>
        Doble clic en cualquier celda para editar · Los cambios se guardan automáticamente
      </div>
    </div>
  )
}
