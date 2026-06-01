const PocketBase = require('pocketbase/cjs');

async function test() {
  const url = 'https://pb.calculatucasa.com';
  const email = 'info@thelusacia.com';
  const password = 'sergio123R.L';

  try {
    const pb = new PocketBase(url);
    await pb.admins.authWithPassword(email, password);

    const collections = await pb.collections.getFullList();
    const inmoColl = collections.find(c => c.name === "inmobiliarias");
    console.log('Full Inmobiliarias Collection:', JSON.stringify(inmoColl, null, 2));

    const zonaColl = collections.find(c => c.name === "zonas_inmobiliarias");
    console.log('Full Zonas Collection:', JSON.stringify(zonaColl, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

test();
