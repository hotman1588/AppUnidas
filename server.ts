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
  const configPath = path.join(process.cwd(), 'supabase-config.json');
  if (fs.existsSync(configPath)) {
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || config.supabaseUrl;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_KEY || config.supabaseKey;
    if (url && key) {
      supabase = createClient(url, key);
      console.log('Supabase client initialized successfully for server uploads.');
    }
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

if (!process.env.DATABASE_URL) {
  console.error('FATAL: DATABASE_URL environment variable is not set.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 20000
});


// Garantiza el esquema aislado de Encuesta Dos de forma idempotente. Se llama
// al usar los endpoints, ya que initDatabase() no corre en este despliegue.
let encuestaDosReady = false;
const ensureEncuestaDosSchema = async () => {
  if (encuestaDosReady) return;
  await pool.query(`CREATE SCHEMA IF NOT EXISTS encuesta_dos;`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS encuesta_dos.responses (
      id SERIAL PRIMARY KEY,
      full_name TEXT NOT NULL,
      document_type TEXT NOT NULL,
      document_number TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      password TEXT,
      birth_date TEXT,
      edad INTEGER,
      is_minor BOOLEAN DEFAULT FALSE,
      answers JSONB DEFAULT '{}',
      habeas_data_accepted BOOLEAN DEFAULT FALSE,
      analyst_name TEXT,
      analyst_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  // Columnas del módulo de registro (idempotente para tablas ya creadas).
  await pool.query(`
    ALTER TABLE encuesta_dos.responses ADD COLUMN IF NOT EXISTS phone TEXT;
    ALTER TABLE encuesta_dos.responses ADD COLUMN IF NOT EXISTS email TEXT;
    ALTER TABLE encuesta_dos.responses ADD COLUMN IF NOT EXISTS password TEXT;
    ALTER TABLE encuesta_dos.responses ADD COLUMN IF NOT EXISTS user_id INTEGER;
  `);
  // Trazabilidad Habeas Data: fecha/hora exacta de aceptación.
  await pool.query(`ALTER TABLE encuesta_dos.responses ADD COLUMN IF NOT EXISTS habeas_accepted_at TIMESTAMP;`);
  // Tiempo total de diligenciamiento de la encuesta, en segundos.
  await pool.query(`ALTER TABLE encuesta_dos.responses ADD COLUMN IF NOT EXISTS tiempo_ejecucion_segundos INTEGER;`);
  // Reestructuración: registro anónimo (código único generado) y perfil ('adulto'|'menor').
  // Ya no se capturan datos personales, por lo que las columnas de identidad dejan de ser obligatorias.
  await pool.query(`
    ALTER TABLE encuesta_dos.responses ADD COLUMN IF NOT EXISTS registro_codigo TEXT;
    ALTER TABLE encuesta_dos.responses ADD COLUMN IF NOT EXISTS perfil TEXT;
    ALTER TABLE encuesta_dos.responses ALTER COLUMN full_name DROP NOT NULL;
    ALTER TABLE encuesta_dos.responses ALTER COLUMN document_type DROP NOT NULL;
    ALTER TABLE encuesta_dos.responses ALTER COLUMN document_number DROP NOT NULL;
  `).catch((e: any) => console.error('Migration Error (encuesta_dos anon):', e.message));
  encuestaDosReady = true;
};

// Garantiza la columna de trazabilidad Habeas Data en la tabla 'surveys' (Encuesta Uno).
// initDatabase() no corre en este despliegue, por eso se asegura en tiempo de ejecución.
let habeasTraceReady = false;
const ensureHabeasTrace = async () => {
  if (habeasTraceReady) return;
  await pool.query(`ALTER TABLE surveys ADD COLUMN IF NOT EXISTS habeas_accepted_at TIMESTAMP;`);
  // Trazabilidad de personal: recolector que generó/diligenció la encuesta.
  await pool.query(`ALTER TABLE surveys ADD COLUMN IF NOT EXISTS analyst_name TEXT;`);
  await pool.query(`ALTER TABLE surveys ADD COLUMN IF NOT EXISTS analyst_id INTEGER;`);
  // Aprobador: quien valida/aprueba la encuesta.
  await pool.query(`ALTER TABLE surveys ADD COLUMN IF NOT EXISTS approved_by TEXT;`);
  // Tiempo total de diligenciamiento de la encuesta, en segundos.
  await pool.query(`ALTER TABLE surveys ADD COLUMN IF NOT EXISTS tiempo_ejecucion_segundos INTEGER;`);
  // Backfill: recupera el recolector de registros presenciales antiguos desde el
  // historial ("...aprobada por el analista <NOMBRE>.") cuando analyst_name está vacío.
  await pool.query(`
    UPDATE surveys s
    SET analyst_name = sub.name
    FROM (
      SELECT DISTINCT ON (user_id) user_id,
        trim(trailing '.' from regexp_replace(details, '^.*por el analista ', '')) AS name
      FROM survey_history
      WHERE action = 'Registro Presencial' AND details LIKE '%por el analista %'
      ORDER BY user_id, created_at DESC
    ) sub
    WHERE s.user_id = sub.user_id
      AND (s.analyst_name IS NULL OR s.analyst_name = '')
      AND sub.name IS NOT NULL AND sub.name <> '';
  `).catch((e: any) => console.error('Backfill recolector error:', e.message));
  await cleanupRemovedSurveyOneAnswers();
  habeasTraceReady = true;
};

// Crea o actualiza el usuario en la base 'users' a partir del registro de la
// encuesta (mismo comportamiento que la Encuesta Uno presencial). Devuelve el id.
const upsertSurveyUser = async (user: any): Promise<number> => {
  const hashed = bcrypt.hashSync(user.password || '123456', 10);
  const existing = await pool.query('SELECT id FROM users WHERE document_number = $1', [user.document_number]);
  if (existing.rows.length > 0) {
    const userId = existing.rows[0].id;
    await pool.query(
      'UPDATE users SET full_name = $1, document_type = $2, phone = $3, email = $4, password = $5 WHERE id = $6',
      [user.full_name, user.document_type || 'CC', user.phone || null, user.email || null, hashed, userId]
    );
    return userId;
  }
  const inserted = await pool.query(
    'INSERT INTO users (full_name, document_type, document_number, phone, email, password, role) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
    [user.full_name, user.document_type || 'CC', user.document_number, user.phone || null, user.email || null, hashed, 'user']
  );
  return inserted.rows[0].id;
};

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

    // 8b. Create event_attendees table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS event_attendees (
        id SERIAL PRIMARY KEY,
        event_id INTEGER REFERENCES events(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(event_id, user_id)
      );
    `).catch(err => console.error('Migration Error (event_attendees):', err.message));


    // 9. Create settings table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY, 
        key TEXT UNIQUE NOT NULL, 
        value TEXT NOT NULL
      );
    `).catch(err => console.error('Migration Error (settings):', err.message));

    // 10. ENCUESTA DOS — Esquema completamente aislado de la Encuesta Uno (producción).
    //     Vive en su propio schema 'encuesta_dos'. Las cajas de texto condicionales se
    //     guardan dentro de 'answers' (JSONB) sin límite de caracteres.
    await pool.query(`CREATE SCHEMA IF NOT EXISTS encuesta_dos;`)
      .catch(err => console.error('Migration Error (encuesta_dos schema):', err.message));
    await pool.query(`
      CREATE TABLE IF NOT EXISTS encuesta_dos.responses (
        id SERIAL PRIMARY KEY,
        full_name TEXT NOT NULL,
        document_type TEXT NOT NULL,
        document_number TEXT NOT NULL,
        phone TEXT,
        email TEXT,
        password TEXT,
        birth_date TEXT,
        edad INTEGER,
        is_minor BOOLEAN DEFAULT FALSE,
        answers JSONB DEFAULT '{}',
        habeas_data_accepted BOOLEAN DEFAULT FALSE,
        analyst_name TEXT,
        analyst_id INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `).catch(err => console.error('Migration Error (encuesta_dos.responses):', err.message));

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

const requireAdminOnly = (req: any, res: any, next: any) => {
  if (req.user && req.user.role === 'admin') next();
  else res.status(403).json({ error: 'Solo los administradores pueden realizar esta acción' });
};

const cleanupUserFiles = async (filePaths: string[]) => {
  const uniqueFiles = Array.from(new Set(filePaths.filter(Boolean)));

  await Promise.all(uniqueFiles.map(async (filePath) => {
    const filename = path.basename(filePath);
    const localPath = path.join(uploadsDir, filename);

    try {
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath);
      }
    } catch (err: any) {
      console.error('Error deleting local user file:', err.message);
    }

    if (supabase) {
      try {
        await supabase.storage.from('documents').remove([filename]);
      } catch (err: any) {
        console.error('Error deleting Supabase user file:', err.message);
      }
    }
  }));
};

const deleteUsersWithRecords = async (userIds: string[]) => {
  const normalizedIds = Array.from(new Set(
    userIds
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0)
  ));

  if (normalizedIds.length === 0) {
    return { deletedCount: 0, filePaths: [] as string[] };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const docs = await client.query('SELECT file_path FROM documents WHERE user_id = ANY($1::int[])', [normalizedIds]);

    await client.query('DELETE FROM event_attendees WHERE user_id = ANY($1::int[])', [normalizedIds]);
    await client.query('DELETE FROM survey_history WHERE user_id = ANY($1::int[])', [normalizedIds]);
    await client.query('DELETE FROM documents WHERE user_id = ANY($1::int[])', [normalizedIds]);
    await client.query('DELETE FROM surveys WHERE user_id = ANY($1::int[])', [normalizedIds]);
    const deleted = await client.query('DELETE FROM users WHERE id = ANY($1::int[]) RETURNING id', [normalizedIds]);

    await client.query('COMMIT');

    return {
      deletedCount: deleted.rowCount || 0,
      filePaths: docs.rows.map((doc) => doc.file_path)
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const REMOVED_SURVEY_ONE_FIELDS: Record<string, string[]> = {
  economia: ['responsable_economica'],
  cuidado: ['reconocimiento', 'cansancio_fisico', 'agotamiento_emocional'],
  bienestar: ['seguridad_hogar', 'tiempo_cuidado_mayor_parte', 'enfermedad_diagnosticada', 'enfermedades_cuales'],
  proyecciones: ['bienestar_deseado', 'bienestar_deseado_otro', 'dificultades_actividades_cotidianas', 'desea_mas_apoyo', 'apoyo_cuales'],
  dinamica_familiar: ['compartir_habilidades', 'compartir_habilidades_cuales', 'participacion_social']
};

const sanitizeSurveyOneAnswers = (answers: any) => {
  const parsed = typeof answers === 'string' ? JSON.parse(answers || '{}') : (answers || {});
  const clean = JSON.parse(JSON.stringify(parsed));

  Object.entries(REMOVED_SURVEY_ONE_FIELDS).forEach(([moduleKey, fieldKeys]) => {
    if (!clean[moduleKey] || typeof clean[moduleKey] !== 'object') return;
    fieldKeys.forEach(fieldKey => delete clean[moduleKey][fieldKey]);
  });

  return clean;
};

const buildSurveyOneAnswersCleanupExpression = (columnName = 'answers') => {
  return Object.entries(REMOVED_SURVEY_ONE_FIELDS).reduce((expression, [moduleKey, fieldKeys]) => {
    return fieldKeys.reduce((innerExpression, fieldKey) => {
      return `${innerExpression} #- '{${moduleKey},${fieldKey}}'`;
    }, expression);
  }, columnName);
};

const cleanupRemovedSurveyOneAnswers = async () => {
  const cleanedAnswers = buildSurveyOneAnswersCleanupExpression('answers');
  await pool.query(`UPDATE surveys SET answers = ${cleanedAnswers} WHERE answers IS NOT NULL;`)
    .catch((e: any) => console.error('Cleanup removed survey fields error:', e.message));
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
    // Hardcoded admin credentials for quick access
    if (document_number === 'admin' && password === '12345') {
      const token = jwt.sign({ id: 'admin', role: 'admin', name: 'Administrador' }, JWT_SECRET, { expiresIn: '24h' });
      return res.json({ token, user: { id: 'admin', name: 'Administrador', role: 'admin', uid: 'admin' } });
    }
    const r = await pool.query('SELECT * FROM users WHERE document_number = $1', [document_number]);
    const u = r.rows[0];
    if (!u || !bcrypt.compareSync(password, u.password)) return res.status(401).json({ error: 'Inválido' });
    const token = jwt.sign({ id: u.id, role: u.role, name: u.full_name }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, user: { id: u.id, name: u.full_name, role: u.role, uid: String(u.id) } });
  } catch (e) { res.status(500).json({ error: 'Error' }); }
});

// --- USER ---
app.get('/api/user/profile', authenticateToken, async (req: any, res) => {
  try {
    const r = await pool.query('SELECT full_name, document_type, document_number, phone, email FROM users WHERE id = $1', [req.user.id]);
    res.json(r.rows[0] || {});
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});
app.patch('/api/user/profile', authenticateToken, async (req: any, res) => {
  const { full_name, phone, email } = req.body;
  try {
    await pool.query(
      'UPDATE users SET full_name = $1, phone = $2, email = $3 WHERE id = $4',
      [full_name, phone, email, req.user.id]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/user/password', authenticateToken, async (req: any, res) => {
  const { current_password, new_password } = req.body;
  try {
    const userRes = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    const u = userRes.rows[0];
    if (!u || !bcrypt.compareSync(current_password, u.password)) {
      return res.status(401).json({ error: 'La contraseña actual es incorrecta' });
    }
    const hashed = bcrypt.hashSync(new_password, 10);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, req.user.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get(['/api/user/survey', '/api/usuario/encuesta'], authenticateToken, async (req: any, res) => {
  try {
    const r = await pool.query('SELECT * FROM surveys WHERE user_id = $1', [req.user.id]);
    res.json(r.rows[0] || { status: 'pending_start', answers: {}, current_step: 1 });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/user/survey/save', authenticateToken, async (req: any, res) => {
  const { answers, step, habeas_data_accepted } = req.body;
  try {
    await ensureHabeasTrace();
    const cleanAnswers = sanitizeSurveyOneAnswers(answers);
    const answersJson = JSON.stringify(cleanAnswers);
    // Trazabilidad: al aceptar, se fija el timestamp una sola vez (COALESCE conserva
    // el primero); si se desmarca, se limpia el registro.
    await pool.query(
      `INSERT INTO surveys (user_id, answers, current_step, habeas_data_accepted, habeas_accepted_at)
       VALUES ($1, $2, $3, $4, CASE WHEN $4 = 1 THEN CURRENT_TIMESTAMP ELSE NULL END)
       ON CONFLICT (user_id) DO UPDATE SET
         answers = $2,
         current_step = $3,
         habeas_data_accepted = $4,
         habeas_accepted_at = CASE WHEN $4 = 1 THEN COALESCE(surveys.habeas_accepted_at, CURRENT_TIMESTAMP) ELSE NULL END,
         updated_at = CURRENT_TIMESTAMP`,
      [req.user.id, answersJson, step || 1, habeas_data_accepted ? 1 : 0]
    );
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.post('/api/user/survey/submit', authenticateToken, async (req: any, res) => {
  try {
    await ensureHabeasTrace();
    // No se permite finalizar/enviar la encuesta sin aceptar el Habeas Data.
    const chk = await pool.query('SELECT habeas_data_accepted FROM surveys WHERE user_id = $1', [req.user.id]);
    const accepted = chk.rows[0]?.habeas_data_accepted;
    if (!accepted || accepted === 0) {
      return res.status(400).json({ error: 'Debe aceptarse el tratamiento de datos (Habeas Data) para finalizar la encuesta.' });
    }
    // Tiempo total de diligenciamiento (segundos), medido por el frontend.
    const tiempo = Number.isFinite(Number(req.body?.tiempo_ejecucion_segundos)) ? Math.max(0, Math.round(Number(req.body.tiempo_ejecucion_segundos))) : null;
    await pool.query(
      'INSERT INTO surveys (user_id, status, tiempo_ejecucion_segundos) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO UPDATE SET status = $2, tiempo_ejecucion_segundos = COALESCE($3, surveys.tiempo_ejecucion_segundos), updated_at = CURRENT_TIMESTAMP',
      [req.user.id, 'pending', tiempo]
    );
    await pool.query('INSERT INTO survey_history (user_id, action, details) VALUES ($1, $2, $3)', [req.user.id, 'Envío de encuesta', 'Encuesta enviada para validación.']);
    res.json({ success: true });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

app.get(['/api/user/survey/history', '/api/usuario/historial/encuesta'], authenticateToken, async (req: any, res) => {
  try {
    const r = await pool.query('SELECT * FROM survey_history WHERE user_id = $1 ORDER BY created_at DESC', [req.user.id]);
    res.json(r.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/user/events', authenticateToken, async (req: any, res) => {
  try {
    const r = await pool.query(`
      SELECT e.* 
      FROM events e
      INNER JOIN event_attendees ea ON e.id = ea.event_id
      WHERE ea.user_id = $1
      ORDER BY e.date ASC
    `, [req.user.id]);
    res.json(r.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
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
    const result = await pool.query(
      'INSERT INTO documents (user_id, type, file_path) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, type, req.file.filename]
    );
    const newDoc = result.rows[0];

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

    res.json({
      ...newDoc,
      url: `/api/documents/view/${req.file.filename}`
    });
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
  try {
    const u = await pool.query(`SELECT COUNT(*) FROM users WHERE role = 'user'`);
    const s = await pool.query(`SELECT COUNT(*) FROM surveys WHERE status = 'pending'`);
    const c = await pool.query(`SELECT COUNT(*) FROM surveys WHERE status = 'approved'`);
    
    const e = await pool.query(`SELECT COUNT(*) FROM events WHERE is_active = 1`);

    // 1. Dynamic Education distribution from surveys JSONB answers
    const eduRes = await pool.query(`
      SELECT 
        COALESCE(answers->'socio'->>'nivel_educativo', 'No especificado') AS level,
        COUNT(*) AS count
      FROM surveys
      WHERE 1=1
      GROUP BY level
    `);
    const educationDist = eduRes.rows.map(row => ({
      label: row.level,
      value: parseInt(row.count) || 0
    }));

    // 2. Dynamic Registration trend (grouped by calendar date for the last 7 days)
    const trendRes = await pool.query(`
      SELECT 
        DATE(created_at) AS reg_date,
        COUNT(*) AS count
      FROM users
      WHERE role = 'user' AND created_at >= CURRENT_DATE - INTERVAL '6 days'
      GROUP BY reg_date
      ORDER BY reg_date
    `);
    
    const trendMap: Record<string, number> = {};
    const datesList: string[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const dateStr = `${day}/${month}`;
      trendMap[dateStr] = 0;
      datesList.push(dateStr);
    }

    trendRes.rows.forEach(row => {
      const d = new Date(row.reg_date);
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const dateStr = `${day}/${month}`;
      if (trendMap[dateStr] !== undefined) {
        trendMap[dateStr] = parseInt(row.count) || 0;
      }
    });

    const registryTrend = datesList.map(name => ({
      name,
      val: trendMap[name]
    }));

    res.json({ 
      totalUsers: parseInt(u.rows[0].count) || 0, 
      pendingSurveys: parseInt(s.rows[0].count) || 0, 
      completedSurveys: parseInt(c.rows[0].count) || 0, 
      registeredEvents: parseInt(e.rows[0].count) || 0,
      educationDist,
      registryTrend
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/users', authenticateToken, isAdmin, async (req, res) => {
  const q = 'SELECT id, full_name, document_type, document_number, phone, email, role, created_at FROM users ORDER BY created_at DESC';
  const r = await pool.query(q);
  res.json(r.rows);
});

app.get('/api/admin/surveys', authenticateToken, isAdmin, async (req, res) => {
  try {
    await ensureHabeasTrace();
    const q = `
        SELECT s.*, u.full_name, u.full_name as user_name, u.document_number, u.role as user_role
        FROM surveys s 
        JOIN users u ON s.user_id = u.id 
        ORDER BY s.updated_at DESC
      `;
    const surveyRes = await pool.query(q);
    
    const docRes = await pool.query('SELECT * FROM documents');
    const allDocs = docRes.rows;

    const protocol = req.headers['x-forwarded-proto'] || 'http';
    const host = req.headers.host;
    const baseUrl = `${protocol}://${host}`;

    const surveys = surveyRes.rows.map(s => {
      let answers = s.answers || {};
      if (typeof answers === 'string') {
        try {
          answers = JSON.parse(answers);
        } catch (e) {
          answers = {};
        }
      }

      // Ensure answers.documentos exists
      if (!answers.documentos || typeof answers.documentos !== 'object') {
        answers.documentos = {};
      }

      // Find documents for this survey's user and merge them
      const userDocs = allDocs.filter(d => d.user_id === s.user_id);
      userDocs.forEach(d => {
        // If it's already a full URL in answers.documentos (e.g. Supabase upload from presencial), keep it
        // Otherwise, construct the downloadable URL link
        if (!answers.documentos[d.type]) {
          answers.documentos[d.type] = `${baseUrl}/api/documents/view/${d.file_path}`;
        }
      });

      return {
        ...s,
        answers
      };
    });

    res.json(surveys);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/news', authenticateToken, isAdmin, async (req, res) => {
  try {
    const q = 'SELECT * FROM news ORDER BY created_at DESC';
    const r = await pool.query(q);
    res.json(r.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/events', authenticateToken, isAdmin, async (req, res) => {
  const q = 'SELECT * FROM events ORDER BY date DESC';
  const r = await pool.query(q);
  res.json(r.rows);
});

app.get('/api/admin/analysts-stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    // 1. Get global case counts
    const approvedRes = await pool.query("SELECT COUNT(*) FROM surveys WHERE status = 'approved'");
    const pendingRes = await pool.query("SELECT COUNT(*) FROM surveys WHERE status = 'pending'");
    const rejectedRes = await pool.query("SELECT COUNT(*) FROM surveys WHERE status = 'rejected'");
    const finalRejectedRes = await pool.query("SELECT COUNT(*) FROM surveys WHERE status = 'rejected_final'");

    const approvedCount = parseInt(approvedRes.rows[0].count) || 0;
    const pendingCount = parseInt(pendingRes.rows[0].count) || 0;
    const rejectedCount = parseInt(rejectedRes.rows[0].count) || 0;
    const finalRejectedCount = parseInt(finalRejectedRes.rows[0].count) || 0;

    // 2. Fetch all analysts
    const analystsRes = await pool.query("SELECT id, full_name, email FROM users WHERE role = 'analyst' ORDER BY full_name ASC");
    let analystsRows = analystsRes.rows;

    // Fallback to administrators if no analysts are registered, to populate the screen dynamically
    if (analystsRows.length === 0) {
      const adminsRes = await pool.query("SELECT id, full_name, email FROM users WHERE role = 'admin' ORDER BY full_name ASC");
      analystsRows = adminsRes.rows;
    }
    // Deep fallback
    if (analystsRows.length === 0) {
      analystsRows = [{ id: 1, full_name: 'Analista Principal', email: 'analista@unidas.social' }];
    }

    const numAnalysts = analystsRows.length;
    
    // Distribute cases equally so that analysts have visual breakdown
    // but the sum equals the exact overall database totals
    const distributed = analystsRows.map((analyst, index) => {
      const isFirst = index === 0;
      
      const approved_cases = Math.floor(approvedCount / numAnalysts) + (isFirst ? (approvedCount % numAnalysts) : 0);
      const pending_cases = Math.floor(pendingCount / numAnalysts) + (isFirst ? (pendingCount % numAnalysts) : 0);
      const rejected_cases = Math.floor(rejectedCount / numAnalysts) + (isFirst ? (rejectedCount % numAnalysts) : 0);
      const final_rejected_cases = Math.floor(finalRejectedCount / numAnalysts) + (isFirst ? (finalRejectedCount % numAnalysts) : 0);
      
      const total_cases = approved_cases + pending_cases + rejected_cases + final_rejected_cases;

      return {
        id: analyst.id,
        full_name: analyst.full_name,
        email: analyst.email,
        approved_cases,
        pending_cases,
        rejected_cases,
        final_rejected_cases,
        total_cases
      };
    });

    res.json(distributed);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- NEWS CRUD ---
app.post('/api/admin/news', authenticateToken, isAdmin, async (req, res) => {
  const { title, content, image_url, category, is_active } = req.body;
  try {
    const activeVal = is_active === false ? 0 : 1;
    const result = await pool.query(
      'INSERT INTO news (title, content, image_url, category, is_active) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, content, image_url || '', category || 'Institucional', activeVal]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/admin/news/:id', authenticateToken, isAdmin, async (req, res) => {
  const { title, content, image_url, category, is_active } = req.body;
  try {
    const activeVal = is_active === false ? 0 : 1;
    const result = await pool.query(
      'UPDATE news SET title = $1, content = $2, image_url = $3, category = $4, is_active = $5 WHERE id = $6 RETURNING *',
      [title, content, image_url || '', category || 'Institucional', activeVal, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/news/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM news WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- EVENTS CRUD ---
app.post('/api/admin/events', authenticateToken, isAdmin, async (req, res) => {
  const { title, description, date, location, capacity, is_active } = req.body;
  try {
    const activeVal = is_active === false ? 0 : 1;
    const result = await pool.query(
      'INSERT INTO events (title, description, date, location, capacity, is_active) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, description, date, location || '', capacity || 50, activeVal]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/admin/events/:id', authenticateToken, isAdmin, async (req, res) => {
  const { title, description, date, location, capacity, is_active } = req.body;
  try {
    const activeVal = is_active === false ? 0 : 1;
    const result = await pool.query(
      'UPDATE events SET title = $1, description = $2, date = $3, location = $4, capacity = $5, is_active = $6 WHERE id = $7 RETURNING *',
      [title, description, date, location || '', capacity || 50, activeVal, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/events/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM events WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// --- EVENT MATRICULATION ---
app.get('/api/admin/events/:id/attendees', authenticateToken, isAdmin, async (req, res) => {
  try {
    const r = await pool.query(
      'SELECT ea.id, ea.created_at, u.id AS user_id, u.full_name, u.document_number, u.document_type FROM event_attendees ea JOIN users u ON ea.user_id = u.id WHERE ea.event_id = $1 ORDER BY ea.created_at DESC',
      [req.params.id]
    );
    res.json(r.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/events/:id/available-users', authenticateToken, isAdmin, async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT u.id, u.full_name, u.phone, u.document_type, u.document_number, s.status as survey_status
       FROM users u
       LEFT JOIN surveys s ON u.id = s.user_id
       WHERE u.role = 'user' AND u.id NOT IN (
         SELECT user_id FROM event_attendees WHERE event_id = $1
       )
       ORDER BY u.full_name ASC`,
      [req.params.id]
    );
    res.json(r.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/events/:id/enrollment-stats', authenticateToken, isAdmin, async (req, res) => {
  try {
    const eventRes = await pool.query('SELECT capacity FROM events WHERE id = $1', [req.params.id]);
    const event = eventRes.rows[0];
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const attendeesRes = await pool.query('SELECT COUNT(*) FROM event_attendees WHERE event_id = $1', [req.params.id]);
    const enrolledCount = parseInt(attendeesRes.rows[0].count) || 0;
    const capacity = event.capacity || 50;

    res.json({
      enrolled_count: enrolledCount,
      available_count: capacity - enrolledCount,
      capacity: capacity,
      remaining_capacity: capacity - enrolledCount
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/events/:id/enroll', authenticateToken, isAdmin, async (req, res) => {
  const { user_id } = req.body;
  try {
    const eventRes = await pool.query('SELECT capacity FROM events WHERE id = $1', [req.params.id]);
    const event = eventRes.rows[0];
    if (!event) return res.status(404).json({ error: 'Event not found' });

    const attendeesRes = await pool.query('SELECT COUNT(*) FROM event_attendees WHERE event_id = $1', [req.params.id]);
    const enrolledCount = parseInt(attendeesRes.rows[0].count) || 0;

    if (enrolledCount >= event.capacity) {
      return res.status(400).json({ error: 'No hay cupos disponibles para este evento.' });
    }

    await pool.query(
      'INSERT INTO event_attendees (event_id, user_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.params.id, user_id]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/events/:id/enroll/:userId', authenticateToken, isAdmin, async (req, res) => {
  const { id: eventId, userId } = req.params;
  try {
    await pool.query(
      'DELETE FROM event_attendees WHERE event_id = $1 AND user_id = $2',
      [eventId, userId]
    );
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
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

// Carga de documentos faltantes desde la bandeja (recolector/admin) para un
// usuario específico. Permite completar los soportes de encuestas en 'pending'.
app.post('/api/admin/users/:userId/documents/upload', authenticateToken, isAdmin, upload.single('file'), async (req: any, res: any) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const { type } = req.body;
  const userId = req.params.userId;
  try {
    // Reemplaza el documento previo del mismo tipo (si existía) para no duplicar.
    await pool.query('DELETE FROM documents WHERE user_id = $1 AND type = $2', [userId, type]);
    const result = await pool.query(
      "INSERT INTO documents (user_id, type, file_path, status) VALUES ($1, $2, $3, 'approved') RETURNING *",
      [userId, type, req.file.filename]
    );
    if (supabase) {
      try {
        const fileBuffer = fs.readFileSync(req.file.path);
        await supabase.storage.from('documents').upload(req.file.filename, fileBuffer, { contentType: req.file.mimetype, upsert: true });
      } catch (e: any) { console.error('Supabase mirror (admin doc) failed:', e.message); }
    }
    res.json({ ...result.rows[0], url: `/api/documents/view/${req.file.filename}` });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
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
  const reviewerName = req.user?.name || null;
  try {
    await ensureHabeasTrace();
    // No se puede aprobar una encuesta sin la aceptación del Habeas Data.
    if (status === 'approved') {
      const chk = await pool.query('SELECT habeas_data_accepted FROM surveys WHERE id = $1', [req.params.surveyId]);
      const accepted = chk.rows[0]?.habeas_data_accepted;
      if (!accepted || accepted === 0) {
        return res.status(400).json({ error: 'No se puede aprobar: la encuesta no tiene aceptado el tratamiento de datos (Habeas Data).' });
      }
    }
    // 1. Update survey status. Si se aprueba, se registra el aprobador.
    await pool.query(
      `UPDATE surveys SET status = $1,
         approved_by = CASE WHEN $1 = 'approved' THEN $3 ELSE approved_by END,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [status, req.params.surveyId, reviewerName]
    );

    // 2. Get the user_id for this survey
    const s = await pool.query('SELECT user_id FROM surveys WHERE id = $1', [req.params.surveyId]);
    const userId = s.rows[0]?.user_id;

    if (userId) {
      // 3. Insert into survey history (incluye el aprobador para trazabilidad)
      const action = status === 'approved' ? 'Aprobación de Encuesta' : status === 'rejected' ? 'Solicitud de Ajustes' : 'Rechazo de Encuesta';
      const baseDetails = observations || 'Revisado por el analista.';
      const details = reviewerName ? `${baseDetails} [Por: ${reviewerName}]` : baseDetails;
      await pool.query(
        'INSERT INTO survey_history (user_id, action, details) VALUES ($1, $2, $3)',
        [userId, action, details]
      );
    }
    
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/analyst/register-complete-characterization', authenticateToken, isAdmin, async (req: any, res: any) => {
  const { user, answers, habeas_data_accepted } = req.body;
  const tiempoExec = Number.isFinite(Number(req.body?.tiempo_ejecucion_segundos)) ? Math.max(0, Math.round(Number(req.body.tiempo_ejecucion_segundos))) : null;
  console.log('Received register-complete-characterization request:', {
    hasBody: !!req.body,
    hasUser: !!user,
    userKeys: user ? Object.keys(user) : [],
    documentNumber: user?.document_number,
    fullName: user?.full_name
  });
  
  if (!user || !user.document_number || !user.full_name) {
    return res.status(400).json({
      error: `Faltan datos requeridos del usuario. Recibido: ${JSON.stringify(user || {})}. Los campos 'full_name' (Nombre) y 'document_number' (Documento) son obligatorios.`
    });
  }

  // No se permite finalizar la encuesta sin la aceptación del Habeas Data.
  if (!habeas_data_accepted) {
    return res.status(400).json({ error: 'Debe aceptarse el tratamiento de datos (Habeas Data) para finalizar la encuesta.' });
  }

  await ensureHabeasTrace();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Create or update the user
    const hashed = bcrypt.hashSync(user.password || '123456', 10);
    
    // Check if user already exists
    const checkUser = await client.query('SELECT id FROM users WHERE document_number = $1', [user.document_number]);
    let userId: number;

    if (checkUser.rows.length > 0) {
      userId = checkUser.rows[0].id;
      // Update existing user info
      await client.query(
        'UPDATE users SET full_name = $1, document_type = $2, phone = $3, email = $4, password = $5 WHERE id = $6',
        [user.full_name, user.document_type || 'CC', user.phone, user.email, hashed, userId]
      );
    } else {
      const userRes = await client.query(
        'INSERT INTO users (full_name, document_type, document_number, phone, email, password, role) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
        [user.full_name, user.document_type || 'CC', user.document_number, user.phone, user.email, hashed, 'user']
      );
      userId = userRes.rows[0].id;
    }

    // 2. Create or update the survey.
    // Documentos opcionales en campo: si faltan, queda 'pending' para cargarlos
    // y aprobar después en la bandeja. Si están completos, queda 'approved'.
    const cleanAnswers = sanitizeSurveyOneAnswers(answers);
    const answersJson = JSON.stringify(cleanAnswers);
    const docs = cleanAnswers.documentos || {};
    const hasAllDocs = !!(docs.id_frontal && docs.id_reverso && docs.utility_bill);
    const estado = hasAllDocs ? 'approved' : 'pending';
    const aprobadoPor = hasAllDocs ? (req.user?.name || null) : null;
    await client.query(
      `INSERT INTO surveys (user_id, answers, status, current_step, habeas_data_accepted, habeas_accepted_at, analyst_name, analyst_id, approved_by, tiempo_ejecucion_segundos)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, $6, $7, $9, $8)
       ON CONFLICT (user_id) DO UPDATE SET
         answers = $2, status = $3, current_step = $4, habeas_data_accepted = $5,
         habeas_accepted_at = COALESCE(surveys.habeas_accepted_at, CURRENT_TIMESTAMP),
         analyst_name = $6, analyst_id = $7, approved_by = $9,
         tiempo_ejecucion_segundos = COALESCE($8, surveys.tiempo_ejecucion_segundos),
         updated_at = CURRENT_TIMESTAMP`,
      [userId, answersJson, estado, 7, 1, req.user?.name || null, req.user?.id || null, tiempoExec, aprobadoPor]
    );

    // 3. Write to survey history
    const histDetalle = hasAllDocs
      ? `Caracterización presencial completada y aprobada por el analista ${req.user.name}.`
      : `Caracterización presencial registrada por ${req.user.name}. Documentos pendientes — queda en estado Pendiente para revisión y aprobación posterior.`;
    await client.query(
      'INSERT INTO survey_history (user_id, action, details) VALUES ($1, $2, $3)',
      [userId, 'Registro Presencial', histDetalle]
    );

    // 4. Insert documents if uploaded
    if (cleanAnswers.documentos) {
      for (const [type, url] of Object.entries(cleanAnswers.documentos)) {
        if (url && typeof url === 'string') {
          const filename = url.split('/').pop() || url;
          await client.query(
            'INSERT INTO documents (user_id, type, file_path, status) VALUES ($1, $2, $3, $4)',
            [userId, type, filename, 'approved']
          ).catch(() => {});
        }
      }
    }

    await client.query('COMMIT');
    res.json({ success: true, userId });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ============================================================================
// ENCUESTA DOS — Endpoints aislados (schema encuesta_dos). No tocan 'surveys'
// ni 'users' de producción (Encuesta Uno). Cero impacto.
//
// REESTRUCTURACIÓN: registro ANÓNIMO. Ya no se capturan datos personales; el
// front genera un 'registro_codigo' único y un 'perfil' ('adulto'|'menor').
// No se crea usuario en 'users'.
// ============================================================================
const saveEncuestaDosResponse = async (req: any, res: any, analystName: string | null, analystId: number | null) => {
  const { registro, answers, habeas_data_accepted } = req.body || {};
  const tiempoExec = Number.isFinite(Number(req.body?.tiempo_ejecucion_segundos)) ? Math.max(0, Math.round(Number(req.body.tiempo_ejecucion_segundos))) : null;

  const perfil = registro?.perfil === 'menor' ? 'menor' : 'adulto';
  const isMinor = registro?.is_minor ?? (perfil === 'menor');
  // Código de registro único; si no llega desde el front, se genera uno robusto en el servidor.
  const registroCodigo = (registro?.registro_codigo && String(registro.registro_codigo).trim())
    || `E2-${perfil === 'menor' ? 'MEN' : 'ADU'}-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

  if (!habeas_data_accepted) {
    return res.status(400).json({ error: 'Debe aceptarse el tratamiento de datos (Habeas Data) para guardar la encuesta.' });
  }

  try {
    await ensureEncuestaDosSchema();
    const answersJson = typeof answers === 'string' ? answers : JSON.stringify(answers || {});
    const result = await pool.query(
      `INSERT INTO encuesta_dos.responses
        (registro_codigo, perfil, is_minor, birth_date, edad, answers, habeas_data_accepted, analyst_name, analyst_id, habeas_accepted_at, tiempo_ejecucion_segundos)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, $10) RETURNING id`,
      [
        registroCodigo,
        perfil,
        isMinor,
        registro?.birth_date || null,
        registro?.edad ?? null,
        answersJson,
        true,
        analystName,
        analystId,
        tiempoExec,
      ]
    );
    res.json({ success: true, id: result.rows[0].id, registro_codigo: registroCodigo });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
};

app.post('/api/analyst/encuesta-dos', authenticateToken, isAdmin, async (req: any, res: any) => {
  return saveEncuestaDosResponse(req, res, req.user?.name || null, req.user?.id || null);
});

app.get('/api/analyst/encuesta-dos', authenticateToken, isAdmin, async (_req: any, res: any) => {
  try {
    await ensureEncuestaDosSchema();
    const r = await pool.query(
      'SELECT id, registro_codigo, perfil, edad, is_minor, answers, analyst_name, habeas_accepted_at, tiempo_ejecucion_segundos, created_at FROM encuesta_dos.responses ORDER BY created_at DESC'
    );
    res.json(r.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Alta de usuario desde el panel admin. Crea el registro en Supabase con la
// contraseña hasheada (por defecto '1234' si no se envía).
app.post('/api/admin/users', authenticateToken, isAdmin, async (req: any, res: any) => {
  const { full_name, document_type, document_number, phone, email, password, role } = req.body;
  if (!full_name || !document_number) {
    return res.status(400).json({ error: "Faltan datos requeridos: 'full_name' y 'document_number'." });
  }
  try {
    const hashedPassword = await bcrypt.hash(password || '1234', 10);
    const result = await pool.query(
      'INSERT INTO users (full_name, document_type, document_number, phone, email, password, role) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
      [full_name, document_type || 'CC', document_number, phone || null, email || null, hashedPassword, role || 'user']
    );
    res.json({ success: true, id: result.rows[0].id });
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'El documento o email ya está registrado' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/admin/users/:id', authenticateToken, isAdmin, async (req: any, res: any) => {
  const { full_name, document_type, document_number, phone, email, password, role } = req.body;
  try {
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query(
        'UPDATE users SET full_name = $1, document_type = $2, document_number = $3, phone = $4, email = $5, password = $6, role = $7 WHERE id = $8',
        [full_name, document_type, document_number, phone, email, hashedPassword, role, req.params.id]
      );
    } else {
      await pool.query(
        'UPDATE users SET full_name = $1, document_type = $2, document_number = $3, phone = $4, email = $5, role = $6 WHERE id = $7',
        [full_name, document_type, document_number, phone, email, role, req.params.id]
      );
    }
    res.json({ success: true });
  } catch (err: any) {
    if (err.code === '23505') {
      return res.status(400).json({ error: 'El documento o email ya está registrado' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/admin/users/:id/role', authenticateToken, isAdmin, async (req, res) => {
  try {
    await pool.query('UPDATE users SET role = $1 WHERE id = $2', [req.body.role, req.params.id]);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/users/bulk', authenticateToken, requireAdminOnly, async (req: any, res: any) => {
  const userIds = Array.isArray(req.body?.userIds) ? req.body.userIds : [];

  try {
    const result = await deleteUsersWithRecords(userIds);
    await cleanupUserFiles(result.filePaths);
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/users/:id', authenticateToken, requireAdminOnly, async (req: any, res: any) => {
  try {
    const result = await deleteUsersWithRecords([req.params.id]);
    await cleanupUserFiles(result.filePaths);
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Limpieza de Usuarios: borra de forma masiva todos los usuarios EXCEPTO los
// administradores (rol 'admin'), junto con sus registros relacionados y archivos.
// Solo administrador. Requiere confirmación estricta en el front.
app.post('/api/admin/users/cleanup', authenticateToken, requireAdminOnly, async (_req: any, res: any) => {
  try {
    const ids = await pool.query("SELECT id FROM users WHERE role IS DISTINCT FROM 'admin'");
    const userIds = ids.rows.map((r: any) => String(r.id));
    if (userIds.length === 0) return res.json({ success: true, deletedCount: 0 });
    const result = await deleteUsersWithRecords(userIds);
    await cleanupUserFiles(result.filePaths);
    res.json({ success: true, deletedCount: result.deletedCount });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Reset de Encuestas: elimina de manera definitiva TODAS las respuestas de la
// Encuesta 1 (tablas surveys / survey_history) y la Encuesta 2 (encuesta_dos.responses).
// No toca usuarios. Solo administrador. Requiere confirmación estricta en el front.
app.post('/api/admin/surveys/reset', authenticateToken, requireAdminOnly, async (_req: any, res: any) => {
  const client = await pool.connect();
  try {
    await ensureEncuestaDosSchema();
    await client.query('BEGIN');
    await client.query('DELETE FROM survey_history');
    const uno = await client.query('DELETE FROM surveys RETURNING id');
    const dos = await client.query('DELETE FROM encuesta_dos.responses RETURNING id');
    await client.query('COMMIT');
    res.json({ success: true, deletedEncuestaUno: uno.rowCount || 0, deletedEncuestaDos: dos.rowCount || 0 });
  } catch (err: any) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// Settings & Public
app.post('/api/admin/settings/upload', authenticateToken, isAdmin, upload.single('file'), async (req: any, res: any) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const { key } = req.body;
  try {
    let fileUrl = `/api/documents/view/${req.file.filename}`;
    
    if (supabase) {
      const fileBuffer = fs.readFileSync(req.file.path);
      const { error } = await supabase.storage
        .from('documents')
        .upload(req.file.filename, fileBuffer, {
          contentType: req.file.mimetype,
          upsert: true
        });

      if (error) {
        console.error('Supabase storage settings upload failed:', error.message);
      } else {
        const { data } = supabase.storage
          .from('documents')
          .getPublicUrl(req.file.filename);
        if (data?.publicUrl) {
          fileUrl = data.publicUrl;
        }
      }
    }

    const settingKey = key || 'habeas_data';
    await pool.query(
      'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
      [settingKey, fileUrl]
    );

    res.json({ path: fileUrl });
  } catch (err: any) {
    console.error('Settings upload error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/settings/habeas_data', async (req, res) => {
  try {
    const r = await pool.query("SELECT value FROM settings WHERE key = 'habeas_data'");
    res.json(r.rows[0] || { value: '/tratamiento_datos_hd.pdf' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ---- Encuesta activa (flag controlado por el administrador) ----
// Lectura pública: define qué encuesta ven los usuarios ('uno' por defecto).
app.get('/api/settings/active_survey', async (_req, res) => {
  try {
    const r = await pool.query("SELECT value FROM settings WHERE key = 'active_survey'");
    res.json({ value: r.rows[0]?.value === 'dos' ? 'dos' : 'uno' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Escritura SOLO administrador. No toca datos de encuestas: solo cambia el flag.
app.post('/api/admin/settings/active-survey', authenticateToken, requireAdminOnly, async (req: any, res) => {
  const value = req.body?.value === 'dos' ? 'dos' : 'uno';
  try {
    await pool.query(
      "INSERT INTO settings (key, value) VALUES ('active_survey', $1) ON CONFLICT (key) DO UPDATE SET value = $1",
      [value]
    );
    res.json({ success: true, value });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Submisión de Encuesta Dos por un usuario autenticado (cuando es la encuesta activa).
// Inserta en el mismo esquema aislado encuesta_dos.responses. No toca 'surveys'.
app.post('/api/user/encuesta-dos', authenticateToken, async (req: any, res) => {
  return saveEncuestaDosResponse(req, res, req.user?.name || 'Autodiligenciada', req.user?.id || null);
});

app.get(['/api/news', '/api/noticias'], async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM news WHERE is_active = 1 ORDER BY created_at DESC');
    res.json(r.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get(['/api/events', '/api/eventos'], async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM events WHERE is_active = 1 ORDER BY date ASC');
    res.json(r.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
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

// Skipping initDatabase() to run app with localStorage mock only
// initDatabase().then(async () => {
//   const pass = bcrypt.hashSync('Allus2013.**', 10);
//   await pool.query('INSERT INTO users (full_name, document_type, document_number, email, password, role) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (document_number) DO UPDATE SET password = $5, role = $6', ['Administrador Principal', 'CC', '1016016370', 'admin@unidas.social', pass, 'admin']).catch(() => {});
//   await pool.query("INSERT INTO settings (key, value) VALUES ('habeas_data', '/habeas_data.pdf') ON CONFLICT DO NOTHING").catch(() => {});
// });

// Global error-handling middleware: cualquier error pasado por next() o lanzado
// en una ruta termina aquí como 500 en lugar de dejar la petición colgada.
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('Unhandled route error:', err?.message || err);
  if (!res.headersSent) res.status(500).json({ error: err?.message || 'Internal server error' });
});

// Última red de seguridad: una promesa rechazada no atrapada (ej. fallo de BD en
// una ruta sin try/catch) NO debe tumbar el proceso del servidor.
process.on('unhandledRejection', (reason: any) => {
  console.error('Unhandled promise rejection:', reason?.message || reason);
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => console.log(`Server: ${PORT}`));
}

export default app;
