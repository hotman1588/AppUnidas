// ============================================================================
// Migración aislada de "Encuesta Dos".
// Crea SOLO el schema `encuesta_dos` y su tabla `responses`. No ejecuta ninguna
// otra migración ni toca las tablas de producción de la Encuesta Uno.
//
// Uso:  npx tsx migrate-encuesta-dos.ts
//
// Conexión: usa DATABASE_URL si está definida; de lo contrario usa los
// parámetros del pooler de Supabase (mismo patrón que apply-schema.ts).
// Nota: el pooler de Supabase exige el usuario 'postgres.<project-ref>',
// no 'postgres' a secas.
// ============================================================================
import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const FALLBACK = {
  user: 'postgres.tnhhtnthbkmvyqgndbmc',
  host: 'aws-1-us-east-1.pooler.supabase.com',
  database: 'postgres',
  password: 'Unidas2026*',
  port: 6543,
  ssl: { rejectUnauthorized: false },
};

function makePool(useUrl: boolean) {
  return useUrl && process.env.DATABASE_URL
    ? new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } })
    : new Pool(FALLBACK);
}

async function runWith(pool: InstanceType<typeof Pool>): Promise<boolean> {
  const sql = fs.readFileSync(path.join(__dirname, 'encuesta_dos_schema.sql'), 'utf8');
  await pool.query(sql);
  const check = await pool.query("SELECT to_regclass('encuesta_dos.responses') AS tbl");
  return !!check.rows[0].tbl;
}

async function migrate() {
  // 1) Intento con DATABASE_URL si existe.
  if (process.env.DATABASE_URL) {
    const pool = makePool(true);
    try {
      console.log('Aplicando esquema encuesta_dos (DATABASE_URL)...');
      if (await runWith(pool)) {
        console.log('✓ Esquema encuesta_dos.responses creado/verificado correctamente.');
        await pool.end();
        return;
      }
    } catch (err: any) {
      await pool.end().catch(() => {});
      if (err.code !== '28P01') { // 28P01 = password authentication failed
        console.error('Error aplicando esquema encuesta_dos:', err.message);
        process.exitCode = 1;
        return;
      }
      console.warn('DATABASE_URL falló autenticación; reintentando con credenciales del pooler...');
    }
  }

  // 2) Fallback a credenciales del pooler de Supabase.
  const pool = makePool(false);
  try {
    if (await runWith(pool)) {
      console.log('✓ Esquema encuesta_dos.responses creado/verificado correctamente (fallback).');
    } else {
      console.error('✗ La tabla no aparece tras la migración.');
      process.exitCode = 1;
    }
  } catch (err: any) {
    console.error('Error aplicando esquema encuesta_dos:', err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

migrate();
