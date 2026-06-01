const PocketBase = require('pocketbase/cjs');

async function test() {
  const url = 'https://pb.calculatucasa.com';
  const email = 'info@thelusacia.com';
  const password = 'sergio123R.L';

  try {
    const pb = new PocketBase(url);
    await pb.admins.authWithPassword(email, password);

    const collection = await pb.collections.getOne("users");
    console.log('Colección users:', JSON.stringify(collection, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

test();
