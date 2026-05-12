import React, { useState, useEffect } from 'react'
import {
  UsersIcon, DocumentTextIcon, ChartBarIcon, StarIcon,
  ArrowDownTrayIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '../contexts/AuthContext'
import supabase from '../lib/supabase'
import DynamicTable from '../components/ui/DynamicTable'
import Tabs from '../components/ui/Tabs'
import KPICard from '../components/ui/KPICard'
import Button from '../components/ui/Button'

/*
 * Required Supabase tables:
 *   empleados (id uuid PK, empresa_id uuid, nombre text, puesto text, departamento text,
 *              email text, telefono text, fecha_ingreso date, salario_bruto numeric DEFAULT 0,
 *              estado text DEFAULT 'activo', doc_refs text[], manager_id uuid,
 *              extras jsonb DEFAULT '{}', created_at timestamptz)
 *   nominas (id uuid PK, empresa_id uuid, empleado_id uuid, empleado_nombre text,
 *            periodo text, salario_bruto numeric, imss_patronal numeric DEFAULT 0,
 *            imss_obrero numeric DEFAULT 0, infonavit numeric DEFAULT 0,
 *            isr numeric DEFAULT 0, total_neto numeric,
 *            extras jsonb DEFAULT '{}', created_at timestamptz)
 *   evaluaciones (id uuid PK, empresa_id uuid, empleado_nombre text, evaluador text,
 *                 periodo text, puntaje int DEFAULT 0, comentarios text,
 *                 extras jsonb DEFAULT '{}', created_at timestamptz)
 *   Storage bucket: expedientes (store employee documents)
 *   tabla_config (id uuid PK, empresa_id uuid, tabla text, columnas jsonb, updated_at timestamptz)
 */

const TABS = [
  { id: 'empleados',   label: 'Empleados',   icon: UsersIcon        },
  { id: 'nomina',      label: 'Nómina',      icon: DocumentTextIcon  },
  { id: 'organigrama', label: 'Organigrama', icon: ChartBarIcon      },
  { id: 'evaluacion',  label: 'Evaluación',  icon: StarIcon          },
]

const EMPLEADOS_COLS = [
  { key: 'nombre',        label: 'Nombre',        type: 'text',   editable: true, width: '200px', builtin: true },
  { key: 'puesto',        label: 'Puesto',        type: 'text',   editable: true, width: '180px', builtin: true },
  { key: 'departamento',  label: 'Departamento',  type: 'text',   editable: true, width: '160px', builtin: true },
  { key: 'email',         label: 'Email',         type: 'email',  editable: true, width: '220px', builtin: true },
  { key: 'telefono',      label: 'Teléfono',      type: 'text',   editable: true, width: '140px', builtin: true },
  { key: 'fecha_ingreso', label: 'Ingreso',       type: 'date',   editable: true, width: '130px', builtin: true },
  {
    key: 'salario_bruto', label: 'Salario Bruto', type: 'number', editable: true, width: '140px', builtin: true,
    formatter: v => v != null ? `$${Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '—',
  },
  {
    key: 'estatus', label: 'Estatus', type: 'select', editable: true, width: '120px', builtin: true,
    options: [
      { value: 'activo',     label: 'Activo'     },
      { value: 'baja',       label: 'Baja'       },
      { value: 'licencia',   label: 'Licencia'   },
      { value: 'vacaciones', label: 'Vacaciones' },
    ],
  },
]

const NOMINA_COLS = [
  { key: 'empleado_nombre', label: 'Empleado',      type: 'text',   editable: true, width: '180px', builtin: true },
  { key: 'periodo',         label: 'Período',       type: 'text',   editable: true, width: '120px', builtin: true },
  { key: 'salario_bruto',   label: 'Salario Bruto', type: 'number', editable: true, width: '140px', builtin: true,
    formatter: v => v != null ? `$${Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '—' },
  { key: 'imss_patronal',   label: 'IMSS Pat.',     type: 'number', editable: true, width: '110px', builtin: true,
    formatter: v => v != null ? `$${Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '—' },
  { key: 'imss_obrero',     label: 'IMSS Ob.',      type: 'number', editable: true, width: '110px', builtin: true,
    formatter: v => v != null ? `$${Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '—' },
  { key: 'infonavit',       label: 'INFONAVIT',     type: 'number', editable: true, width: '110px', builtin: true,
    formatter: v => v != null ? `$${Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '—' },
  { key: 'isr',             label: 'ISR',           type: 'number', editable: true, width: '100px', builtin: true,
    formatter: v => v != null ? `$${Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '—' },
  { key: 'total_neto',      label: 'Neto',          type: 'number', editable: true, width: '130px', builtin: true,
    formatter: v => v != null ? `$${Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '—' },
]

const EVAL_COLS = [
  { key: 'empleado_nombre', label: 'Empleado',   type: 'text',   editable: true, width: '180px', builtin: true },
  { key: 'evaluador',       label: 'Evaluador',  type: 'text',   editable: true, width: '160px', builtin: true },
  { key: 'periodo',         label: 'Período',    type: 'text',   editable: true, width: '120px', builtin: true },
  { key: 'puntaje',         label: 'Puntaje',    type: 'number', editable: true, width: '90px',  builtin: true },
  { key: 'comentarios',     label: 'Comentarios',type: 'text',   editable: true, width: '300px', builtin: true },
]

// ── Organigrama simple ────────────────────────────────────────────
function OrganigramaTab({ empresaId }) {
  const [empleados, setEmpleados] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!empresaId) return
    supabase.from('empleados').select('id,nombre,puesto,departamento,manager_id,estatus')
      .eq('empresa_id', empresaId)
      .eq('estatus', 'activo')
      .then(({ data }) => { setEmpleados(data || []); setLoading(false) })
  }, [empresaId])

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}><span className="spinner" /></div>

  // Group by department
  const depts = {}
  empleados.forEach(e => {
    const d = e.departamento || 'Sin departamento'
    if (!depts[d]) depts[d] = []
    depts[d].push(e)
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {Object.entries(depts).map(([dept, emps]) => (
        <div key={dept} className="card" style={{ padding: '1.25rem' }}>
          <h3 style={{ margin: '0 0 1rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '.05em', fontSize: '.8rem' }}>
            {dept}
          </h3>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {emps.map(emp => (
              <div key={emp.id} style={{
                background: 'var(--surface-2)', border: '1px solid var(--border)',
                borderRadius: '.6rem', padding: '.75rem 1rem', minWidth: 160,
                textAlign: 'center',
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: 'var(--primary)', color: '#fff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '1rem', margin: '0 auto .5rem',
                }}>
                  {emp.nombre?.charAt(0)?.toUpperCase() || '?'}
                </div>
                <div style={{ fontWeight: 700, fontSize: '.85rem', color: 'var(--text)' }}>{emp.nombre}</div>
                <div style={{ fontSize: '.75rem', color: 'var(--text-muted)', marginTop: '.15rem' }}>{emp.puesto}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
      {empleados.length === 0 && (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Sin empleados activos. Agrega empleados en la pestaña Empleados.
        </div>
      )}
    </div>
  )
}

// ── Nómina tab ────────────────────────────────────────────────────
function NominaTab({ empresaId }) {
  const [empleados, setEmpleados] = useState([])
  const [selected, setSelected]   = useState('')
  const [periodo,  setPeriodo]    = useState('')
  const [calculating, setCalculating] = useState(false)
  const [result, setResult] = useState(null)
  const [saveError, setSaveError] = useState(null)

  useEffect(() => {
    if (!empresaId) return
    supabase.from('empleados').select('id,nombre,salario_bruto').eq('empresa_id', empresaId).eq('estatus', 'activo')
      .then(({ data }) => setEmpleados(data || []))
  }, [empresaId])

  const calcular = () => {
    const emp = empleados.find(e => e.id === selected)
    if (!emp) return
    const bruto          = Number(emp.salario_bruto) || 0
    const imss_patronal  = bruto * 0.3196
    const imss_obrero    = bruto * 0.0225
    const infonavit      = bruto * 0.05
    const isr            = bruto > 20000 ? bruto * 0.25 : bruto * 0.15
    const deducciones    = imss_obrero + infonavit + isr
    const total_neto     = bruto - deducciones
    setResult({ bruto, imss_patronal, imss_obrero, infonavit, isr, total_neto, nombre: emp.nombre })
  }

  const guardar = async () => {
    if (!result || !periodo.trim()) return
    if (!empresaId) { setSaveError('empresa_id es null — usuario sin empresa activa'); return }
    setCalculating(true)
    setSaveError(null)
    const { error: err } = await supabase.from('nomina').insert({
      empresa_id: empresaId, empleado_id: selected,
      empleado_nombre: result.nombre, periodo,
      salario_bruto:  result.bruto,
      imss_patronal:  result.imss_patronal,
      imss_obrero:    result.imss_obrero,
      infonavit:      result.infonavit,
      isr:            result.isr,
      total_neto:     result.total_neto,
    })
    setCalculating(false)
    if (err) { setSaveError(err.message || err.details || JSON.stringify(err)); return }
    setResult(null)
    setSelected('')
    setPeriodo('')
  }

  const fmt = v => `$${Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Calculator */}
      <div className="card" style={{ padding: '1.5rem', maxWidth: 560 }}>
        <h3 style={{ margin: '0 0 1.25rem', fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>
          Calculadora de Nómina
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '.3rem' }}>Empleado</label>
            <select className="input-themed" style={{ width: '100%' }} value={selected} onChange={e => setSelected(e.target.value)}>
              <option value="">Seleccionar empleado…</option>
              {empleados.map(e => <option key={e.id} value={e.id}>{e.nombre} — {fmt(e.salario_bruto || 0)}/mes</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '.3rem' }}>Período</label>
            <input className="input-themed" style={{ width: '100%' }} placeholder="Ej: 2025-06" value={periodo} onChange={e => setPeriodo(e.target.value)} />
          </div>
          <Button onClick={calcular} disabled={!selected}>Calcular</Button>

          {result && (
            <div style={{ background: 'var(--surface-2)', borderRadius: '.6rem', padding: '1rem', marginTop: '.25rem' }}>
              <div style={{ fontWeight: 700, marginBottom: '.75rem', color: 'var(--text)' }}>{result.nombre} — {periodo}</div>
              {[
                ['Salario Bruto',     result.bruto,          true ],
                ['IMSS Patronal',     result.imss_patronal,  false],
                ['IMSS Obrero',       result.imss_obrero,    false],
                ['INFONAVIT',         result.infonavit,      false],
                ['ISR',               result.isr,            false],
              ].map(([label, val, bold]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.85rem', padding: '.2rem 0', color: 'var(--text)', borderBottom: '1px solid var(--border)', fontWeight: bold ? 700 : 400 }}>
                  <span>{label}</span><span>{fmt(val)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '.95rem', fontWeight: 800, color: 'var(--success)', padding: '.5rem 0 0' }}>
                <span>Total Neto</span><span>{fmt(result.total_neto)}</span>
              </div>
              {saveError && (
                <div style={{ marginTop: '.5rem', padding: '.6rem .75rem', background: 'rgba(239,68,68,.08)', border: '1px solid var(--danger)', borderRadius: '.4rem', fontSize: '.8rem', color: 'var(--danger)', fontFamily: 'monospace', wordBreak: 'break-word' }}>
                  Error: {saveError}
                </div>
              )}
              <div style={{ display: 'flex', gap: '.75rem', marginTop: '.75rem' }}>
                <Button size="sm" loading={calculating} onClick={guardar}>Guardar en nómina</Button>
                <button className="btn-ghost" onClick={() => window.print()} title="Imprimir recibo">
                  <ArrowDownTrayIcon style={{ width: '1rem', height: '1rem' }} /> PDF
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nomina history table */}
      <DynamicTable
        tableName="nomina"
        empresaId={empresaId}
        tableKey="nomina"
        defaultColumns={NOMINA_COLS}
        defaultRow={{ periodo: '', salario_bruto: 0, total_neto: 0 }}
        title="Historial de Nóminas"
        orderBy="created_at"
        ascending={false}
      />
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────
export default function RRHH() {
  const { empresaId } = useAuth()
  const [activeTab, setActiveTab] = useState('empleados')
  const [totalEmp, setTotalEmp]   = useState(0)

  useEffect(() => {
    if (!empresaId) return
    supabase.from('empleados').select('id', { count: 'exact', head: true }).eq('empresa_id', empresaId).eq('estatus', 'activo')
      .then(({ count }) => setTotalEmp(count || 0))
  }, [empresaId])

  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ margin: '0 0 .25rem', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)' }}>
            Recursos Humanos
          </h2>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '.875rem' }}>
            Expedientes, nómina IMSS/INFONAVIT/ISR, organigrama y evaluaciones
          </p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '.75rem' }}>
          <KPICard label="Empleados activos" value={totalEmp} icon={UsersIcon} />
        </div>
      </div>

      <Tabs
        tabs={TABS}
        active={activeTab}
        onChange={setActiveTab}
        panels={{
          empleados: (
            <DynamicTable
              tableName="empleados"
              empresaId={empresaId}
              tableKey="empleados"
              defaultColumns={EMPLEADOS_COLS}
              defaultRow={{ nombre: 'Nuevo empleado', estatus: 'activo', salario_bruto: 0, fecha_ingreso: new Date().toISOString().split('T')[0] }}
              title="Directorio de empleados"
              orderBy="nombre"
              ascending={true}
            />
          ),
          nomina:      <NominaTab empresaId={empresaId} />,
          organigrama: <OrganigramaTab empresaId={empresaId} />,
          evaluacion: (
            <DynamicTable
              tableName="evaluaciones"
              empresaId={empresaId}
              tableKey="evaluaciones"
              defaultColumns={EVAL_COLS}
              defaultRow={{ empleado_nombre: 'Empleado', evaluador: '', puntaje: 0, periodo: new Date().getFullYear() + '-S1' }}
              title="Evaluaciones de desempeño"
              orderBy="created_at"
              ascending={false}
            />
          ),
        }}
      />
    </div>
  )
}
