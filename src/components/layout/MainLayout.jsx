import React, { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

export default function MainLayout() {
  const location = useLocation()

  const [collapsed,  setCollapsed]  = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile,   setIsMobile]   = useState(() => window.innerWidth < 768)

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) setMobileOpen(false)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // Close mobile drawer on navigation
  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const sidebarWidth = isMobile ? 0 : (collapsed ? 64 : 240)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Mobile backdrop */}
      {isMobile && mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,.55)',
            zIndex: 38,
          }}
        />
      )}

      <Sidebar
        collapsed={isMobile ? false : collapsed}
        onToggle={() => isMobile ? setMobileOpen(false) : setCollapsed(c => !c)}
        isMobile={isMobile}
        mobileOpen={mobileOpen}
      />

      <div style={{
        marginLeft:    sidebarWidth,
        flex:          1,
        display:       'flex',
        flexDirection: 'column',
        transition:    'margin-left .2s ease-in-out',
        minHeight:     '100vh',
        minWidth:      0,
      }}>
        <Header
          sidebarWidth={sidebarWidth}
          isMobile={isMobile}
          onHamburger={() => setMobileOpen(v => !v)}
        />
        <main style={{
          marginTop: 56,
          padding:   isMobile ? '.875rem .75rem' : '1.75rem',
          flex:      1,
          minWidth:  0,
          overflowX: 'hidden',
        }}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
