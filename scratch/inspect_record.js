const PocketBase = require('pocketbase/cjs');

async function test() {
  const url = 'https://pb.calculatucasa.com';
  const email = 'info@thelusacia.com';
  const password = 'sergio123R.L';

  try {
    const pb = new PocketBase(url);
    await pb.admins.authWithPassword(email, password);

    const res = await pb.collection("leads").getFullList({ limit: 1 });
    console.log('Registro completo:', JSON.stringify(res[0], null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

test();
