import React from 'react'
import { NavLink } from 'react-router-dom'
import { Reorder, useDragControls, motion } from 'framer-motion'
import {
  HomeIcon, UsersIcon, ShoppingCartIcon, ArchiveBoxIcon,
  BanknotesIcon, UserGroupIcon, ChartBarIcon, Cog6ToothIcon,
  Bars3Icon, XMarkIcon,
} from '@heroicons/react/24/outline'
import { useModulos } from '../../contexts/ModulosContext'
import { useAuth } from '../../contexts/AuthContext'

const ICON_MAP = {
  HomeIcon:         HomeIcon,
  UsersIcon:        UsersIcon,
  ShoppingCartIcon: ShoppingCartIcon,
  ArchiveBoxIcon:   ArchiveBoxIcon,
  BanknotesIcon:    BanknotesIcon,
  UserGroupIcon:    UserGroupIcon,
  ChartBarIcon:     ChartBarIcon,
  Cog6ToothIcon:    Cog6ToothIcon,
}

function ModuloItem({ modulo, collapsed }) {
  const controls = useDragControls()
  const Icon = ICON_MAP[modulo.icono] || HomeIcon

  return (
    <Reorder.Item
      value={modulo}
      dragListener={false}
      dragControls={controls}
      style={{ listStyle: 'none' }}
      whileDrag={{ scale: 1.02, boxShadow: '0 8px 24px rgba(0,0,0,.3)' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '.25rem' }}>
        {/* Drag handle (only when expanded) */}
        {!collapsed && (
          <span
            onPointerDown={(e) => controls.start(e)}
            style={{
              cursor: 'grab', color: 'var(--sidebar-text)', opacity: .4,
              padding: '.4rem .2rem', flexShrink: 0, touchAction: 'none',
            }}
            title="Arrastrar para reordenar"
          >
            <Bars3Icon style={{ width: '.9rem', height: '.9rem' }} />
          </span>
        )}

        <NavLink
          to={modulo.ruta}
          className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
          style={{ flex: 1 }}
          title={collapsed ? modulo.nombre : undefined}
        >
          <Icon style={{ width: '1.1rem', height: '1.1rem', flexShrink: 0 }} />
          {!collapsed && <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{modulo.nombre}</span>}
        </NavLink>
      </div>
    </Reorder.Item>
  )
}

export default function Sidebar({ collapsed, onToggle }) {
  const { modulosActivos, reorderModulos } = useModulos()
  const { empresa, perfil, logout } = useAuth()

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: .2, ease: 'easeInOut' }}
      style={{
        background:    'var(--sidebar)',
        borderRight:   '1px solid var(--border)',
        height:        '100vh',
        position:      'fixed',
        top:           0,
        left:          0,
        display:       'flex',
        flexDirection: 'column',
        zIndex:        40,
        overflow:      'hidden',
      }}
    >
      {/* Logo / brand */}
      <div style={{
        padding: collapsed ? '.875rem .75rem' : '.875rem 1rem',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        minHeight: 56,
      }}>
        {!collapsed && (
          <div>
            <div style={{ fontWeight: 800, fontSize: '.95rem', color: 'var(--sidebar-text-act)', letterSpacing: '-.01em' }}>
              KontrolSuite
            </div>
            {empresa && (
              <div style={{ fontSize: '.7rem', color: 'var(--sidebar-text)', opacity: .75, marginTop: '.1rem', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {empresa.nombre}
              </div>
            )}
          </div>
        )}

        <button
          onClick={onToggle}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--sidebar-text)', padding: '.3rem',
            borderRadius: '.375rem', transition: 'background .15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--sidebar-active)'}
          onMouseLeave={e => e.currentTarget.style.background = 'none'}
        >
          {collapsed
            ? <Bars3Icon style={{ width: '1.1rem', height: '1.1rem' }} />
            : <XMarkIcon style={{ width: '1.1rem', height: '1.1rem' }} />
          }
        </button>
      </div>

      {/* Nav modules — reorderable */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '.5rem .5rem' }}>
        <Reorder.Group
          axis="y"
          values={modulosActivos}
          onReorder={reorderModulos}
          style={{ margin: 0, padding: 0 }}
        >
          {modulosActivos.map(mod => (
            <ModuloItem key={mod.modulo_id} modulo={mod} collapsed={collapsed} />
          ))}
        </Reorder.Group>
      </div>

      {/* Footer: user info + logout */}
      <div style={{
        padding: '.75rem .5rem',
        borderTop: '1px solid var(--border)',
      }}>
        {!collapsed && perfil && (
          <div style={{
            padding: '.5rem .75rem', marginBottom: '.5rem',
            borderRadius: '.5rem',
          }}>
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
          style={{ width: '100%', background: 'none', border: 'none', justifyContent: collapsed ? 'center' : 'flex-start' }}
          title={collapsed ? 'Cerrar sesión' : undefined}
        >
          <svg style={{ width: '1.1rem', height: '1.1rem', flexShrink: 0 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          {!collapsed && <span>Cerrar sesión</span>}
        </button>
      </div>
    </motion.aside>
  )
}
