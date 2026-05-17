import React, { useState, useEffect, useRef } from 'react'
import {
  UsersIcon, DocumentTextIcon, ChartBarIcon, StarIcon,
  ArrowDownTrayIcon, CalendarDaysIcon, FolderOpenIcon, TrashIcon,
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
  { id: 'empleados',   label: 'Empleados',   icon: UsersIcon          },
  { id: 'asistencias', label: 'Asistencias', icon: CalendarDaysIcon   },
  { id: 'nomina',      label: 'Nómina',      icon: DocumentTextIcon   },
  { id: 'expediente',  label: 'Expediente',  icon: FolderOpenIcon     },
  { id: 'organigrama', label: 'Organigrama', icon: ChartBarIcon       },
  { id: 'evaluacion',  label: 'Evaluación',  icon: StarIcon           },
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

// ── Asistencias — calendario mensual ─────────────────────────────
const TIPOS_ASIS  = ['presente', 'ausente', 'tardanza', 'permiso', 'vacaciones']
const ASIS_COLOR  = {
  presente:   { bg: 'var(--success)',  text: '#fff' },
  ausente:    { bg: 'var(--danger)',   text: '#fff' },
  tardanza:   { bg: 'var(--warning)',  text: '#fff' },
  permiso:    { bg: 'var(--primary)',  text: '#fff' },
  vacaciones: { bg: '#8b5cf6',         text: '#fff' },
}
const ASIS_SHORT  = { presente: 'P', ausente: 'A', tardanza: 'T', permiso: 'PE', vacaciones: 'V' }

function AsistenciasTab({ empresaId }) {
  const hoy  = new Date()
  const [mes, setMes] = useState(
    `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`
  )
  const [empleados,   setEmpleados]   = useState([])
  const [asistencias, setAsistencias] = useState({})
  const [loading,     setLoading]     = useState(true)
  const [saving,      setSaving]      = useState(false)

  const [year, month] = mes.split('-').map(Number)
  const diasEnMes  = new Date(year, month, 0).getDate()
  const dias       = Array.from({ length: diasEnMes }, (_, i) => i + 1)

  useEffect(() => {
    if (!empresaId) return
    supabase.from('empleados').select('id,nombre')
      .eq('empresa_id', empresaId).eq('estatus', 'activo')
      .order('nombre', { ascending: true })
      .then(({ data }) => setEmpleados(data || []))
  }, [empresaId])

  useEffect(() => {
    if (!empresaId) return
    setLoading(true)
    const desde = `${mes}-01`
    const hasta = `${mes}-${String(diasEnMes).padStart(2, '0')}`
    supabase.from('asistencias').select('*').eq('empresa_id', empresaId)
      .gte('fecha', desde).lte('fecha', hasta)
      .then(({ data }) => {
        const map = {};
        (data || []).forEach(a => { map[`${a.empleado_id}-${a.fecha}`] = { tipo: a.tipo, id: a.id } })
        setAsistencias(map)
        setLoading(false)
      })
  }, [empresaId, mes, diasEnMes])

  const navMes = (delta) => {
    const d = new Date(year, month - 1 + delta, 1)
    setMes(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`)
  }

  const toggleCell = async (empId, empNombre, dia) => {
    const fecha = `${mes}-${String(dia).padStart(2, '0')}`
    const key   = `${empId}-${fecha}`
    const actual = asistencias[key]
    setSaving(true)
    if (!actual) {
      const { data } = await supabase.from('asistencias').insert({
        empresa_id: empresaId, empleado_id: empId,
        empleado_nombre: empNombre, fecha, tipo: 'presente',
      }).select().single()
      if (data) setAsistencias(prev => ({ ...prev, [key]: { tipo: 'presente', id: data.id } }))
    } else {
      const next = TIPOS_ASIS[(TIPOS_ASIS.indexOf(actual.tipo) + 1) % TIPOS_ASIS.length]
      await supabase.from('asistencias').update({ tipo: next }).eq('id', actual.id)
      setAsistencias(prev => ({ ...prev, [key]: { ...prev[key], tipo: next } }))
    }
    setSaving(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Nav */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <button className="btn-ghost" onClick={() => navMes(-1)}>← Anterior</button>
        <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text)', textTransform: 'capitalize' }}>
          {new Date(year, month - 1, 1).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' })}
        </span>
        <button className="btn-ghost" onClick={() => navMes(1)}>Siguiente →</button>
        {saving && <span className="spinner" style={{ width: 16, height: 16 }} />}
      </div>

      {/* Leyenda */}
      <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap', alignItems: 'center' }}>
        {TIPOS_ASIS.map(t => (
          <span key={t} style={{
            background: ASIS_COLOR[t]?.bg, color: ASIS_COLOR[t]?.text,
            borderRadius: '9999px', padding: '.15rem .55rem',
            fontSize: '.7rem', fontWeight: 700,
          }}>
            {ASIS_SHORT[t]} = {t}
          </span>
        ))}
        <span style={{ fontSize: '.7rem', color: 'var(--text-muted)' }}>· Click para marcar / ciclar</span>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}><span className="spinner" /></div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', minWidth: '100%', fontSize: '.77rem' }}>
            <thead>
              <tr>
                <th style={{
                  padding: '.45rem .75rem', textAlign: 'left',
                  background: 'var(--surface-2)', color: 'var(--text)',
                  borderBottom: '2px solid var(--border)',
                  position: 'sticky', left: 0, zIndex: 2, minWidth: 160,
                }}>
                  Empleado
                </th>
                {dias.map(d => {
                  const wd = new Date(year, month - 1, d).getDay()
                  const wk = wd === 0 || wd === 6
                  return (
                    <th key={d} style={{
                      padding: '.35rem .2rem', textAlign: 'center', minWidth: 34,
                      background: wk ? 'rgba(99,102,241,.1)' : 'var(--surface-2)',
                      color: wk ? 'var(--primary)' : 'var(--text-muted)',
                      borderBottom: '2px solid var(--border)',
                      borderLeft: '1px solid var(--border)',
                      fontWeight: wk ? 700 : 500,
                    }}>
                      {d}
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              {empleados.length === 0 && (
                <tr>
                  <td colSpan={diasEnMes + 1} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    Sin empleados activos.
                  </td>
                </tr>
              )}
              {empleados.map((emp, ri) => {
                const rowBg = ri % 2 === 0 ? 'var(--surface)' : 'var(--surface-2)'
                return (
                  <tr key={emp.id} style={{ background: rowBg }}>
                    <td style={{
                      padding: '.4rem .75rem', fontWeight: 600, color: 'var(--text)',
                      borderBottom: '1px solid var(--border)',
                      position: 'sticky', left: 0, background: rowBg, zIndex: 1,
                    }}>
                      {emp.nombre}
                    </td>
                    {dias.map(d => {
                      const fecha = `${mes}-${String(d).padStart(2, '0')}`
                      const key   = `${emp.id}-${fecha}`
                      const a     = asistencias[key]
                      const col   = a ? (ASIS_COLOR[a.tipo] || { bg: 'var(--primary)', text: '#fff' }) : null
                      return (
                        <td key={d} style={{
                          padding: '.2rem .1rem', textAlign: 'center',
                          borderBottom: '1px solid var(--border)',
                          borderLeft: '1px solid var(--border)',
                        }}>
                          <div
                            onClick={() => toggleCell(emp.id, emp.nombre, d)}
                            title={a ? a.tipo : 'Sin marcar'}
                            style={{
                              width: 28, height: 22, margin: '0 auto',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              borderRadius: '.3rem', cursor: 'pointer',
                              background: col ? col.bg : 'transparent',
                              color: col ? col.text : 'var(--border)',
                              fontSize: '.68rem', fontWeight: 700,
                              transition: 'background .12s',
                            }}
                          >
                            {a ? (ASIS_SHORT[a.tipo] || a.tipo[0].toUpperCase()) : '·'}
                          </div>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Expediente digital — Supabase Storage ─────────────────────────
function ExpedienteTab({ empresaId }) {
  const [empleados,    setEmpleados]    = useState([])
  const [selectedId,   setSelectedId]   = useState('')
  const [files,        setFiles]        = useState([])
  const [uploading,    setUploading]    = useState(false)
  const [uploadError,  setUploadError]  = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    if (!empresaId) return
    supabase.from('empleados').select('id,nombre')
      .eq('empresa_id', empresaId).eq('estatus', 'activo')
      .order('nombre', { ascending: true })
      .then(({ data }) => setEmpleados(data || []))
  }, [empresaId])

  useEffect(() => {
    if (!selectedId || !empresaId) { setFiles([]); return }
    loadFiles()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, empresaId])

  const loadFiles = async () => {
    const { data, error } = await supabase.storage
      .from('expedientes')
      .list(`${empresaId}/${selectedId}`, { sortBy: { column: 'created_at', order: 'desc' } })
    if (!error) setFiles(data || [])
  }

  const upload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || !selectedId || !empresaId) return
    if (file.size > 10 * 1024 * 1024) { setUploadError('El archivo supera el límite de 10 MB.'); return }
    setUploading(true)
    setUploadError(null)
    const path = `${empresaId}/${selectedId}/${Date.now()}_${file.name}`
    const { error } = await supabase.storage.from('expedientes').upload(path, file)
    if (error) setUploadError(error.message)
    else await loadFiles()
    setUploading(false)
    e.target.value = ''
  }

  const remove = async (fileName) => {
    await supabase.storage.from('expedientes').remove([`${empresaId}/${selectedId}/${fileName}`])
    await loadFiles()
  }

  const getUrl = (fileName) => {
    const { data } = supabase.storage.from('expedientes')
      .getPublicUrl(`${empresaId}/${selectedId}/${fileName}`)
    return data?.publicUrl
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 680 }}>
      <div>
        <label style={{ display: 'block', fontSize: '.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '.3rem' }}>
          Empleado
        </label>
        <select
          className="input-themed"
          style={{ width: '100%', maxWidth: 400 }}
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
        >
          <option value="">Seleccionar empleado…</option>
          {empleados.map(e => <option key={e.id} value={e.id}>{e.nombre}</option>)}
        </select>
      </div>

      {selectedId && (
        <>
          <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={upload} />
            <Button onClick={() => fileInputRef.current?.click()} loading={uploading} disabled={uploading}>
              Subir documento
            </Button>
            <span style={{ fontSize: '.8rem', color: 'var(--text-muted)' }}>
              PDF, DOCX, XLSX, PNG, JPG — máx. 10 MB
            </span>
          </div>

          {uploadError && (
            <div style={{ padding: '.6rem .75rem', background: 'rgba(239,68,68,.08)', border: '1px solid var(--danger)', borderRadius: '.4rem', fontSize: '.8rem', color: 'var(--danger)' }}>
              Error: {uploadError}
            </div>
          )}

          {files.length === 0 ? (
            <div className="card" style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '.875rem' }}>
              Sin documentos en el expediente. Sube el primer archivo.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              {files.map(f => (
                <div key={f.name} className="card" style={{ padding: '.7rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem', minWidth: 0 }}>
                    <DocumentTextIcon style={{ width: '1.2rem', height: '1.2rem', color: 'var(--primary)', flexShrink: 0 }} />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: '.875rem', color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {f.name.replace(/^\d+_/, '')}
                      </div>
                      {f.metadata?.size && (
                        <div style={{ fontSize: '.73rem', color: 'var(--text-muted)' }}>
                          {(f.metadata.size / 1024).toFixed(1)} KB
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '.4rem', flexShrink: 0 }}>
                    <a
                      href={getUrl(f.name)} target="_blank" rel="noreferrer"
                      className="btn-ghost"
                      style={{ padding: '.3rem .65rem', fontSize: '.8rem', textDecoration: 'none' }}
                    >
                      Ver
                    </a>
                    <button className="btn-ghost" onClick={() => remove(f.name)} style={{ padding: '.3rem', opacity: .65 }}>
                      <TrashIcon style={{ width: '.85rem', height: '.85rem', color: 'var(--danger)' }} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

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
          asistencias: <AsistenciasTab empresaId={empresaId} />,
          nomina:      <NominaTab empresaId={empresaId} />,
          expediente:  <ExpedienteTab empresaId={empresaId} />,
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
