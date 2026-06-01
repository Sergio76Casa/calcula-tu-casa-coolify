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
      console.log('Autenticado como admin');
    } catch (e) {
      await pb.collection('_superusers').authWithPassword(email, password);
      console.log('Autenticado como superusuario');
    }

    const c1 = await pb.collections.getOne('social_proof_banners');
    console.log('\n--- social_proof_banners fields ---');
    console.log(JSON.stringify(c1.fields, null, 2));

    const c2 = await pb.collections.getOne('leads');
    console.log('\n--- leads fields ---');
    console.log(JSON.stringify(c2.fields, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

check();
