const PocketBase = require('pocketbase/cjs');

async function test() {
  const url = 'https://pb.calculatucasa.com';
  const email = 'info@thelusacia.com';
  const password = 'sergio123R.L';

  try {
    const pb = new PocketBase(url);
    await pb.admins.authWithPassword(email, password);

    console.log('Obteniendo últimas valoraciones...');
    const vals = await pb.collection("valoraciones").getFullList({
      sort: "-created",
      limit: 5
    });

    console.log('Últimas valoraciones creadas:', JSON.stringify(vals, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

test();
