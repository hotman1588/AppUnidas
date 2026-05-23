import pg from 'pg';

const passwords = [
  'Unidas2026*',
  'Unidas2026',
  'unidas2026*',
  'unidas2026',
  'Unidas2025*',
  'Unidas2025'
];

async function testPassword(password) {
  const pool = new pg.Pool({
    connectionString: `postgresql://postgres.tnhhtnthbkmvyqgndbmc:${encodeURIComponent(password)}@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true`,
    ssl: { rejectUnauthorized: false }
  });
  try {
    const res = await pool.query('SELECT now()');
    console.log(`Password "${password}" worked!`);
    return true;
  } catch (err) {
    console.log(`Password "${password}" failed: ${err.message}`);
    return false;
  } finally {
    await pool.end();
  }
}

async function run() {
  for (const pw of passwords) {
    if (await testPassword(pw)) break;
  }
}
run();
