const fs = require('fs');
const path = require('path');

// ─── Leer .env.local ──────────────────────────────────────────────────────────
const envPath = path.join(__dirname, '..', '.env.local');
let envContent = '';
try {
  envContent = fs.readFileSync(envPath, 'utf8');
} catch (e) {
  console.error('Error al leer .env.local:', e.message);
  process.exit(1);
}

const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)\s*$/);
  if (match) {
    let value = match[2].trim();
    if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
    if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
    env[match[1]] = value;
  }
});

const baseUrl = env.POCKETBASE_URL || env.NEXT_PUBLIC_POCKETBASE_URL;
const adminEmail = env.POCKETBASE_ADMIN_EMAIL;
const adminPassword = env.POCKETBASE_ADMIN_PASSWORD;

if (!baseUrl || !adminEmail || !adminPassword) {
  console.error('Faltan variables de configuración de PocketBase en .env.local');
  process.exit(1);
}

console.log(`Conectando a PocketBase en: ${baseUrl}`);
console.log(`Email Administrador: ${adminEmail}`);

async function run() {
  try {
    // 1. Autenticar Administrador
    const authUrl = `${baseUrl}/api/collections/_superusers/auth-with-password`;
    // Fallback por si es versión antigua
    const fallbackAuthUrl = `${baseUrl}/api/admins/auth-with-password`;

    let res = await fetch(authUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identity: adminEmail, password: adminPassword })
    });

    if (!res.ok) {
      // Intentar fallback
      res = await fetch(fallbackAuthUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail, password: adminPassword })
      });
    }

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Autenticación fallida: ${res.status} - ${errText}`);
    }

    const authData = await res.json();
    const token = authData.token;
    console.log('Autenticación exitosa. Token obtenido.');

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': token
    };

    // 2. Obtener lista de colecciones
    const listRes = await fetch(`${baseUrl}/api/collections?perPage=100`, { headers });
    if (!listRes.ok) {
      throw new Error(`Error al listar colecciones: ${listRes.statusText}`);
    }
    const listData = await listRes.json();
    const collections = listData.items || [];

    let inmoCollection = collections.find(c => c.name === 'inmobiliarias');
    let zonasCollection = collections.find(c => c.name === 'zonas_inmobiliarias');

    // 3. Crear colección inmobiliarias si no existe
    if (!inmoCollection) {
      console.log('Creando colección "inmobiliarias"...');
      const createInmoRes = await fetch(`${baseUrl}/api/collections`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: 'inmobiliarias',
          type: 'base',
          schema: [
            { name: 'nombre', type: 'text', required: true },
            { name: 'telefono', type: 'text', required: true },
            { name: 'email', type: 'email', required: true },
            { name: 'estado', type: 'bool', required: false }
          ],
          listRule: '',
          viewRule: '',
          createRule: '',
          updateRule: '',
          deleteRule: ''
        })
      });

      if (!createInmoRes.ok) {
        const err = await createInmoRes.text();
        throw new Error(`Error al crear "inmobiliarias": ${err}`);
      }

      inmoCollection = await createInmoRes.json();
      console.log(`Colección "inmobiliarias" creada con ID: ${inmoCollection.id}`);
    } else {
      console.log('La colección "inmobiliarias" ya existe.');
    }

    // 4. Crear colección zonas_inmobiliarias si no existe
    if (!zonasCollection) {
      console.log('Creando colección "zonas_inmobiliarias"...');
      const createZonasRes = await fetch(`${baseUrl}/api/collections`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: 'zonas_inmobiliarias',
          type: 'base',
          schema: [
            { name: 'codigo_postal', type: 'text', required: true },
            {
              name: 'inmobiliaria_id',
              type: 'relation',
              required: true,
              options: {
                collectionId: inmoCollection.id,
                cascadeDelete: true,
                maxSelect: 1,
                minSelect: null,
                displayFields: null
              }
            }
          ],
          listRule: '',
          viewRule: '',
          createRule: '',
          updateRule: '',
          deleteRule: ''
        })
      });

      if (!createZonasRes.ok) {
        const err = await createZonasRes.text();
        throw new Error(`Error al crear "zonas_inmobiliarias": ${err}`);
      }

      zonasCollection = await createZonasRes.json();
      console.log(`Colección "zonas_inmobiliarias" creada con ID: ${zonasCollection.id}`);
    } else {
      console.log('La colección "zonas_inmobiliarias" ya existe.');
    }

    console.log('¡Inicialización de base de datos finalizada con éxito!');

  } catch (err) {
    console.error('Error durante la inicialización:', err.message);
    process.exit(1);
  }
}

run();
