import express from 'express';
// Dynamic import for vite later
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

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const JWT_SECRET = process.env.JWT_SECRET || 'unidas-secret-key-123';
const PORT = 3000;

// Initialize PostgreSQL Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// Database Schema Initialization
const initDatabase = async () => {
  console.log('Initializing database schema...');
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

      CREATE TABLE IF NOT EXISTS survey_history (
        id SERIAL PRIMARY KEY,
        survey_id INTEGER REFERENCES surveys(id),
        user_id INTEGER REFERENCES users(id),
        action TEXT NOT NULL,
        details TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        survey_id INTEGER REFERENCES surveys(id),
        analyst_id INTEGER REFERENCES users(id),
        status TEXT NOT NULL,
        observations TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Database schema checked/created successfully.');
  } catch (err) {
    console.error('Error initializing database schema:', err);
    throw err;
  }
};

// Seed initial users if not exists
const seedUser = async (fullName: string, doc: string, email: string, pass: string, role: string) => {
  const hashedPassword = bcrypt.hashSync(pass, 10);
  try {
    const res = await pool.query('SELECT id FROM users WHERE document_number = $1 OR email = $2', [doc, email]);
    if (res.rows.length === 0) {
      await pool.query(
        'INSERT INTO users (full_name, document_type, document_number, phone, email, password, role) VALUES ($1, $2, $3, $4, $5, $6, $7)',
        [fullName, 'CC', doc, '3000000000', email, hashedPassword, role]
      );
    } else {
      await pool.query('UPDATE users SET password = $1, role = $2 WHERE id = $3', [hashedPassword, role, res.rows[0].id]);
    }
  } catch (err) {
    console.error('Error seeding user:', err);
  }
};

const runSeeds = async () => {
  console.log('Running seeds...');
  await seedUser('Administrador Principal', '12345678', 'admin@unidas.social', '1234', 'admin');
  await seedUser('Analista de Pruebas', '987654321', 'analista@unidas.social', '1234', 'analyst');
  await seedUser('Usuario Ciudadano', '1013608140', 'ciudadano@unidas.social', '1234', 'user');

  // Seed Initial News
  console.log('Seeding news...');
  const newsRes = await pool.query('SELECT COUNT(*) as count FROM news');
  const newsCount = parseInt(newsRes.rows[0].count);
  if (newsCount === 0) {
    await pool.query('INSERT INTO news (title, content, image_url, category) VALUES ($1, $2, $3, $4)',
      ['Inauguración del Centro de Cuidado UNIDAS', 'Un nuevo espacio dedicado al bienestar emocional y físico de nuestras cuidadoras.', 'https://images.unsplash.com/photo-1544027993-37dbfe43562a?q=80&w=800&auto=format&fit=crop', 'Institucional']);
    await pool.query('INSERT INTO news (title, content, image_url, category) VALUES ($1, $2, $3, $4)',
      ['Jornada de Vacunación Prioritaria', 'Mañana desde las 8:00 AM en el polideportivo local.', 'https://images.unsplash.com/photo-1576091160550-217359f42f8c?q=80&w=800&auto=format&fit=crop', 'Salud']);
  }

  // Seed Initial Events
  console.log('Seeding events...');
  const eventsRes = await pool.query('SELECT COUNT(*) as count FROM events');
  const eventCount = parseInt(eventsRes.rows[0].count);
  if (eventCount === 0) {
    await pool.query('INSERT INTO events (title, description, date, location) VALUES ($1, $2, $3, $4)',
      ['Taller de Respiro y Yoga', 'Sesión de relajación guiada para cuidadoras.', '2024-06-15 09:00:00', 'Casa del Cuidado']);
    await pool.query('INSERT INTO events (title, description, date, location) VALUES ($1, $2, $3, $4)',
      ['Brigada Jurídica', 'Asesoría legal gratuita en temas de familia.', '2024-06-20 14:00:00', 'Alcaldía Local']);
  }
  console.log('Seeds finished.');
};

const runServerInit = async () => {
  try {
    await initDatabase();
    await runSeeds();
  } catch (err) {
    console.error('CRITICAL ERROR DURING INITIALIZATION:', err);
  }
};

runServerInit();

const app = express();
export default app;

async function startServer() {
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

  // Password Validation Function
  const validatePassword = (password: string): { valid: boolean; error?: string } => {
    if (!password) return { valid: false, error: 'La contraseña es requerida' };
    if (password.length < 4) return { valid: false, error: 'La contraseña debe tener mínimo 4 caracteres' };
    if (password.length > 12) return { valid: false, error: 'La contraseña debe tener máximo 12 caracteres' };
    return { valid: true };
  };

  // Analyst: Register complete user and survey (Face-to-face assistance)
  app.post('/api/analyst/register-complete-characterization', authenticateToken, async (req: any, res) => {
    console.log('[API] Analyst registration request received');
    if (req.user.role !== 'analyst' && req.user.role !== 'admin') {
      console.warn('[API] Unauthorized access attempt by:', req.user.role);
      return res.sendStatus(403);
    }
    
    const { user: userData, answers } = req.body;
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // 1. Create User
      const hashedPassword = bcrypt.hashSync(userData.password || '1234', 10);
      const userResult = await client.query(
        'INSERT INTO users (full_name, document_type, document_number, phone, email, password, role) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
        [userData.full_name, userData.document_type || 'CC', userData.document_number, userData.phone, userData.email, hashedPassword, 'user']
      );
      const newUserId = userResult.rows[0].id;
      
      // 2. Create Approved Survey
      const surveyResult = await client.query(
        'INSERT INTO surveys (user_id, answers, status, updated_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING id',
        [newUserId, JSON.stringify(answers), 'approved']
      );
      const newSurveyId = surveyResult.rows[0].id;
      
      // 3. Log History
      await client.query(
        'INSERT INTO survey_history (survey_id, user_id, action, details) VALUES ($1, $2, $3, $4)',
        [newSurveyId, newUserId, 'Caracterización Presencial', `Registrada por analista: ${req.user.name}`]
      );
      
      // 4. Create Review record
      await client.query(
        'INSERT INTO reviews (survey_id, analyst_id, status, observations) VALUES ($1, $2, $3, $4)',
        [newSurveyId, req.user.id, 'approved', 'Caracterización realizada de forma presencial por analista.']
      );
      
      await client.query('COMMIT');
      console.log('[API] Registration successful for:', userData.document_number);
      res.json({ success: true, userId: newUserId });
    } catch (err: any) {
      await client.query('ROLLBACK');
      console.error('[API] Error during analyst registration:', err);
      if (err.code === '23505') {
        res.status(400).json({ error: 'El documento o correo ya se encuentra registrado' });
      } else {
        res.status(500).json({ error: err.message });
      }
    } finally {
      client.release();
    }
  });



  // Auth Routes
  app.post('/api/auth/register', async (req, res) => {
    const { full_name, document_type, document_number, phone, email, password } = req.body;
    try {
      // Validate password
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        return res.status(400).json({ error: passwordValidation.error });
      }

      const hashedPassword = bcrypt.hashSync(password, 10);
      const result = await pool.query(
        'INSERT INTO users (full_name, document_type, document_number, phone, email, password) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
        [full_name, document_type, document_number, phone, email, hashedPassword]
      );
      res.json({ id: result.rows[0].id });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { document_number, password } = req.body;
    try {
      const result = await pool.query('SELECT * FROM users WHERE document_number = $1', [document_number]);
      const user = result.rows[0];
      if (!user || !bcrypt.compareSync(password, user.password)) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }
      const token = jwt.sign({ id: user.id, role: user.role, name: user.full_name }, JWT_SECRET, { expiresIn: '8h' });
      res.json({ token, user: { id: user.id, name: user.full_name, role: user.role } });
    } catch (err: any) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  app.get('/api/auth/me', authenticateToken, async (req: any, res) => {
    const result = await pool.query('SELECT id, full_name as name, role FROM users WHERE id = $1', [req.user.id]);
    res.json(result.rows[0]);
  });

  // News Routes
  app.get('/api/news', async (req, res) => {
    const result = await pool.query('SELECT * FROM news WHERE is_active = 1 ORDER BY created_at DESC');
    res.json(result.rows);
  });

  app.get('/api/admin/news', authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const result = await pool.query('SELECT * FROM news ORDER BY created_at DESC');
    res.json(result.rows);
  });

  app.post('/api/admin/news', authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { title, content, image_url, category } = req.body;
    const result = await pool.query(
      'INSERT INTO news (title, content, image_url, category) VALUES ($1, $2, $3, $4) RETURNING id',
      [title, content, image_url, category]
    );
    res.json({ id: result.rows[0].id });
  });

  app.patch('/api/admin/news/:id', authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { title, content, image_url, category, is_active } = req.body;
    await pool.query(
      'UPDATE news SET title = $1, content = $2, image_url = $3, category = $4, is_active = $5 WHERE id = $6',
      [title, content, image_url, category, is_active ? 1 : 0, req.params.id]
    );
    res.json({ success: true });
  });

  app.delete('/api/admin/news/:id', authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    await pool.query('DELETE FROM news WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  });

  // Events Routes
  app.get('/api/events', async (req, res) => {
    const result = await pool.query('SELECT * FROM events WHERE is_active = 1 ORDER BY date ASC');
    res.json(result.rows);
  });

  app.get('/api/admin/events', authenticateToken, async (req: any, res) => {
    if (req.user.role === 'user') return res.sendStatus(403);
    const result = await pool.query('SELECT * FROM events ORDER BY date ASC');
    res.json(result.rows);
  });

  app.post('/api/admin/events', authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { title, description, date, location, capacity } = req.body;
    const result = await pool.query(
      'INSERT INTO events (title, description, date, location, capacity) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [title, description, date, location, capacity || 50]
    );
    res.json({ id: result.rows[0].id });
  });

  app.patch('/api/admin/events/:id', authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { title, description, date, location, capacity, is_active } = req.body;
    await pool.query(
      'UPDATE events SET title = $1, description = $2, date = $3, location = $4, capacity = $5, is_active = $6 WHERE id = $7',
      [title, description, date, location, capacity, is_active ? 1 : 0, req.params.id]
    );
    res.json({ success: true });
  });

  app.delete('/api/admin/events/:id', authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM event_enrollments WHERE event_id = $1', [req.params.id]);
      await client.query('DELETE FROM events WHERE id = $1', [req.params.id]);
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
    res.json({ success: true });
  });

  // Event Enrollments
  app.post('/api/admin/events/:id/enroll', authenticateToken, async (req: any, res) => {
    if (req.user.role === 'user') return res.sendStatus(403);
    const { user_id } = req.body;
    const event_id = req.params.id;
    
    // Check if already enrolled
    const existing = await pool.query('SELECT id FROM event_enrollments WHERE user_id = $1 AND event_id = $2', [user_id, event_id]);
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Usuario ya matriculado en este evento' });

    await pool.query('INSERT INTO event_enrollments (user_id, event_id) VALUES ($1, $2)', [user_id, event_id]);
    res.json({ success: true });
  });

  app.get('/api/admin/events/:id/attendees', authenticateToken, async (req: any, res) => {
    if (req.user.role === 'user') return res.sendStatus(403);
    const result = await pool.query(`
      SELECT ee.id, ee.created_at, u.id as user_id, u.full_name, u.document_number, u.email
      FROM event_enrollments ee
      JOIN users u ON ee.user_id = u.id
      WHERE ee.event_id = $1
      ORDER BY ee.created_at DESC
    `, [req.params.id]);
    res.json(result.rows);
  });

  // Get available users for enrollment (not yet enrolled in event)
  app.get('/api/admin/events/:id/available-users', authenticateToken, async (req: any, res) => {
    if (req.user.role === 'user') return res.sendStatus(403);
    const eventId = req.params.id;
    
    const result = await pool.query(`
      SELECT u.id, u.full_name, u.document_type, u.document_number, u.email, u.phone, u.created_at
      FROM users u
      WHERE u.role = 'user' AND u.id NOT IN (
        SELECT user_id FROM event_enrollments WHERE event_id = $1
      )
      ORDER BY u.full_name ASC
    `, [eventId]);
    
    res.json(result.rows);
  });

  // Get enrollment statistics for an event
  app.get('/api/admin/events/:id/enrollment-stats', authenticateToken, async (req: any, res) => {
    if (req.user.role === 'user') return res.sendStatus(403);
    const eventId = req.params.id;
    
    const eventRes = await pool.query('SELECT * FROM events WHERE id = $1', [eventId]);
    const event = eventRes.rows[0];
    const enrolledRes = await pool.query('SELECT COUNT(*) as count FROM event_enrollments WHERE event_id = $1', [eventId]);
    const enrolled = parseInt(enrolledRes.rows[0].count);
    const availableRes = await pool.query(`
      SELECT COUNT(*) as count FROM users WHERE role = 'user' AND id NOT IN (
        SELECT user_id FROM event_enrollments WHERE event_id = $1
      )
    `, [eventId]);
    const available = parseInt(availableRes.rows[0].count);
    
    res.json({
      event_id: eventId,
      event_title: event?.title,
      enrolled_count: enrolled,
      available_count: available,
      capacity: event?.capacity,
      remaining_capacity: (event?.capacity || 0) - enrolled
    });
  });

  // Stats Routes
  app.get('/api/stats', async (req, res) => {
    try {
      const totalUsersRes = await pool.query("SELECT COUNT(*) as count FROM users WHERE role = 'user'");
      const totalUsers = parseInt(totalUsersRes.rows[0].count) || 0;
      const completedSurveysRes = await pool.query("SELECT COUNT(*) as count FROM surveys WHERE status = 'approved'");
      const completedSurveys = parseInt(completedSurveysRes.rows[0].count) || 0;
      const pendingSurveysRes = await pool.query("SELECT COUNT(*) as count FROM surveys WHERE status = 'pending'");
      const pendingSurveys = parseInt(pendingSurveysRes.rows[0].count) || 0;
      const registeredEventsRes = await pool.query('SELECT COUNT(*) as count FROM events WHERE is_active = 1');
      const registeredEvents = parseInt(registeredEventsRes.rows[0].count) || 0;
      
      const educationDistRes = await pool.query(`
        SELECT answer as label, COUNT(*) as value 
        FROM survey_answers 
        WHERE question = 'nivel_educativo' 
        GROUP BY answer
      `);
      const educationDist = educationDistRes.rows || [];

      res.json({
        totalUsers,
        completedSurveys,
        pendingSurveys,
        registeredEvents,
        educationDist
      });
    } catch (err) {
      console.error('Stats error:', err);
      res.status(500).json({ error: 'Error al cargar estadísticas' });
    }
  });

  // Survey Routes
  app.get('/api/user/survey', authenticateToken, async (req: any, res) => {
    let surveyRes = await pool.query('SELECT * FROM surveys WHERE user_id = $1', [req.user.id]);
    let survey = surveyRes.rows[0];
    if (!survey) {
      const result = await pool.query('INSERT INTO surveys (user_id) VALUES ($1) RETURNING *', [req.user.id]);
      survey = result.rows[0];
    }
    const answersRes = await pool.query('SELECT module, question, answer FROM survey_answers WHERE survey_id = $1', [survey.id]);
    res.json({ ...survey, answers: answersRes.rows });
  });

  app.post('/api/user/survey/save', authenticateToken, async (req: any, res) => {
    const { answers, step, habeas_data_accepted } = req.body;
    let surveyRes = await pool.query('SELECT id, status FROM surveys WHERE user_id = $1', [req.user.id]);
    let survey = surveyRes.rows[0];
    
    if (!survey) {
      const result = await pool.query('INSERT INTO surveys (user_id) VALUES ($1) RETURNING id, status', [req.user.id]);
      survey = result.rows[0];
    }

    if (survey.status === 'pending' || survey.status === 'approved' || survey.status === 'rejected_final') {
      return res.status(403).json({ error: 'Encuesta bloqueada en su estado actual' });
    }

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Update survey metadata
      await client.query('UPDATE surveys SET current_step = $1, habeas_data_accepted = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
        [step, habeas_data_accepted ? 1 : 0, survey.id]);

      // Upsert answers
      if (answers) {
        for (const [module, moduleAnswers] of Object.entries(answers as any)) {
          for (const [question, answer] of Object.entries(moduleAnswers as any)) {
            const existing = await client.query('SELECT id FROM survey_answers WHERE survey_id = $1 AND module = $2 AND question = $3',
              [survey.id, module, question]);
            if (existing.rows.length > 0) {
              await client.query('UPDATE survey_answers SET answer = $1 WHERE id = $2',
                [String(answer), existing.rows[0].id]);
            } else {
              await client.query('INSERT INTO survey_answers (survey_id, module, question, answer) VALUES ($1, $2, $3, $4)',
                [survey.id, module, question, String(answer)]);
            }
          }
        }
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
    
    res.json({ success: true });
  });

  app.post('/api/user/survey/submit', authenticateToken, async (req: any, res) => {
    let surveyRes = await pool.query('SELECT id, status FROM surveys WHERE user_id = $1', [req.user.id]);
    let survey = surveyRes.rows[0];
    if (!survey) {
      const result = await pool.query('INSERT INTO surveys (user_id) VALUES ($1) RETURNING id, status', [req.user.id]);
      survey = result.rows[0];
    }

    if (survey.status === 'pending') {
      return res.status(400).json({ error: 'Ya existe una encuesta pendiente de revisión' });
    }
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query("UPDATE surveys SET status = 'pending', updated_at = CURRENT_TIMESTAMP WHERE id = $1", [survey.id]);
      await client.query('INSERT INTO history (survey_id, user_id, action, details) VALUES ($1, $2, $3, $4)',
        [survey.id, req.user.id, 'Envío de encuesta', 'La usuaria ha enviado la encuesta para validación.']);
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    res.json({ success: true });
  });

  // Admin/Analyst: List Surveys
  app.get('/api/admin/surveys', authenticateToken, async (req: any, res) => {
    if (req.user.role === 'user') return res.sendStatus(403);
    const result = await pool.query(`
      SELECT s.*, u.full_name as user_name, u.document_number 
      FROM surveys s 
      JOIN users u ON s.user_id = u.id 
      ORDER BY s.updated_at DESC
    `);
    res.json(result.rows);
  });

  // Admin/Analyst: Review Survey
  app.post('/api/admin/surveys/:id/review', authenticateToken, async (req: any, res) => {
    if (req.user.role === 'user') return res.sendStatus(403);
    const { status, observations } = req.body;
    const surveyId = req.params.id;
    
    const statusMap: any = {
      'approved': 'Aprobada',
      'rejected': 'Devuelta para ajustes',
      'rejected_final': 'Rechazada definitivamente',
      'pending': 'Pendiente'
    };

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Create review record
      await client.query('INSERT INTO reviews (survey_id, analyst_id, status, observations) VALUES ($1, $2, $3, $4)',
        [surveyId, req.user.id, status, observations]);
      
      // Update survey status
      await client.query('UPDATE surveys SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [status, surveyId]);

      // Log to history
      await client.query('INSERT INTO history (survey_id, user_id, action, details) VALUES ($1, $2, $3, $4)',
        [surveyId, req.user.id, `Cambio de estado: ${statusMap[status] || status}`, observations || 'Sin observaciones adicionales.']);

      // Create notification for user
      const surveyRes = await client.query('SELECT user_id FROM surveys WHERE id = $1', [surveyId]);
      const survey = surveyRes.rows[0];
      await client.query('INSERT INTO notifications (user_id, title, message) VALUES ($1, $2, $3)',
        [survey.user_id, `Actualización de tu Caracterización`, `Tu encuesta ha sido marcada como: ${statusMap[status] || status}. Observaciones: ${observations || 'Ninguna'}`]);
      
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    res.json({ success: true });
  });

  // Admin: Update User Data and Password
  app.patch('/api/admin/users/:id', authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { full_name, document_type, document_number, phone, email, password, role } = req.body;
    try {
      if (password) {
        // Validate password
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
          return res.status(400).json({ error: passwordValidation.error });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);
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
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: Create User directly
  app.post('/api/admin/users', authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { full_name, document_type, document_number, phone, email, password, role } = req.body;
    try {
      const hashedPassword = bcrypt.hashSync(password || '1234', 10);
      const result = await pool.query(
        'INSERT INTO users (full_name, document_type, document_number, phone, email, password, role) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
        [full_name, document_type, document_number, phone, email, hashedPassword, role || 'user']
      );
      res.json({ id: result.rows[0].id });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  // Admin: Global Stats (Enhanced)
  app.get('/api/admin/detailed-stats', authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    // Add more detailed queries for admin if needed
    res.json({ status: 'ok' });
  });

  // Admin: Get Analysts with Case Statistics
  app.get('/api/admin/analysts-stats', authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    try {
      const result = await pool.query(`
        SELECT u.id, u.full_name, u.email, u.document_number, u.created_at,
          COUNT(CASE WHEN r.status = 'approved' THEN 1 END) as approved_cases,
          COUNT(CASE WHEN r.status = 'pending' THEN 1 END) as pending_cases,
          COUNT(CASE WHEN r.status = 'rejected' THEN 1 END) as rejected_cases,
          COUNT(CASE WHEN r.status = 'rejected_final' THEN 1 END) as final_rejected_cases,
          COUNT(r.id) as total_cases
        FROM users u
        LEFT JOIN reviews r ON u.id = r.analyst_id
        WHERE u.role = 'analyst'
        GROUP BY u.id
        ORDER BY u.full_name ASC
      `);
      res.json(result.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: Update Survey Answers for any user
  app.post('/api/admin/survey/answers', authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { surveyId, answers } = req.body;
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      if (answers) {
        for (const [module, moduleAnswers] of Object.entries(answers as any)) {
          for (const [question, answer] of Object.entries(moduleAnswers as any)) {
            const existing = await client.query('SELECT id FROM survey_answers WHERE survey_id = $1 AND module = $2 AND question = $3',
              [surveyId, module, question]);
            if (existing.rows.length > 0) {
              await client.query('UPDATE survey_answers SET answer = $1 WHERE id = $2',
                [String(answer), existing.rows[0].id]);
            } else {
              await client.query('INSERT INTO survey_answers (survey_id, module, question, answer) VALUES ($1, $2, $3, $4)',
                [surveyId, module, question, String(answer)]);
            }
          }
        }
      }
      await client.query('COMMIT');
      res.json({ success: true });
    } catch (err: any) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  });

  // Admin/Analyst: List All Users
  app.get('/api/admin/users', authenticateToken, async (req: any, res) => {
    if (req.user.role === 'user') return res.sendStatus(403);
    try {
      const result = await pool.query(`
        SELECT u.id, u.full_name, u.document_type, u.document_number, u.phone, u.email, u.role, u.created_at, s.status as survey_status
        FROM users u
        LEFT JOIN surveys s ON u.id = s.user_id
        ORDER BY u.created_at DESC
      `);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: 'Error al obtener usuarios' });
    }
  });



  // Admin/Analyst: Get Survey Details
  app.get('/api/admin/users/:id/survey', authenticateToken, async (req: any, res) => {
    if (req.user.role === 'user') return res.sendStatus(403);
    try {
      const surveyRes = await pool.query('SELECT * FROM surveys WHERE user_id = $1', [req.params.id]);
      const survey = surveyRes.rows[0];
      if (!survey) return res.status(404).json({ error: 'Encuesta no encontrada' });
      const answersRes = await pool.query('SELECT module, question, answer FROM survey_answers WHERE survey_id = $1', [survey.id]);
      res.json({ ...survey, answers: answersRes.rows });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: Update User Role
  app.patch('/api/admin/users/:id/role', authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const { role } = req.body;
    try {
      await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, req.params.id]);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Error al actualizar rol' });
    }
  });

  // Admin: Delete User
  app.delete('/api/admin/users/:id', authenticateToken, async (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const userId = req.params.id;
      // Delete related data first to maintain integrity
      await client.query('DELETE FROM survey_answers WHERE survey_id IN (SELECT id FROM surveys WHERE user_id = $1)', [userId]);
      await client.query('DELETE FROM reviews WHERE survey_id IN (SELECT id FROM surveys WHERE user_id = $1)', [userId]);
      await client.query('DELETE FROM surveys WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM event_enrollments WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM notifications WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM documents WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM users WHERE id = $1', [userId]);
      await client.query('COMMIT');
      res.json({ success: true });
    } catch (err) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: 'Error al eliminar usuario' });
    } finally {
      client.release();
    }
  });

  // Document Upload Routes
  app.post('/api/user/documents', authenticateToken, upload.single('file'), async (req: any, res) => {
    if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });
    const { type } = req.body;
    const userId = req.user.id;

    // Check survey status to lock documents
    const surveyRes = await pool.query('SELECT status FROM surveys WHERE user_id = $1', [userId]);
    const survey = surveyRes.rows[0];
    if (survey && (survey.status === 'pending' || survey.status === 'approved' || survey.status === 'rejected_final')) {
      return res.status(403).json({ error: 'No se pueden modificar documentos en el estado actual' });
    }
    
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('INSERT INTO documents (user_id, type, file_path) VALUES ($1, $2, $3)',
        [userId, type, req.file.path]);
      
      const surveyRes = await client.query('SELECT id FROM surveys WHERE user_id = $1', [userId]);
      if (surveyRes.rows.length > 0) {
        await client.query('INSERT INTO history (survey_id, user_id, action, details) VALUES ($1, $2, $3, $4)',
          [surveyRes.rows[0].id, userId, 'Carga de documento', `Se ha cargado el documento: ${type}`]);
      }
      await client.query('COMMIT');
      res.json({ id: 0, path: req.file.path });
    } catch (err: any) {
      await client.query('ROLLBACK');
      res.status(500).json({ error: err.message });
    } finally {
      client.release();
    }
  });

  app.get('/api/user/documents', authenticateToken, async (req: any, res) => {
    try {
      const result = await pool.query('SELECT type, status, file_path FROM documents WHERE user_id = $1', [req.user.id]);
      res.json(result.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/admin/users/:userId/documents', authenticateToken, async (req: any, res) => {
    if (req.user.role === 'user') return res.sendStatus(403);
    try {
      const result = await pool.query('SELECT type, status, file_path FROM documents WHERE user_id = $1', [req.params.userId]);
      res.json(result.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get Survey History
  app.get('/api/admin/surveys/:id/history', authenticateToken, async (req: any, res) => {
    if (req.user.role === 'user') return res.sendStatus(403);
    try {
      const result = await pool.query(`
        SELECT h.*, u.full_name as user_name
        FROM history h
        JOIN users u ON h.user_id = u.id
        WHERE h.survey_id = $1
        ORDER BY h.created_at DESC
      `, [req.params.id]);
      res.json(result.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/user/survey/history', authenticateToken, async (req: any, res) => {
    try {
      const surveyRes = await pool.query('SELECT id FROM surveys WHERE user_id = $1', [req.user.id]);
      if (surveyRes.rows.length === 0) return res.json([]);
      
      const result = await pool.query(`
        SELECT h.*, u.full_name as user_name
        FROM history h
        JOIN users u ON h.user_id = u.id
        WHERE h.survey_id = $1
        ORDER BY h.created_at DESC
      `, [surveyRes.rows[0].id]);
      res.json(result.rows);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Settings Routes
  app.get('/api/settings/:key', async (req, res) => {
    const result = await pool.query('SELECT value FROM settings WHERE key = $1', [req.params.key]);
    res.json(result.rows[0] || { value: null });
  });

  app.post('/api/admin/settings/upload', authenticateToken, upload.single('file'), async (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    if (!req.file) return res.status(400).json({ error: 'No se subió ningún archivo' });
    const { key } = req.body;
    
    await pool.query('INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
      [key, req.file.path]);
    
    res.json({ path: req.file.path });
  });

  // Export Survey Questions as Excel
  app.get('/api/survey/export-questions', authenticateToken, async (req: any, res) => {
    if (req.user.role === 'user') return res.sendStatus(403);
    
    try {
      const XLSX = require('xlsx');
      
      const surveyQuestions = [
        { '#': 1, 'Módulo': 'Perfil Sociodemográfico', 'Pregunta': 'FECHA DE NACIMIENTO', 'Descripción': 'Ingresa el día, mes y año de tu nacimiento.', 'Tipo': 'date', 'Opciones': '-', 'Requerido': 'Sí', 'Campo': 'socio.fecha_nacimiento' },
        { '#': 2, 'Módulo': 'Perfil Sociodemográfico', 'Pregunta': 'GÉNERO', 'Descripción': 'Identidad de género con la que te identificas.', 'Tipo': 'select', 'Opciones': 'Mujer Cisgénero; Mujer Transgénero; No binaria; Otro', 'Requerido': 'Sí', 'Campo': 'socio.genero' },
        { '#': 3, 'Módulo': 'Perfil Sociodemográfico', 'Pregunta': 'BARRIO', 'Descripción': 'Selecciona tu barrio de residencia.', 'Tipo': 'select', 'Opciones': 'La Castellana; Rionegro; La Patria; El Andes; Los Andes; Doce de Octubre; San Fernando; San Jorge; Jorge Eliécer Gaitán; Benjamín Herrera; Las Ferias; Bonanza; Palo Blanco; El Laurel; Bellavista Occidental; Simón Bolívar; Alcázares; Baquero; Concepción Norte; Santa Sofía', 'Requerido': 'Sí', 'Campo': 'socio.barrio' },
        { '#': 4, 'Módulo': 'Perfil Sociodemográfico', 'Pregunta': 'ZONA (UPL)', 'Descripción': 'Zona geográfica detectada automáticamente.', 'Tipo': 'select', 'Opciones': '-', 'Requerido': 'Sí', 'Campo': 'socio.upz' },
        { '#': 5, 'Módulo': 'Perfil Sociodemográfico', 'Pregunta': 'NIVEL EDUCATIVO', 'Descripción': 'Máximo grado de escolaridad alcanzado.', 'Tipo': 'select', 'Opciones': 'Primaria Incompleta; Primaria Completa; Secundaria Incompleta; Secundaria Completa; Técnico; Tecnólogo; Universitario; Postgrado', 'Requerido': 'Sí', 'Campo': 'socio.nivel_educativo' },
        { '#': 6, 'Módulo': 'Perfil Sociodemográfico', 'Pregunta': 'PERTENENCIA POBLACIONAL', 'Descripción': 'Selección múltiple. ¿Con qué grupos te identificas?', 'Tipo': 'checkbox', 'Opciones': 'Indígena; Afrocolombiana; Raizal; Palenquera; LGBTIQ+; Víctima del conflicto; Migrante; Ninguno de los anteriores', 'Requerido': 'No', 'Campo': 'socio.pertenencia_poblacional' },
        { '#': 7, 'Módulo': 'Economía y Autonomía', 'Pregunta': 'INGRESOS MENSUALES', 'Descripción': 'Ingresa tu ingreso mensual aproximado en pesos.', 'Tipo': 'number', 'Opciones': '-', 'Requerido': 'Sí', 'Campo': 'economia.ingresos' },
        { '#': 8, 'Módulo': 'Economía y Autonomía', 'Pregunta': 'FUENTE PRINCIPAL DE INGRESOS', 'Descripción': 'Selecciona tu principal fuente de ingresos.', 'Tipo': 'select', 'Opciones': 'Trabajo dependiente; Trabajo independiente; Negocio propio; Pensión; Renta o alquiler; Ayuda familiar; Subsidio gubernamental; No tengo ingresos', 'Requerido': 'Sí', 'Campo': 'economia.fuente_ingresos' },
        { '#': 9, 'Módulo': 'Economía y Autonomía', 'Pregunta': 'SITUACIÓN LABORAL', 'Descripción': 'Describe tu situación actual de empleo.', 'Tipo': 'select', 'Opciones': 'Empleada tiempo completo; Empleada tiempo parcial; Desempleada; Trabajadora por cuenta propia; Estudiante; Hogar', 'Requerido': 'Sí', 'Campo': 'economia.situacion_laboral' },
        { '#': 10, 'Módulo': 'Economía y Autonomía', 'Pregunta': 'TIPO DE VIVIENDA', 'Descripción': 'Selecciona el tipo de vivienda donde resides.', 'Tipo': 'select', 'Opciones': 'Casa propia; Apartamento propio; Casa arrendada; Apartamento arrendado; Vivienda compartida; Otra', 'Requerido': 'No', 'Campo': 'economia.tipo_vivienda' },
        { '#': 11, 'Módulo': 'Carga de Cuidado', 'Pregunta': 'POBLACIÓN BAJO CUIDADO', 'Descripción': 'Selecciona quiénes cuidas y en qué cantidad.', 'Tipo': 'checkbox', 'Opciones': 'Menores de 5 años; Niños/as 5-17 años; Personas mayores; Personas con discapacidad; Personas con enfermedad crónica', 'Requerido': 'Sí', 'Campo': 'cuidado.poblacion' },
        { '#': 12, 'Módulo': 'Carga de Cuidado', 'Pregunta': 'HORAS DIARIAS DE CUIDADO', 'Descripción': 'Ingresa el número de horas diarias dedicadas al cuidado.', 'Tipo': 'number', 'Opciones': '-', 'Requerido': 'Sí', 'Campo': 'cuidado.horas' },
        { '#': 13, 'Módulo': 'Carga de Cuidado', 'Pregunta': '¿EL CUIDADO ES REMUNERADO?', 'Descripción': 'Indica si recibas pago por tu trabajo de cuidado.', 'Tipo': 'select', 'Opciones': 'Sí; No', 'Requerido': 'No', 'Campo': 'cuidado.remunerado' },
        { '#': 14, 'Módulo': 'Bienestar y Seguridad', 'Pregunta': 'SEGURIDAD EN EL HOGAR', 'Descripción': 'Indica tu nivel de seguridad en el hogar.', 'Tipo': 'select', 'Opciones': 'Muy segura; Segura; Neutral; Insegura; Muy insegura', 'Requerido': 'Sí', 'Campo': 'bienestar.seguridad_hogar' },
        { '#': 15, 'Módulo': 'Bienestar y Seguridad', 'Pregunta': 'TIPOS DE VIOLENCIA EXPERIMENTADA', 'Descripción': 'Selecciona los tipos de violencia que hayas experimentado.', 'Tipo': 'checkbox', 'Opciones': 'Violencia física; Violencia psicológica; Violencia verbal; Violencia económica; Violencia sexual; Discriminación; Ninguna', 'Requerido': 'No', 'Campo': 'bienestar.tipos_violencia' },
        { '#': 16, 'Módulo': 'Sueños y Proyecciones', 'Pregunta': 'INTERÉS DE FORMACIÓN', 'Descripción': 'Selecciona áreas de formación que te interesan.', 'Tipo': 'checkbox', 'Opciones': 'Educación formal; Capacitación técnica; Emprendimiento; Desarrollo personal; Tecnología; Salud y bienestar; Otra', 'Requerido': 'No', 'Campo': 'suenos.interes_formacion' },
        { '#': 17, 'Módulo': 'Sueños y Proyecciones', 'Pregunta': 'PRIORIDAD URGENTE', 'Descripción': 'Describe tu prioridad más urgente en este momento.', 'Tipo': 'textarea', 'Opciones': '-', 'Requerido': 'No', 'Campo': 'suenos.prioridad_urgente' },
        { '#': 18, 'Módulo': 'Documentos y Consentimiento', 'Pregunta': 'CÉDULA FRONTAL', 'Descripción': 'Sube una fotografía clara de tu cédula (lado frontal).', 'Tipo': 'document', 'Opciones': '-', 'Requerido': 'No', 'Campo': 'documentos.cedula_frontal' },
        { '#': 19, 'Módulo': 'Documentos y Consentimiento', 'Pregunta': 'CÉDULA REVERSO', 'Descripción': 'Sube una fotografía clara de tu cédula (lado reverso).', 'Tipo': 'document', 'Opciones': '-', 'Requerido': 'No', 'Campo': 'documentos.cedula_reverso' },
        { '#': 20, 'Módulo': 'Documentos y Consentimiento', 'Pregunta': 'RECIBO DE SERVICIO PÚBLICO', 'Descripción': 'Sube un recibo de servicio público a tu nombre (agua, luz, etc).', 'Tipo': 'document', 'Opciones': '-', 'Requerido': 'No', 'Campo': 'documentos.recibo_publico' },
        { '#': 21, 'Módulo': 'Documentos y Consentimiento', 'Pregunta': 'HABEAS DATA', 'Descripción': 'Acepta la política de tratamiento de datos personales.', 'Tipo': 'checkbox', 'Opciones': 'Acepto la política de habeas data', 'Requerido': 'Sí', 'Campo': 'documentos.habeas_data' }
      ];

      const ws = XLSX.utils.json_to_sheet(surveyQuestions);
      const wb = XLSX.utils.book_new();
      
      ws['!cols'] = [
        { wch: 5 },   // #
        { wch: 25 },  // Módulo
        { wch: 30 },  // Pregunta
        { wch: 40 },  // Descripción
        { wch: 12 },  // Tipo
        { wch: 50 },  // Opciones
        { wch: 12 },  // Requerido
        { wch: 30 }   // Campo
      ];

      XLSX.utils.book_append_sheet(wb, ws, 'Preguntas Encuesta');
      
      const now = new Date();
      const filename = `Encuesta_UNIDAS_Preguntas_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.xlsx`;
      
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      XLSX.write(wb, { bookType: 'xlsx', type: 'buffer', bookSST: false });
      const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer', bookSST: false });
      res.send(buffer);
    } catch (err) {
      console.error('Export error:', err);
      res.status(500).json({ error: 'Error al exportar las preguntas' });
    }
  });

  // Serve uploads folder
  app.use('/uploads', express.static(uploadsDir));

  // Vite middleware
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    } else {
      app.get('*', (req, res) => {
        res.send('Frontend not built. Please ensure "npm run build" is part of your build command.');
      });
    }
  }

  // Only listen if not on Vercel
  if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }
}

startServer();
