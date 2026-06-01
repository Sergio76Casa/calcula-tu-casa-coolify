const PocketBase = require('pocketbase/cjs');

async function test() {
  const url = 'https://pb.calculatucasa.com';
  const email = 'info@thelusacia.com';
  const password = 'sergio123R.L';

  try {
    const pb = new PocketBase(url);
    await pb.admins.authWithPassword(email, password);

    const collections = ['users', 'propiedades', 'valoraciones', 'social_proof_banners'];

    for (const coll of collections) {
      console.log(`\n--- Probando colección '${coll}' ---`);
      try {
        await pb.collection(coll).getFullList({ sort: '-created', limit: 1 });
        console.log(`✓ Ordenación por '-created' funcionó!`);
      } catch (e) {
        console.log(`✗ Ordenación por '-created' FALLÓ: ${e.message}`);
      }
      try {
        const records = await pb.collection(coll).getFullList({ limit: 1 });
        if (records.length > 0) {
          console.log(`Primer registro de '${coll}':`, Object.keys(records[0]));
        } else {
          console.log(`No hay registros en '${coll}'`);
        }
      } catch (e) {
        console.log(`✗ Error al listar '${coll}': ${e.message}`);
      }
    }
  } catch (error) {
    console.error('Error general:', error);
  }
}

test();
