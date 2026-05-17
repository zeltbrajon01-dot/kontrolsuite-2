import React, { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { BellIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'

const ROUTE_TITLES = {
  '/dashboard':     'Dashboard',
  '/clientes':      'Clientes',
  '/ventas':        'Ventas & CRM',
  '/inventario':    'Inventario',
  '/finanzas':      'Finanzas',
  '/rrhh':          'Recursos Humanos',
  '/proyectos':     'Proyectos',
  '/compras':       'Compras',
  '/produccion':    'Producción',
  '/comunicaciones':'Comunicaciones',
  '/reportes':      'Reportes',
  '/configuracion': 'Configuración',
  '/ia':            'Asistente IA',
  '/legal':         'Legal',
  '/sistema':       'Sistema',
}

export default function Header({ sidebarWidth }) {
  const location              = useLocation()
  const navigate              = useNavigate()
  const { perfil }            = useAuth()
  const { theme, setTheme, themes } = useTheme()
  const [showProfile, setShowProfile] = useState(false)
  const profileRef            = useRef(null)

  const title = ROUTE_TITLES[location.pathname] || 'KontrolSuite'

  useEffect(() => {
    if (!showProfile) return
    const handleClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showProfile])

  const initial = perfil?.nombre?.[0]?.toUpperCase() || '?'

  return (
    <header style={{
      position:       'fixed',
      top:            0,
      left:           sidebarWidth,
      right:          0,
      height:         56,
      background:     'var(--surface)',
      borderBottom:   '1px solid var(--border)',
      display:        'flex',
      alignItems:     'center',
      justifyContent: 'space-between',
      padding:        '0 1.5rem',
      zIndex:         30,
      transition:     'left .2s ease-in-out',
    }}>

      {/* Left: page title */}
      <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>
        {title}
      </h1>

      {/* Right: controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>

        {/* Search */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <MagnifyingGlassIcon style={{
            position: 'absolute', left: '.6rem',
            width: '.9rem', height: '.9rem',
            color: 'var(--text-muted)', pointerEvents: 'none',
          }} />
          <input
            className="input-themed"
            style={{ paddingLeft: '2rem', width: 180, fontSize: '.8rem', padding: '.35rem .75rem .35rem 2rem' }}
            placeholder="Buscar..."
          />
        </div>

        {/* Theme picker */}
        <select
          value={theme}
          onChange={e => setTheme(e.target.value)}
          className="input-themed"
          style={{ width: 'auto', padding: '.35rem .6rem', fontSize: '.75rem' }}
        >
          {themes.map(t => (
            <option key={t.id} value={t.id}>{t.nombre}</option>
          ))}
        </select>

        {/* Notifications */}
        <button style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', padding: '.3rem', borderRadius: '.375rem',
        }}>
          <BellIcon style={{ width: '1.15rem', height: '1.15rem' }} />
        </button>

        {/* Avatar + Profile dropdown */}
        <div ref={profileRef} style={{ position: 'relative' }}>
          <div
            onClick={() => setShowProfile(v => !v)}
            title={perfil?.nombre || 'Perfil'}
            style={{
              width: 32, height: 32, borderRadius: '50%',
              background: 'var(--primary)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '.8rem', fontWeight: 700, cursor: 'pointer', flexShrink: 0,
              overflow: 'hidden',
              outline: showProfile ? '2px solid var(--primary)' : 'none',
              outlineOffset: 2,
              transition: 'outline .15s',
            }}
          >
            {perfil?.foto_url
              ? <img src={perfil.foto_url} alt={perfil.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : initial
            }
          </div>

          {showProfile && (
            <div
              className="card animate-fadeIn"
              style={{
                position: 'absolute', top: 44, right: 0,
                width: 276, zIndex: 200,
                padding: '1.25rem',
              }}
            >
              {/* Large avatar */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.65rem', marginBottom: '1rem' }}>
                <div style={{
                  width: 70, height: 70, borderRadius: '50%',
                  background: 'var(--primary)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1.65rem', fontWeight: 800, overflow: 'hidden', flexShrink: 0,
                }}>
                  {perfil?.foto_url
                    ? <img src={perfil.foto_url} alt={perfil.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : initial
                  }
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: '.95rem', color: 'var(--text)', lineHeight: 1.3 }}>
                    {perfil?.nombre}
                  </div>
                  <div style={{ fontSize: '.77rem', color: 'var(--text-muted)', marginTop: '.15rem' }}>
                    {perfil?.email}
                  </div>
                </div>
              </div>

              {/* Details: puesto / area / rol */}
              {(perfil?.puesto || perfil?.area || perfil?.rol) && (
                <div style={{
                  borderTop: '1px solid var(--border)', paddingTop: '.75rem',
                  marginBottom: '.75rem', display: 'flex', flexDirection: 'column', gap: '.3rem',
                }}>
                  {perfil?.puesto && (
                    <div style={{ display: 'flex', gap: '.5rem', fontSize: '.81rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 600, minWidth: 54 }}>Puesto</span>
                      <span style={{ color: 'var(--text)' }}>{perfil.puesto}</span>
                    </div>
                  )}
                  {perfil?.area && (
                    <div style={{ display: 'flex', gap: '.5rem', fontSize: '.81rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 600, minWidth: 54 }}>Área</span>
                      <span style={{ color: 'var(--text)' }}>{perfil.area}</span>
                    </div>
                  )}
                  {perfil?.rol && (
                    <div style={{ display: 'flex', gap: '.5rem', fontSize: '.81rem' }}>
                      <span style={{ color: 'var(--text-muted)', fontWeight: 600, minWidth: 54 }}>Rol</span>
                      <span style={{ color: 'var(--text)', textTransform: 'capitalize' }}>{perfil.rol}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Semblanza */}
              {perfil?.semblanza && (
                <div style={{
                  borderTop: '1px solid var(--border)', paddingTop: '.75rem',
                  marginBottom: '.75rem', fontSize: '.8rem',
                  color: 'var(--text-muted)', lineHeight: 1.55,
                }}>
                  {perfil.semblanza}
                </div>
              )}

              {/* Action */}
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '.75rem' }}>
                <button
                  className="btn-ghost"
                  style={{ width: '100%', justifyContent: 'center', fontSize: '.82rem' }}
                  onClick={() => { setShowProfile(false); navigate('/configuracion') }}
                >
                  Editar perfil
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
