import React, { useState, useEffect } from 'react'
import {
  ChartBarIcon, FlagIcon, CalendarIcon, MegaphoneIcon,
  TrashIcon,
} from '@heroicons/react/24/outline'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts'
import { useAuth } from '../contexts/AuthContext'
import supabase from '../lib/supabase'
import DynamicTable from '../components/ui/DynamicTable'
import KPICard from '../components/ui/KPICard'
import Tabs from '../components/ui/Tabs'
import Button from '../components/ui/Button'

/*
 * Required Supabase tables:
 *   kpis (id uuid PK, empresa_id uuid, titulo text, valor numeric DEFAULT 0,
 *         meta numeric DEFAULT 100, unidad text DEFAULT '%', categoria text,
 *         activo bool DEFAULT true, extras jsonb DEFAULT '{}', created_at timestamptz)
 *   okrs (id uuid PK, empresa_id uuid, objetivo text, resultado_clave text,
 *         progreso int DEFAULT 0, responsable text, periodo text,
 *         extras jsonb DEFAULT '{}', created_at timestamptz)
 *   comunicados (id uuid PK, empresa_id uuid, titulo text, contenido text,
 *                tipo text DEFAULT 'general', fecha date,
 *                extras jsonb DEFAULT '{}', created_at timestamptz)
 *   tabla_config (id uuid PK, empresa_id uuid, tabla text, columnas jsonb,
 *                 updated_at timestamptz, UNIQUE(empresa_id, tabla))
 */

const TABS = [
  { id: 'kpis',        label: 'KPIs',        icon: ChartBarIcon   },
  { id: 'okrs',        label: 'OKRs',        icon: FlagIcon        },
  { id: 'calendario',  label: 'Calendario',  icon: CalendarIcon    },
  { id: 'comunicados', label: 'Comunicados', icon: MegaphoneIcon   },
]

const KPI_COLS = [
  { key: 'objetivo',        label: 'Objetivo',       type: 'text',   editable: true, width: '240px', builtin: true },
  { key: 'resultado_clave', label: 'Resultado Clave', type: 'text',   editable: true, width: '220px', builtin: true },
  { key: 'progreso',        label: 'Progreso %',      type: 'number', editable: true, width: '100px', builtin: true },
  { key: 'responsable',     label: 'Responsable',     type: 'text',   editable: true, width: '160px', builtin: true },
  { key: 'periodo',         label: 'Período',         type: 'text',   editable: true, width: '120px', builtin: true },
]

const OKR_COLS = [
  { key: 'objetivo',       label: 'Objetivo',      type: 'text',   editable: true, width: '220px', builtin: true },
  { key: 'resultado_clave',label: 'Resultado Clave',type: 'text',   editable: true, width: '220px', builtin: true },
  { key: 'progreso',       label: 'Progreso %',    type: 'number', editable: true, width: '100px', builtin: true },
  { key: 'responsable',    label: 'Responsable',   type: 'text',   editable: true, width: '160px', builtin: true },
  { key: 'periodo',        label: 'Período',       type: 'text',   editable: true, width: '120px', builtin: true },
]

const COMUNICADO_COLS = [
  { key: 'titulo',   label: 'Título',   type: 'text',   editable: true, width: '240px', builtin: true },
  { key: 'tipo',     label: 'Tipo',     type: 'select', editable: true, width: '120px', builtin: true,
    options: [
      { value: 'general',   label: 'General'   },
      { value: 'urgente',   label: 'Urgente'   },
      { value: 'reunion',   label: 'Reunión'   },
      { value: 'resultado', label: 'Resultado' },
    ],
  },
  { key: 'fecha',    label: 'Fecha',    type: 'date',   editable: true, width: '130px', builtin: true },
  { key: 'contenido',label: 'Contenido',type: 'text',   editable: true, width: '320px', builtin: true },
]

const CHART_DATA = [
  { mes: 'Ene', ventas: 42, meta: 50 }, { mes: 'Feb', ventas: 58, meta: 50 },
  { mes: 'Mar', ventas: 52, meta: 55 }, { mes: 'Abr', ventas: 71, meta: 55 },
  { mes: 'May', ventas: 64, meta: 60 }, { mes: 'Jun', ventas: 89, meta: 60 },
]

// ── Simple calendar ───────────────────────────────────────────────
function CalendarioTab({ empresaId }) {
  const today  = new Date()
  const [year, setYear]   = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [events, setEvents] = useState([])
  const [addingDay, setAddingDay] = useState(null)
  const [newEvent,  setNewEvent]  = useState('')

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const MONTH_NAMES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
  const DAY_NAMES   = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']

  useEffect(() => {
    if (!empresaId) return
    supabase.from('eventos_calendario').select('*')
      .eq('empresa_id', empresaId)
      .then(({ data }) => setEvents(data || []))
  }, [empresaId])

  const saveEvent = async () => {
    if (!newEvent.trim() || !addingDay) return
    const fecha = `${year}-${String(month + 1).padStart(2, '0')}-${String(addingDay).padStart(2, '0')}`
    const { data } = await supabase.from('eventos_calendario')
      .insert({ empresa_id: empresaId, titulo: newEvent.trim(), fecha })
      .select().single()
    if (data) setEvents(prev => [...prev, data])
    setNewEvent('')
    setAddingDay(null)
  }

  const deleteEvent = async (id) => {
    await supabase.from('eventos_calendario').delete().eq('id', id)
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  const eventsForDay = (d) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    return events.filter(e => e.fecha === dateStr)
  }

  return (
    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
      <div className="card" style={{ flex: '1 1 500px', padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <button className="btn-ghost" style={{ padding: '.35rem .6rem' }}
            onClick={() => { if (month === 0) { setMonth(11); setYear(y => y - 1) } else setMonth(m => m - 1) }}>
            ‹
          </button>
          <span style={{ fontWeight: 700, fontSize: '.95rem', color: 'var(--text)' }}>
            {MONTH_NAMES[month]} {year}
          </span>
          <button className="btn-ghost" style={{ padding: '.35rem .6rem' }}
            onClick={() => { if (month === 11) { setMonth(0); setYear(y => y + 1) } else setMonth(m => m + 1) }}>
            ›
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '.25rem' }}>
          {DAY_NAMES.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: '.7rem', fontWeight: 700, color: 'var(--text-muted)', padding: '.35rem 0' }}>{d}</div>
          ))}
          {Array.from({ length: firstDay }).map((_, i) => <div key={'e' + i} />)}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => {
            const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear()
            const dayEvts = eventsForDay(d)
            return (
              <div
                key={d}
                onClick={() => setAddingDay(d)}
                style={{
                  padding: '.3rem',
                  borderRadius: '.4rem',
                  cursor: 'pointer',
                  background: isToday ? 'var(--primary)' : dayEvts.length ? 'var(--primary-light)' : 'var(--surface-2)',
                  border: '1px solid ' + (isToday ? 'var(--primary)' : 'var(--border)'),
                  minHeight: 36,
                  transition: 'background .1s',
                }}
                onMouseEnter={e => { if (!isToday) e.currentTarget.style.background = 'var(--primary-light)' }}
                onMouseLeave={e => { if (!isToday) e.currentTarget.style.background = dayEvts.length ? 'var(--primary-light)' : 'var(--surface-2)' }}
              >
                <div style={{ fontSize: '.75rem', fontWeight: 600, color: isToday ? '#fff' : 'var(--text)', textAlign: 'right' }}>{d}</div>
                {dayEvts.slice(0, 2).map(ev => (
                  <div key={ev.id} style={{ fontSize: '.6rem', color: isToday ? '#ffffffcc' : 'var(--primary)', fontWeight: 600, marginTop: '.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {ev.titulo}
                  </div>
                ))}
                {dayEvts.length > 2 && <div style={{ fontSize: '.6rem', color: 'var(--text-muted)' }}>+{dayEvts.length - 2}</div>}
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ flex: '0 0 280px' }}>
        <div style={{ display: addingDay ? 'block' : 'none' }} className="card">
          <div style={{ padding: '1rem' }}>
            <h4 style={{ margin: '0 0 .75rem', fontSize: '.9rem', fontWeight: 700, color: 'var(--text)' }}>
              Nuevo evento — día {addingDay}
            </h4>
            <input
              className="input-themed"
              style={{ width: '100%', padding: '.45rem .75rem', fontSize: '.875rem', marginBottom: '.75rem' }}
              placeholder="Título del evento…"
              value={newEvent}
              onChange={e => setNewEvent(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') saveEvent(); if (e.key === 'Escape') setAddingDay(null) }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: '.5rem' }}>
              <Button size="sm" onClick={saveEvent}>Guardar</Button>
              <button className="btn-ghost" onClick={() => setAddingDay(null)}>Cancelar</button>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: addingDay ? '1rem' : 0, padding: '1rem' }}>
          <h4 style={{ margin: '0 0 .75rem', fontSize: '.875rem', fontWeight: 700, color: 'var(--text)' }}>Próximos eventos</h4>
          {events.length === 0 ? (
            <p style={{ color: 'var(--text-muted)', fontSize: '.8rem' }}>Sin eventos. Haz clic en un día para agregar.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
              {events.sort((a, b) => a.fecha.localeCompare(b.fecha)).slice(0, 8).map(ev => (
                <div key={ev.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '.5rem', background: 'var(--surface-2)', borderRadius: '.375rem', padding: '.45rem .6rem' }}>
                  <div>
                    <div style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--text)' }}>{ev.titulo}</div>
                    <div style={{ fontSize: '.7rem', color: 'var(--text-muted)' }}>{ev.fecha}</div>
                  </div>
                  <button className="btn-ghost" style={{ padding: '.2rem', opacity: .5 }} onClick={() => deleteEvent(ev.id)}>
                    <TrashIcon style={{ width: '.75rem', height: '.75rem', color: 'var(--danger)' }} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── KPIs with chart ──────────────────────────────────────────────
function KPIsTab({ empresaId }) {
  const [kpis, setKpis] = useState([])

  useEffect(() => {
    if (!empresaId) return
    supabase.from('okrs').select('*').eq('empresa_id', empresaId).then(({ data }) => setKpis(data || []))
  }, [empresaId])

  const topKpis = kpis.slice(0, 4)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Summary cards from DB */}
      {topKpis.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: '1rem' }}>
          {topKpis.map(k => (
            <KPICard
              key={k.id}
              label={k.objetivo}
              value={`${k.progreso ?? 0}%`}
              subtitle={k.resultado_clave}
              change={k.periodo}
              up={(k.progreso ?? 0) >= 50}
              icon={ChartBarIcon}
            />
          ))}
        </div>
      )}

      {/* Chart */}
      <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
        <h3 style={{ margin: '0 0 1rem', fontSize: '.95rem', fontWeight: 700, color: 'var(--text)' }}>
          Desempeño mensual vs. Meta
        </h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={CHART_DATA} barCategoryGap="35%">
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '.5rem', fontSize: '.8rem', color: 'var(--text)' }}
            />
            <Legend wrapperStyle={{ fontSize: '.8rem', color: 'var(--text-muted)' }} />
            <Bar dataKey="ventas" name="Real"  fill="var(--primary)" radius={[4,4,0,0]} />
            <Bar dataKey="meta"   name="Meta"  fill="var(--border)"  radius={[4,4,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* KPIs table */}
      <DynamicTable
        tableName="okrs"
        empresaId={empresaId}
        tableKey="okrs_kpis"
        defaultColumns={KPI_COLS}
        defaultRow={{ objetivo: 'Nuevo objetivo', progreso: 0, periodo: new Date().getFullYear() + '-Q1' }}
        title="KPIs — Objetivos y Resultados"
        orderBy="objetivo"
        ascending={true}
      />
    </div>
  )
}

// ── OKRs with progress bars ───────────────────────────────────────
function OKRsTab({ empresaId }) {
  const [okrs, setOkrs] = useState([])

  useEffect(() => {
    if (!empresaId) return
    supabase.from('okrs').select('*').eq('empresa_id', empresaId).order('created_at', { ascending: false })
      .then(({ data }) => setOkrs(data || []))
  }, [empresaId])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Visual OKR progress cards */}
      {okrs.slice(0, 6).map(okr => (
        <div key={okr.id} className="card" style={{ padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.5rem' }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: '.9rem', color: 'var(--text)' }}>{okr.objetivo}</div>
              <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginTop: '.15rem' }}>
                {okr.resultado_clave} · {okr.responsable} · {okr.periodo}
              </div>
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: okr.progreso >= 80 ? 'var(--success)' : okr.progreso >= 50 ? 'var(--primary)' : 'var(--danger)' }}>
              {okr.progreso}%
            </span>
          </div>
          <div style={{ background: 'var(--border)', borderRadius: '9999px', height: 6 }}>
            <div style={{
              width: Math.min(okr.progreso, 100) + '%',
              height: '100%',
              borderRadius: '9999px',
              background: okr.progreso >= 80 ? 'var(--success)' : okr.progreso >= 50 ? 'var(--primary)' : 'var(--danger)',
              transition: 'width .4s ease',
            }} />
          </div>
        </div>
      ))}

      {/* OKRs editable table */}
      <DynamicTable
        tableName="okrs"
        empresaId={empresaId}
        tableKey="okrs"
        defaultColumns={OKR_COLS}
        defaultRow={{ objetivo: 'Nuevo objetivo', progreso: 0, periodo: new Date().getFullYear() + '-Q1' }}
        title="Objetivos y Resultados Clave"
        orderBy="created_at"
        ascending={false}
      />
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────
export default function DireccionGeneral() {
  const { empresaId } = useAuth()
  const [activeTab, setActiveTab] = useState('kpis')

  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ margin: '0 0 .25rem', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)' }}>
          Dirección General
        </h2>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '.875rem' }}>
          KPIs estratégicos, OKRs, calendario y comunicados
        </p>
      </div>

      <Tabs
        tabs={TABS}
        active={activeTab}
        onChange={setActiveTab}
        panels={{
          kpis:        <KPIsTab empresaId={empresaId} />,
          okrs:        <OKRsTab empresaId={empresaId} />,
          calendario:  <CalendarioTab empresaId={empresaId} />,
          comunicados: (
            <DynamicTable
              tableName="comunicados"
              empresaId={empresaId}
              tableKey="comunicados"
              defaultColumns={COMUNICADO_COLS}
              defaultRow={{ titulo: 'Nuevo comunicado', tipo: 'general', fecha: new Date().toISOString().split('T')[0] }}
              title="Comunicados internos"
              orderBy="fecha"
              ascending={false}
            />
          ),
        }}
      />
    </div>
  )
}
