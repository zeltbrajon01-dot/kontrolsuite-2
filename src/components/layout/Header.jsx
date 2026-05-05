import React from 'react'
import { useLocation } from 'react-router-dom'
import { BellIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'

const ROUTE_TITLES = {
  '/dashboard':    'Dashboard',
  '/clientes':     'Clientes',
  '/ventas':       'Ventas',
  '/inventario':   'Inventario',
  '/finanzas':     'Finanzas',
  '/rrhh':         'RRHH',
  '/reportes':     'Reportes',
  '/configuracion':'Configuración',
}

export default function Header({ sidebarWidth }) {
  const location = useLocation()
  const { perfil } = useAuth()
  const { theme, setTheme, themes } = useTheme()

  const title = ROUTE_TITLES[location.pathname] || 'KontrolSuite'

  return (
    <header style={{
      position:    'fixed',
      top:         0,
      left:        sidebarWidth,
      right:       0,
      height:      56,
      background:  'var(--surface)',
      borderBottom:'1px solid var(--border)',
      display:     'flex',
      alignItems:  'center',
      justifyContent: 'space-between',
      padding:     '0 1.5rem',
      zIndex:      30,
      transition:  'left .2s ease-in-out',
    }}>
      {/* Left: page title */}
      <h1 style={{
        margin: 0,
        fontSize: '1.1rem',
        fontWeight: 700,
        color: 'var(--text)',
      }}>
        {title}
      </h1>

      {/* Right: search + theme + notifications + avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
        {/* Search bar */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <MagnifyingGlassIcon style={{
            position: 'absolute', left: '.6rem',
            width: '.9rem', height: '.9rem',
            color: 'var(--text-muted)',
            pointerEvents: 'none',
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
          color: 'var(--text-muted)', padding: '.3rem',
          borderRadius: '.375rem',
        }}>
          <BellIcon style={{ width: '1.15rem', height: '1.15rem' }} />
        </button>

        {/* Avatar */}
        <div style={{
          width: 32, height: 32,
          borderRadius: '50%',
          background: 'var(--primary)',
          color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '.8rem', fontWeight: 700,
          cursor: 'pointer',
          flexShrink: 0,
        }}>
          {perfil?.nombre?.[0]?.toUpperCase() || '?'}
        </div>
      </div>
    </header>
  )
}
