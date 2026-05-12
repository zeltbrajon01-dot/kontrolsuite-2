import React, { useState, useEffect } from 'react'
import {
  UsersIcon, ShieldCheckIcon, DocumentTextIcon,
  PlusIcon, TrashIcon, CheckIcon, XMarkIcon,
} from '@heroicons/react/24/outline'
import { useAuth } from '../contexts/AuthContext'
import supabase from '../lib/supabase'
import DynamicTable from '../components/ui/DynamicTable'
import Tabs from '../components/ui/Tabs'
import Button from '../components/ui/Button'

/*
 * Required Supabase tables:
 *   usuarios_empresa (id uuid PK, empresa_id uuid, email text, nombre text,
 *                     rol text DEFAULT 'editor', activo bool DEFAULT true,
 *                     permisos jsonb DEFAULT '{}',
 *                     extras jsonb DEFAULT '{}', created_at timestamptz)
 *   roles_empresa (id uuid PK, empresa_id uuid, nombre text, descripcion text,
 *                  permisos jsonb DEFAULT '{}',
 *                  extras jsonb DEFAULT '{}', created_at timestamptz)
 *   auditoria (id uuid PK, empresa_id uuid, usuario text, accion text,
 *              tabla text, registro_id text, descripcion text,
 *              ip text, extras jsonb DEFAULT '{}', created_at timestamptz)
 *   tabla_config ...
 */

const TABS = [
  { id: 'usuarios',  label: 'Usuarios',  icon: UsersIcon        },
  { id: 'roles',     label: 'Roles',     icon: ShieldCheckIcon  },
  { id: 'auditoria', label: 'Auditoría', icon: DocumentTextIcon },
]

const MODULOS_PERMISO = [
  'dashboard', 'direccion', 'rrhh', 'ventas', 'finanzas',
  'compras', 'inventario', 'proyectos', 'produccion',
  'comunicaciones', 'sistema', 'ia',
]

const USUARIO_COLS = [
  { key: 'nombre', label: 'Nombre', type: 'text',  editable: true, width: '180px', builtin: true },
  { key: 'email',  label: 'Email',  type: 'email', editable: true, width: '220px', builtin: true },
  {
    key: 'rol', label: 'Rol', type: 'select', editable: true, width: '130px', builtin: true,
    options: [
      { value: 'admin',  label: 'Administrador' },
      { value: 'editor', label: 'Editor'        },
      { value: 'viewer', label: 'Solo lectura'  },
    ],
  },
]

const AUDITORIA_COLS = [
  { key: 'created_at', label: 'Fecha/Hora', type: 'text', editable: false, width: '170px', builtin: true,
    formatter: v => v ? new Date(v).toLocaleString('es-MX') : '—' },
  { key: 'usuario',    label: 'Usuario',    type: 'text', editable: false, width: '180px', builtin: true },
  { key: 'accion',     label: 'Acción',     type: 'text', editable: false, width: '130px', builtin: true },
  { key: 'tabla',      label: 'Tabla',      type: 'text', editable: false, width: '140px', builtin: true },
  { key: 'descripcion',label: 'Descripción',type: 'text', editable: false, width: '300px', builtin: true },
  { key: 'ip',         label: 'IP',         type: 'text', editable: false, width: '130px', builtin: true },
]

// ── Roles tab with permission matrix ─────────────────────────────
function RolesTab({ empresaId }) {
  const [roles,       setRoles]       = useState([])
  const [loading,     setLoading]     = useState(true)
  const [adding,      setAdding]      = useState(false)
  const [newRolName,  setNewRolName]  = useState('')
  const [saving,      setSaving]      = useState(false)
  const [saveError,   setSaveError]   = useState(null)

  useEffect(() => {
    if (!empresaId) return
    supabase.from('roles_empresa').select('*').eq('empresa_id', empresaId)
      .order('nombre').then(({ data }) => { setRoles(data || []); setLoading(false) })
  }, [empresaId])

  const addRol = async () => {
    if (!newRolName.trim()) return
    if (!empresaId) { setSaveError('empresa_id es null — usuario sin empresa activa'); return }
    setSaving(true)
    setSaveError(null)
    const permisos = {}
    MODULOS_PERMISO.forEach(m => { permisos[m] = { read: true, write: false, delete: false } })
    const { data, error: err } = await supabase.from('roles_empresa')
      .insert({ empresa_id: empresaId, nombre: newRolName.trim(), permisos })
      .select().single()
    setSaving(false)
    if (err) { setSaveError(err.message || err.details || JSON.stringify(err)); return }
    if (data) setRoles(prev => [...prev, data])
    setNewRolName('')
    setAdding(false)
  }

  const togglePerm = async (rolId, modulo, perm) => {
    const rol = roles.find(r => r.id === rolId)
    if (!rol) return
    const newPerms = {
      ...rol.permisos,
      [modulo]: { ...rol.permisos?.[modulo], [perm]: !rol.permisos?.[modulo]?.[perm] },
    }
    setRoles(prev => prev.map(r => r.id === rolId ? { ...r, permisos: newPerms } : r))
    await supabase.from('roles_empresa').update({ permisos: newPerms }).eq('id', rolId)
  }

  const deleteRol = async (id) => {
    await supabase.from('roles_empresa').delete().eq('id', id)
    setRoles(prev => prev.filter(r => r.id !== id))
  }

  if (loading) return <div style={{ padding: '2rem', textAlign: 'center' }}><span className="spinner" /></div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button onClick={() => setAdding(v => !v)}>
          <PlusIcon style={{ width: '.9rem', height: '.9rem' }} /> Nuevo rol
        </Button>
      </div>

      {adding && (
        <div className="card animate-fadeIn" style={{ padding: '1.25rem', maxWidth: 460 }}>
          <h4 style={{ margin: '0 0 .875rem', fontWeight: 700, fontSize: '.95rem', color: 'var(--text)' }}>Nuevo rol</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            <input className="input-themed" placeholder="Nombre del rol" value={newRolName} onChange={e => setNewRolName(e.target.value)} />
            {saveError && (
              <div style={{ padding: '.5rem .75rem', background: 'rgba(239,68,68,.08)', border: '1px solid var(--danger)', borderRadius: '.4rem', fontSize: '.8rem', color: 'var(--danger)', fontFamily: 'monospace', wordBreak: 'break-word' }}>
                Error: {saveError}
              </div>
            )}
            <div style={{ display: 'flex', gap: '.6rem' }}>
              <Button size="sm" loading={saving} onClick={addRol}>Crear rol</Button>
              <button className="btn-ghost" onClick={() => setAdding(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {roles.map(rol => (
        <div key={rol.id} className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '.875rem 1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span style={{ fontWeight: 700, fontSize: '.9rem', color: 'var(--text)' }}>{rol.nombre}</span>
              {rol.descripcion && <span style={{ marginLeft: '.75rem', fontSize: '.8rem', color: 'var(--text-muted)' }}>{rol.descripcion}</span>}
            </div>
            <button className="btn-ghost" style={{ padding: '.3rem', opacity: .5 }} onClick={() => deleteRol(rol.id)}>
              <TrashIcon style={{ width: '.85rem', height: '.85rem', color: 'var(--danger)' }} />
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="table-themed" style={{ fontSize: '.78rem' }}>
              <thead>
                <tr>
                  <th>Módulo</th>
                  <th style={{ textAlign: 'center' }}>Leer</th>
                  <th style={{ textAlign: 'center' }}>Escribir</th>
                  <th style={{ textAlign: 'center' }}>Eliminar</th>
                </tr>
              </thead>
              <tbody>
                {MODULOS_PERMISO.map(mod => {
                  const p = rol.permisos?.[mod] || {}
                  return (
                    <tr key={mod}>
                      <td style={{ fontWeight: 600, textTransform: 'capitalize' }}>{mod}</td>
                      {['read','write','delete'].map(perm => (
                        <td key={perm} style={{ textAlign: 'center' }}>
                          <button
                            onClick={() => togglePerm(rol.id, mod, perm)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '.15rem' }}
                          >
                            {p[perm]
                              ? <CheckIcon style={{ width: '1rem', height: '1rem', color: 'var(--success)' }} />
                              : <XMarkIcon style={{ width: '1rem', height: '1rem', color: 'var(--border)' }} />
                            }
                          </button>
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {roles.length === 0 && !adding && (
        <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          Sin roles personalizados. El sistema usa admin/editor/viewer por defecto.
        </div>
      )}
    </div>
  )
}

// ── Main page ─────────────────────────────────────────────────────
export default function Sistema() {
  const { empresaId } = useAuth()
  const [activeTab, setActiveTab] = useState('usuarios')

  return (
    <div className="animate-fadeIn" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ margin: '0 0 .25rem', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)' }}>
          Sistema
        </h2>
        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '.875rem' }}>
          Gestión de usuarios, roles, permisos granulares y auditoría
        </p>
      </div>

      <Tabs
        tabs={TABS}
        active={activeTab}
        onChange={setActiveTab}
        panels={{
          usuarios: (
            <DynamicTable
              tableName="perfiles"
              empresaId={empresaId}
              tableKey="perfiles"
              defaultColumns={USUARIO_COLS}
              defaultRow={{ nombre: 'Nuevo usuario', email: '', rol: 'editor' }}
              title="Usuarios de la empresa"
              orderBy="nombre"
              ascending={true}
            />
          ),
          roles:     <RolesTab empresaId={empresaId} />,
          auditoria: (
            <DynamicTable
              tableName="audit_logs"
              empresaId={empresaId}
              tableKey="audit_logs"
              defaultColumns={AUDITORIA_COLS}
              defaultRow={{}}
              title="Log de auditoría"
              orderBy="created_at"
              ascending={false}
              allowAdd={false}
              allowDelete={false}
            />
          ),
        }}
      />
    </div>
  )
}
