/**
 * Extractor de soportes de la ENCUESTA UNO a una carpeta local del proyecto.
 *
 * Genera exports/documentos-encuesta-1/<Nombre_Cedula>/<documento>.<ext>,
 * la misma estructura que produce el .zip del panel de administración.
 *
 * Fuentes de los archivos, en orden:
 *   1. La carpeta local de uploads (UPLOADS_DIR o ./uploads).
 *   2. El bucket 'documents' de Supabase Storage.
 *
 * Uso:  npm run export:encuesta-uno
 * Requiere DATABASE_URL (y, para la fuente 2, las credenciales de Supabase).
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import { createClient } from '@supabase/supabase-js';

const OUT_DIR = path.join(process.cwd(), 'exports', 'documentos-encuesta-1');
const LOCAL_UPLOADS = process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');

if (!process.env.DATABASE_URL) {
  console.error('FALTA DATABASE_URL. Define la variable (o crea un archivo .env) antes de ejecutar el extractor.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 20000
});

// Cliente de Supabase: usa la service role key si está disponible.
let supabase: any = null;
try {
  const configPath = path.join(process.cwd(), 'supabase-config.json');
  const config = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {};
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || config.supabaseUrl;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_KEY || config.supabaseKey;
  if (url && key) supabase = createClient(url, key);
} catch (err: any) {
  console.warn('No se pudo inicializar Supabase:', err.message);
}

// Mismas reglas de nombres que usa el endpoint del .zip.
const sanitize = (value: string, fallback: string) => {
  const clean = (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\/:*?"<>|]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\.+$/, '');
  return clean || fallback;
};

const DOC_LABELS: Record<string, string> = {
  id_frontal: 'Cedula (frontal)', cedula_frontal: 'Cedula (frontal)',
  id_reverso: 'Cedula (reverso)', cedula_reverso: 'Cedula (reverso)',
  utility_bill: 'Recibo de servicio publico', recibo_publico: 'Recibo de servicio publico', recibo: 'Recibo de servicio publico',
};

const readDocument = async (filePath: string): Promise<{ buffer: Buffer | null; reason?: string }> => {
  const filename = path.basename(filePath);

  const localPath = path.join(LOCAL_UPLOADS, filename);
  if (fs.existsSync(localPath)) return { buffer: fs.readFileSync(localPath) };

  if (!supabase) return { buffer: null, reason: 'Sin cliente de Supabase y sin copia local.' };

  try {
    const { data, error } = await supabase.storage.from('documents').download(filename);
    if (error || !data) return { buffer: null, reason: error?.message || 'No existe en el bucket.' };
    return { buffer: Buffer.from(await data.arrayBuffer()) };
  } catch (err: any) {
    return { buffer: null, reason: err.message };
  }
};

const main = async () => {
  const { rows } = await pool.query(`
    SELECT u.id AS user_id, u.full_name, u.document_number, d.type, d.file_path, d.created_at
    FROM documents d
    JOIN users u ON u.id = d.user_id
    JOIN surveys s ON s.user_id = u.id
    ORDER BY u.full_name ASC, d.created_at ASC, d.id ASC
  `);

  console.log(`Documentos de la Encuesta 1 registrados en la base: ${rows.length}`);
  if (rows.length === 0) {
    await pool.end();
    return;
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const used = new Map<string, number>();
  const missing: string[] = [];
  let saved = 0;

  for (const row of rows) {
    const folderName = `${sanitize(row.full_name, 'Sin_nombre')}_${sanitize(row.document_number, String(row.user_id))}`.replace(/\s+/g, '_');
    const folderPath = path.join(OUT_DIR, folderName);

    // La carpeta de la persona se crea siempre, aunque el archivo no se pueda
    // recuperar todavia: asi queda la estructura lista para rellenar despues.
    fs.mkdirSync(folderPath, { recursive: true });

    const { buffer, reason } = await readDocument(row.file_path);
    if (!buffer) {
      missing.push(`${row.full_name} (${row.document_number}) - ${row.file_path}${reason ? ` - ${reason}` : ''}`);
      continue;
    }

    const ext = path.extname(row.file_path) || '';
    const label = sanitize(DOC_LABELS[row.type] || row.type, 'documento');
    let fileName = `${label}${ext}`;
    const key = `${folderName}/${fileName}`;
    const count = (used.get(key) || 0) + 1;
    used.set(key, count);
    if (count > 1) fileName = `${label} (${count})${ext}`;

    fs.writeFileSync(path.join(folderPath, fileName), buffer);
    saved++;
  }

  if (missing.length > 0) {
    fs.writeFileSync(
      path.join(OUT_DIR, '_ARCHIVOS_NO_ENCONTRADOS.txt'),
      ['Documentos registrados en la base que no se pudieron recuperar:', '', ...missing].join('\n'),
      'utf8'
    );
  }

  console.log(`Archivos extraidos: ${saved}`);
  console.log(`No recuperados:     ${missing.length}`);
  console.log(`Carpeta de salida:  ${OUT_DIR}`);
  if (missing.length > 0) {
    console.log('Revisa exports/documentos-encuesta-1/_ARCHIVOS_NO_ENCONTRADOS.txt para el detalle.');
  }

  await pool.end();
};

main().catch(async (err) => {
  console.error('Error en la extraccion:', err.message);
  await pool.end();
  process.exit(1);
});
