import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

export default function MainLayout() {
  const [collapsed, setCollapsed] = useState(false)
  const sidebarWidth = collapsed ? 64 : 240

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

      {/* Main content area shifts right with sidebar */}
      <div style={{
        marginLeft: sidebarWidth,
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        transition: 'margin-left .2s ease-in-out',
        minHeight: '100vh',
      }}>
        <Header sidebarWidth={sidebarWidth} />

        <main style={{
          marginTop: 56,
          padding: '1.75rem',
          flex: 1,
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
