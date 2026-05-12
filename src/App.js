import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { AuthProvider }    from './contexts/AuthContext'
import { ThemeProvider }   from './contexts/ThemeContext'
import { ModulosProvider } from './contexts/ModulosContext'

import ProtectedRoute from './routes/ProtectedRoute'
import PublicRoute    from './routes/PublicRoute'
import MainLayout     from './components/layout/MainLayout'

import Login           from './pages/Login'
import Register        from './pages/Register'
import Legal           from './pages/Legal'
import Dashboard       from './pages/Dashboard'
import DireccionGeneral from './pages/DireccionGeneral'
import RRHH            from './pages/RRHH'
import Ventas          from './pages/Ventas'
import Finanzas        from './pages/Finanzas'
import Compras         from './pages/Compras'
import Inventario      from './pages/Inventario'
import Proyectos       from './pages/Proyectos'
import Produccion      from './pages/Produccion'
import Comunicaciones  from './pages/Comunicaciones'
import Sistema         from './pages/Sistema'
import IA              from './pages/IA'
import Configuracion   from './pages/Configuracion'
import Reportes        from './pages/Reportes'
import NotFound        from './pages/NotFound'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ModulosProvider>
          <BrowserRouter>
            <Routes>
              {/* ── Public (redirects to /dashboard if already logged in) ── */}
              <Route element={<PublicRoute />}>
                <Route path="/login"    element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Route>

              {/* ── Fully public (no auth redirect) ── */}
              <Route path="/legal" element={<Legal />} />

              {/* ── Protected (redirects to /login if not authenticated) ── */}
              <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                  <Route index                    element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard"        element={<Dashboard />} />
                  <Route path="/direccion"        element={<DireccionGeneral />} />
                  <Route path="/rrhh"             element={<RRHH />} />
                  <Route path="/ventas"           element={<Ventas />} />
                  <Route path="/clientes"         element={<Navigate to="/ventas" replace />} />
                  <Route path="/finanzas"         element={<Finanzas />} />
                  <Route path="/compras"          element={<Compras />} />
                  <Route path="/inventario"       element={<Inventario />} />
                  <Route path="/proyectos"        element={<Proyectos />} />
                  <Route path="/produccion"       element={<Produccion />} />
                  <Route path="/comunicaciones"   element={<Comunicaciones />} />
                  <Route path="/sistema"          element={<Sistema />} />
                  <Route path="/ia"               element={<IA />} />
                  <Route path="/reportes"         element={<Reportes />} />
                  <Route path="/configuracion"    element={<Configuracion />} />
                </Route>
              </Route>

              {/* ── 404 ── */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </ModulosProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
