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

// Storage for Vercel (Temporary)
const uploadsDir = '/tmp/uploads';
if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
  } catch (err) {}
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const JWT_SECRET = process.env.JWT_SECRET || 'unidas-secret-key-123';
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 20000
});

const initDatabase = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY, full_name TEXT NOT NULL, document_type TEXT DEFAULT 'CC', document_number TEXT UNIQUE NOT NULL, phone TEXT, email TEXT UNIQUE, password TEXT NOT NULL, role TEXT DEFAULT 'user', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS surveys (
        id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id) UNIQUE, answers JSONB DEFAULT '{}', status TEXT DEFAULT 'pending_start', current_step INTEGER DEFAULT 1, habeas_data_accepted INTEGER DEFAULT 0, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id), type TEXT NOT NULL, file_path TEXT NOT NULL, status TEXT DEFAULT 'pending', created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS survey_history (
        id SERIAL PRIMARY KEY, user_id INTEGER REFERENCES users(id), action TEXT NOT NULL, details TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS news (
        id SERIAL PRIMARY KEY, title TEXT NOT NULL, content TEXT NOT NULL, image_url TEXT, category TEXT, is_active INTEGER DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL, date TIMESTAMP NOT NULL, location TEXT, capacity INTEGER DEFAULT 50, is_active INTEGER DEFAULT 1, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY, key TEXT UNIQUE NOT NULL, value TEXT NOT NULL
      );
    `);
  } catch (err) { console.error('DB Error:', err); }
};

const app = express();
app.use(cors());
app.use(express.json());

const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Forbidden' });
    req.user = user;
    next();
  });
};

const isAdmin = (req: any, res: any, next: any) => {
  if (req.user && req.user.role === 'admin') next();
  else res.status(403).json({ error: 'Denied' });
};

// --- API ---

// Auth
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
    const token = jwt.sign({ id: u.id, role: u.role, name: u.full_name }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: u.id, name: u.full_name, role: u.role, uid: String(u.id) } });
  } catch (e) { res.status(500).json({ error: 'Error' }); }
});

// Survey
app.get(['/api/user/survey', '/api/usuario/encuesta'], authenticateToken, async (req: any, res) => {
  const r = await pool.query('SELECT * FROM surveys WHERE user_id = $1', [req.user.id]);
  res.json(r.rows[0] || { status: 'pending_start', answers: {}, current_step: 1 });
});

app.post('/api/user/survey/save', authenticateToken, async (req: any, res) => {
  const { answers, step, habeas_data_accepted } = req.body;
  try {
    const answersJson = typeof answers === 'string' ? answers : JSON.stringify(answers || {});
    await pool.query(
      'INSERT INTO surveys (user_id, answers, current_step, habeas_data_accepted) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id) DO UPDATE SET answers = $2, current_step = $3, habeas_data_accepted = $4, updated_at = CURRENT_TIMESTAMP',
      [req.user.id, answersJson, step || 1, habeas_data_accepted ? 1 : 0]
    );
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/user/survey/submit', authenticateToken, async (req: any, res) => {
  try {
    await pool.query('UPDATE surveys SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2', ['pending', req.user.id]);
    await pool.query('INSERT INTO survey_history (user_id, action, details) VALUES ($1, $2, $3)', [req.user.id, 'Envío de encuesta', 'Encuesta enviada para validación.']);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get(['/api/user/survey/history', '/api/usuario/historial/encuesta'], authenticateToken, async (req: any, res) => {
  const r = await pool.query('SELECT * FROM survey_history WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
  res.json(r.rows);
});

// Documents
app.get('/api/user/documents', authenticateToken, async (req: any, res) => {
  const r = await pool.query('SELECT * FROM documents WHERE user_id = $1', [req.user.id]);
  const docs = r.rows.map(d => ({ ...d, url: `/api/documents/view/${d.file_path}` }));
  res.json(docs);
});

app.post('/api/user/documents/upload', authenticateToken, upload.single('file'), async (req: any, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const { type } = req.body;
  await pool.query('INSERT INTO documents (user_id, type, file_path) VALUES ($1, $2, $3)', [req.user.id, type, req.file.filename]);
  res.json({ success: true, url: `/api/documents/view/${req.file.filename}` });
});

app.get('/api/documents/view/:filename', authenticateToken, (req, res) => {
  const filePath = path.join(uploadsDir, req.params.filename);
  if (fs.existsSync(filePath)) res.sendFile(filePath);
  else res.status(404).send('Not found');
});

// Admin
app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
  const r = await pool.query('SELECT id, full_name, document_type, document_number, phone, email, role, created_at FROM users ORDER BY created_at DESC');
  res.json(r.rows);
});
app.get('/api/admin/surveys', authenticateToken, isAdmin, async (req, res) => {
  const r = await pool.query('SELECT s.*, u.full_name, u.document_number FROM surveys s JOIN users u ON s.user_id = u.id ORDER BY s.updated_at DESC');
  res.json(r.rows);
});
app.get('/api/admin/news', authenticateToken, isAdmin, async (req, res) => {
  const r = await pool.query('SELECT * FROM news ORDER BY created_at DESC');
  res.json(r.rows);
});
app.get('/api/admin/events', authenticateToken, isAdmin, async (req, res) => {
  const r = await pool.query('SELECT * FROM events ORDER BY date DESC');
  res.json(r.rows);
});
app.patch('/api/admin/users/:id/role', authenticateToken, isAdmin, async (req, res) => {
  await pool.query('UPDATE users SET role = $1 WHERE id = $2', [req.body.role, req.params.id]);
  res.json({ success: true });
});
app.delete('/api/admin/users/:id', authenticateToken, isAdmin, async (req, res) => {
  await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

// Misc
app.get('/api/settings/habeas_data', async (req, res) => {
  const r = await pool.query("SELECT value FROM settings WHERE key = 'habeas_data'");
  res.json(r.rows[0] || { value: '/habeas_data.pdf' });
});
app.get('/api/stats', async (req, res) => {
  const u = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'user'");
  res.json({ totalUsers: parseInt(u.rows[0].count), completedSurveys: 0, pendingSurveys: 0, registeredEvents: 0 });
});

// SPA
const dist = path.join(process.cwd(), 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
    res.sendFile(path.join(dist, 'index.html'));
  });
}

initDatabase().then(async () => {
  const pass = bcrypt.hashSync('Allus2013.**', 10);
  await pool.query('INSERT INTO users (full_name, document_type, document_number, email, password, role) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (document_number) DO UPDATE SET password = $5, role = $6', ['Administrador Principal', 'CC', '1016016370', 'admin@unidas.social', pass, 'admin']).catch(() => {});
  await pool.query("INSERT INTO settings (key, value) VALUES ('habeas_data', '/habeas_data.pdf') ON CONFLICT DO NOTHING").catch(() => {});
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => console.log(`Run ${PORT}`));
}

export default app;
