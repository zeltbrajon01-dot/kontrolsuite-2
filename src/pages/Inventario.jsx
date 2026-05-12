import React, { useState, useEffect } from 'react'
import {
  ArchiveBoxIcon, BuildingStorefrontIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '../contexts/AuthContext'
import supabase from '../lib/supabase'
import DynamicTable from '../components/ui/DynamicTable'
import KPICard from '../components/ui/KPICard'
import Tabs from '../components/ui/Tabs'

/*
 * Required Supabase tables:
 *   productos (id uuid PK, empresa_id uuid, codigo text, nombre text, categoria text,
 *              almacen text DEFAULT 'Principal', stock_actual numeric DEFAULT 0,
 *              stock_minimo numeric DEFAULT 5, precio numeric DEFAULT 0,
 *              estado text DEFAULT 'activo', ubicacion text,
 *              extras jsonb DEFAULT '{}', created_at timestamptz)
 *   almacenes (id uuid PK, empresa_id uuid, nombre text, direccion text,
 *              responsable text, activo bool DEFAULT true,
 *              extras jsonb DEFAULT '{}', created_at timestamptz)
 *   tabla_config ...
 */

const TABS = [
  { id: 'productos',  label: 'Productos',  icon: ArchiveBoxIcon          },
  { id: 'almacenes',  label: 'Almacenes',  icon: BuildingStorefrontIcon  },
  { id: 'alertas',    label: 'Alertas',    icon: ExclamationTriangleIcon },
]

const PRODUCTO_COLS = [
  { key: 'codigo',      label: 'Código',    type: 'text',   editable: true, width: '120px', builtin: true },
  { key: 'nombre',      label: 'Producto',  type: 'text',   editable: true, width: '220px', builtin: true },
  { key: 'categoria',   label: 'Categoría', type: 'text',   editable: true, width: '150px', builtin: true },
  { key: 'almacen',     label: 'Almacén',   type: 'text',   editable: true, width: '140px', builtin: true },
  { key: 'stock_actual',label: 'Stock',     type: 'number', editable: true, width: '90px',  builtin: true },
  { key: 'stock_minimo',label: 'Mín.',      type: 'number', editable: true, width: '80px',  builtin: true },
  {
    key: 'precio', label: 'Precio', type: 'number', editable: true, width: '120px', builtin: true,
    formatter: v => v != null ? `$${Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '—',
  },
  {
    key: 'estado', label: 'Estado', type: 'select', editable: true, width: '120px', builtin: true,
    options: [
      { value: 'activo',        label: 'Activo'        },
      { value: 'agotado',       label: 'Agotado'       },
      { value: 'descontinuado', label: 'Descontinuado' },
    ],
  },
  { key: 'ubicacion', label: 'Ubicación', type: 'text', editable: true, width: '130px', builtin: true },
]

const ALMACEN_COLS = [
  { key: 'nombre',      label: 'Almacén',     type: 'text', editable: true, width: '180px', builtin: true },
  { key: 'direccion',   label: 'Dirección',   type: 'text', editable: true, width: '240px', builtin: true },
  { key: 'responsable', label: 'Responsable', type: 'text', editable: true, width: '180px', builtin: true },
]

// ── Alerts tab ────────────────────────────────────────────────────
function AlertasTab({ empresaId }) {
  const [alertas, setAlertas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!empresaId) return
    supabase.from('productos')
      .select('*')
      .eq('empresa_id', empresaId)
      .then(({ data }) => {
        const bajoStock = (data || []).filter(p => Number(p.stock_actual) <= Number(p.stock_minimo))
        setAlertas(bajoStock)
        setLoading(false)
      })
  }, [empresaId])

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}><span className="spinner" /></div>

  if (alertas.length === 0) {
    return (
      <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '.75rem' }}>✅</div>
        <h3 style={{ margin: '0 0 .5rem', color: 'var(--success)', fontWeight: 700 }}>Sin alertas de stock</h3>
        <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '.875rem' }}>
          Todos los productos están por encima de su stock mínimo.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.75rem 1rem', background: 'rgba(239,68,68,.1)', border: '1px solid var(--danger)', borderRadius: '.6rem' }}>
        <ExclamationTriangleIcon style={{ width: '1.25rem', height: '1.25rem', color: 'var(--danger)', flexShrink: 0 }} />
        <span style={{ color: 'var(--danger)', fontWeight: 600, fontSize: '.875rem' }}>
          {alertas.length} producto{alertas.length !== 1 ? 's' : ''} bajo stock mínimo
        </span>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="table-themed">
          <thead>
            <tr>
              <th>Producto</th>
              <th>Código</th>
              <th>Almacén</th>
              <th>Stock Actual</th>
              <th>Stock Mínimo</th>
              <th>Diferencia</th>
            </tr>
          </thead>
          <tbody>
            {alertas.map(p => {
              const diff = Number(p.stock_actual) - Number(p.stock_minimo)
              return (
                <tr key={p.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text)' }}>{p.nombre}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{p.codigo || '—'}</td>
                  <td style={{ color: 'var(--text-muted)' }}>{p.almacen || 'Principal'}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: p.stock_actual <= 0 ? 'var(--danger)' : 'var(--text)' }}>
                      {p.stock_actual}
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-muted)' }}>{p.stock_minimo}</td>
                  <td>
                    <span style={{
                      background: 'rgba(239,68,68,.12)', color: 'var(--danger)',
                      borderRadius: '.375rem', padding: '.15rem .5rem', fontSize: '.8rem', fontWeight: 700,
                    }}>
                      {diff}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────
export default function Inventario() {
  const { empresaId } = useAuth()
  const [activeTab, setActiveTab] = useState('productos')
  const [stats, setStats] = useState({ total: 0, agotados: 0, alertas: 0 })

  useEffect(() => {
    if (!empresaId) return
    supabase.from('productos').select('stock_actual,stock_minimo,estado').eq('empresa_id', empresaId)
      .then(({ data }) => {
        const rows = data || []
        setStats({
          total:   rows.length,
          agotados: rows.filter(p => p.estado === 'agotado' || Number(p.stock_actual) <= 0).length,
          alertas:  rows.filter(p => Number(p.stock_actual) <= Number(p.stock_minimo)).length,
        })
      })
  }, [empresaId])

  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: '0 0 .25rem', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)' }}>
            Inventario
          </h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '.875rem' }}>
            Múltiples almacenes, alertas de stock mínimo y catálogo de productos
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '.75rem' }}>
          <KPICard label="Productos"    value={stats.total}   icon={ArchiveBoxIcon}          />
          <KPICard label="Agotados"     value={stats.agotados} icon={ExclamationTriangleIcon} color="var(--danger)" up={false} />
          <KPICard label="Bajo mínimo"  value={stats.alertas}  icon={ExclamationTriangleIcon} color="var(--warning, #f59e0b)" up={false} />
        </div>
      </div>

      <Tabs
        tabs={TABS}
        active={activeTab}
        onChange={setActiveTab}
        panels={{
          productos: (
            <DynamicTable
              tableName="productos"
              empresaId={empresaId}
              tableKey="productos"
              defaultColumns={PRODUCTO_COLS}
              defaultRow={{ nombre: 'Nuevo producto', codigo: '', estado: 'activo', stock_actual: 0, stock_minimo: 5, precio: 0, almacen: 'Principal' }}
              title="Catálogo de Productos"
              orderBy="nombre"
              ascending={true}
            />
          ),
          almacenes: (
            <DynamicTable
              tableName="almacenes"
              empresaId={empresaId}
              tableKey="almacenes"
              defaultColumns={ALMACEN_COLS}
              defaultRow={{ nombre: 'Nuevo almacén', activo: true }}
              title="Almacenes"
              orderBy="nombre"
              ascending={true}
            />
          ),
          alertas: <AlertasTab empresaId={empresaId} />,
        }}
      />
    </div>
  )
}
