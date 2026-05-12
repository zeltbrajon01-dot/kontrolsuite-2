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
      {/*
        Spinner SIEMPRE en el DOM — nunca insertado/eliminado condicionalmente.
        {loading && <span>} causa insertBefore(span, textNode) cuando loading
        cambia a true. Si el browser o una extensión modificó los hijos del
        botón entre renders, el textNode ya no es hijo directo → error.
        Con display:none/inline-block el nodo existe desde el primer render
        y React nunca necesita hacer insertBefore.
      */}
      <span
        aria-hidden="true"
        className="spinner"
        style={{
          display: loading ? 'inline-block' : 'none',
          width:  '.85rem',
          height: '.85rem',
        }}
      />
      {children}
    </button>
  )
}
