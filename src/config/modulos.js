export const MODULOS_DEFAULT = [
  { modulo_id: 'dashboard',     nombre: 'Dashboard',    icono: 'HomeIcon',            ruta: '/dashboard',    activo: true,  orden: 0 },
  { modulo_id: 'clientes',      nombre: 'Clientes',     icono: 'UsersIcon',           ruta: '/clientes',     activo: true,  orden: 1 },
  { modulo_id: 'ventas',        nombre: 'Ventas',        icono: 'ShoppingCartIcon',    ruta: '/ventas',       activo: true,  orden: 2 },
  { modulo_id: 'inventario',    nombre: 'Inventario',   icono: 'ArchiveBoxIcon',       ruta: '/inventario',   activo: true,  orden: 3 },
  { modulo_id: 'finanzas',      nombre: 'Finanzas',     icono: 'BanknotesIcon',        ruta: '/finanzas',     activo: true,  orden: 4 },
  { modulo_id: 'rrhh',          nombre: 'RRHH',          icono: 'UserGroupIcon',        ruta: '/rrhh',         activo: false, orden: 5 },
  { modulo_id: 'reportes',      nombre: 'Reportes',     icono: 'ChartBarIcon',         ruta: '/reportes',     activo: true,  orden: 6 },
  { modulo_id: 'configuracion', nombre: 'Configuración', icono: 'Cog6ToothIcon',       ruta: '/configuracion', activo: true, orden: 7 },
]

export const ROLES = {
  ADMIN: 'admin',
  EDITOR: 'editor',
  VIEWER: 'viewer',
}
