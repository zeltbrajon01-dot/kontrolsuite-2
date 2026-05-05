import React from 'react'
import { useAuth } from '../contexts/AuthContext'
import EditableTable from '../components/ui/EditableTable'

const COLUMNS = [
  { key: 'codigo',      label: 'Código',     type: 'text',   editable: true, width: '120px' },
  { key: 'nombre',      label: 'Producto',   type: 'text',   editable: true, width: '220px' },
  { key: 'categoria',   label: 'Categoría',  type: 'text',   editable: true, width: '150px' },
  { key: 'stock',       label: 'Stock',      type: 'number', editable: true, width: '90px' },
  { key: 'stock_min',   label: 'Mín.',       type: 'number', editable: true, width: '80px' },
  {
    key: 'precio',
    label: 'Precio',
    type: 'number',
    editable: true,
    width: '110px',
    formatter: v => v != null ? `$${Number(v).toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '—',
  },
  {
    key: 'estado',
    label: 'Estado',
    type: 'select',
    editable: true,
    width: '120px',
    options: [
      { value: 'activo',     label: 'Activo'     },
      { value: 'agotado',    label: 'Agotado'    },
      { value: 'descontinuado', label: 'Descont.' },
    ],
  },
  { key: 'ubicacion', label: 'Ubicación', type: 'text', editable: true, width: '130px' },
]

export default function Inventario() {
  const { empresaId } = useAuth()

  return (
    <div className="animate-fadeIn">
      <EditableTable
        tableName="inventario"
        empresaId={empresaId}
        columns={COLUMNS}
        title="Inventario"
        orderBy="nombre"
        defaultRow={{ estado: 'activo', stock: 0, stock_min: 5, precio: 0 }}
      />
    </div>
  )
}
