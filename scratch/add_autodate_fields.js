const PocketBase = require('pocketbase/cjs');

async function test() {
  const url = 'https://pb.calculatucasa.com';
  const email = 'info@thelusacia.com';
  const password = 'sergio123R.L';

  try {
    const pb = new PocketBase(url);
    await pb.admins.authWithPassword(email, password);

    console.log('Obteniendo colección leads...');
    const collection = await pb.collections.getOne("leads");

    // Verificar si ya tiene created/updated
    const hasCreated = collection.fields.some(f => f.name === 'created');
    const hasUpdated = collection.fields.some(f => f.name === 'updated');

    if (!hasCreated) {
      console.log('Añadiendo campo created...');
      collection.fields.push({
        "hidden": false,
        "name": "created",
        "onCreate": true,
        "onUpdate": false,
        "presentable": false,
        "system": false,
        "type": "autodate"
      });
    }

    if (!hasUpdated) {
      console.log('Añadiendo campo updated...');
      collection.fields.push({
        "hidden": false,
        "name": "updated",
        "onCreate": true,
        "onUpdate": true,
        "presentable": false,
        "system": false,
        "type": "autodate"
      });
    }

    if (!hasCreated || !hasUpdated) {
      const updated = await pb.collections.update(collection.id, collection);
      console.log('Colección leads actualizada con éxito!');
      console.log('Campos actuales:', updated.fields.map(f => `${f.name} (${f.type})`));
    } else {
      console.log('La colección leads ya tiene los campos created y updated.');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

test();
