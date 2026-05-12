import React from 'react'

export default function KPICard({
  label,
  value,
  change,
  up,
  icon: Icon,
  color = 'var(--primary)',
  subtitle,
}) {
  return (
    <div className="card" style={{ padding: '1.25rem 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '.75rem' }}>
        <span style={{ fontSize: '.8rem', color: 'var(--text-muted)', fontWeight: 600, lineHeight: 1.3 }}>
          {label}
        </span>
        {Icon && (
          <div style={{ background: color + '22', borderRadius: '.5rem', padding: '.35rem', flexShrink: 0 }}>
            <Icon style={{ width: '1rem', height: '1rem', color }} />
          </div>
        )}
      </div>

      <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text)', marginBottom: '.2rem', lineHeight: 1 }}>
        {value ?? '—'}
      </div>

      {subtitle && (
        <div style={{ fontSize: '.78rem', color: 'var(--text-muted)', marginBottom: '.2rem' }}>
          {subtitle}
        </div>
      )}

      {change !== undefined && change !== null && (
        <div style={{ fontSize: '.75rem', fontWeight: 600, color: up ? 'var(--success)' : 'var(--danger)', marginTop: '.2rem' }}>
          {change}
        </div>
      )}
    </div>
  )
}
