const PocketBase = require('pocketbase/cjs');

async function test() {
  const url = 'https://pb.calculatucasa.com';
  const email = 'info@thelusacia.com';
  const password = 'sergio123R.L';

  try {
    const pb = new PocketBase(url);
    await pb.admins.authWithPassword(email, password);

    console.log('--- Probando diferentes campos de ordenación ---');

    const fields = ['id', '-id', 'nombre', '-nombre', 'email', '-email', 'created', '-created', 'updated', '-updated'];

    for (const f of fields) {
      try {
        await pb.collection("leads").getFullList({ sort: f, limit: 1 });
        console.log(`✓ Ordenación por '${f}' funcionó!`);
      } catch (e) {
        console.log(`✗ Ordenación por '${f}' FALLÓ: ${e.message}`);
      }
    }
  } catch (error) {
    console.error('Error general:', error);
  }
}

test();
