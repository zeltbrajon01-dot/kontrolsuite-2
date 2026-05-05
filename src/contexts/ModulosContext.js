import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import supabase from '../lib/supabase'
import { MODULOS_DEFAULT } from '../config/modulos'
import { useAuth } from './AuthContext'

const ModulosContext = createContext(null)

export function ModulosProvider({ children }) {
  const { empresaId, isAuthenticated } = useAuth()
  const [modulos, setModulos]   = useState([])
  const [loading, setLoading]   = useState(true)

  // ── Load or initialize modules for this empresa ────────────────
  const loadModulos = useCallback(async () => {
    if (!empresaId) return
    setLoading(true)

    const { data, error } = await supabase
      .from('modulos_empresa')
      .select('*')
      .eq('empresa_id', empresaId)
      .order('orden', { ascending: true })

    if (error) {
      setLoading(false)
      return
    }

    if (!data || data.length === 0) {
      // First time: seed defaults for this empresa
      const seeds = MODULOS_DEFAULT.map(m => ({ ...m, empresa_id: empresaId }))
      const { data: inserted } = await supabase
        .from('modulos_empresa')
        .insert(seeds)
        .select()
      setModulos(inserted || seeds)
    } else {
      setModulos(data)
    }

    setLoading(false)
  }, [empresaId])

  useEffect(() => {
    if (isAuthenticated && empresaId) {
      loadModulos()
    } else {
      setModulos([])
      setLoading(false)
    }
  }, [isAuthenticated, empresaId, loadModulos])

  // ── Toggle activo ──────────────────────────────────────────────
  const toggleModulo = async (moduloId) => {
    const mod = modulos.find(m => m.modulo_id === moduloId)
    if (!mod) return

    const nuevoActivo = !mod.activo
    setModulos(prev => prev.map(m => m.modulo_id === moduloId ? { ...m, activo: nuevoActivo } : m))

    await supabase
      .from('modulos_empresa')
      .update({ activo: nuevoActivo })
      .eq('empresa_id', empresaId)
      .eq('modulo_id', moduloId)
  }

  // ── Reorder (persist new orden values) ────────────────────────
  const reorderModulos = async (newOrder) => {
    const withOrder = newOrder.map((m, i) => ({ ...m, orden: i }))
    setModulos(withOrder)

    const updates = withOrder.map(m =>
      supabase
        .from('modulos_empresa')
        .update({ orden: m.orden })
        .eq('empresa_id', empresaId)
        .eq('modulo_id', m.modulo_id)
    )
    await Promise.all(updates)
  }

  // ── Update nombre / icono / ruta ───────────────────────────────
  const updateModulo = async (moduloId, changes) => {
    setModulos(prev => prev.map(m => m.modulo_id === moduloId ? { ...m, ...changes } : m))

    await supabase
      .from('modulos_empresa')
      .update(changes)
      .eq('empresa_id', empresaId)
      .eq('modulo_id', moduloId)
  }

  const modulosActivos = modulos.filter(m => m.activo)

  return (
    <ModulosContext.Provider value={{
      modulos,
      modulosActivos,
      loading,
      toggleModulo,
      reorderModulos,
      updateModulo,
      reloadModulos: loadModulos,
    }}>
      {children}
    </ModulosContext.Provider>
  )
}

export function useModulos() {
  const ctx = useContext(ModulosContext)
  if (!ctx) throw new Error('useModulos must be used inside ModulosProvider')
  return ctx
}
