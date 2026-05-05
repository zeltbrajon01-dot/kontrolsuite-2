import React from 'react'
import {
  BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from 'recharts'

const VENTAS_MES = [
  { mes: 'Ene', ventas: 4200, gastos: 2800 }, { mes: 'Feb', ventas: 5800, gastos: 3100 },
  { mes: 'Mar', ventas: 5200, gastos: 2900 }, { mes: 'Abr', ventas: 7100, gastos: 3400 },
  { mes: 'May', ventas: 6400, gastos: 3000 }, { mes: 'Jun', ventas: 8900, gastos: 4200 },
  { mes: 'Jul', ventas: 7800, gastos: 3900 }, { mes: 'Ago', ventas: 9100, gastos: 4500 },
]

const CATEGORIAS = [
  { name: 'Producto A', value: 35 }, { name: 'Producto B', value: 28 },
  { name: 'Producto C', value: 20 }, { name: 'Otros', value: 17 },
]

const PIE_COLORS = ['var(--primary)', 'var(--success)', 'var(--warning)', 'var(--text-muted)']

const tooltipStyle = {
  contentStyle: {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: '.5rem', fontSize: '.8rem', color: 'var(--text)',
  },
}

export default function Reportes() {
  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top row: bar + area */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '.95rem', fontWeight: 700, color: 'var(--text)' }}>
            Ventas vs Gastos
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={VENTAS_MES} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={50} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip {...tooltipStyle} formatter={v => `$${v.toLocaleString()}`} />
              <Legend wrapperStyle={{ fontSize: '.75rem', color: 'var(--text-muted)' }} />
              <Bar dataKey="ventas" name="Ventas" fill="var(--primary)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="gastos" name="Gastos" fill="var(--danger)" radius={[4, 4, 0, 0]} opacity={.7} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '.95rem', fontWeight: 700, color: 'var(--text)' }}>
            Evolución de ingresos
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={VENTAS_MES}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="var(--primary)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={50} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip {...tooltipStyle} formatter={v => `$${v.toLocaleString()}`} />
              <Area type="monotone" dataKey="ventas" name="Ventas" stroke="var(--primary)" strokeWidth={2} fill="url(#g1)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom row: pie + summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '1rem' }}>
        <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '.95rem', fontWeight: 700, color: 'var(--text)' }}>
            Ventas por categoría
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={CATEGORIAS} cx="50%" cy="50%" innerRadius={55} outerRadius={80} dataKey="value" paddingAngle={3}>
                {CATEGORIAS.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip {...tooltipStyle} formatter={v => `${v}%`} />
              <Legend wrapperStyle={{ fontSize: '.75rem', color: 'var(--text-muted)' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontSize: '.95rem', fontWeight: 700, color: 'var(--text)' }}>
            Resumen del período
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {[
              { label: 'Total ventas',    value: '$54,500', color: 'var(--primary)' },
              { label: 'Total gastos',    value: '$27,800', color: 'var(--danger)'  },
              { label: 'Utilidad neta',   value: '$26,700', color: 'var(--success)' },
              { label: 'Margen',          value: '49%',     color: 'var(--warning)' },
            ].map(item => (
              <div key={item.label} style={{ background: 'var(--surface-2)', borderRadius: '.75rem', padding: '1rem 1.25rem' }}>
                <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '.35rem' }}>{item.label}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: item.color }}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
