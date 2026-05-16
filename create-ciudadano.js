import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';

// Initialize Database
const db = new Database('unidas.db');

async function createCiudadanoUser() {
  try {
    console.log('🔄 Creando usuario ciudadano...\n');

    const fullName = 'Usuario Ciudadano';
    const documentType = 'CC';
    const documentNumber = '1013608140';
    const phone = '3000000000';
    const email = 'ciudadano@unidas.social';
    const password = '1234';
    const role = 'user'; // rol ciudadano

    // Validate password
    if (!password || password.length < 4 || password.length > 12) {
      throw new Error('Contraseña inválida - debe tener entre 4 y 12 caracteres');
    }

    // Check if user already exists
    const existingUser = db.prepare('SELECT id FROM users WHERE document_number = ? OR email = ?').get(documentNumber, email);
    
    if (existingUser) {
      console.log('⚠️  El usuario ya existe en la base de datos.');
      console.log(`   Cédula: ${documentNumber}`);
      console.log(`   Email: ${email}\n`);
      process.exit(0);
    }

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Insert user
    console.log('  1️⃣ Insertando usuario en base de datos...');
    const result = db.prepare(
      'INSERT INTO users (full_name, document_type, document_number, phone, email, password, role) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(fullName, documentType, documentNumber, phone, email, hashedPassword, role);

    console.log('  ✓ Usuario creado correctamente\n');

    console.log('✅ ¡Usuario ciudadano creado con éxito!\n');
    console.log('📋 Datos del usuario:');
    console.log(`   📝 Nombre: ${fullName}`);
    console.log(`   🆔 Cédula: ${documentNumber}`);
    console.log(`   📧 Email: ${email}`);
    console.log(`   🔑 Contraseña: ${password}`);
    console.log(`   👤 Rol: ${role}`);
    console.log(`   📞 Teléfono: ${phone}\n`);
    console.log('Ya puedes usar estas credenciales para ingresar a la app.\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

createCiudadanoUser();
