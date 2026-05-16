import fs from 'fs';

const firebaseConfig = JSON.parse(fs.readFileSync('./firebase-applet-config.json', 'utf8'));

const API_KEY = firebaseConfig.apiKey;
const PROJECT_ID = firebaseConfig.projectId;
const FIRESTORE_DB = firebaseConfig.firestoreDatabaseId;

async function createAdminUser() {
  try {
    console.log('🔄 Creating admin user in Firebase...');

    // Step 1: Sign up user in Firebase Auth REST API
    console.log('  1️⃣ Creating auth user...');
    const authResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@unidas.social',
          password: '123456',
          returnSecureToken: true,
        }),
      }
    );

    if (!authResponse.ok) {
      const error = await authResponse.json();
      throw new Error(error.error?.message || 'Failed to create auth user');
    }

    const authData = await authResponse.json();
    const uid = authData.localId;
    const idToken = authData.idToken;

    console.log('  ✓ Auth user created:', uid);

    // Step 2: Create user profile in Firestore REST API
    console.log('  2️⃣ Creating Firestore profile...');
    const firestoreResponse = await fetch(
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${FIRESTORE_DB}/documents/users/${uid}?key=${API_KEY}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          fields: {
            uid: { stringValue: uid },
            full_name: { stringValue: 'Administrador Principal' },
            document_type: { stringValue: 'CC' },
            document_number: { stringValue: '12345678' },
            phone: { stringValue: '3000000000' },
            email: { stringValue: 'admin@unidas.social' },
            role: { stringValue: 'admin' },
            created_at: { timestampValue: new Date().toISOString() },
          },
        }),
      }
    );

    if (!firestoreResponse.ok) {
      const error = await firestoreResponse.json();
      throw new Error(error.error?.message || 'Failed to create Firestore document');
    }

    console.log('  ✓ Firestore profile created');

    console.log('\n✅ Admin user created successfully!');
    console.log('\n📧 Email: admin@unidas.social');
    console.log('🔑 Password: 123456');
    console.log('\nYa puedes usar estas credenciales para ingresar a la app.\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    process.exit(1);
  }
}

createAdminUser();
