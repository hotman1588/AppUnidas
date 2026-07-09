-- ============================================================================
-- ENCUESTA DOS — Esquema aislado.
-- Idempotente: seguro de ejecutar múltiples veces. NO toca tablas de la
-- Encuesta Uno (surveys, users, documents, etc.) en el schema public.
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS encuesta_dos;

-- REESTRUCTURACIÓN: registro ANÓNIMO. No se capturan datos personales; se usa
-- 'registro_codigo' (código único generado) y 'perfil' ('adulto'|'menor').
-- Las columnas de identidad se conservan por compatibilidad histórica pero ya
-- no son obligatorias ni se diligencian.
CREATE TABLE IF NOT EXISTS encuesta_dos.responses (
  id SERIAL PRIMARY KEY,
  registro_codigo TEXT,
  perfil TEXT,
  full_name TEXT,
  document_type TEXT,
  document_number TEXT,
  phone TEXT,
  email TEXT,
  password TEXT,
  birth_date TEXT,
  edad INTEGER,
  is_minor BOOLEAN DEFAULT FALSE,
  answers JSONB DEFAULT '{}',
  habeas_data_accepted BOOLEAN DEFAULT FALSE,
  habeas_accepted_at TIMESTAMP,
  tiempo_ejecucion_segundos INTEGER,
  analyst_name TEXT,
  analyst_id INTEGER,
  user_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Migración idempotente para tablas ya creadas con el esquema anterior.
ALTER TABLE encuesta_dos.responses ADD COLUMN IF NOT EXISTS registro_codigo TEXT;
ALTER TABLE encuesta_dos.responses ADD COLUMN IF NOT EXISTS perfil TEXT;
ALTER TABLE encuesta_dos.responses ALTER COLUMN full_name DROP NOT NULL;
ALTER TABLE encuesta_dos.responses ALTER COLUMN document_type DROP NOT NULL;
ALTER TABLE encuesta_dos.responses ALTER COLUMN document_number DROP NOT NULL;
