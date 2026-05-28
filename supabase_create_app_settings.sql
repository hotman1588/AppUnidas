-- ============================================================
-- CREATE: Tabla app_settings (configuración global de la app)
-- Ejecutar en Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS public.app_settings (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Lectura pública
CREATE POLICY "app_settings_read_all"
  ON public.app_settings FOR SELECT
  USING (true);

-- Escritura para usuarios autenticados (admins usan la ruta /admin protegida)
CREATE POLICY "app_settings_write_authenticated"
  ON public.app_settings FOR ALL
  USING (auth.role() = 'authenticated');

-- Valor inicial: landing original activa
INSERT INTO public.app_settings (key, value)
VALUES ('active_landing', 'original')
ON CONFLICT (key) DO NOTHING;
