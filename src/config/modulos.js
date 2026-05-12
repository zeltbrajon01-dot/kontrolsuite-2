export const FASE_CONFIG = {
  dashboard:      0,
  direccion:      1,
  rrhh:           1,
  ventas:         2,
  finanzas:       2,
  compras:        2,
  inventario:     3,
  proyectos:      3,
  produccion:     3,
  comunicaciones: 4,
  sistema:        4,
  ia:             4,
  configuracion:  0,
}

export const FASE_LABELS = {
  1: 'Gestión',
  2: 'Comercial',
  3: 'Operaciones',
  4: 'Inteligencia',
}

export const MODULOS_DEFAULT = [
  { modulo_id: 'dashboard',      nombre: 'Dashboard',         icono: 'HomeIcon',                  ruta: '/dashboard',      activo: true,  orden: 0  },
  { modulo_id: 'direccion',      nombre: 'Dirección General', icono: 'ChartPieIcon',              ruta: '/direccion',      activo: true,  orden: 1  },
  { modulo_id: 'rrhh',           nombre: 'RRHH',              icono: 'UserGroupIcon',             ruta: '/rrhh',           activo: true,  orden: 2  },
  { modulo_id: 'ventas',         nombre: 'Ventas & CRM',      icono: 'ShoppingCartIcon',          ruta: '/ventas',         activo: true,  orden: 3  },
  { modulo_id: 'finanzas',       nombre: 'Finanzas',          icono: 'BanknotesIcon',             ruta: '/finanzas',       activo: true,  orden: 4  },
  { modulo_id: 'compras',        nombre: 'Compras',           icono: 'CubeIcon',                  ruta: '/compras',        activo: true,  orden: 5  },
  { modulo_id: 'inventario',     nombre: 'Inventario',        icono: 'ArchiveBoxIcon',            ruta: '/inventario',     activo: true,  orden: 6  },
  { modulo_id: 'proyectos',      nombre: 'Proyectos',         icono: 'ClipboardDocumentListIcon', ruta: '/proyectos',      activo: true,  orden: 7  },
  { modulo_id: 'produccion',     nombre: 'Producción',        icono: 'WrenchScrewdriverIcon',     ruta: '/produccion',     activo: true,  orden: 8  },
  { modulo_id: 'comunicaciones', nombre: 'Comunicaciones',    icono: 'ChatBubbleLeftRightIcon',   ruta: '/comunicaciones', activo: true,  orden: 9  },
  { modulo_id: 'sistema',        nombre: 'Sistema',           icono: 'ShieldCheckIcon',           ruta: '/sistema',        activo: true,  orden: 10 },
  { modulo_id: 'ia',             nombre: 'Inteligencia IA',   icono: 'SparklesIcon',              ruta: '/ia',             activo: true,  orden: 11 },
  { modulo_id: 'configuracion',  nombre: 'Configuración',     icono: 'Cog6ToothIcon',             ruta: '/configuracion',  activo: true,  orden: 12 },
]

export const ROLES = {
  ADMIN:  'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer',
}
