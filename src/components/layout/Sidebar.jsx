import React, { useState, useRef, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import {
  HomeIcon, UsersIcon, ShoppingCartIcon, ArchiveBoxIcon,
  BanknotesIcon, UserGroupIcon, ChartBarIcon, Cog6ToothIcon,
  ChartPieIcon, CubeIcon, ClipboardDocumentListIcon,
  WrenchScrewdriverIcon, ChatBubbleLeftRightIcon,
  ShieldCheckIcon, SparklesIcon,
  Bars3Icon, XMarkIcon,
} from '@heroicons/react/24/outline'
import { useModulos } from '../../contexts/ModulosContext'
import { useAuth } from '../../contexts/AuthContext'
import { useTheme } from '../../contexts/ThemeContext'
import { FASE_CONFIG, FASE_LABELS } from '../../config/modulos'

const ICON_MAP = {
  HomeIcon, UsersIcon, ShoppingCartIcon, ArchiveBoxIcon,
  BanknotesIcon, UserGroupIcon, ChartBarIcon, Cog6ToothIcon,
  ChartPieIcon, CubeIcon, ClipboardDocumentListIcon,
  WrenchScrewdriverIcon, ChatBubbleLeftRightIcon,
  ShieldCheckIcon, SparklesIcon,
}

export default function Sidebar({ collapsed, onToggle, isMobile, mobileOpen }) {
  const { modulosActivos, reorderModulos } = useModulos()
  const { perfil, logout }                 = useAuth()
  const { theme }                          = useTheme()
  const logoSrc = theme === 'claro' ? '/logo-negro.png' : '/logo-blanco.png'
  // negro-pro has a black sidebar but light content — sidebar logo stays white

  const [items, setItems]       = useState(modulosActivos)
  const dragIdxRef              = useRef(null)
  const [dragging, setDragging] = useState(false)

  useEffect(() => { setItems(modulosActivos) }, [modulosActivos])

  const onDragStart = (e, index) => {
    dragIdxRef.current = index
    setDragging(true)
    e.dataTransfer.setData('text/plain', String(index))
    e.dataTransfer.effectAllowed = 'move'
  }

  const onDragOver = (e, index) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    const from = dragIdxRef.current
    if (from === null || from === index) return
    const next = [...items]
    const [moved] = next.splice(from, 1)
    next.splice(index, 0, moved)
    dragIdxRef.current = index
    setItems(next)
  }

  const onDrop = (e) => {
    e.preventDefault()
    reorderModulos(items)
  }

  const onDragEnd = () => {
    dragIdxRef.current = null
    setDragging(false)
  }

  // Compute phase separators: track which fase we've rendered so far
  let lastFase = null

  return (
    <aside
      style={{
        width:         isMobile ? 260 : (collapsed ? 64 : 240),
        transition:    'width .2s ease-in-out, transform .25s ease-in-out',
        transform:     isMobile ? (mobileOpen ? 'translateX(0)' : 'translateX(-100%)') : 'translateX(0)',
        background:    'var(--sidebar)',
        borderRight:   '1px solid var(--border)',
        height:        '100vh',
        position:      'fixed',
        top:           0,
        left:          0,
        display:       'flex',
        flexDirection: 'column',
        zIndex:        39,
        overflow:      'hidden',
        flexShrink:    0,
      }}
    >
      {/* ── Brand / toggle ────────────────────────────────────── */}
      <div
        style={{
          paddingTop:     '24px',
          paddingBottom:  '20px',
          paddingLeft:    collapsed && !isMobile ? '.75rem' : '1rem',
          paddingRight:   collapsed && !isMobile ? '.75rem' : '1rem',
          borderBottom:   '1px solid var(--border)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: collapsed && !isMobile ? 'center' : 'space-between',
          flexShrink:     0,
        }}
      >
        {(!collapsed || isMobile) && (
          <div style={{ display: 'flex', justifyContent: 'center', flex: 1 }}>
            <img
              src={logoSrc}
              alt="KontrolSuite"
              style={{ width: '110px', height: 'auto', display: 'block' }}
            />
          </div>
        )}
        <button
          onClick={onToggle}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--sidebar-text)', padding: '.3rem', borderRadius: '.375rem', transition: 'background .15s', flexShrink: 0 }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--sidebar-active)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
          title={collapsed && !isMobile ? 'Expandir' : 'Cerrar'}
        >
          {collapsed && !isMobile
            ? <Bars3Icon style={{ width: '1.1rem', height: '1.1rem' }} />
            : <XMarkIcon style={{ width: '1.1rem', height: '1.1rem' }} />
          }
        </button>
      </div>

      {/* ── Nav list ──────────────────────────────────────────── */}
      <ul style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '.5rem', margin: 0, listStyle: 'none' }}>
        {items.map((mod, index) => {
          const fase      = FASE_CONFIG[mod.modulo_id] ?? 0
          const expanded  = !collapsed || isMobile
          const showLabel = expanded && fase !== 0 && fase !== lastFase
          lastFase = fase
          const Icon = ICON_MAP[mod.icono] || HomeIcon

          return (
            <React.Fragment key={mod.modulo_id}>
              {/* Phase label — not draggable, CSS display toggle */}
              <li
                style={{
                  display:      showLabel ? 'block' : 'none',
                  padding:      '.75rem .75rem .2rem',
                  listStyle:    'none',
                  pointerEvents: 'none',
                }}
              >
                <span style={{
                  fontSize:       '.6rem',
                  fontWeight:     700,
                  textTransform:  'uppercase',
                  letterSpacing:  '.1em',
                  color:          'var(--sidebar-text)',
                  opacity:        .45,
                }}>
                  {FASE_LABELS[fase]}
                </span>
              </li>

              <li
                draggable={expanded && !isMobile}
                onDragStart={e => onDragStart(e, index)}
                onDragOver={e  => onDragOver(e, index)}
                onDrop={onDrop}
                onDragEnd={onDragEnd}
                style={{ opacity: dragging && dragIdxRef.current === index ? 0.4 : 1, transition: 'opacity .15s', marginBottom: '.1rem' }}
              >
                <NavLink
                  to={mod.ruta}
                  className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
                  title={!expanded ? mod.nombre : undefined}
                  style={{ userSelect: 'none' }}
                >
                  {expanded && !isMobile && (
                    <span style={{ cursor: 'grab', color: 'var(--sidebar-text)', opacity: .3, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                      <Bars3Icon style={{ width: '.75rem', height: '.75rem' }} />
                    </span>
                  )}
                  <Icon style={{ width: '1.1rem', height: '1.1rem', flexShrink: 0 }} />
                  {expanded && (
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {mod.nombre}
                    </span>
                  )}
                </NavLink>
              </li>
            </React.Fragment>
          )
        })}
      </ul>

      {/* ── Footer: user + logout ─────────────────────────────── */}
      <div style={{ padding: '.75rem .5rem', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        {(!collapsed || isMobile) && perfil && (
          <div style={{ padding: '.4rem .75rem', marginBottom: '.4rem' }}>
            <div style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--sidebar-text-act)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {perfil.nombre}
            </div>
            <div style={{ fontSize: '.7rem', color: 'var(--sidebar-text)', opacity: .7, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {perfil.email}
            </div>
          </div>
        )}
        <button
          onClick={logout}
          className="sidebar-link"
          style={{ width: '100%', background: 'none', border: 'none', justifyContent: collapsed && !isMobile ? 'center' : 'flex-start' }}
          title={collapsed && !isMobile ? 'Cerrar sesión' : undefined}
        >
          <svg style={{ width: '1.1rem', height: '1.1rem', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {(!collapsed || isMobile) && <span>Cerrar sesión</span>}
        </button>
      </div>
    </aside>
  )
}
