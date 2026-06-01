const PocketBase = require('pocketbase/cjs');

async function main() {
  const url = 'https://pb.calculatucasa.com';
  const email = 'info@thelusacia.com';
  const password = 'sergio123R.L';

  try {
    const pb = new PocketBase(url);
    console.log('Autenticando...');
    await pb.admins.authWithPassword(email, password);
    console.log('Autenticado!');

    // 1. Crear Don Piso Sabadell
    console.log('Creando "Don Piso Sabadell"...');
    const inmo1 = await pb.collection("inmobiliarias").create({
      nombre: "Don Piso Sabadell",
      telefono: "+34 600 111 222",
      email: "sabadell@donpiso.com",
      estado: true
    });
    console.log(`Creada: ${inmo1.nombre} (ID: ${inmo1.id})`);

    // Asignar zona 08205
    console.log('Asignando CP 08205...');
    await pb.collection("zonas_inmobiliarias").create({
      codigo_postal: "08205",
      inmobiliaria_id: inmo1.id
    });

    // 2. Crear Finques Centre Terrassa
    console.log('Creando "Finques Centre Terrassa"...');
    const inmo2 = await pb.collection("inmobiliarias").create({
      nombre: "Finques Centre Terrassa",
      telefono: "+34 600 333 444",
      email: "terrassa@finquescentre.com",
      estado: true
    });
    console.log(`Creada: ${inmo2.nombre} (ID: ${inmo2.id})`);

    // Asignar zona 08220
    console.log('Asignando CP 08220...');
    await pb.collection("zonas_inmobiliarias").create({
      codigo_postal: "08220",
      inmobiliaria_id: inmo2.id
    });

    console.log('¡Inmobiliarias y zonas mock creadas con éxito!');
  } catch (error) {
    console.error('Error general:', error);
  }
}

main();
