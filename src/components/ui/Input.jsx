import React from 'react'

export default function Input({
  label,
  error,
  id,
  className = '',
  ...props
}) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} style={{ color: 'var(--text-muted)', fontSize: '.8rem', fontWeight: 600 }}>
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`input-themed ${className}`}
        {...props}
      />
      {error && (
        <span style={{ color: 'var(--danger)', fontSize: '.75rem' }}>{error}</span>
      )}
    </div>
  )
}
