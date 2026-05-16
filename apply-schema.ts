import pkg from 'pg';
const { Pool } = pkg;
import fs from 'fs';
import path from 'path';

const pool = new Pool({
  user: 'postgres.tnhhtnthbkmvyqgndbmc',
  host: 'aws-1-us-east-1.pooler.supabase.com',
  database: 'postgres',
  password: 'Unidas2026*',
  port: 6543,
  ssl: {
    rejectUnauthorized: false
  }
});

const sqlPath = path.join('C:', 'Users', 'lizib', '.gemini', 'antigravity', 'brain', '4d063789-a184-4e5b-8783-dac49216f4a6', 'supabase_schema.sql');

async function applySchema() {
  try {
    console.log('Reading schema file...');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    console.log('Executing SQL schema...');
    await pool.query(sql);
    
    console.log('Schema applied successfully!');
  } catch (err) {
    console.error('Error applying schema:', err.message);
  } finally {
    await pool.end();
  }
}

applySchema();
