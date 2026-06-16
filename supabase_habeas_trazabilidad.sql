-- Trazabilidad Habeas Data: registra fecha/hora exacta de aceptación de la
-- política de tratamiento de datos por parte de cada usuario.
-- El servidor ejecuta estos ALTER de forma idempotente en tiempo de ejecución
-- (ensureHabeasTrace / ensureEncuestaDosSchema), pero se dejan aquí para
-- aplicarlos manualmente en Supabase si se prefiere.

-- Encuesta 1
ALTER TABLE surveys ADD COLUMN IF NOT EXISTS habeas_accepted_at TIMESTAMP;

-- Encuesta 2 (esquema aislado)
ALTER TABLE encuesta_dos.responses ADD COLUMN IF NOT EXISTS habeas_accepted_at TIMESTAMP;
