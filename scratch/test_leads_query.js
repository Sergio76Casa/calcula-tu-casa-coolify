const PocketBase = require('pocketbase/cjs');

async function test() {
  const url = 'https://pb.calculatucasa.com';
  const email = 'info@thelusacia.com';
  const password = 'sergio123R.L';

  try {
    const pb = new PocketBase(url);
    await pb.admins.authWithPassword(email, password);

    console.log('--- Probando consultas de Leads ---');

    console.log('1. Consulta simple (sin sort, sin expand):');
    try {
      const res = await pb.collection("leads").getFullList();
      console.log(`Éxito! Registros devueltos: ${res.length}`);
      if (res.length > 0) {
        console.log('Campos en un registro:', Object.keys(res[0]));
      }
    } catch (e) {
      console.error('Fallo 1:', e.message);
    }

    console.log('\n2. Consulta con sort=-created:');
    try {
      const res = await pb.collection("leads").getFullList({ sort: "-created" });
      console.log(`Éxito! Registros devueltos: ${res.length}`);
    } catch (e) {
      console.error('Fallo 2:', e.message);
    }

    console.log('\n3. Consulta con sort=-created_at:');
    try {
      const res = await pb.collection("leads").getFullList({ sort: "-created_at" });
      console.log(`Éxito! Registros devueltos: ${res.length}`);
    } catch (e) {
      console.error('Fallo 3:', e.message);
    }

    console.log('\n4. Consulta con expand=propiedad_id:');
    try {
      const res = await pb.collection("leads").getFullList({ expand: "propiedad_id" });
      console.log(`Éxito! Registros devueltos: ${res.length}`);
    } catch (e) {
      console.error('Fallo 4:', e.message);
    }
  } catch (error) {
    console.error('Error general:', error);
  }
}

test();
