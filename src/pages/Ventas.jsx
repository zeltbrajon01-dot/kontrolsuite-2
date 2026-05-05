import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import EditableTable from '../components/ui/EditableTable'

const COLUMNS = [
  { key: 'numero',      label: '#',            type: 'text',   editable: false, width: '80px' },
  { key: 'cliente',     label: 'Cliente',       type: 'text',   editable: true,  width: '200px' },
  { key: 'producto',    label: 'Producto',      type: 'text',   editable: true,  width: '200px' },
  { key: 'cantidad',    label: 'Qty',           type: 'number', editable: true,  width: '80px' },
  {
    key: 'monto',
    label: 'Monto',
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
      { value: 'pendiente',  label: 'Pendiente'  },
      { value: 'pagado',     label: 'Pagado'     },
      { value: 'cancelado',  label: 'Cancelado'  },
      { value: 'devolucion', label: 'Devolución' },
    ],
  },
  { key: 'fecha', label: 'Fecha', type: 'date', editable: true, width: '140px' },
]

export default function Ventas() {
  const { empresaId } = useAuth()

  return (
    <div className="animate-fadeIn">
      <EditableTable
        tableName="ventas"
        empresaId={empresaId}
        columns={COLUMNS}
        title="Ventas"
        orderBy="fecha"
        ascending={false}
        defaultRow={{ estado: 'pendiente', cantidad: 1, monto: 0 }}
      />
    </div>
  )
}
