-- ============================================================
-- CREATE: Tabla app_settings (configuración global de la app)
-- Ejecutar en Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.app_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- RLS habilitado con acceso público (la tabla no contiene datos sensibles)
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Lectura pública
CREATE POLICY "app_settings_select"
  ON public.app_settings FOR SELECT
  USING (true);

-- Escritura pública (la app usa JWT propio, no Supabase Auth)
CREATE POLICY "app_settings_insert"
  ON public.app_settings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "app_settings_update"
  ON public.app_settings FOR UPDATE
  USING (true) WITH CHECK (true);

-- Valor inicial: landing original activa
INSERT INTO public.app_settings (key, value)
VALUES ('active_landing', 'original')
ON CONFLICT (key) DO NOTHING;
