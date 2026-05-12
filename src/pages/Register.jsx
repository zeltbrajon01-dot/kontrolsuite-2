import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import Input from '../components/ui/Input'
import Button from '../components/ui/Button'

export default function Register() {
  const { register } = useAuth()
  const navigate     = useNavigate()

  const [nombre,        setNombre]        = useState('')
  const [nombreEmpresa, setNombreEmpresa] = useState('')
  const [email,         setEmail]         = useState('')
  const [password,      setPassword]      = useState('')
  const [confirm,       setConfirm]       = useState('')

  const [error,         setError]         = useState('')
  const [successMsg,    setSuccessMsg]     = useState('')  // '' = no hay éxito
  const [loading,       setLoading]       = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // ── Validaciones cliente ─────────────────────────────────────
    if (!nombre.trim())        { setError('Ingresa tu nombre completo.');       return }
    if (!nombreEmpresa.trim()) { setError('Ingresa el nombre de tu empresa.');  return }
    if (!email.trim())         { setError('Ingresa tu correo electrónico.');    return }
    if (password.length < 6)  { setError('La contraseña debe tener al menos 6 caracteres.'); return }
    if (password !== confirm)  { setError('Las contraseñas no coinciden.');     return }

    setLoading(true)
    const { data, error: err } = await register({ email, password, nombre, nombreEmpresa })
    setLoading(false)

    if (err) {
      const msg = err.message ?? ''
      if (msg.includes('already registered') || msg.includes('Ya existe')) {
        setError('Ya existe una cuenta con este correo electrónico.')
      } else if (msg.includes('Password should be')) {
        setError('La contraseña debe tener al menos 6 caracteres.')
      } else {
        setError(msg || 'Ocurrió un error. Intenta de nuevo.')
      }
      return
    }

    if (data?.requiresConfirmation) {
      // Supabase tiene confirmación de email activada.
      // No podemos crear empresa/perfil aún (sin sesión activa).
      setSuccessMsg('confirm')
      return
    }

    // Registro exitoso con sesión activa → ir al dashboard
    setSuccessMsg('redirect')
    setTimeout(() => navigate('/dashboard', { replace: true }), 1200)
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
      {/*
        Tarjeta única con estructura DOM completamente estable.
        El ternario anterior en la raíz desmontaba/montaba dos árboles
        diferentes, lo que podía dejar el DOM en estado inconsistente.
        Aquí usamos dos paneles con display:none/block dentro del
        MISMO contenedor — React nunca inserta ni elimina nodos raíz.
      */}
      <div
        className="card animate-fadeIn"
        style={{ width: '100%', maxWidth: 460, padding: '2.5rem 2rem' }}
      >

        {/* ── Panel de éxito: siempre en DOM, visible con CSS ─── */}
        <div style={{ display: successMsg ? 'flex' : 'none', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem' }}>
          <div style={{ fontSize: '3rem', lineHeight: 1 }}>
            {successMsg === 'redirect' ? '🚀' : '✉️'}
          </div>
          <h2 style={{ margin: 0, color: 'var(--text)', fontSize: '1.25rem', fontWeight: 800 }}>
            {successMsg === 'redirect' ? '¡Cuenta creada!' : '¡Revisa tu correo!'}
          </h2>
          <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '.9rem', maxWidth: 320 }}>
            {successMsg === 'redirect'
              ? 'Tu empresa fue creada. Entrando al dashboard…'
              : 'Haz clic en el enlace que te enviamos para activar tu cuenta y luego inicia sesión.'}
          </span>
          {/* Link SIEMPRE en DOM, display toggle — evita insertBefore en flex container */}
          <Link
            to="/login"
            style={{
              display:        successMsg === 'confirm' ? 'inline-block' : 'none',
              color:          'var(--primary)',
              fontWeight:     600,
              textDecoration: 'none',
              fontSize:       '.875rem',
            }}
          >
            Ir al login
          </Link>
        </div>

        {/* ── Panel del formulario: siempre en DOM, visible con CSS ── */}
        <div style={{ display: successMsg ? 'none' : 'block' }}>

          {/* Brand */}
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
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
              Crea tu cuenta
            </h1>
            <span style={{ display: 'block', color: 'var(--text-muted)', fontSize: '.875rem' }}>
              Tu empresa tendrá su propio espacio aislado
            </span>
          </div>

          {/*
            Formulario con estructura DOM estable.
            Banner de error siempre presente (display toggle), no
            insertado condicionalmente entre hermanos del <form>.
          */}
          <form
            onSubmit={handleSubmit}
            noValidate
            style={{ display: 'flex', flexDirection: 'column', gap: '.875rem' }}
          >
            <Input
              label="Tu nombre completo"
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              placeholder="Juan García"
              autoComplete="name"
              autoFocus
            />

            <Input
              label="Nombre de tu empresa"
              type="text"
              value={nombreEmpresa}
              onChange={e => setNombreEmpresa(e.target.value)}
              placeholder="Mi Empresa S.A."
              autoComplete="organization"
            />

            <Input
              label="Correo electrónico"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="juan@miempresa.com"
              autoComplete="email"
            />

            <Input
              label="Contraseña"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Mínimo 6 caracteres"
              autoComplete="new-password"
            />

            <Input
              label="Confirmar contraseña"
              type="password"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              placeholder="Repite la contraseña"
              autoComplete="new-password"
            />

            {/*
              Banner de error SIEMPRE en el DOM.
              display:block/none en lugar de montaje/desmontaje condicional
              evita el error insertBefore en formularios con muchos campos.
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
              Crear cuenta y empresa
            </Button>
          </form>

          {/* Link a login — fuera del <form>, sin text nodes mezclados */}
          <div
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              gap: '.35rem', marginTop: '1.5rem',
              fontSize: '.875rem', color: 'var(--text-muted)',
            }}
          >
            <span>¿Ya tienes cuenta?</span>
            <Link
              to="/login"
              style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'none' }}
            >
              Inicia sesión
            </Link>
          </div>

        </div>
      </div>
    </div>
  )
}
