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

    console.log('\n--- Inmobiliarias ---');
    const inmos = await pb.collection("inmobiliarias").getFullList();
    console.log(`Inmobiliarias encontradas: ${inmos.length}`);
    inmos.forEach(i => {
      console.log(`ID: ${i.id} | Nombre: ${i.nombre} | Estado: ${i.estado} | Teléfono: ${i.telefono} | Email: ${i.email}`);
    });

    console.log('\n--- Zonas Inmobiliarias ---');
    const zonas = await pb.collection("zonas_inmobiliarias").getFullList({ expand: "inmobiliaria_id" });
    console.log(`Zonas encontradas: ${zonas.length}`);
    zonas.forEach(z => {
      console.log(`ID: ${z.id} | CP: ${z.codigo_postal} | Agencia: ${z.expand?.inmobiliaria_id?.nombre || 'Ninguna'} (${z.inmobiliaria_id})`);
    });
  } catch (error) {
    console.error('Error general:', error);
  }
}

test();
