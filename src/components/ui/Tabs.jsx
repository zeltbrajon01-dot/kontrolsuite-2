import React from 'react'

/*
 * Tabs — always renders all tab panels (CSS display toggle), never mounts/unmounts.
 * This prevents the insertBefore DOM error caused by conditional children.
 *
 * Usage:
 *   <Tabs
 *     tabs={[{ id: 'overview', label: 'Resumen', icon: ChartBarIcon }]}
 *     active={activeTab}
 *     onChange={setActiveTab}
 *   >
 *     <div data-tab="overview">...</div>
 *     <div data-tab="details">...</div>
 *   </Tabs>
 *
 * Or with panels prop:
 *   <Tabs tabs={tabs} active={active} onChange={setActive}
 *     panels={{ overview: <OverviewComponent />, details: <DetailsComponent /> }}
 *   />
 */
export default function Tabs({ tabs = [], active, onChange, panels, children, style }) {
  return (
    <div style={style}>
      {/* Tab strip */}
      <div style={{
        display: 'flex', borderBottom: '2px solid var(--border)',
        gap: '.1rem', flexWrap: 'wrap', marginBottom: '1.25rem',
      }}>
        {tabs.map(tab => {
          const isActive = active === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              style={{
                background:   'none',
                border:       'none',
                borderBottom: isActive ? '2px solid var(--primary)' : '2px solid transparent',
                marginBottom: '-2px',
                color:        isActive ? 'var(--primary)' : 'var(--text-muted)',
                fontWeight:   isActive ? 700 : 500,
                cursor:       'pointer',
                padding:      '.6rem 1rem',
                fontSize:     '.875rem',
                transition:   'all .15s',
                display:      'flex',
                alignItems:   'center',
                gap:          '.4rem',
                whiteSpace:   'nowrap',
              }}
            >
              {tab.icon && <tab.icon style={{ width: '.95rem', height: '.95rem' }} />}
              {tab.label}
              {tab.badge != null && (
                <span style={{
                  background: isActive ? 'var(--primary)' : 'var(--border)',
                  color: isActive ? '#fff' : 'var(--text-muted)',
                  borderRadius: '9999px', fontSize: '.65rem', fontWeight: 700,
                  padding: '.1rem .4rem', lineHeight: 1.4,
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Panels — CSS display toggle, never conditionally mounted */}
      {panels
        ? tabs.map(tab => (
            <div key={tab.id} style={{ display: active === tab.id ? 'block' : 'none' }}>
              {panels[tab.id]}
            </div>
          ))
        : children
      }
    </div>
  )
}
