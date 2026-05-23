import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: 'postgresql://postgres.tnhhtnthbkmvyqgndbmc:Unidas2026%2A@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  ssl: { rejectUnauthorized: false }
});

async function cleanDatabase() {
  const client = await pool.connect();
  try {
    console.log('Iniciando limpieza de la base de datos...');
    await client.query('BEGIN');
    
    // 1. Borrar historial asociado a usuarios que NO son admin
    console.log('1. Borrando historial de encuestas...');
    await client.query("DELETE FROM survey_history WHERE user_id IN (SELECT id FROM users WHERE role != 'admin')");
    
    // 2. Borrar documentos asociados
    console.log('2. Borrando registros de documentos...');
    await client.query("DELETE FROM documents WHERE user_id IN (SELECT id FROM users WHERE role != 'admin')");
    
    // 3. Borrar encuestas asociadas
    console.log('3. Borrando encuestas...');
    await client.query("DELETE FROM surveys WHERE user_id IN (SELECT id FROM users WHERE role != 'admin')");
    
    // 4. Finalmente, borrar los usuarios
    console.log('4. Borrando usuarios (excepto administradores)...');
    const res = await client.query("DELETE FROM users WHERE role != 'admin'");
    
    await client.query('COMMIT');
    
    console.log(`\n✅ ¡Limpieza exitosa! Se han eliminado ${res.rowCount} usuarios y toda su información asociada.`);
    console.log('El administrador principal se ha conservado intacto.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error limpiando la base de datos:', err);
  } finally {
    client.release();
    pool.end();
  }
}

cleanDatabase();
