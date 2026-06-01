const PocketBase = require('pocketbase/cjs');

async function run() {
  const url = 'https://pb.calculatucasa.com';
  const email = 'info@thelusacia.com';
  const password = 'sergio123R.L';

  try {
    const pb = new PocketBase(url);
    await pb.admins.authWithPassword(email, password);

    console.log('Creando propiedad de prueba en Sabadell...');
    const prop = await pb.collection("propiedades").create({
      direccion_completa: 'Carrer de Gràcia, Sabadell, Barcelona, España',
      m2_construidos: 95,
      estado_conservacion: 'bueno',
      tipo_propiedad: 'piso',
      habitaciones: 3,
      ascensor: true,
      jardin: false,
      certificado_energetico: 'e'
    });

    console.log(`Propiedad creada con ID: ${prop.id}`);

    const nowIso = new Date().toISOString().replace('T', ' ').substring(0, 19);

    console.log('Asociando propiedad al lead Sergio Lozano (2oc6hbmlqcioppk) y actualizando fechas...');
    await pb.collection("leads").update('2oc6hbmlqcioppk', {
      propiedad_id: prop.id,
      created: nowIso,
      updated: nowIso
    });

    console.log('¡Lead actualizado con éxito!');

    // Ahora actualizar la propiedad y la valoración si es necesario
    console.log('Buscando valoraciones...');
    const vals = await pb.collection("valoraciones").getFullList();
    for (const v of vals) {
      if (!v.created || v.created.startsWith('1970') || v.created === '') {
        await pb.collection("valoraciones").update(v.id, {
          created: nowIso,
          updated: nowIso
        });
      }
    }
    console.log('¡Fechas de valoraciones actualizadas!');

  } catch (error) {
    console.error('Error:', error);
    if (error.response) {
      console.error('Detalles del error:', JSON.stringify(error.response, null, 2));
    }
  }
}

run();
