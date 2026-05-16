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

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } 
});

const JWT_SECRET = process.env.JWT_SECRET || 'unidas-secret-key-123';
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Add global error handler to the pool to prevent unhandled rejections
pool.on('error', (err) => {
  console.error('UNEXPECTED ERROR ON IDLE CLIENT:', err);
});

// --- Database Logic ---
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

      CREATE TABLE IF NOT EXISTS surveys (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        answers JSONB DEFAULT '{}',
        status TEXT DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS news (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        image_url TEXT,
        category TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        date TIMESTAMP NOT NULL,
        location TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (err) { console.error('DB Init Error:', err); }
};

const runSeeds = async () => {
  try {
    const hashedPassword = bcrypt.hashSync('1234', 10);
    await pool.query('INSERT INTO users (full_name, document_number, email, password, role) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING',
      ['Administrador', '12345678', 'admin@unidas.social', hashedPassword, 'admin']);
    await pool.query('INSERT INTO users (full_name, document_number, email, password, role) VALUES ($1, $2, $3, $4, $5) ON CONFLICT DO NOTHING',
      ['Analista', '987654321', 'analista@unidas.social', hashedPassword, 'analyst']);
  } catch (err) { console.error('Seed Error:', err); }
};

// --- App Setup ---
const app = express();
app.use(cors());
app.use(express.json());

// Auth Middleware
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

// --- API Routes ---
app.post('/api/auth/login', async (req, res) => {
  const { document_number, password } = req.body;
  try {
    const result = await pool.query('SELECT * FROM users WHERE document_number = $1', [document_number]);
    const user = result.rows[0];
    if (!user || !bcrypt.compareSync(password, user.password)) return res.status(401).json({ error: 'Credenciales inválidas' });
    const token = jwt.sign({ id: user.id, role: user.role, name: user.full_name }, JWT_SECRET, { expiresIn: '8h' });
    res.json({ token, user: { id: user.id, name: user.full_name, role: user.role } });
  } catch (err) { res.status(500).json({ error: 'Error' }); }
});

app.get('/api/news', async (req, res) => {
  const result = await pool.query('SELECT * FROM news WHERE is_active = 1 ORDER BY created_at DESC');
  res.json(result.rows);
});

app.get('/api/events', async (req, res) => {
  const result = await pool.query('SELECT * FROM events WHERE is_active = 1 ORDER BY date ASC');
  res.json(result.rows);
});

app.post('/api/analyst/register-complete-characterization', authenticateToken, async (req: any, res) => {
  if (req.user.role !== 'analyst' && req.user.role !== 'admin') return res.sendStatus(403);
  const { user: userData, answers } = req.body;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const hashedPassword = bcrypt.hashSync(userData.password || '1234', 10);
    const uRes = await client.query(
      'INSERT INTO users (full_name, document_type, document_number, phone, email, password, role) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [userData.full_name, userData.document_type || 'CC', userData.document_number, userData.phone, userData.email, hashedPassword, 'user']
    );
    await client.query('INSERT INTO surveys (user_id, answers, status) VALUES ($1, $2, $3)', [uRes.rows[0].id, JSON.stringify(answers), 'approved']);
    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err: any) { await client.query('ROLLBACK'); res.status(500).json({ error: err.message }); }
  finally { client.release(); }
});

// --- Frontend & Init ---
const setupApp = async () => {
  try {
    if (process.env.NODE_ENV !== 'production') {
      const { createServer } = await import('vite');
      const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
      app.use(vite.middlewares);
    } else {
      const distPath = path.join(process.cwd(), 'dist');
      if (fs.existsSync(distPath)) {
        app.use(express.static(distPath));
        app.get('*', (req, res) => {
          if (!req.path.startsWith('/api')) {
            res.sendFile(path.join(distPath, 'index.html'));
          } else {
            res.status(404).json({ error: 'API route not found' });
          }
        });
      } else {
        app.get('*', (req, res) => {
          if (req.path.startsWith('/api')) return res.status(404).json({ error: 'API route not found' });
          res.send('La aplicación se está iniciando... Por favor, recarga en unos segundos.');
        });
      }
    }
    
    // Non-blocking initialization
    initDatabase().then(() => runSeeds()).catch(e => console.error('Background init failed:', e));
    
  } catch (err) {
    console.error('SETUP ERROR:', err);
  }
};

setupApp();

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => console.log(`Server on port ${PORT}`));
}

export default app;
