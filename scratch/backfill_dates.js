const PocketBase = require('pocketbase/cjs');

async function run() {
  const url = 'https://pb.calculatucasa.com';
  const email = 'info@thelusacia.com';
  const password = 'sergio123R.L';

  try {
    const pb = new PocketBase(url);
    await pb.admins.authWithPassword(email, password);

    const collections = ['leads', 'propiedades', 'valoraciones', 'social_proof_banners'];
    const nowIso = new Date().toISOString().replace('T', ' ').substring(0, 19);

    for (const collName of collections) {
      console.log(`\nVerificando registros de '${collName}'...`);
      const records = await pb.collection(collName).getFullList();
      let updatedCount = 0;

      for (const rec of records) {
        if (!rec.created || rec.created.startsWith('1970') || rec.created === '') {
          console.log(`Actualizando fechas para registro ${rec.id} en ${collName}...`);
          await pb.collection(collName).update(rec.id, {
            created: nowIso,
            updated: nowIso
          });
          updatedCount++;
        }
      }
      console.log(`✓ Se actualizaron ${updatedCount} registros en '${collName}'.`);
    }

  } catch (error) {
    console.error('Error general:', error);
  }
}

run();
