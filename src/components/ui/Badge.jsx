import React from 'react'

const variants = {
  success: 'badge-success',
  warning: 'badge-warning',
  danger:  'badge-danger',
  primary: 'badge-primary',
  muted:   'badge-muted',
}

export default function Badge({ children, variant = 'muted' }) {
  return (
    <span className={`badge ${variants[variant] || 'badge-muted'}`}>
      {children}
    </span>
  )
}
