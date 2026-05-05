import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

import { AuthProvider }    from './contexts/AuthContext'
import { ThemeProvider }   from './contexts/ThemeContext'
import { ModulosProvider } from './contexts/ModulosContext'

import ProtectedRoute from './routes/ProtectedRoute'
import PublicRoute    from './routes/PublicRoute'
import MainLayout     from './components/layout/MainLayout'

import Login        from './pages/Login'
import Register     from './pages/Register'
import Dashboard    from './pages/Dashboard'
import Clientes     from './pages/Clientes'
import Ventas       from './pages/Ventas'
import Inventario   from './pages/Inventario'
import Finanzas     from './pages/Finanzas'
import RRHH         from './pages/RRHH'
import Reportes     from './pages/Reportes'
import Configuracion from './pages/Configuracion'
import NotFound     from './pages/NotFound'

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ModulosProvider>
          <BrowserRouter>
            <Routes>
              {/* ── Public routes (redirect to /dashboard if logged in) ── */}
              <Route element={<PublicRoute />}>
                <Route path="/login"    element={<Login />} />
                <Route path="/register" element={<Register />} />
              </Route>

              {/* ── Protected routes (redirect to /login if not logged in) ── */}
              <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                  <Route index                  element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard"      element={<Dashboard />} />
                  <Route path="/clientes"       element={<Clientes />} />
                  <Route path="/ventas"         element={<Ventas />} />
                  <Route path="/inventario"     element={<Inventario />} />
                  <Route path="/finanzas"       element={<Finanzas />} />
                  <Route path="/rrhh"           element={<RRHH />} />
                  <Route path="/reportes"       element={<Reportes />} />
                  <Route path="/configuracion"  element={<Configuracion />} />
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
