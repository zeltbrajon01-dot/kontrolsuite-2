import React, { useState } from 'react'
import {
  ShoppingCartIcon, UsersIcon, ViewColumnsIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '../contexts/AuthContext'
import DynamicTable from '../components/ui/DynamicTable'
import KanbanBoard from '../components/ui/KanbanBoard'
import Tabs from '../components/ui/Tabs'

/*
 * Uses the `leads` table for all three tabs:
 *   - Ventas: list view filtered/all leads
 *   - CRM Pipeline: kanban view by columna
 *   - Contactos: contact-oriented view of leads
 *
 * leads (id uuid PK, empresa_id uuid, titulo text, nombre text,
 *        empresa_nombre text, email text, telefono text,
 *        valor numeric DEFAULT 0, columna text,
 *        prioridad text DEFAULT 'media', fecha_cierre date,
 *        estado text DEFAULT 'activo', notas text, orden int DEFAULT 0,
 *        extras jsonb DEFAULT '{}', created_at timestamptz)
 *
 * tabla_config (id uuid PK, empresa_id uuid, tabla text, columnas jsonb,
 *               updated_at timestamptz, UNIQUE(empresa_id, tabla))
 */

const TABS = [
  { id: 'ventas',    label: 'Ventas',       icon: ShoppingCartIcon },
  { id: 'pipeline',  label: 'CRM Pipeline', icon: ViewColumnsIcon  },
  { id: 'contactos', label: 'Contactos',    icon: UsersIcon        },
]

const VENTAS_COLS = [
  { key: 'titulo',      label: 'Oportunidad', type: 'text',   editable: true, width: '200px', builtin: true },
  { key: 'nombre',      label: 'Contacto',    type: 'text',   editable: true, width: '180px', builtin: true },
  { key: 'empresa_nombre', label: 'Empresa',  type: 'text',   editable: true, width: '160px', builtin: true },
  {
    key: 'valor', label: 'Valor', type: 'number', editable: true, width: '130px', builtin: true,
    formatter: v => v != null ? `$${Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '—',
  },
  {
    key: 'prioridad', label: 'Prioridad', type: 'select', editable: true, width: '120px', builtin: true,
    options: [
      { value: 'alta',  label: 'Alta'  },
      { value: 'media', label: 'Media' },
      { value: 'baja',  label: 'Baja'  },
    ],
  },
  { key: 'fecha_cierre', label: 'Cierre estimado', type: 'date', editable: true, width: '150px', builtin: true },
  { key: 'notas',        label: 'Notas',           type: 'text', editable: true, width: '240px', builtin: true },
]

const CONTACTOS_COLS = [
  { key: 'nombre',         label: 'Nombre',   type: 'text',  editable: true, width: '180px', builtin: true },
  { key: 'empresa_nombre', label: 'Empresa',  type: 'text',  editable: true, width: '160px', builtin: true },
  { key: 'email',          label: 'Email',    type: 'email', editable: true, width: '200px', builtin: true },
  { key: 'telefono',       label: 'Teléfono', type: 'text',  editable: true, width: '140px', builtin: true },
  {
    key: 'estado', label: 'Estado', type: 'select', editable: true, width: '130px', builtin: true,
    options: [
      { value: 'activo',   label: 'Activo'   },
      { value: 'inactivo', label: 'Inactivo' },
    ],
  },
  { key: 'notas', label: 'Notas', type: 'text', editable: true, width: '240px', builtin: true },
]

const PIPELINE_DEFAULTS = [
  { id: 'prospecto',   label: 'Prospecto'   },
  { id: 'calificado',  label: 'Calificado'  },
  { id: 'propuesta',   label: 'Propuesta'   },
  { id: 'negociacion', label: 'Negociación' },
  { id: 'cerrado',     label: 'Cerrado'     },
]

export default function Ventas() {
  const { empresaId } = useAuth()
  const [activeTab, setActiveTab] = useState('ventas')

  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ margin: '0 0 .25rem', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)' }}>
          Ventas & CRM
        </h2>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '.875rem' }}>
          Pipeline de oportunidades, vista Kanban y directorio de contactos
        </p>
      </div>

      <Tabs
        tabs={TABS}
        active={activeTab}
        onChange={setActiveTab}
        panels={{
          ventas: (
            <DynamicTable
              tableName="leads"
              empresaId={empresaId}
              tableKey="leads_ventas"
              defaultColumns={VENTAS_COLS}
              defaultRow={{ titulo: 'Nueva oportunidad', nombre: 'Contacto', prioridad: 'media', valor: 0, fecha_cierre: new Date().toISOString().split('T')[0] }}
              title="Oportunidades"
              orderBy="created_at"
              ascending={false}
            />
          ),
          pipeline: (
            <div>
              <p style={{ margin: '0 0 1rem', fontSize: '.875rem', color: 'var(--text-muted)' }}>
                Arrastra tarjetas entre columnas · Lápiz para renombrar columna · + para agregar etapa
              </p>
              <KanbanBoard
                tableName="leads"
                empresaId={empresaId}
                configKey="leads_pipeline_cols"
                defaultColumns={PIPELINE_DEFAULTS}
                titleField="titulo"
                cardFields={[
                  { key: 'nombre',      label: 'Contacto' },
                  { key: 'valor',       label: 'Valor'    },
                  { key: 'fecha_cierre',label: 'Cierre'   },
                ]}
                defaultCard={{ titulo: 'Nueva oportunidad', nombre: 'Contacto', prioridad: 'media', valor: 0 }}
              />
            </div>
          ),
          contactos: (
            <DynamicTable
              tableName="leads"
              empresaId={empresaId}
              tableKey="leads_contactos"
              defaultColumns={CONTACTOS_COLS}
              defaultRow={{ nombre: 'Nuevo contacto', estado: 'activo' }}
              title="Contactos"
              orderBy="nombre"
              ascending={true}
            />
          ),
        }}
      />
    </div>
  )
}
