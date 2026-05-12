import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'

const root = ReactDOM.createRoot(document.getElementById('root'))

// StrictMode desactivado: en React 18 double-invoca effects (mount→cleanup→mount),
// creando una ventana de tiempo donde callbacks de Promises resuelven con el árbol
// en estado parcialmente desmontado. Esto puede desencadenar insertBefore errors
// en AuthContext cuando getSession() resuelve durante ese gap.
root.render(<App />)
