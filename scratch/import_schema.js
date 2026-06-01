const fs = require('fs');
const path = require('path');

const email = 'info@thelusacia.com';
const password = 'sergio123R.L';

const targets = [
  'https://pb.calculatucasa.com',
  'http://127.0.0.1:8090',
  'http://localhost:8090'
];

async function importToTarget(url) {
  console.log(`\n--- Intentando importar en: ${url} ---`);
  try {
    const PocketBase = (await import('pocketbase')).default;
    const pb = new PocketBase(url);

    // Intentar autenticación
    console.log('Autenticando...');
    try {
      await pb.admins.authWithPassword(email, password);
      console.log('Autenticado como admin (v0.20)');
    } catch (e) {
      try {
        await pb.collection('_superusers').authWithPassword(email, password);
        console.log('Autenticado como superusuario (v0.22+)');
      } catch (e2) {
        console.log(`No se pudo autenticar en ${url} (¿está encendido y con estas credenciales?)`);
        return;
      }
    }

    // Cargar archivo
    const schemaPath = path.join(__dirname, '../pb_schema.json');
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Archivo no encontrado: ${schemaPath}`);
    }
    const schemaContent = fs.readFileSync(schemaPath, 'utf8');
    const collections = JSON.parse(schemaContent);

    console.log(`Cargadas ${collections.length} colecciones de pb_schema.json`);

    // Importar colecciones
    console.log('Ejecutando importación...');
    await pb.collections.import(collections, false);

    console.log(`¡IMPORTACIÓN COMPLETADA CON ÉXITO EN ${url}!`);
  } catch (error) {
    console.error(`Error en ${url}:`, error.message || error);
  }
}

async function run() {
  for (const target of targets) {
    await importToTarget(target);
  }
}

run();
