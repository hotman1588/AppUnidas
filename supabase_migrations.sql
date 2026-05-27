-- ============================================================
-- ROLLBACK: Eliminar columna environment_id y tabla environments
-- ============================================================

-- 1. Eliminar columna environment_id de todas las tablas (si existe)
ALTER TABLE public.users    DROP COLUMN IF EXISTS environment_id;
ALTER TABLE public.surveys  DROP COLUMN IF EXISTS environment_id;
ALTER TABLE public.events   DROP COLUMN IF EXISTS environment_id;
ALTER TABLE public.news     DROP COLUMN IF EXISTS environment_id;

-- 2. Eliminar la tabla environments (si existe)
DROP TABLE IF EXISTS public.environments CASCADE;
