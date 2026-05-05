import React, { createContext, useContext, useEffect, useRef, useState } from 'react'
import supabase from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session,  setSession]  = useState(null)
  const [perfil,   setPerfil]   = useState(null)
  const [empresa,  setEmpresa]  = useState(null)
  const [loading,  setLoading]  = useState(true)

  // Guard: evita que onAuthStateChange llame loadPerfil cuando login/register
  // ya lo están haciendo — previene la race condition de doble setState.
  const perfilLoadedForRef = useRef(null)

  // ─────────────────────────────────────────────────────────────────
  // loadPerfil: busca el perfil + empresa. Verifica que empresa_id
  // exista y que la empresa esté en la tabla. Retorna el perfil o null.
  // ─────────────────────────────────────────────────────────────────
  const loadPerfil = async (userId) => {
    const { data, error } = await supabase
      .from('perfiles')
      .select('*, empresa:empresas(*)')
      .eq('id', userId)
      .single()

    if (error || !data) return null
    if (!data.empresa_id || !data.empresa) return null   // empresa_id nulo o empresa borrada

    setPerfil(data)
    setEmpresa(data.empresa)
    perfilLoadedForRef.current = userId
    return data
  }

  const clearAuth = () => {
    setSession(null)
    setPerfil(null)
    setEmpresa(null)
    perfilLoadedForRef.current = null
  }

  // ─────────────────────────────────────────────────────────────────
  // Inicialización: revisar sesión activa al montar.
  // onAuthStateChange solo actúa en SIGNED_OUT y TOKEN_REFRESHED
  // para no interferir con los flujos explícitos de login/register.
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mounted) return
      setSession(s)
      if (s?.user) {
        loadPerfil(s.user.id).finally(() => {
          if (mounted) setLoading(false)
        })
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, s) => {
      if (!mounted) return

      if (event === 'SIGNED_OUT') {
        clearAuth()
        setLoading(false)
        return
      }

      if (event === 'TOKEN_REFRESHED') {
        setSession(s)
        return
      }

      // SIGNED_IN después de confirmar email (el usuario nunca pasó por login)
      if (event === 'SIGNED_IN' && s?.user && perfilLoadedForRef.current !== s.user.id) {
        setSession(s)
        loadPerfil(s.user.id).finally(() => {
          if (mounted) setLoading(false)
        })
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ─────────────────────────────────────────────────────────────────
  // register: crea auth user → empresa exclusiva → perfil con
  // empresa_id único. Nunca comparte empresa_id entre usuarios.
  // ─────────────────────────────────────────────────────────────────
  const register = async ({ email, password, nombre, nombreEmpresa }) => {
    // 1. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email.trim().toLowerCase(),
      password,
      options: { data: { nombre: nombre.trim() } },
    })

    if (authError) return { error: authError }

    const user = authData?.user
    if (!user?.id) return { error: { message: 'No se pudo crear el usuario. Intenta de nuevo.' } }

    // Supabase devuelve identities=[] si el email ya existe (sin exponer que la cuenta existe)
    if (user.identities?.length === 0) {
      return { error: { message: 'Ya existe una cuenta con este correo electrónico.' } }
    }

    // 2. Si no hay sesión: Supabase requiere confirmación de email.
    //    Los INSERTs en empresas/perfiles no se pueden hacer aún sin sesión activa.
    //    Retornar requiresConfirmation para que la UI informe al usuario.
    if (!authData.session) {
      return { data: { requiresConfirmation: true } }
    }

    // 3. Crear empresa exclusiva — empresa_id único por usuario, nunca compartido
    const { data: empresaData, error: empresaError } = await supabase
      .from('empresas')
      .insert({
        nombre: (nombreEmpresa || `Empresa de ${nombre}`).trim(),
        config: {},
      })
      .select()
      .single()

    if (empresaError) {
      await supabase.auth.signOut()
      return { error: { message: `Error al crear empresa: ${empresaError.message}` } }
    }

    // 4. Crear perfil vinculado al empresa_id único recién creado
    const { error: perfilError } = await supabase
      .from('perfiles')
      .insert({
        id:         user.id,
        empresa_id: empresaData.id,     // único, nunca compartido
        nombre:     nombre.trim(),
        email:      email.trim().toLowerCase(),
        rol:        'admin',
      })

    if (perfilError) {
      // Limpiar empresa huérfana si el perfil falla
      await supabase.from('empresas').delete().eq('id', empresaData.id)
      await supabase.auth.signOut()
      return { error: { message: `Error al crear perfil: ${perfilError.message}` } }
    }

    // 5. Cargar perfil en el contexto y actualizar sesión
    await loadPerfil(user.id)
    setSession(authData.session)

    return { data: { user, empresa: empresaData } }
  }

  // ─────────────────────────────────────────────────────────────────
  // login: autentica → carga perfil → verifica empresa_id antes
  // de dar acceso. Si algo falla, hace signOut y retorna error.
  // ─────────────────────────────────────────────────────────────────
  const login = async ({ email, password }) => {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email:    email.trim().toLowerCase(),
      password,
    })

    if (authError) return { error: authError }

    // Verificar perfil + empresa_id antes de dar acceso
    const perfilData = await loadPerfil(authData.user.id)

    if (!perfilData) {
      await supabase.auth.signOut()
      return {
        error: {
          message: 'No se encontró un perfil activo para este usuario. Verifica tu correo o contacta soporte.',
        },
      }
    }

    if (!perfilData.empresa_id) {
      await supabase.auth.signOut()
      return {
        error: { message: 'Esta cuenta no tiene una empresa asignada. Contacta a soporte.' },
      }
    }

    if (!perfilData.empresa) {
      await supabase.auth.signOut()
      return {
        error: { message: 'La empresa de esta cuenta no se encontró. Contacta a soporte.' },
      }
    }

    setSession(authData.session)
    return { data: authData }
  }

  // ─────────────────────────────────────────────────────────────────
  // logout
  // ─────────────────────────────────────────────────────────────────
  const logout = async () => {
    await supabase.auth.signOut()
    clearAuth()
  }

  // ─────────────────────────────────────────────────────────────────
  // updateEmpresaConfig
  // ─────────────────────────────────────────────────────────────────
  const updateEmpresaConfig = async (updates) => {
    if (!empresa) return { error: { message: 'No hay empresa activa' } }
    const { data, error } = await supabase
      .from('empresas')
      .update(updates)
      .eq('id', empresa.id)
      .select()
      .single()
    if (!error) setEmpresa(data)
    return { data, error }
  }

  const value = {
    session,
    perfil,
    empresa,
    loading,
    // isAuthenticated requiere sesión + empresa cargada (empresa_id verificado)
    isAuthenticated: !!session && !!empresa,
    empresaId:       empresa?.id ?? null,
    rol:             perfil?.rol ?? null,
    register,
    login,
    logout,
    updateEmpresaConfig,
    reloadPerfil: () => session?.user && loadPerfil(session.user.id),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
