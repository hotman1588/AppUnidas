import pg from 'pg';

const connectionString = "postgresql://postgres.tnhhtnthbkmvyqgndbmc:Unidas2026*@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  try {
    const res = await pool.query('SELECT answers FROM surveys LIMIT 5');
    console.log('Surveys found:', res.rowCount);
    res.rows.forEach((row, i) => {
      console.log(`\nSurvey ${i + 1} answers structure:`);
      console.log(JSON.stringify(row.answers, null, 2));
    });
  } catch (err) {
    console.error('Error fetching surveys:', err);
  } finally {
    await pool.end();
  }
}

main();
