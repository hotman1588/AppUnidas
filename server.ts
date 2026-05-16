import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import fs from 'fs';
import multer from 'multer';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = process.env.VERCEL ? '/tmp/uploads' : path.join(__dirname, 'uploads');
try {
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
} catch (err) {}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

const JWT_SECRET = process.env.JWT_SECRET || 'unidas-secret-key-123';
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://localhost:5432/missing',
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000
});

const initDatabase = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name TEXT NOT NULL,
        document_type TEXT DEFAULT 'CC',
        document_number TEXT UNIQUE NOT NULL,
        phone TEXT,
        email TEXT UNIQUE,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE users ALTER COLUMN document_type SET DEFAULT 'CC';
      
      CREATE TABLE IF NOT EXISTS surveys (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) UNIQUE,
        answers JSONB DEFAULT '{}',
        status TEXT DEFAULT 'pending_start',
        current_step INTEGER DEFAULT 1,
        habeas_data_accepted INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        type TEXT NOT NULL,
        file_path TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS news (
        id SERIAL PRIMARY KEY, title TEXT NOT NULL, content TEXT NOT NULL, image_url TEXT, category TEXT, is_active INTEGER DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL, date TIMESTAMP NOT NULL, location TEXT, is_active INTEGER DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS survey_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        action TEXT NOT NULL,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (err) { console.error('Schema Error:', err); }
};

const runSeeds = async () => {
  try {
    const pass = bcrypt.hashSync('Allus2013.**', 10);
    await pool.query(
      'INSERT INTO users (full_name, document_type, document_number, email, password, role) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (document_number) DO UPDATE SET password = $5, role = $6',
      ['Administrador Principal', 'CC', '1016016370', 'admin@unidas.social', pass, 'admin']
    );
  } catch (err) { console.error('Seed error:', err); }
};

const app = express();
app.use(cors());
app.use(express.json());

const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.sendStatus(401);
  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

// --- AUTH ---
app.post(['/api/auth/register', '/api/auth/registro'], async (req, res) => {
  const { full_name, document_type, document_number, phone, email, password } = req.body;
  try {
    const hashed = bcrypt.hashSync(password, 10);
    const result = await pool.query(
      'INSERT INTO users (full_name, document_type, document_number, phone, email, password) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [full_name, document_type || 'CC', document_number, phone, email, hashed]
    );
    res.json({ id: result.rows[0].id });
  } catch (e: any) { res.status(400).json({ error: e.message }); }
});

app.post(['/api/auth/login', '/api/auth/ingreso'], async (req, res) => {
  const { document_number, password } = req.body;
  try {
    const r = await pool.query('SELECT * FROM users WHERE document_number = $1', [document_number]);
    const u = r.rows[0];
    if (!u || !bcrypt.compareSync(password, u.password)) return res.status(401).json({ error: 'Inválido' });
    const token = jwt.sign({ id: u.id, role: u.role, name: u.full_name }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: { id: u.id, name: u.full_name, role: u.role } });
  } catch (e) { res.status(500).json({ error: 'Error' }); }
});

app.get('/api/auth/me', authenticateToken, async (req: any, res) => {
  const r = await pool.query('SELECT id, full_name as name, role FROM users WHERE id = $1', [req.user.id]);
  res.json(r.rows[0]);
});

// --- SURVEY ---
app.get(['/api/user/survey', '/api/usuario/encuesta'], authenticateToken, async (req: any, res) => {
  const r = await pool.query('SELECT * FROM surveys WHERE user_id = $1', [req.user.id]);
  res.json(r.rows[0] || { status: 'pending_start', answers: {}, current_step: 1 });
});

app.post('/api/user/survey/save', authenticateToken, async (req: any, res) => {
  const { answers, step, habeas_data_accepted } = req.body;
  try {
    await pool.query(
      'INSERT INTO surveys (user_id, answers, current_step, habeas_data_accepted) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id) DO UPDATE SET answers = $2, current_step = $3, habeas_data_accepted = $4, updated_at = CURRENT_TIMESTAMP',
      [req.user.id, JSON.stringify(answers), step, habeas_data_accepted ? 1 : 0]
    );
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/user/survey/submit', authenticateToken, async (req: any, res) => {
  try {
    await pool.query('UPDATE surveys SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2', ['pending', req.user.id]);
    await pool.query('INSERT INTO survey_history (user_id, action, details) VALUES ($1, $2, $3)', 
      [req.user.id, 'Envío de encuesta', 'La usuaria ha enviado la encuesta para validación.']);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get(['/api/user/survey/history', '/api/usuario/historial/encuesta'], authenticateToken, async (req: any, res) => {
  const r = await pool.query('SELECT * FROM survey_history WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
  res.json(r.rows);
});

// --- DOCUMENTS ---
app.get('/api/user/documents', authenticateToken, async (req: any, res) => {
  const r = await pool.query('SELECT * FROM documents WHERE user_id = $1', [req.user.id]);
  res.json(r.rows);
});

app.post('/api/user/documents/upload', authenticateToken, upload.single('file'), async (req: any, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const { type } = req.body;
  try {
    const r = await pool.query(
      'INSERT INTO documents (user_id, type, file_path) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, type, req.file.filename]
    );
    res.json(r.rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// --- CONTENT ---
app.get(['/api/news', '/api/noticias'], async (req, res) => {
  const r = await pool.query('SELECT * FROM news WHERE is_active = 1 ORDER BY created_at DESC');
  res.json(r.rows);
});

app.get('/api/stats', async (req, res) => {
  const u = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'user'");
  const s = await pool.query("SELECT COUNT(*) FROM surveys WHERE status = 'approved'");
  res.json({ totalUsers: parseInt(u.rows[0].count), completedSurveys: parseInt(s.rows[0].count), pendingSurveys: 0, registeredEvents: 0 });
});

const start = async () => {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const dist = path.join(process.cwd(), 'dist');
    if (fs.existsSync(dist)) {
      app.use(express.static(dist));
      app.get('*', (req, res) => {
        if (!req.path.startsWith('/api')) res.sendFile(path.join(dist, 'index.html'));
        else res.status(404).json({ error: 'API Not Found' });
      });
    }
  }
  initDatabase().then(() => runSeeds()).catch(() => {});
};
start();

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => console.log(`Port ${PORT}`));
}

export default app;
