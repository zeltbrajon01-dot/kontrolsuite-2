import React from 'react'

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  ...props
}) {
  const cls = variant === 'primary' ? 'btn-primary'
            : variant === 'ghost'   ? 'btn-ghost'
            : variant === 'danger'  ? 'btn-danger'
            : 'btn-primary'

  return (
    <button
      type={type}
      className={`${cls} ${size === 'sm' ? 'text-xs py-1 px-3' : ''} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading && <span className="spinner" style={{ width: '.85rem', height: '.85rem' }} />}
      {children}
    </button>
  )
}
