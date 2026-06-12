-- ============================================================================
-- ENCUESTA DOS — Esquema aislado.
-- Idempotente: seguro de ejecutar múltiples veces. NO toca tablas de la
-- Encuesta Uno (surveys, users, documents, etc.) en el schema public.
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS encuesta_dos;

CREATE TABLE IF NOT EXISTS encuesta_dos.responses (
  id SERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  document_type TEXT NOT NULL,
  document_number TEXT NOT NULL,
  birth_date TEXT,
  edad INTEGER,
  is_minor BOOLEAN DEFAULT FALSE,
  answers JSONB DEFAULT '{}',
  habeas_data_accepted BOOLEAN DEFAULT FALSE,
  analyst_name TEXT,
  analyst_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
