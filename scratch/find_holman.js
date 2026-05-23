import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    const res = await pool.query("SELECT u.id, u.full_name, u.role, u.document_number, s.status as survey_status FROM users u LEFT JOIN surveys s ON u.id = s.user_id WHERE u.full_name ILIKE $1", ['%holm%']);
    console.log("Holman users:", res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
run();
