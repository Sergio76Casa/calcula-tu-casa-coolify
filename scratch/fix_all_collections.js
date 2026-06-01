const PocketBase = require('pocketbase/cjs');

async function run() {
  const url = 'https://pb.calculatucasa.com';
  const email = 'info@thelusacia.com';
  const password = 'sergio123R.L';

  try {
    const pb = new PocketBase(url);
    await pb.admins.authWithPassword(email, password);

    const collections = ['propiedades', 'valoraciones', 'social_proof_banners'];

    for (const collName of collections) {
      console.log(`\nProcesando colección: ${collName}...`);
      const collection = await pb.collections.getOne(collName);

      const hasCreated = collection.fields.some(f => f.name === 'created');
      const hasUpdated = collection.fields.some(f => f.name === 'updated');
      let changed = false;

      if (!hasCreated) {
        console.log(`Añadiendo campo 'created' a ${collName}...`);
        collection.fields.push({
          "hidden": false,
          "name": "created",
          "onCreate": true,
          "onUpdate": false,
          "presentable": false,
          "system": false,
          "type": "autodate"
        });
        changed = true;
      }

      if (!hasUpdated) {
        console.log(`Añadiendo campo 'updated' a ${collName}...`);
        collection.fields.push({
          "hidden": false,
          "name": "updated",
          "onCreate": true,
          "onUpdate": true,
          "presentable": false,
          "system": false,
          "type": "autodate"
        });
        changed = true;
      }

      if (changed) {
        await pb.collections.update(collection.id, collection);
        console.log(`✓ Colección ${collName} actualizada con éxito!`);
      } else {
        console.log(`La colección ${collName} ya tiene los campos created y updated.`);
      }
    }

  } catch (error) {
    console.error('Error general:', error);
  }
}

run();
