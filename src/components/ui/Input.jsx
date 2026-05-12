import React from 'react'

export default function Input({
  label,
  error,
  id,
  className = '',
  ...props
}) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') : undefined)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {/*
        label y error SIEMPRE en el DOM con display toggle.
        {label && <label>} causa insertBefore cuando password managers
        inyectan nodos en este contenedor: React pierde la referencia al
        <input> como nodo hermano y el insertBefore falla.
        Con el nodo siempre presente, la estructura DOM nunca cambia.
      */}
      <label
        htmlFor={inputId}
        style={{
          display:    label ? 'block' : 'none',
          color:      'var(--text-muted)',
          fontSize:   '.8rem',
          fontWeight: 600,
        }}
      >
        {label}
      </label>

      <input
        id={inputId}
        className={`input-themed ${className}`}
        {...props}
      />

      <span
        role="alert"
        style={{
          display:    error ? 'block' : 'none',
          color:      'var(--danger)',
          fontSize:   '.75rem',
          lineHeight: 1.3,
        }}
      >
        {error}
      </span>
    </div>
  )
}
