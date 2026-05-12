import React, { useState } from 'react'
import {
  WrenchScrewdriverIcon, TableCellsIcon, CheckBadgeIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '../contexts/AuthContext'
import DynamicTable from '../components/ui/DynamicTable'
import Tabs from '../components/ui/Tabs'

/*
 * Required Supabase tables:
 *   ordenes_produccion (id uuid PK, empresa_id uuid, folio text, producto text,
 *                       cantidad numeric DEFAULT 0, estado text DEFAULT 'planeada',
 *                       fecha_inicio date, fecha_fin date, responsable text, notas text,
 *                       extras jsonb DEFAULT '{}', created_at timestamptz)
 *   bom (id uuid PK, empresa_id uuid, producto text, componente text,
 *        cantidad numeric DEFAULT 1, unidad text DEFAULT 'pza',
 *        costo_unitario numeric DEFAULT 0, proveedor text,
 *        extras jsonb DEFAULT '{}', created_at timestamptz)
 *   calidad (id uuid PK, empresa_id uuid, orden_folio text, producto text,
 *            lote text, inspeccionado_por text, fecha date,
 *            resultado text DEFAULT 'aprobado', defectos int DEFAULT 0,
 *            observaciones text,
 *            extras jsonb DEFAULT '{}', created_at timestamptz)
 *   tabla_config ...
 */

const TABS = [
  { id: 'ordenes',  label: 'Órdenes',   icon: WrenchScrewdriverIcon },
  { id: 'bom',      label: 'BOM',        icon: TableCellsIcon        },
  { id: 'calidad',  label: 'Calidad',    icon: CheckBadgeIcon        },
]

const ORDEN_COLS = [
  { key: 'folio',        label: 'Folio',       type: 'text',   editable: true, width: '120px', builtin: true },
  { key: 'producto',     label: 'Producto',    type: 'text',   editable: true, width: '200px', builtin: true },
  { key: 'cantidad',     label: 'Cantidad',    type: 'number', editable: true, width: '90px',  builtin: true },
  { key: 'responsable',  label: 'Responsable', type: 'text',   editable: true, width: '160px', builtin: true },
  { key: 'fecha_inicio', label: 'Inicio',      type: 'date',   editable: true, width: '130px', builtin: true },
  { key: 'fecha_fin',    label: 'Fin',         type: 'date',   editable: true, width: '130px', builtin: true },
  {
    key: 'estado', label: 'Estado', type: 'select', editable: true, width: '130px', builtin: true,
    options: [
      { value: 'planeada',   label: 'Planeada'   },
      { value: 'en_proceso', label: 'En proceso' },
      { value: 'pausada',    label: 'Pausada'    },
      { value: 'terminada',  label: 'Terminada'  },
      { value: 'cancelada',  label: 'Cancelada'  },
    ],
  },
  { key: 'notas', label: 'Notas', type: 'text', editable: true, width: '220px', builtin: true },
]

const BOM_COLS = [
  { key: 'producto',      label: 'Producto Final', type: 'text',   editable: true, width: '200px', builtin: true },
  { key: 'componente',    label: 'Componente',     type: 'text',   editable: true, width: '200px', builtin: true },
  { key: 'cantidad',      label: 'Cantidad',       type: 'number', editable: true, width: '90px',  builtin: true },
  { key: 'unidad',        label: 'Unidad',         type: 'text',   editable: true, width: '90px',  builtin: true },
  { key: 'costo_unitario',label: 'Costo Unit.',    type: 'number', editable: true, width: '120px', builtin: true,
    formatter: v => v != null ? `$${Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '—' },
  { key: 'proveedor',     label: 'Proveedor',      type: 'text',   editable: true, width: '160px', builtin: true },
]

const CALIDAD_COLS = [
  { key: 'orden_folio',     label: 'Orden',       type: 'text',   editable: true, width: '120px', builtin: true },
  { key: 'producto',        label: 'Producto',    type: 'text',   editable: true, width: '180px', builtin: true },
  { key: 'lote',            label: 'Lote',        type: 'text',   editable: true, width: '120px', builtin: true },
  { key: 'inspeccionado_por',label: 'Inspector',  type: 'text',   editable: true, width: '160px', builtin: true },
  { key: 'fecha',           label: 'Fecha',       type: 'date',   editable: true, width: '130px', builtin: true },
  { key: 'defectos',        label: 'Defectos',    type: 'number', editable: true, width: '90px',  builtin: true },
  {
    key: 'resultado', label: 'Resultado', type: 'select', editable: true, width: '130px', builtin: true,
    options: [
      { value: 'aprobado',        label: 'Aprobado'        },
      { value: 'aprobado_condic', label: 'Aprobado cond.'  },
      { value: 'rechazado',       label: 'Rechazado'       },
    ],
  },
  { key: 'observaciones', label: 'Observaciones', type: 'text', editable: true, width: '260px', builtin: true },
]

export default function Produccion() {
  const { empresaId } = useAuth()
  const [activeTab, setActiveTab] = useState('ordenes')

  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ margin: '0 0 .25rem', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)' }}>
          Producción
        </h2>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '.875rem' }}>
          Órdenes de producción, lista de materiales (BOM) y control de calidad
        </p>
      </div>

      <Tabs
        tabs={TABS}
        active={activeTab}
        onChange={setActiveTab}
        panels={{
          ordenes: (
            <DynamicTable
              tableName="ordenes_produccion"
              empresaId={empresaId}
              tableKey="ordenes_produccion"
              defaultColumns={ORDEN_COLS}
              defaultRow={{ folio: 'OP-001', producto: 'Producto', estado: 'planeada', cantidad: 1, fecha_inicio: new Date().toISOString().split('T')[0] }}
              title="Órdenes de Producción"
              orderBy="fecha_inicio"
              ascending={false}
            />
          ),
          bom: (
            <DynamicTable
              tableName="bom"
              empresaId={empresaId}
              tableKey="bom"
              defaultColumns={BOM_COLS}
              defaultRow={{ producto: 'Producto', componente: 'Componente', cantidad: 1, unidad: 'pza', costo_unitario: 0 }}
              title="Lista de Materiales (BOM)"
              orderBy="producto"
              ascending={true}
            />
          ),
          calidad: (
            <DynamicTable
              tableName="calidad"
              empresaId={empresaId}
              tableKey="calidad"
              defaultColumns={CALIDAD_COLS}
              defaultRow={{ producto: 'Producto', resultado: 'aprobado', defectos: 0, fecha: new Date().toISOString().split('T')[0] }}
              title="Control de Calidad"
              orderBy="fecha"
              ascending={false}
            />
          ),
        }}
      />
    </div>
  )
}
