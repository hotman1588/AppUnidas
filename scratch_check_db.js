import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({
  user: 'postgres.tnhhtnthbkmvyqgndbmc',
  host: 'aws-1-us-east-1.pooler.supabase.com',
  database: 'postgres',
  password: 'Unidas2026*',
  port: 6543,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const res = await pool.query('SELECT id, user_id, answers FROM surveys LIMIT 5');
  console.log(JSON.stringify(res.rows, null, 2));
  pool.end();
}
run();
