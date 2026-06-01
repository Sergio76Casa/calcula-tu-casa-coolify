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

    console.log('Últimas propiedades creadas:');
    for (const p of props) {
      console.log(`\nID: ${p.id}`);
      console.log(`Dirección: ${p.direccion_completa}`);
      console.log(`M2: ${p.m2_construidos}`);
      console.log(`Tipo: ${p.tipo_propiedad}`);
      console.log(`Habitaciones: ${p.habitaciones}`);
      console.log(`Estado: ${p.estado_conservacion}`);
      console.log(`Creada: ${p.created}`);
      
      // Buscar su valoración
      try {
        const val = await pb.collection("valoraciones").getFirstListItem(`propiedad_id="${p.id}"`);
        console.log(`Precio Sugerido: ${val.precio_sugerido} €`);
        console.log(`Rango: ${val.rango_minimo} € - ${val.rango_maximo} €`);
        console.log(`Argumentario: ${val.argumentario_venta}`);
      } catch (e) {
        console.log('No tiene valoración asociada');
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

test();
