import React, { useState, useEffect } from 'react'
import {
  ClipboardDocumentListIcon, ViewColumnsIcon, CalendarIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '../contexts/AuthContext'
import supabase from '../lib/supabase'
import DynamicTable from '../components/ui/DynamicTable'
import KanbanBoard from '../components/ui/KanbanBoard'
import Tabs from '../components/ui/Tabs'

/*
 * Required Supabase tables:
 *   proyectos (id uuid PK, empresa_id uuid, nombre text, descripcion text,
 *              estado text DEFAULT 'activo', fecha_inicio date, fecha_fin date,
 *              responsable text, presupuesto numeric DEFAULT 0,
 *              extras jsonb DEFAULT '{}', created_at timestamptz)
 *   tareas (id uuid PK, empresa_id uuid, proyecto text, titulo text,
 *           asignado_a text, estado text DEFAULT 'pendiente',
 *           fecha_inicio date, fecha_limite date, columna text,
 *           prioridad text DEFAULT 'media', orden int DEFAULT 0,
 *           extras jsonb DEFAULT '{}', created_at timestamptz)
 *   tabla_config ...
 */

const TABS = [
  { id: 'kanban',    label: 'Kanban',    icon: ViewColumnsIcon            },
  { id: 'gantt',     label: 'Gantt',     icon: CalendarIcon               },
  { id: 'proyectos', label: 'Proyectos', icon: ClipboardDocumentListIcon  },
]

const PROYECTO_COLS = [
  { key: 'nombre',      label: 'Proyecto',     type: 'text',   editable: true, width: '220px', builtin: true },
  { key: 'responsable', label: 'Responsable',  type: 'text',   editable: true, width: '160px', builtin: true },
  { key: 'fecha_inicio',label: 'Inicio',       type: 'date',   editable: true, width: '130px', builtin: true },
  { key: 'fecha_fin',   label: 'Fin',          type: 'date',   editable: true, width: '130px', builtin: true },
  { key: 'presupuesto', label: 'Presupuesto',  type: 'number', editable: true, width: '140px', builtin: true,
    formatter: v => v != null ? `$${Number(v).toLocaleString('es-MX', { minimumFractionDigits: 0 })}` : '—' },
  {
    key: 'estado', label: 'Estado', type: 'select', editable: true, width: '130px', builtin: true,
    options: [
      { value: 'planeacion', label: 'Planeación' },
      { value: 'activo',     label: 'Activo'     },
      { value: 'pausado',    label: 'Pausado'    },
      { value: 'terminado',  label: 'Terminado'  },
      { value: 'cancelado',  label: 'Cancelado'  },
    ],
  },
  { key: 'descripcion', label: 'Descripción', type: 'text', editable: true, width: '280px', builtin: true },
]

const KANBAN_DEFAULTS = [
  { id: 'backlog',      label: 'Backlog'      },
  { id: 'en_progreso',  label: 'En progreso'  },
  { id: 'revision',     label: 'Revisión'     },
  { id: 'completado',   label: 'Completado'   },
]

// ── Simple Gantt chart ────────────────────────────────────────────
function GanttTab({ empresaId }) {
  const [proyectos, setProyectos] = useState([])
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    if (!empresaId) return
    supabase.from('proyectos').select('*').eq('empresa_id', empresaId)
      .order('fecha_inicio', { ascending: true })
      .then(({ data }) => { setProyectos(data || []); setLoading(false) })
  }, [empresaId])

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}><span className="spinner" /></div>
  if (proyectos.length === 0) {
    return (
      <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Sin proyectos. Agrega proyectos en la pestaña Proyectos.
      </div>
    )
  }

  // Compute timeline bounds
  const dates = proyectos.flatMap(p => [p.fecha_inicio, p.fecha_fin].filter(Boolean)).sort()
  if (!dates.length) return <div className="card" style={{ padding: '2rem', color: 'var(--text-muted)' }}>Proyectos sin fechas asignadas.</div>

  const minDate = new Date(dates[0])
  const maxDate = new Date(dates[dates.length - 1])
  const totalDays = Math.max((maxDate - minDate) / 86400000 + 1, 30)

  const toPercent = (dateStr) => {
    if (!dateStr) return 0
    const d = new Date(dateStr)
    return Math.max(0, Math.min(100, ((d - minDate) / (maxDate - minDate)) * 100))
  }

  const widthPercent = (start, end) => {
    if (!start || !end) return 10
    const s = new Date(start), e = new Date(end)
    return Math.max(2, ((e - s) / (maxDate - minDate)) * 100)
  }

  const STATUS_COLORS = {
    planeacion: 'var(--text-muted)',
    activo:     'var(--primary)',
    pausado:    '#f59e0b',
    terminado:  'var(--success)',
    cancelado:  'var(--danger)',
  }

  return (
    <div className="card" style={{ padding: '1.25rem', overflowX: 'auto' }}>
      <h3 style={{ margin: '0 0 1.25rem', fontSize: '.95rem', fontWeight: 700, color: 'var(--text)' }}>
        Línea de tiempo de proyectos
      </h3>
      <div style={{ minWidth: 700 }}>
        {/* Header: months */}
        <div style={{ display: 'flex', marginBottom: '1rem', paddingLeft: 200 }}>
          {Array.from({ length: Math.ceil(totalDays / 30) }, (_, i) => {
            const d = new Date(minDate)
            d.setDate(d.getDate() + i * 30)
            return (
              <div key={i} style={{ flex: '0 0 ' + Math.min(100 / Math.ceil(totalDays / 30), 30) + '%', fontSize: '.7rem', color: 'var(--text-muted)', fontWeight: 600, borderLeft: '1px solid var(--border)', paddingLeft: '.3rem' }}>
                {d.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' })}
              </div>
            )
          })}
        </div>

        {proyectos.map(p => (
          <div key={p.id} style={{ display: 'flex', alignItems: 'center', marginBottom: '.75rem', height: 36 }}>
            <div style={{ width: 196, flexShrink: 0, fontSize: '.8rem', fontWeight: 600, color: 'var(--text)', paddingRight: '.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {p.nombre}
            </div>
            <div style={{ flex: 1, position: 'relative', height: '100%', background: 'var(--surface-2)', borderRadius: '.35rem' }}>
              {p.fecha_inicio && p.fecha_fin && (
                <div style={{
                  position: 'absolute',
                  left:     toPercent(p.fecha_inicio) + '%',
                  width:    widthPercent(p.fecha_inicio, p.fecha_fin) + '%',
                  height:   '100%',
                  background: STATUS_COLORS[p.estado] || 'var(--primary)',
                  borderRadius: '.35rem',
                  display: 'flex', alignItems: 'center', paddingLeft: '.5rem',
                  overflow: 'hidden',
                  transition: 'width .3s',
                }}>
                  <span style={{ fontSize: '.7rem', color: '#fff', fontWeight: 600, whiteSpace: 'nowrap' }}>
                    {p.fecha_inicio} → {p.fecha_fin}
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────
export default function Proyectos() {
  const { empresaId } = useAuth()
  const [activeTab, setActiveTab] = useState('kanban')

  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ margin: '0 0 .25rem', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)' }}>
          Proyectos
        </h2>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '.875rem' }}>
          Tablero Kanban, línea de tiempo Gantt y gestión de proyectos
        </p>
      </div>

      <Tabs
        tabs={TABS}
        active={activeTab}
        onChange={setActiveTab}
        panels={{
          kanban: (
            <div>
              <p style={{ margin: '0 0 1rem', fontSize: '.875rem', color: 'var(--text-muted)' }}>
                Arrastra tareas entre etapas · Lápiz para renombrar columna · + para agregar etapa
              </p>
              <KanbanBoard
                tableName="tareas"
                empresaId={empresaId}
                configKey="tareas_kanban_cols"
                defaultColumns={KANBAN_DEFAULTS}
                titleField="titulo"
                cardFields={[
                  { key: 'proyecto',    label: 'Proyecto'   },
                  { key: 'asignado_a',  label: 'Asignado'   },
                  { key: 'fecha_limite',label: 'Vence'      },
                  { key: 'prioridad',   label: 'Prioridad'  },
                ]}
                defaultCard={{ titulo: 'Nueva tarea', prioridad: 'media' }}
              />
            </div>
          ),
          gantt:     <GanttTab empresaId={empresaId} />,
          proyectos: (
            <DynamicTable
              tableName="proyectos"
              empresaId={empresaId}
              tableKey="proyectos"
              defaultColumns={PROYECTO_COLS}
              defaultRow={{
                nombre: 'Nuevo proyecto',
                estado: 'planeacion',
                presupuesto: 0,
                fecha_inicio: new Date().toISOString().split('T')[0],
              }}
              title="Proyectos"
              orderBy="fecha_inicio"
              ascending={false}
            />
          ),
        }}
      />
    </div>
  )
}
