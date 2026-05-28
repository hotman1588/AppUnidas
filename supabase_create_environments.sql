-- ============================================================
-- CREATE: Tabla environments (Multi-Tenant / Macro Módulos)
-- Ejecutar en Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.environments (
  id              UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  slug            TEXT        NOT NULL UNIQUE,
  name            TEXT        NOT NULL,
  is_active_globally BOOLEAN  DEFAULT false,
  theme_config    JSONB       DEFAULT '{}',
  features_config JSONB       DEFAULT '{}',
  dashboard_layout TEXT       DEFAULT 'default',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.environments ENABLE ROW LEVEL SECURITY;

-- Lectura pública (todos los usuarios autenticados y anónimos pueden leer)
CREATE POLICY "environments_read_all"
  ON public.environments FOR SELECT
  USING (true);

-- Escritura para usuarios autenticados (la ruta /admin ya protege por rol en el frontend)
CREATE POLICY "environments_write_authenticated"
  ON public.environments FOR ALL
  USING (auth.role() = 'authenticated');

-- Entorno por defecto (landing original)
INSERT INTO public.environments (slug, name, is_active_globally, theme_config, features_config, dashboard_layout)
VALUES (
  'unidas-1',
  'UNIDAS Barrios Unidos',
  true,
  '{"primary": "#6B21A8", "secondary": "#9333EA", "accent": "#F59E0B"}',
  '{}',
  'default'
)
ON CONFLICT (slug) DO NOTHING;
