const PocketBase = require('pocketbase/cjs');

async function test() {
  const url = 'https://pb.calculatucasa.com';
  const email = 'info@thelusacia.com';
  const password = 'sergio123R.L';

  try {
    const pb = new PocketBase(url);
    await pb.admins.authWithPassword(email, password);

    const inmo = await pb.collection("inmobiliarias").getFullList({ limit: 1 });
    console.log('Inmobiliaria keys:', Object.keys(inmo[0]));
    console.log('Inmobiliaria keys with getOwnPropertyNames:', Object.getOwnPropertyNames(inmo[0]));
    console.log('Inmobiliaria values:', {
      nombre: inmo[0].nombre,
      telefono: inmo[0].telefono,
      email: inmo[0].email,
      estado: inmo[0].estado
    });

    const collections = await pb.collections.getFullList();
    const inmoColl = collections.find(c => c.name === "inmobiliarias");
    console.log('Inmobiliarias collection schema/fields:', JSON.stringify(inmoColl.fields, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

test();
