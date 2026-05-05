import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import EditableTable from '../components/ui/EditableTable'

const COLUMNS = [
  { key: 'nombre',    label: 'Nombre',      type: 'text', editable: true, width: '200px' },
  { key: 'puesto',    label: 'Puesto',      type: 'text', editable: true, width: '180px' },
  { key: 'depto',     label: 'Departamento', type: 'text', editable: true, width: '160px' },
  { key: 'email',     label: 'Email',       type: 'email', editable: true, width: '220px' },
  { key: 'telefono',  label: 'Teléfono',    type: 'text', editable: true, width: '140px' },
  { key: 'ingreso',   label: 'Ingreso',     type: 'date', editable: true, width: '130px' },
  {
    key: 'salario',
    label: 'Salario',
    type: 'number',
    editable: true,
    width: '120px',
    formatter: v => v != null ? `$${Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '—',
  },
  {
    key: 'estado',
    label: 'Estado',
    type: 'select',
    editable: true,
    width: '120px',
    options: [
      { value: 'activo',   label: 'Activo'   },
      { value: 'baja',     label: 'Baja'     },
      { value: 'licencia', label: 'Licencia' },
    ],
  },
]

export default function RRHH() {
  const { empresaId } = useAuth()

  return (
    <div className="animate-fadeIn">
      <EditableTable
        tableName="rrhh"
        empresaId={empresaId}
        columns={COLUMNS}
        title="Recursos Humanos"
        orderBy="nombre"
        defaultRow={{ estado: 'activo', salario: 0 }}
      />
    </div>
  )
}
