import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import EditableTable from '../components/ui/EditableTable'

const COLUMNS = [
  { key: 'nombre',    label: 'Nombre',     type: 'text',   editable: true, width: '200px' },
  { key: 'email',     label: 'Email',      type: 'email',  editable: true, width: '220px' },
  { key: 'telefono',  label: 'Teléfono',   type: 'text',   editable: true, width: '140px' },
  { key: 'empresa',   label: 'Empresa',    type: 'text',   editable: true, width: '180px' },
  {
    key: 'estado',
    label: 'Estado',
    type: 'select',
    editable: true,
    width: '120px',
    options: [
      { value: 'activo',    label: 'Activo'    },
      { value: 'inactivo',  label: 'Inactivo'  },
      { value: 'prospecto', label: 'Prospecto' },
    ],
  },
  { key: 'notas', label: 'Notas', type: 'text', editable: true, width: '220px' },
]

export default function Clientes() {
  const { empresaId } = useAuth()

  return (
    <div className="animate-fadeIn">
      <EditableTable
        tableName="clientes"
        empresaId={empresaId}
        columns={COLUMNS}
        title="Clientes"
        orderBy="nombre"
        defaultRow={{ nombre: 'Nuevo cliente', estado: 'prospecto' }}
      />
    </div>
  )
}
