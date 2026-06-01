const PocketBase = require('pocketbase/cjs');

async function main() {
  const url = 'https://pb.calculatucasa.com';
  const email = 'info@thelusacia.com';
  const password = 'sergio123R.L';

  try {
    const pb = new PocketBase(url);
    await pb.admins.authWithPassword(email, password);
    console.log('Autenticado!');

    // 1. Obtener colecciones para verificar si existe
    const collections = await pb.collections.getFullList();
    let namesColl = collections.find(c => c.name === 'social_proof_names');

    if (!namesColl) {
      console.log('Creando colección "social_proof_names"...');
      namesColl = await pb.collections.create({
        name: 'social_proof_names',
        type: 'base',
        fields: [
          {
            name: 'name',
            type: 'text',
            required: true,
            system: false
          }
        ],
        listRule: '',
        viewRule: '',
        createRule: '',
        updateRule: '',
        deleteRule: ''
      });
      console.log('Colección "social_proof_names" creada con éxito!');

      // Poblar con nombres por defecto
      const defaultNames = [
        "Antonio", "María", "Carlos", "Laura", "Jordi",
        "Marta",   "David", "Elena",  "Sergio", "Ana",
        "Miguel",  "Sara",  "Javier", "Lucía",  "Pablo",
        "Núria",   "Marc",  "Isabel", "Álvaro", "Rosa",
        "Josep",   "Montserrat", "Albert", "Sílvia", "Xavier",
        "Mireia",  "Joan",  "Daniela", "Oriol",  "Cristina"
      ];

      console.log('Poblando nombres por defecto...');
      for (const name of defaultNames) {
        await pb.collection('social_proof_names').create({ name });
      }
      console.log('Nombres por defecto añadidos!');
    } else {
      console.log('La colección "social_proof_names" ya existe.');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

main();
