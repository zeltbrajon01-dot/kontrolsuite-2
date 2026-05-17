import React, { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { BellIcon, MagnifyingGlassIcon, Bars3Icon } from '@heroicons/react/24/outline'
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

export default function Header({ sidebarWidth, isMobile, onHamburger }) {
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
      padding:        isMobile ? '0 .875rem' : '0 1.5rem',
      zIndex:         30,
      transition:     'left .2s ease-in-out',
      gap:            '.5rem',
    }}>

      {/* Left: hamburger (mobile) + page title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', minWidth: 0 }}>
        {isMobile && (
          <button
            onClick={onHamburger}
            aria-label="Abrir menú"
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--text)', padding: '.3rem', borderRadius: '.375rem',
              display: 'flex', alignItems: 'center', flexShrink: 0,
              minWidth: 44, minHeight: 44, justifyContent: 'center',
            }}
          >
            <Bars3Icon style={{ width: '1.35rem', height: '1.35rem' }} />
          </button>
        )}
        <h1 style={{
          margin: 0,
          fontSize: isMobile ? '1rem' : '1.1rem',
          fontWeight: 700,
          color: 'var(--text)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {title}
        </h1>
      </div>

      {/* Right: controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '.5rem' : '.75rem', flexShrink: 0 }}>

        {/* Search — hidden on mobile */}
        {!isMobile && (
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
        )}

        {/* Theme picker — hidden on mobile */}
        {!isMobile && (
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
        )}

        {/* Notifications */}
        <button style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--text-muted)', padding: '.3rem', borderRadius: '.375rem',
          minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <BellIcon style={{ width: '1.15rem', height: '1.15rem' }} />
        </button>

        {/* Avatar + Profile dropdown */}
        <div ref={profileRef} style={{ position: 'relative' }}>
          <div
            onClick={() => setShowProfile(v => !v)}
            title={perfil?.nombre || 'Perfil'}
            style={{
              width: 36, height: 36, borderRadius: '50%',
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
                width: isMobile ? 'calc(100vw - 1.75rem)' : 276,
                maxWidth: 320,
                zIndex: 200,
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

              {/* Theme picker on mobile — inside profile card */}
              {isMobile && (
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: '.75rem', marginBottom: '.75rem' }}>
                  <label style={{ display: 'block', fontSize: '.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '.4rem' }}>Tema</label>
                  <select
                    value={theme}
                    onChange={e => setTheme(e.target.value)}
                    className="input-themed"
                    style={{ width: '100%', padding: '.45rem .6rem', fontSize: '.82rem' }}
                  >
                    {themes.map(t => (
                      <option key={t.id} value={t.id}>{t.nombre}</option>
                    ))}
                  </select>
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
