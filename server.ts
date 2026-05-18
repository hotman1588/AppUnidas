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
import { createClient } from '@supabase/supabase-js';
import supabaseConfig from './supabase-config.json';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Storage for Vercel
const uploadsDir = '/tmp/uploads';
if (!fs.existsSync(uploadsDir)) {
  try {
    fs.mkdirSync(uploadsDir, { recursive: true });
  } catch (err) {}
}

// Initialize Supabase Client for Cloud Storage
let supabase: any = null;
try {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || supabaseConfig.supabaseUrl;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_KEY || supabaseConfig.supabaseKey;
  if (url && key) {
    supabase = createClient(url, key);
    console.log('Supabase client initialized successfully for server uploads.');
  }
} catch (err: any) {
  console.error('Failed to initialize Supabase client in server.ts:', err.message);
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
    console.log('Running database migrations...');
    
    // 1. Create users table
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
    `).catch(err => console.error('Migration Error (users):', err.message));

    // 2. Create surveys table
    await pool.query(`
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
    `).catch(err => console.error('Migration Error (surveys):', err.message));

    // 3. Migrate surveys table columns if they are missing
    await pool.query(`
      ALTER TABLE surveys ADD COLUMN IF NOT EXISTS answers JSONB DEFAULT '{}';
      ALTER TABLE surveys ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending_start';
      ALTER TABLE surveys ADD COLUMN IF NOT EXISTS current_step INTEGER DEFAULT 1;
      ALTER TABLE surveys ADD COLUMN IF NOT EXISTS habeas_data_accepted INTEGER DEFAULT 0;
      ALTER TABLE surveys ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    `).catch(err => console.error('Migration Error (surveys alter columns):', err.message));

    // 4. Add UNIQUE constraint to surveys.user_id if missing
    await pool.query(`
      ALTER TABLE surveys ADD CONSTRAINT surveys_user_id_key UNIQUE (user_id);
    `).catch(err => {
      if (!err.message.includes('already exists') && !err.message.includes('already a unique')) {
        console.error('Migration Error (surveys unique constraint):', err.message);
      }
    });

    // 5. Create documents table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS documents (
        id SERIAL PRIMARY KEY, 
        user_id INTEGER REFERENCES users(id), 
        type TEXT NOT NULL, 
        file_path TEXT NOT NULL, 
        status TEXT DEFAULT 'pending', 
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `).catch(err => console.error('Migration Error (documents):', err.message));

    // 6. Create survey_history table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS survey_history (
        id SERIAL PRIMARY KEY, 
        user_id INTEGER REFERENCES users(id), 
        action TEXT NOT NULL, 
        details TEXT, 
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `).catch(err => console.error('Migration Error (survey_history):', err.message));

    // 7. Create news table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS news (
        id SERIAL PRIMARY KEY, 
        title TEXT NOT NULL, 
        content TEXT NOT NULL, 
        image_url TEXT, 
        category TEXT, 
        is_active INTEGER DEFAULT 1, 
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `).catch(err => console.error('Migration Error (news):', err.message));

    // 8. Create events table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY, 
        title TEXT NOT NULL, 
        description TEXT NOT NULL, 
        date TIMESTAMP NOT NULL, 
        location TEXT, 
        capacity INTEGER DEFAULT 50, 
        is_active INTEGER DEFAULT 1, 
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `).catch(err => console.error('Migration Error (events):', err.message));

    // 9. Create settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY, 
        key TEXT UNIQUE NOT NULL, 
        value TEXT NOT NULL
      );
    `).catch(err => console.error('Migration Error (settings):', err.message));

    console.log('Database migrations completed successfully.');
  } catch (err: any) {
    console.error('Global Migration Error:', err.message);
  }
};

const app = express();
app.use(cors());
app.use(express.json());

const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
};

const isAdmin = (req: any, res: any, next: any) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'analyst')) next();
  else res.status(403).json({ error: 'Denied' });
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
    const token = jwt.sign({ id: u.id, role: u.role, name: u.full_name }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: u.id, name: u.full_name, role: u.role, uid: String(u.id) } });
  } catch (e) { res.status(500).json({ error: 'Error' }); }
});

// --- USER ---
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
    await pool.query(
      'INSERT INTO surveys (user_id, status) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET status = $2, updated_at = CURRENT_TIMESTAMP',
      [req.user.id, 'pending']
    );
    await pool.query('INSERT INTO survey_history (user_id, action, details) VALUES ($1, $2, $3)', [req.user.id, 'Envío de encuesta', 'Encuesta enviada para validación.']);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get(['/api/user/survey/history', '/api/usuario/historial/encuesta'], authenticateToken, async (req: any, res) => {
  const r = await pool.query('SELECT * FROM survey_history WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
  res.json(r.rows);
});

app.get('/api/user/documents', authenticateToken, async (req: any, res) => {
  const r = await pool.query('SELECT * FROM documents WHERE user_id = $1', [req.user.id]);
  res.json(r.rows.map(d => ({ ...d, url: `/api/documents/view/${d.file_path}` })));
});

app.post('/api/user/documents/upload', authenticateToken, upload.single('file'), async (req: any, res: any) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const { type } = req.body;
  try {
    // 1. Save in local PostgreSQL database
    await pool.query('INSERT INTO documents (user_id, type, file_path) VALUES ($1, $2, $3)', [req.user.id, type, req.file.filename]);

    // 2. Upload to Supabase Storage if initialized
    if (supabase) {
      const fileBuffer = fs.readFileSync(req.file.path);
      const { error } = await supabase.storage
        .from('documents')
        .upload(req.file.filename, fileBuffer, {
          contentType: req.file.mimetype,
          upsert: true
        });

      if (error) {
        console.error('Supabase storage upload failed:', error.message);
      } else {
        console.log('Successfully mirrored file to Supabase storage:', req.file.filename);
      }
    } else {
      console.warn('Supabase storage client not initialized, file only stored locally.');
    }

    res.json({ success: true, url: `/api/documents/view/${req.file.filename}` });
  } catch (err: any) {
    console.error('Document upload error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/documents/view/:filename', authenticateToken, async (req, res) => {
  const filePath = path.join(uploadsDir, req.params.filename);
  
  // 1. Try serving local file first
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  
  // 2. Fallback: retrieve from Supabase Storage if local file is missing (Vercel serverless environment)
  if (supabase) {
    try {
      console.log(`Local file missing. Fetching ${req.params.filename} from Supabase storage fallback...`);
      const { data, error } = await supabase.storage
        .from('documents')
        .download(req.params.filename);

      if (!error && data) {
        const buffer = Buffer.from(await data.arrayBuffer());
        const ext = path.extname(req.params.filename).toLowerCase();
        let contentType = 'application/octet-stream';
        if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';
        else if (ext === '.png') contentType = 'image/png';
        else if (ext === '.pdf') contentType = 'application/pdf';

        res.setHeader('Content-Type', contentType);
        return res.send(buffer);
      } else {
        console.error('Supabase storage download failed:', error?.message || 'File not found');
      }
    } catch (err: any) {
      console.error('Error fetching file from Supabase storage:', err.message);
    }
  }
  
  res.status(404).send('Not found');
});

// --- ADMIN ---
app.get('/api/stats', authenticateToken, async (req, res) => {
  const u = await pool.query("SELECT COUNT(*) FROM users WHERE role = 'user'");
  const s = await pool.query("SELECT COUNT(*) FROM surveys WHERE status = 'pending'");
  res.json({ totalUsers: parseInt(u.rows[0].count), pendingSurveys: parseInt(s.rows[0].count), completedSurveys: 0, registeredEvents: 0 });
});

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

app.get('/api/admin/analysts-stats', authenticateToken, isAdmin, async (req, res) => {
  // Mock analysts list to avoid frontend errors
  res.json([
    { id: 1, name: 'Analista Principal', surveys_completed: 0, surveys_pending: 0 }
  ]);
});

app.get('/api/admin/users/:userId/survey', authenticateToken, isAdmin, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM surveys WHERE user_id = $1', [req.params.userId]);
    res.json(r.rows[0] || { status: 'pending_start', answers: {}, current_step: 1 });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/admin/users/:userId/documents', authenticateToken, isAdmin, async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM documents WHERE user_id = $1', [req.params.userId]);
    res.json(r.rows.map(d => ({ ...d, url: `/api/documents/view/${d.file_path}` })));
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/admin/surveys/:surveyId/history', authenticateToken, isAdmin, async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT sh.*, u.full_name as user_name FROM survey_history sh JOIN users u ON sh.user_id = u.id WHERE sh.user_id = (SELECT user_id FROM surveys WHERE id = $1) ORDER BY sh.created_at DESC',
      [req.params.surveyId]
    );
    res.json(r.rows);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/admin/surveys/:surveyId/review', authenticateToken, isAdmin, async (req: any, res: any) => {
  const { status, observations } = req.body;
  try {
    // 1. Update survey status
    await pool.query(
      'UPDATE surveys SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [status, req.params.surveyId]
    );
    
    // 2. Get the user_id for this survey
    const s = await pool.query('SELECT user_id FROM surveys WHERE id = $1', [req.params.surveyId]);
    const userId = s.rows[0]?.user_id;
    
    if (userId) {
      // 3. Insert into survey history
      const action = status === 'approved' ? 'Aprobación de Encuesta' : status === 'rejected' ? 'Solicitud de Ajustes' : 'Rechazo de Encuesta';
      await pool.query(
        'INSERT INTO survey_history (user_id, action, details) VALUES ($1, $2, $3)',
        [userId, action, observations || 'Revisado por el analista.']
      );
    }
    
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.patch('/api/admin/users/:id/role', authenticateToken, isAdmin, async (req, res) => {
  await pool.query('UPDATE users SET role = $1 WHERE id = $2', [req.body.role, req.params.id]);
  res.json({ success: true });
});

app.delete('/api/admin/users/:id', authenticateToken, isAdmin, async (req, res) => {
  await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
  res.json({ success: true });
});

// Settings & Public
app.get('/api/settings/habeas_data', async (req, res) => {
  const r = await pool.query("SELECT value FROM settings WHERE key = 'habeas_data'");
  res.json(r.rows[0] || { value: '/habeas_data.pdf' });
});

app.get(['/api/news', '/api/noticias'], async (req, res) => {
  const r = await pool.query('SELECT * FROM news WHERE is_active = 1 ORDER BY created_at DESC');
  res.json(r.rows);
});

app.get(['/api/events', '/api/eventos'], async (req, res) => {
  const r = await pool.query('SELECT * FROM events WHERE is_active = 1 ORDER BY date ASC');
  res.json(r.rows);
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
  app.listen(PORT, () => console.log(`Server: ${PORT}`));
}

export default app;
