import { useState, useEffect, useCallback } from 'react'
import supabase from '../lib/supabase'

/**
 * Generic hook for CRUD on a Supabase table scoped to an empresa_id.
 *
 * @param {string} tableName  - Supabase table name
 * @param {object} opts
 * @param {string} opts.empresaId  - filter rows by empresa_id
 * @param {Array}  opts.filters    - extra filters [{ column, value }]
 * @param {string} opts.orderBy    - column to order by (default 'created_at')
 * @param {boolean} opts.ascending - sort order (default true)
 */
export function useSupabaseTable(tableName, { empresaId, filters = [], orderBy = 'created_at', ascending = true } = {}) {
  const [rows, setRows]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(null)

  const fetchData = useCallback(async () => {
    if (!tableName) return   // guard aquí evita el warning de eslint en useEffect
    setLoading(true)
    setError(null)

    let query = supabase.from(tableName).select('*')

    if (empresaId) query = query.eq('empresa_id', empresaId)
    filters.forEach(f => { query = query.eq(f.column, f.value) })
    query = query.order(orderBy, { ascending })

    const { data, error: err } = await query

    if (err) setError(err)
    else setRows(data || [])

    setLoading(false)
  }, [tableName, empresaId, orderBy, ascending, JSON.stringify(filters)])  // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ── Update a single row ────────────────────────────────────────
  const updateRow = async (id, updates) => {
    const { data, error: err } = await supabase
      .from(tableName)
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (!err) {
      setRows(prev => prev.map(r => r.id === id ? { ...r, ...data } : r))
    }
    return { data, error: err }
  }

  // ── Insert a new row ───────────────────────────────────────────
  const addRow = async (newRow) => {
    const payload = empresaId ? { ...newRow, empresa_id: empresaId } : newRow
    const { data, error: err } = await supabase
      .from(tableName)
      .insert(payload)
      .select()
      .single()

    if (!err) setRows(prev => [...prev, data])
    return { data, error: err }
  }

  // ── Delete a row ───────────────────────────────────────────────
  const deleteRow = async (id) => {
    const { error: err } = await supabase
      .from(tableName)
      .delete()
      .eq('id', id)

    if (!err) setRows(prev => prev.filter(r => r.id !== id))
    return { error: err }
  }

  return {
    rows,
    loading,
    error,
    updateRow,
    addRow,
    deleteRow,
    refetch: fetchData,
  }
}
