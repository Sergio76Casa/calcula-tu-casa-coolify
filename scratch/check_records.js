const PocketBase = require('pocketbase/cjs');

async function test() {
  const url = 'https://pb.calculatucasa.com';
  const email = 'info@thelusacia.com';
  const password = 'sergio123R.L';

  try {
    const pb = new PocketBase(url);
    console.log('Autenticando...');
    await pb.admins.authWithPassword(email, password);
    console.log('Autenticado!');

    console.log('\n--- Banners ---');
    try {
      const banners = await pb.collection("social_proof_banners").getFullList();
      console.log(`Banners encontrados: ${banners.length}`);
      if (banners.length > 0) {
        console.log('Primer banner:', JSON.stringify(banners[0], null, 2));
      }
    } catch (e) {
      console.error('Error cargando banners:', e.message);
    }

    console.log('\n--- Leads ---');
    try {
      const leads = await pb.collection("leads").getFullList({
        expand: "propiedad_id",
        sort: "-created"
      });
      console.log(`Leads encontrados: ${leads.length}`);
      if (leads.length > 0) {
        console.log('Primer lead:', JSON.stringify(leads[0], null, 2));
      }
    } catch (e) {
      console.error('Error cargando leads:', e);
    }
  } catch (error) {
    console.error('Error general:', error);
  }
}

test();
