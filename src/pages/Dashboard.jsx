import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useModulos } from '../contexts/ModulosContext'
import { Link } from 'react-router-dom'
import {
  UsersIcon, ShoppingCartIcon, ArchiveBoxIcon, BanknotesIcon,
  UserGroupIcon, ChartBarIcon,
} from '@heroicons/react/24/outline'
import { AreaChart, Area, ResponsiveContainer, Tooltip, XAxis } from 'recharts'

const STAT_ICONS = {
  clientes: UsersIcon, ventas: ShoppingCartIcon, inventario: ArchiveBoxIcon,
  finanzas: BanknotesIcon, rrhh: UserGroupIcon, reportes: ChartBarIcon,
}

const FAKE_CHART = [
  { mes: 'Ene', valor: 4200 }, { mes: 'Feb', valor: 5800 }, { mes: 'Mar', valor: 5200 },
  { mes: 'Abr', valor: 7100 }, { mes: 'May', valor: 6400 }, { mes: 'Jun', valor: 8900 },
]

const STATS = [
  { id: 'clientes',   label: 'Clientes',       value: '142',     change: '+12%',  up: true  },
  { id: 'ventas',     label: 'Ventas hoy',      value: '$8,420',  change: '+5.2%', up: true  },
  { id: 'inventario', label: 'Productos',       value: '538',     change: '-3',    up: false },
  { id: 'finanzas',   label: 'Ingresos / mes',  value: '$62,100', change: '+18%',  up: true  },
]

export default function Dashboard() {
  const { perfil, empresa } = useAuth()
  const { modulosActivos }  = useModulos()

  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Welcome */}
      <div>
        <h2 style={{ margin: '0 0 .25rem', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text)' }}>
          Bienvenido, {perfil?.nombre?.split(' ')[0] || 'usuario'} 👋
        </h2>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '.9rem' }}>
          {empresa?.nombre} · Resumen de hoy
        </p>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
        {STATS.map(stat => {
          const Icon = STAT_ICONS[stat.id] || ChartBarIcon
          return (
            <div key={stat.id} className="card" style={{ padding: '1.25rem 1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.75rem' }}>
                <span style={{ fontSize: '.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{stat.label}</span>
                <div style={{
                  background: 'var(--primary-light)', borderRadius: '.5rem', padding: '.35rem',
                }}>
                  <Icon style={{ width: '1rem', height: '1rem', color: 'var(--primary)' }} />
                </div>
              </div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text)', marginBottom: '.25rem' }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '.75rem', color: stat.up ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                {stat.change} vs. mes anterior
              </div>
            </div>
          )
        })}
      </div>

      {/* Chart + Modules grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '1rem' }}>
        {/* Revenue chart */}
        <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
          <h3 style={{ margin: '0 0 1.25rem', fontSize: '.95rem', fontWeight: 700, color: 'var(--text)' }}>
            Ingresos 2024
          </h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={FAKE_CHART}>
              <defs>
                <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--primary)" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '.5rem', fontSize: '.8rem', color: 'var(--text)' }}
                formatter={v => [`$${v.toLocaleString()}`, 'Ingresos']}
              />
              <Area type="monotone" dataKey="valor" stroke="var(--primary)" strokeWidth={2} fill="url(#grad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Active modules quick-access */}
        <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '.95rem', fontWeight: 700, color: 'var(--text)' }}>
            Módulos activos
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
            {modulosActivos.filter(m => m.modulo_id !== 'dashboard').slice(0, 6).map(mod => (
              <Link
                key={mod.modulo_id}
                to={mod.ruta}
                style={{
                  display: 'flex', alignItems: 'center', gap: '.75rem',
                  padding: '.55rem .75rem', borderRadius: '.5rem',
                  color: 'var(--text)', textDecoration: 'none', fontSize: '.875rem',
                  background: 'var(--surface-2)', transition: 'background .15s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--primary-light)'}
                onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-2)'}
              >
                <span style={{ color: 'var(--primary)', fontSize: '.75rem', fontWeight: 700, minWidth: 24 }}>
                  →
                </span>
                {mod.nombre}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
