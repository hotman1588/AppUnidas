import pg from 'pg';

const pool = new pg.Pool({
  host: 'db.tnhhtnthbkmvyqgndbmc.supabase.co',
  port: 5432,
  user: 'postgres',
  password: 'Unidas2026*',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const res = await pool.query('SELECT current_user, now()');
    console.log('Direct Success:', res.rows);
  } catch (err) {
    console.error('Direct Error:', err.message);
  } finally {
    pool.end();
  }
}
run();
