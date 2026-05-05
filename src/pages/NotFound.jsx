import React from 'react'
import { Link } from 'react-router-dom'
import Button from '../components/ui/Button'

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', flexDirection: 'column', gap: '1rem', textAlign: 'center',
      padding: '2rem',
    }}>
      <div style={{ fontSize: '5rem', fontWeight: 900, color: 'var(--primary)', lineHeight: 1 }}>404</div>
      <h1 style={{ margin: 0, color: 'var(--text)', fontSize: '1.5rem', fontWeight: 700 }}>Página no encontrada</h1>
      <p style={{ margin: 0, color: 'var(--text-muted)', maxWidth: 360 }}>
        La ruta que buscas no existe o fue eliminada.
      </p>
      <Link to="/dashboard">
        <Button>Volver al dashboard</Button>
      </Link>
    </div>
  )
}
