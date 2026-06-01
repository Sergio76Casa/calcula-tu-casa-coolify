async function check() {
  const url = 'https://pb.calculatucasa.com';
  const email = 'info@thelusacia.com';
  const password = 'sergio123R.L';

  try {
    const PocketBase = (await import('pocketbase')).default;
    const pb = new PocketBase(url);

    console.log('Autenticando...');
    try {
      await pb.admins.authWithPassword(email, password);
      console.log('Autenticado como admin (v0.20)');
    } catch (e) {
      await pb.collection('_superusers').authWithPassword(email, password);
      console.log('Autenticado como superusuario (v0.22+)');
    }

    console.log('\n--- Colecciones en la Base de Datos ---');
    const collections = await pb.collections.getFullList();
    for (const c of collections) {
      console.log(`\nColección: ${c.name} (${c.id})`);
      if (Array.isArray(c.schema)) {
        console.log('Campos:');
        for (const field of c.schema) {
          console.log(` - ${field.name} (${field.type}) [id: ${field.id}]`);
        }
      } else {
        console.log('Campos (no schema array, e.g. system table):', Object.keys(c));
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

check();
