-- Migración inicial para Arquitectura de Macro Módulos (Multi-Tenant)

-- 1. Crear la tabla de Entornos (Macro Módulos)
CREATE TABLE IF NOT EXISTS public.environments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    is_active_globally BOOLEAN DEFAULT false,
    theme_config JSONB DEFAULT '{}'::jsonb,
    features_config JSONB DEFAULT '{}'::jsonb,
    dashboard_layout VARCHAR(255) DEFAULT 'default',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en la tabla environments
ALTER TABLE public.environments ENABLE ROW LEVEL SECURITY;

-- Políticas para environments (Todos pueden leer, solo admin puede modificar - asumiendo roles manejados en la app o auth)
CREATE POLICY "Environments are viewable by everyone" ON public.environments FOR SELECT USING (true);

-- 2. Insertar los primeros Macro Módulos
-- Asegurarnos de que solo uno esté activo
INSERT INTO public.environments (slug, name, is_active_globally, theme_config, features_config, dashboard_layout)
VALUES 
(
    'unidas-1', 
    'UNIDAS Barrios Unidos', 
    true, 
    '{"primary": "#6B21A8", "secondary": "#9333EA", "accent": "#F59E0B"}'::jsonb, 
    '{"enable_survey_v1": true}'::jsonb, 
    'default'
),
(
    'unidas-2', 
    'UNIDAS 2.0', 
    false, 
    '{"primary": "#0369a1", "secondary": "#0284c7", "accent": "#14b8a6"}'::jsonb, 
    '{"enable_survey_v2": true, "enable_ia": true}'::jsonb, 
    'dashboard_v2'
)
ON CONFLICT (slug) DO NOTHING;

-- Obtener el ID del entorno principal para asignarlo a los registros existentes
DO $$
DECLARE
    default_env_id UUID;
BEGIN
    SELECT id INTO default_env_id FROM public.environments WHERE slug = 'unidas-1' LIMIT 1;

    -- 3. Modificar tablas existentes para agregar la FK (environment_id)
    -- Esto asume que tienes tablas llamadas 'users', 'surveys', 'events', 'news'
    -- (Ajusta los nombres según tu esquema exacto de Supabase)

    -- Tabla users
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
        ALTER TABLE public.users ADD COLUMN IF NOT EXISTS environment_id UUID REFERENCES public.environments(id);
        UPDATE public.users SET environment_id = default_env_id WHERE environment_id IS NULL;
        ALTER TABLE public.users ALTER COLUMN environment_id SET NOT NULL;
    END IF;

    -- Tabla surveys
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'surveys') THEN
        ALTER TABLE public.surveys ADD COLUMN IF NOT EXISTS environment_id UUID REFERENCES public.environments(id);
        UPDATE public.surveys SET environment_id = default_env_id WHERE environment_id IS NULL;
        ALTER TABLE public.surveys ALTER COLUMN environment_id SET NOT NULL;
    END IF;

    -- Tabla events
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'events') THEN
        ALTER TABLE public.events ADD COLUMN IF NOT EXISTS environment_id UUID REFERENCES public.environments(id);
        UPDATE public.events SET environment_id = default_env_id WHERE environment_id IS NULL;
        ALTER TABLE public.events ALTER COLUMN environment_id SET NOT NULL;
    END IF;

    -- Tabla news
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'news') THEN
        ALTER TABLE public.news ADD COLUMN IF NOT EXISTS environment_id UUID REFERENCES public.environments(id);
        UPDATE public.news SET environment_id = default_env_id WHERE environment_id IS NULL;
        ALTER TABLE public.news ALTER COLUMN environment_id SET NOT NULL;
    END IF;

END $$;
