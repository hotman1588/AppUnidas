import pg from 'pg';
import dotenv from 'dotenv';
const { Pool } = pg;

// Clear any global PG env variables that might override the connection string
delete process.env.PGUSER;
delete process.env.PGPASSWORD;
delete process.env.PGDATABASE;
delete process.env.PGPORT;
delete process.env.PGHOST;

dotenv.config();

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.error('DATABASE_URL is not defined in environment variables');
  process.exit(1);
}

const parsedUrl = new URL(dbUrl);

const pool = new Pool({
  user: decodeURIComponent(parsedUrl.username),
  password: decodeURIComponent(parsedUrl.password),
  host: parsedUrl.hostname,
  port: parseInt(parsedUrl.port || '5432', 10),
  database: decodeURIComponent(parsedUrl.pathname.substring(1)),
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    console.log('Connecting to database...');
    console.log(`Connecting as user: ${decodeURIComponent(parsedUrl.username)} to ${parsedUrl.hostname}:${parsedUrl.port}`);
    const selectRes = await pool.query('SELECT id, user_id, answers FROM surveys');
    console.log(`Total surveys found: ${selectRes.rows.length}`);
    
    let updatedCount = 0;
    for (const row of selectRes.rows) {
      let answersStr = JSON.stringify(row.answers || {});
      if (answersStr.includes('empalado')) {
        console.log(`Found "empalado" in survey ID ${row.id} for user ${row.user_id}`);
        const updatedAnswers = JSON.parse(answersStr.replace(/empalado/g, 'Empleado'));
        
        await pool.query('UPDATE surveys SET answers = $1 WHERE id = $2', [JSON.stringify(updatedAnswers), row.id]);
        console.log(`Updated survey ID ${row.id}`);
        updatedCount++;
      }
    }
    
    console.log(`Finished! Updated ${updatedCount} records.`);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

run();
