import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import supabase from '../lib/supabase'

/*
 * Public page — accessible without authentication at /legal
 * Displays Términos y Condiciones + Aviso de Privacidad.
 *
 * Required Supabase table (public read, admin-only write via RLS):
 *   legal_config (id uuid PK, empresa_id uuid, terminos TEXT, privacidad TEXT,
 *                 updated_at TIMESTAMPTZ, nombre_empresa TEXT)
 *
 * For a multi-empresa setup, display a generic default if no empresa_id is provided.
 * Superadmin can edit via ?edit=1 query param (requires Supabase auth).
 */

const DEFAULT_TERMINOS = `
TÉRMINOS Y CONDICIONES DE USO

Última actualización: ${new Date().getFullYear()}

1. ACEPTACIÓN DE LOS TÉRMINOS
Al acceder y utilizar KontrolSuite, usted acepta cumplir con estos Términos y Condiciones. Si no está de acuerdo con alguna parte de estos términos, no deberá usar el servicio.

2. DESCRIPCIÓN DEL SERVICIO
KontrolSuite es una plataforma de gestión empresarial que provee herramientas para la administración de recursos humanos, finanzas, inventario, ventas, producción y comunicaciones.

3. CUENTA DE USUARIO
- Usted es responsable de mantener la confidencialidad de su contraseña.
- Es responsable de todas las actividades que ocurran bajo su cuenta.
- Debe notificarnos inmediatamente de cualquier uso no autorizado.

4. PROPIEDAD INTELECTUAL
El software, diseño y contenido de KontrolSuite son propiedad exclusiva y están protegidos por leyes de derechos de autor.

5. LIMITACIÓN DE RESPONSABILIDAD
KontrolSuite no será responsable por daños indirectos, incidentales, especiales o consecuentes que resulten del uso del servicio.

6. MODIFICACIONES
Nos reservamos el derecho de modificar estos términos en cualquier momento, notificando a los usuarios registrados.

7. LEY APLICABLE
Estos términos se rigen por las leyes de los Estados Unidos Mexicanos.
`.trim()

const DEFAULT_PRIVACIDAD = `
AVISO DE PRIVACIDAD

Última actualización: ${new Date().getFullYear()}

RESPONSABLE DEL TRATAMIENTO DE DATOS PERSONALES
KontrolSuite, en cumplimiento con la Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP), informa sobre el tratamiento de sus datos personales.

DATOS QUE RECOPILAMOS
- Nombre completo y datos de contacto (email, teléfono)
- Información de la empresa
- Datos de uso de la plataforma
- Información de pago (procesada por terceros certificados)

FINALIDADES DEL TRATAMIENTO
- Prestación y mejora del servicio
- Comunicaciones relacionadas con su cuenta
- Cumplimiento de obligaciones legales
- Análisis estadístico (datos anonimizados)

TRANSFERENCIA DE DATOS
No compartimos sus datos personales con terceros sin su consentimiento, excepto cuando sea requerido por ley o necesario para la prestación del servicio (ej. proveedores de infraestructura cloud).

DERECHOS ARCO
Usted tiene derecho a Acceder, Rectificar, Cancelar u Oponerse al tratamiento de sus datos. Para ejercer estos derechos, contáctenos en: privacidad@kontrolsuite.com

SEGURIDAD
Implementamos medidas técnicas y organizativas para proteger sus datos contra acceso no autorizado, pérdida o divulgación.

CAMBIOS A ESTE AVISO
Cualquier modificación será publicada en esta página con la fecha de actualización.
`.trim()

export default function Legal() {
  const [activeSection, setActiveSection] = useState('terminos')
  const [content, setContent] = useState({ terminos: DEFAULT_TERMINOS, privacidad: DEFAULT_PRIVACIDAD, nombre_empresa: 'KontrolSuite' })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Try to load from Supabase (public read)
    supabase.from('legal_config')
      .select('terminos,privacidad,nombre_empresa')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setContent({
            terminos:       data.terminos       || DEFAULT_TERMINOS,
            privacidad:     data.privacidad     || DEFAULT_PRIVACIDAD,
            nombre_empresa: data.nombre_empresa || 'KontrolSuite',
          })
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
            <div style={{
              width: 40, height: 40, borderRadius: '.6rem',
              background: 'var(--primary)', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 800, fontSize: '1.2rem',
            }}>
              K
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text)' }}>
              {content.nombre_empresa}
            </span>
          </div>
          <Link
            to="/login"
            style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '.875rem', textDecoration: 'none' }}
          >
            ← Volver al inicio
          </Link>
        </div>

        {/* Tab selector */}
        <div style={{ display: 'flex', borderBottom: '2px solid var(--border)', marginBottom: '2rem', gap: '.25rem' }}>
          {[
            { id: 'terminos',   label: 'Términos y Condiciones'  },
            { id: 'privacidad', label: 'Aviso de Privacidad'     },
          ].map(tab => {
            const isActive = activeSection === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSection(tab.id)}
                style={{
                  background:   'none',
                  border:       'none',
                  borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                  marginBottom: '-2px',
                  color:        isActive ? 'var(--primary)' : 'var(--text-muted)',
                  fontWeight:   isActive ? 700 : 500,
                  cursor:       'pointer',
                  padding:      '.6rem 1.25rem',
                  fontSize:     '.9rem',
                  transition:   'all .15s',
                  whiteSpace:   'nowrap',
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem' }}><span className="spinner" style={{ width: '2rem', height: '2rem' }} /></div>
        ) : (
          <>
            <div style={{ display: activeSection === 'terminos' ? 'block' : 'none' }}>
              <div className="card" style={{ padding: '2rem 2.5rem' }}>
                <pre style={{
                  fontFamily: 'inherit', fontSize: '.9rem', lineHeight: 1.8,
                  color: 'var(--text)', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  margin: 0,
                }}>
                  {content.terminos}
                </pre>
              </div>
            </div>

            <div style={{ display: activeSection === 'privacidad' ? 'block' : 'none' }}>
              <div className="card" style={{ padding: '2rem 2.5rem' }}>
                <pre style={{
                  fontFamily: 'inherit', fontSize: '.9rem', lineHeight: 1.8,
                  color: 'var(--text)', whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  margin: 0,
                }}>
                  {content.privacidad}
                </pre>
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', marginTop: '2rem', fontSize: '.78rem', color: 'var(--text-muted)' }}>
          © {new Date().getFullYear()} {content.nombre_empresa} · Todos los derechos reservados
        </div>
      </div>
    </div>
  )
}
