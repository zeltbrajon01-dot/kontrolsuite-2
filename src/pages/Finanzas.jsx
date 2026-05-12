import React, { useState, useEffect } from 'react'
import {
  BanknotesIcon, ChartBarIcon, ChartPieIcon, TableCellsIcon,
} from '@heroicons/react/24/outline'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer,
} from 'recharts'
import { useAuth } from '../contexts/AuthContext'
import supabase from '../lib/supabase'
import DynamicTable from '../components/ui/DynamicTable'
import KPICard from '../components/ui/KPICard'
import Tabs from '../components/ui/Tabs'

/*
 * Required Supabase tables:
 *   transacciones (id uuid PK, empresa_id uuid, descripcion text, monto numeric DEFAULT 0,
 *                  tipo text DEFAULT 'ingreso', categoria text, referencia text,
 *                  estado text DEFAULT 'pendiente', fecha date,
 *                  extras jsonb DEFAULT '{}', created_at timestamptz)
 *   presupuesto (id uuid PK, empresa_id uuid, categoria text, monto_presupuestado numeric DEFAULT 0,
 *                monto_real numeric DEFAULT 0, mes text, tipo text DEFAULT 'egreso',
 *                extras jsonb DEFAULT '{}', created_at timestamptz)
 *   tabla_config ...
 */

const TABS = [
  { id: 'transacciones', label: 'Transacciones', icon: TableCellsIcon  },
  { id: 'pyg',           label: 'P&G',           icon: ChartBarIcon    },
  { id: 'balance',       label: 'Balance',        icon: ChartPieIcon    },
  { id: 'presupuesto',   label: 'Presupuesto',    icon: BanknotesIcon   },
]

const TX_COLS = [
  { key: 'fecha',       label: 'Fecha',        type: 'date',   editable: true, width: '130px', builtin: true },
  { key: 'descripcion', label: 'Descripción',  type: 'text',   editable: true, width: '240px', builtin: true },
  {
    key: 'tipo', label: 'Tipo', type: 'select', editable: true, width: '120px', builtin: true,
    options: [
      { value: 'ingreso',      label: 'Ingreso'      },
      { value: 'egreso',       label: 'Egreso'       },
      { value: 'transferencia',label: 'Transferencia'},
    ],
  },
  {
    key: 'monto', label: 'Monto', type: 'number', editable: true, width: '130px', builtin: true,
    formatter: v => v != null ? `$${Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '—',
  },
  { key: 'categoria',  label: 'Categoría',  type: 'text', editable: true, width: '150px', builtin: true },
  { key: 'referencia', label: 'Referencia', type: 'text', editable: true, width: '150px', builtin: true },
  {
    key: 'estado', label: 'Estado', type: 'select', editable: true, width: '130px', builtin: true,
    options: [
      { value: 'confirmado', label: 'Confirmado' },
      { value: 'pendiente',  label: 'Pendiente'  },
      { value: 'anulado',    label: 'Anulado'    },
    ],
  },
]

const PRESUPUESTO_COLS = [
  { key: 'categoria',          label: 'Categoría',         type: 'text',   editable: true, width: '180px', builtin: true },
  { key: 'mes',                label: 'Mes',               type: 'text',   editable: true, width: '110px', builtin: true },
  {
    key: 'tipo', label: 'Tipo', type: 'select', editable: true, width: '110px', builtin: true,
    options: [{ value: 'ingreso', label: 'Ingreso' }, { value: 'egreso', label: 'Egreso' }],
  },
  { key: 'monto_presupuestado', label: 'Presupuestado', type: 'number', editable: true, width: '140px', builtin: true,
    formatter: v => v != null ? `$${Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '—' },
  { key: 'monto_real',          label: 'Real',          type: 'number', editable: true, width: '130px', builtin: true,
    formatter: v => v != null ? `$${Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '—' },
]

const PIE_COLORS = ['var(--success)', 'var(--danger)', 'var(--primary)', '#f59e0b', '#8b5cf6', '#06b6d4']

// ── P&G Tab ───────────────────────────────────────────────────────
function PYGTab({ empresaId }) {
  const [data, setData] = useState([])

  useEffect(() => {
    if (!empresaId) return
    supabase.from('pagos').select('tipo,monto,fecha,categoria')
      .eq('empresa_id', empresaId).eq('estado', 'confirmado')
      .then(({ data: rows }) => {
        if (!rows) return
        // Group by month
        const byMonth = {}
        rows.forEach(r => {
          const mes = r.fecha ? r.fecha.substring(0, 7) : 'sin fecha'
          if (!byMonth[mes]) byMonth[mes] = { mes, ingresos: 0, egresos: 0 }
          if (r.tipo === 'ingreso') byMonth[mes].ingresos += Number(r.monto) || 0
          if (r.tipo === 'egreso')  byMonth[mes].egresos  += Number(r.monto) || 0
        })
        setData(Object.values(byMonth).sort((a, b) => a.mes.localeCompare(b.mes)).slice(-12))
      })
  }, [empresaId])

  const totalIngresos = data.reduce((s, d) => s + d.ingresos, 0)
  const totalEgresos  = data.reduce((s, d) => s + d.egresos,  0)
  const utilidad      = totalIngresos - totalEgresos
  const fmt = v => `$${Number(v).toLocaleString('es-MX', { minimumFractionDigits: 0 })}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px,1fr))', gap: '1rem' }}>
        <KPICard label="Ingresos totales"   value={fmt(totalIngresos)} icon={BanknotesIcon} color="var(--success)" up={true}  />
        <KPICard label="Egresos totales"    value={fmt(totalEgresos)}  icon={BanknotesIcon} color="var(--danger)"  up={false} />
        <KPICard label="Utilidad neta"      value={fmt(utilidad)}      icon={ChartBarIcon}  color={utilidad >= 0 ? 'var(--success)' : 'var(--danger)'} up={utilidad >= 0} />
      </div>

      <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem', fontSize: '.95rem', fontWeight: 700, color: 'var(--text)' }}>
          Estado de Resultados (P&G)
        </h3>
        {data.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '.875rem' }}>Sin datos de transacciones confirmadas.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '.5rem', fontSize: '.8rem', color: 'var(--text)' }}
                formatter={v => `$${Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
              />
              <Legend wrapperStyle={{ fontSize: '.8rem', color: 'var(--text-muted)' }} />
              <Bar dataKey="ingresos" name="Ingresos" fill="var(--success)" radius={[4,4,0,0]} />
              <Bar dataKey="egresos"  name="Egresos"  fill="var(--danger)"  radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  )
}

// ── Balance Tab ───────────────────────────────────────────────────
function BalanceTab({ empresaId }) {
  const [catData, setCatData] = useState([])
  const [tipoData, setTipoData] = useState([])

  useEffect(() => {
    if (!empresaId) return
    supabase.from('pagos').select('tipo,monto,categoria')
      .eq('empresa_id', empresaId).eq('estado', 'confirmado')
      .then(({ data: rows }) => {
        if (!rows) return

        // By type
        const tipos = { ingreso: 0, egreso: 0 }
        rows.forEach(r => { tipos[r.tipo] = (tipos[r.tipo] || 0) + Number(r.monto) })
        setTipoData([
          { name: 'Ingresos', value: tipos.ingreso || 0 },
          { name: 'Egresos',  value: tipos.egreso  || 0 },
        ])

        // By category
        const cats = {}
        rows.forEach(r => {
          const c = r.categoria || 'Sin categoría'
          cats[c] = (cats[c] || 0) + Number(r.monto)
        })
        setCatData(Object.entries(cats).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 8))
      })
  }, [empresaId])

  const fmt = v => `$${Number(v).toLocaleString('es-MX', { minimumFractionDigits: 0 })}`

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', flexWrap: 'wrap' }}>
      <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem', fontSize: '.95rem', fontWeight: 700, color: 'var(--text)' }}>
          Ingresos vs. Egresos
        </h3>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={tipoData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }) => `${name}: ${fmt(value)}`} labelLine={false}>
              {tipoData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
            </Pie>
            <Tooltip formatter={v => fmt(v)} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '.5rem', fontSize: '.8rem', color: 'var(--text)' }} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem', fontSize: '.95rem', fontWeight: 700, color: 'var(--text)' }}>
          Distribución por categoría
        </h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={catData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} width={110} />
            <Tooltip formatter={v => fmt(v)} contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '.5rem', fontSize: '.8rem', color: 'var(--text)' }} />
            <Bar dataKey="value" name="Monto" fill="var(--primary)" radius={[0,4,4,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────
export default function Finanzas() {
  const { empresaId } = useAuth()
  const [activeTab, setActiveTab] = useState('transacciones')

  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ margin: '0 0 .25rem', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)' }}>
          Finanzas
        </h2>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '.875rem' }}>
          Transacciones, estado de resultados, balance y presupuesto
        </p>
      </div>

      <Tabs
        tabs={TABS}
        active={activeTab}
        onChange={setActiveTab}
        panels={{
          transacciones: (
            <DynamicTable
              tableName="pagos"
              empresaId={empresaId}
              tableKey="pagos"
              defaultColumns={TX_COLS}
              defaultRow={{ tipo: 'ingreso', estado: 'pendiente', monto: 0, fecha: new Date().toISOString().split('T')[0] }}
              title="Transacciones"
              orderBy="fecha"
              ascending={false}
            />
          ),
          pyg:         <PYGTab empresaId={empresaId} />,
          balance:     <BalanceTab empresaId={empresaId} />,
          presupuesto: (
            <DynamicTable
              tableName="presupuesto"
              empresaId={empresaId}
              tableKey="presupuesto"
              defaultColumns={PRESUPUESTO_COLS}
              defaultRow={{ tipo: 'egreso', monto_presupuestado: 0, monto_real: 0, mes: new Date().toISOString().substring(0, 7) }}
              title="Presupuesto"
              orderBy="created_at"
              ascending={false}
            />
          ),
        }}
      />
    </div>
  )
}
