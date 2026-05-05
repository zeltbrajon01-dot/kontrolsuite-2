import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import EditableTable from '../components/ui/EditableTable'

const COLUMNS = [
  { key: 'fecha',       label: 'Fecha',       type: 'date',   editable: true, width: '130px' },
  { key: 'descripcion', label: 'Descripción',  type: 'text',   editable: true, width: '240px' },
  {
    key: 'tipo',
    label: 'Tipo',
    type: 'select',
    editable: true,
    width: '120px',
    options: [
      { value: 'ingreso',  label: 'Ingreso'  },
      { value: 'egreso',   label: 'Egreso'   },
      { value: 'transferencia', label: 'Transfer.' },
    ],
  },
  {
    key: 'monto',
    label: 'Monto',
    type: 'number',
    editable: true,
    width: '120px',
    formatter: v => v != null ? `$${Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '—',
  },
  { key: 'categoria',  label: 'Categoría', type: 'text', editable: true, width: '150px' },
  { key: 'referencia', label: 'Referencia', type: 'text', editable: true, width: '150px' },
  {
    key: 'estado',
    label: 'Estado',
    type: 'select',
    editable: true,
    width: '120px',
    options: [
      { value: 'confirmado', label: 'Confirmado' },
      { value: 'pendiente',  label: 'Pendiente'  },
      { value: 'anulado',    label: 'Anulado'    },
    ],
  },
]

export default function Finanzas() {
  const { empresaId } = useAuth()

  return (
    <div className="animate-fadeIn">
      <EditableTable
        tableName="finanzas"
        empresaId={empresaId}
        columns={COLUMNS}
        title="Finanzas"
        orderBy="fecha"
        ascending={false}
        defaultRow={{ tipo: 'ingreso', estado: 'pendiente', monto: 0 }}
      />
    </div>
  )
}
