import React, { useState } from 'react'
import { CubeIcon, TruckIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline'
import { useAuth } from '../contexts/AuthContext'
import DynamicTable from '../components/ui/DynamicTable'
import Tabs from '../components/ui/Tabs'

/*
 * Required Supabase tables:
 *   proveedores (id uuid PK, empresa_id uuid, nombre text, rfc text, contacto text,
 *                email text, telefono text, categoria text, estado text DEFAULT 'activo',
 *                credito_dias int DEFAULT 30, extras jsonb DEFAULT '{}', created_at timestamptz)
 *   ordenes_compra (id uuid PK, empresa_id uuid, proveedor text, folio text, fecha date,
 *                   descripcion text, total numeric DEFAULT 0,
 *                   estado text DEFAULT 'borrador', notas text,
 *                   extras jsonb DEFAULT '{}', created_at timestamptz)
 *   recepciones (id uuid PK, empresa_id uuid, orden_folio text, proveedor text, fecha date,
 *                producto text, cantidad_pedida numeric DEFAULT 0,
 *                cantidad_recibida numeric DEFAULT 0,
 *                estado text DEFAULT 'pendiente',
 *                extras jsonb DEFAULT '{}', created_at timestamptz)
 *   tabla_config ...
 */

const TABS = [
  { id: 'proveedores', label: 'Proveedores',     icon: TruckIcon                  },
  { id: 'ordenes',     label: 'Órdenes de Compra',icon: ClipboardDocumentListIcon  },
  { id: 'recepcion',   label: 'Recepción',        icon: CubeIcon                   },
]

const PROV_COLS = [
  { key: 'nombre',       label: 'Proveedor',    type: 'text',  editable: true, width: '200px', builtin: true },
  { key: 'rfc',          label: 'RFC',          type: 'text',  editable: true, width: '140px', builtin: true },
  { key: 'contacto',     label: 'Contacto',     type: 'text',  editable: true, width: '160px', builtin: true },
  { key: 'email',        label: 'Email',        type: 'email', editable: true, width: '200px', builtin: true },
  { key: 'telefono',     label: 'Teléfono',     type: 'text',  editable: true, width: '140px', builtin: true },
  { key: 'categoria',    label: 'Categoría',    type: 'text',  editable: true, width: '150px', builtin: true },
  { key: 'credito_dias', label: 'Crédito (días)',type: 'number',editable: true, width: '120px', builtin: true },
  {
    key: 'estado', label: 'Estado', type: 'select', editable: true, width: '120px', builtin: true,
    options: [
      { value: 'activo',   label: 'Activo'    },
      { value: 'inactivo', label: 'Inactivo'  },
      { value: 'bloqueado',label: 'Bloqueado' },
    ],
  },
]

const OC_COLS = [
  { key: 'folio',       label: 'Folio',      type: 'text',   editable: true, width: '120px', builtin: true },
  { key: 'proveedor',   label: 'Proveedor',  type: 'text',   editable: true, width: '180px', builtin: true },
  { key: 'fecha',       label: 'Fecha',      type: 'date',   editable: true, width: '130px', builtin: true },
  { key: 'descripcion', label: 'Descripción',type: 'text',   editable: true, width: '240px', builtin: true },
  {
    key: 'total', label: 'Total', type: 'number', editable: true, width: '130px', builtin: true,
    formatter: v => v != null ? `$${Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '—',
  },
  {
    key: 'estado', label: 'Estado', type: 'select', editable: true, width: '130px', builtin: true,
    options: [
      { value: 'borrador',  label: 'Borrador'   },
      { value: 'enviada',   label: 'Enviada'    },
      { value: 'aprobada',  label: 'Aprobada'   },
      { value: 'recibida',  label: 'Recibida'   },
      { value: 'cancelada', label: 'Cancelada'  },
    ],
  },
  { key: 'notas', label: 'Notas', type: 'text', editable: true, width: '200px', builtin: true },
]

const RECEPCION_COLS = [
  { key: 'orden_folio',       label: 'OC Folio',   type: 'text',   editable: true, width: '120px', builtin: true },
  { key: 'proveedor',         label: 'Proveedor',  type: 'text',   editable: true, width: '180px', builtin: true },
  { key: 'fecha',             label: 'Fecha',      type: 'date',   editable: true, width: '130px', builtin: true },
  { key: 'producto',          label: 'Producto',   type: 'text',   editable: true, width: '200px', builtin: true },
  { key: 'cantidad_pedida',   label: 'Pedido',     type: 'number', editable: true, width: '90px',  builtin: true },
  { key: 'cantidad_recibida', label: 'Recibido',   type: 'number', editable: true, width: '90px',  builtin: true },
  {
    key: 'estado', label: 'Estado', type: 'select', editable: true, width: '120px', builtin: true,
    options: [
      { value: 'pendiente',  label: 'Pendiente'  },
      { value: 'parcial',    label: 'Parcial'    },
      { value: 'completo',   label: 'Completo'   },
      { value: 'devolucion', label: 'Devolución' },
    ],
  },
]

export default function Compras() {
  const { empresaId } = useAuth()
  const [activeTab, setActiveTab] = useState('proveedores')

  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ margin: '0 0 .25rem', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)' }}>
          Compras
        </h2>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '.875rem' }}>
          Catálogo de proveedores, órdenes de compra y recepción de mercancía
        </p>
      </div>

      <Tabs
        tabs={TABS}
        active={activeTab}
        onChange={setActiveTab}
        panels={{
          proveedores: (
            <DynamicTable
              tableName="proveedores"
              empresaId={empresaId}
              tableKey="proveedores"
              defaultColumns={PROV_COLS}
              defaultRow={{ nombre: 'Nuevo proveedor', estado: 'activo', credito_dias: 30 }}
              title="Proveedores"
              orderBy="nombre"
              ascending={true}
            />
          ),
          ordenes: (
            <DynamicTable
              tableName="ordenes_compra"
              empresaId={empresaId}
              tableKey="ordenes_compra"
              defaultColumns={OC_COLS}
              defaultRow={{ estado: 'borrador', total: 0, fecha: new Date().toISOString().split('T')[0] }}
              title="Órdenes de Compra"
              orderBy="fecha"
              ascending={false}
            />
          ),
          recepcion: (
            <DynamicTable
              tableName="recepciones"
              empresaId={empresaId}
              tableKey="recepciones"
              defaultColumns={RECEPCION_COLS}
              defaultRow={{ estado: 'pendiente', cantidad_pedida: 0, cantidad_recibida: 0, fecha: new Date().toISOString().split('T')[0] }}
              title="Recepción de Mercancía"
              orderBy="fecha"
              ascending={false}
            />
          ),
        }}
      />
    </div>
  )
}
