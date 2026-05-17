import React, { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

const MAX_ATTEMPTS  = 5
const LOCKOUT_MS    = 5 * 60 * 1000  // 5 minutes

export default function Login() {
  const { login } = useAuth()

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const attemptsRef = useRef({ count: 0, lockUntil: 0 })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const now = Date.now()
    if (attemptsRef.current.lockUntil > now) {
      const secs = Math.ceil((attemptsRef.current.lockUntil - now) / 1000)
      const mins = Math.floor(secs / 60)
      const s    = secs % 60
      setError(`Cuenta bloqueada por demasiados intentos. Espera ${mins}:${String(s).padStart(2,'0')} min.`)
      return
    }

    if (!email.trim())    { setError('Ingresa tu correo electrónico.');  return }
    if (!password)        { setError('Ingresa tu contraseña.');           return }

    setLoading(true)
    const { error: err } = await login({ email, password })
    setLoading(false)

    if (err) {
      attemptsRef.current.count++
      if (attemptsRef.current.count >= MAX_ATTEMPTS) {
        attemptsRef.current.lockUntil = Date.now() + LOCKOUT_MS
        attemptsRef.current.count = 0
        setError('Demasiados intentos fallidos. Acceso bloqueado por 5 minutos.')
        return
      }
      const remaining = MAX_ATTEMPTS - attemptsRef.current.count
      const msg = err.message ?? ''
      if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
        setError(`Correo o contraseña incorrectos. (${remaining} intento${remaining !== 1 ? 's' : ''} restante${remaining !== 1 ? 's' : ''})`)
      } else if (msg.includes('Email not confirmed')) {
        setError('Debes confirmar tu correo antes de iniciar sesión.')
      } else if (msg.includes('Too many requests')) {
        setError('Demasiados intentos. Espera unos minutos e intenta de nuevo.')
      } else {
        setError(err.message)
      }
    } else {
      attemptsRef.current = { count: 0, lockUntil: 0 }
    }
    // Si no hay error: isAuthenticated se vuelve true → PublicRoute redirige a /dashboard
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--bg)',
        padding: '1rem',
      }}
    >
      {/* Tarjeta única — estructura DOM estable, no cambia forma ni tamaño */}
      <div
        className="card animate-fadeIn"
        style={{ width: '100%', maxWidth: 420, padding: '2.5rem 2rem' }}
      >
        {/* ── Brand ────────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: 48, height: 48, borderRadius: '.75rem',
              background: 'var(--primary)', color: '#fff',
              display: 'inline-flex', alignItems: 'center',
              justifyContent: 'center', fontSize: '1.5rem',
              fontWeight: 800, marginBottom: '1rem',
            }}
          >
            K
          </div>
          <h1 style={{ margin: '0 0 .3rem', fontSize: '1.4rem', fontWeight: 800, color: 'var(--text)' }}>
            KontrolSuite
          </h1>
          <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '.875rem' }}>
            Inicia sesión en tu cuenta
          </span>
        </div>

        {/* ── Formulario ───────────────────────────────────────── */}
        {/*
          noValidate: desactiva validación nativa del browser que puede
          inyectar nodos extra en el DOM y desencadenar insertBefore.
          Estructura fija: label+input+error_banner+button, sin
          nodos insertados/eliminados condicionalmente entre hermanos.
        */}
        <form
          onSubmit={handleSubmit}
          noValidate
          style={{ display: 'flex', flexDirection: 'column', gap: '.875rem' }}
        >
          <Input
            label="Correo electrónico"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="tu@empresa.com"
            autoComplete="email"
            autoFocus
          />

          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
          />

          {/*
            Banner de error: SIEMPRE en el DOM (display toggling).
            Si usáramos {error && <div>} React haría insertBefore entre
            el input y el botón, fallando si alguna extensión modificó
            la lista de hijos del formulario.
          */}
          <div
            role="alert"
            aria-live="polite"
            style={{
              background:   'rgba(239,68,68,.12)',
              border:       '1px solid var(--danger)',
              borderRadius: '.5rem',
              padding:      '.7rem 1rem',
              color:        'var(--danger)',
              fontSize:     '.82rem',
              lineHeight:   1.4,
              display:      error ? 'block' : 'none',
            }}
          >
            {error}
          </div>

          <Button
            type="submit"
            loading={loading}
            style={{ width: '100%', justifyContent: 'center', marginTop: '.25rem' }}
          >
            Iniciar sesión
          </Button>
        </form>

        {/* ── Link a registro ───────────────────────────────────── */}
        {/*
          Separado del <form> para evitar cualquier interferencia.
          Dos <span> independientes en lugar de texto + <Link> dentro
          de <p>, lo que generaba text nodes adyacentes al nodo React.
        */}
        <div
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '.35rem', marginTop: '1.5rem',
            fontSize: '.875rem', color: 'var(--text-muted)',
          }}
        >
          <span>¿No tienes cuenta?</span>
          <Link
            to="/register"
            style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}
          >
            Regístrate gratis
          </Link>
        </div>
      </div>
    </div>
  )
}
