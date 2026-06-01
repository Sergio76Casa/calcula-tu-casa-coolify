const PocketBase = require('pocketbase/cjs');

async function test() {
  const url = 'https://pb.calculatucasa.com';
  const email = 'info@thelusacia.com';
  const password = 'sergio123R.L';

  try {
    const pb = new PocketBase(url);
    await pb.admins.authWithPassword(email, password);

    console.log('Obteniendo últimas propiedades...');
    const props = await pb.collection("propiedades").getFullList({
      sort: "-created",
      limit: 5
    });

    for (const p of props) {
      console.log(`ID: ${p.id} | Dirección: ${p.direccion_completa.substring(0, 30)} | Certificado: ${p.certificado_energetico}`);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

test();
