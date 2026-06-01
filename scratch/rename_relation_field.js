const PocketBase = require('pocketbase/cjs');

async function run() {
  const url = 'https://pb.calculatucasa.com';
  const email = 'info@thelusacia.com';
  const password = 'sergio123R.L';

  try {
    const pb = new PocketBase(url);
    await pb.admins.authWithPassword(email, password);

    console.log('Obteniendo colección valoraciones...');
    const collection = await pb.collections.getOne("valoraciones");

    const relationField = collection.fields.find(f => f.name === 'relation');
    
    if (relationField) {
      console.log('Renombrando campo "relation" a "propiedad_id"...');
      relationField.name = 'propiedad_id';
      
      const updated = await pb.collections.update(collection.id, collection);
      console.log('Colección valoraciones actualizada con éxito!');
      console.log('Campos actuales:', updated.fields.map(f => `${f.name} (${f.type})`));
    } else {
      console.log('No se encontró el campo "relation" en la colección valoraciones.');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

run();
