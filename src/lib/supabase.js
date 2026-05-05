import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase env vars not set. Create .env.local with REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY')
}

const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
)

export default supabase

/*
Required Supabase tables:

create table empresas (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  config jsonb default '{}',
  created_at timestamptz default now()
);

create table perfiles (
  id uuid primary key references auth.users(id) on delete cascade,
  empresa_id uuid references empresas(id) on delete cascade,
  nombre text,
  email text,
  rol text default 'admin',
  created_at timestamptz default now()
);

create table modulos_empresa (
  id uuid primary key default gen_random_uuid(),
  empresa_id uuid references empresas(id) on delete cascade,
  modulo_id text not null,
  nombre text not null,
  icono text not null,
  ruta text not null,
  activo boolean default true,
  orden integer default 0,
  created_at timestamptz default now(),
  unique(empresa_id, modulo_id)
);

-- RLS: enable on all tables, policy: users can only read/write rows where empresa_id matches their perfil.empresa_id
*/
