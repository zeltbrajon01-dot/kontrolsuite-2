import React, { createContext, useContext, useEffect, useState } from 'react'

const THEMES = [
  { id: 'oscuro',    nombre: 'Oscuro',             preview: '#1e293b' },
  { id: 'claro',     nombre: 'Claro',              preview: '#f8fafc' },
  { id: 'azul-corp', nombre: 'Azul Corporativo',   preview: '#1e3a5f' },
  { id: 'esmeralda', nombre: 'Verde Esmeralda',    preview: '#064e3b' },
  { id: 'morado',    nombre: 'Morado Moderno',     preview: '#4c1d95' },
  { id: 'negro',     nombre: 'Negro',              preview: '#000000' },
]

const STORAGE_KEY = 'ks_theme'

const ThemeContext = createContext(null)

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || 'oscuro'
  })

  // Apply theme to <html> element via data-theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const setTheme = (id) => {
    if (THEMES.find(t => t.id === id)) setThemeState(id)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
