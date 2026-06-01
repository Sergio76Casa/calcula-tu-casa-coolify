const PocketBase = require('pocketbase/cjs');

async function fix() {
  const url = 'https://pb.calculatucasa.com';
  const email = 'info@thelusacia.com';
  const password = 'sergio123R.L';

  try {
    const pb = new PocketBase(url);
    await pb.admins.authWithPassword(email, password);
    console.log('Autenticado!');

    // 1. Corregir inmobiliarias
    console.log('Actualizando colección "inmobiliarias"...');
    const inmoCol = await pb.collections.getOne('inmobiliarias');
    
    // Filtrar para evitar duplicados si ya existen
    const inmoFieldsToKeep = inmoCol.fields.filter(f => 
      f.name !== 'nombre' && f.name !== 'telefono' && f.name !== 'email' && f.name !== 'estado'
    );

    inmoCol.fields = [
      ...inmoFieldsToKeep,
      {
        "name": "nombre",
        "type": "text",
        "required": true,
        "system": false
      },
      {
        "name": "telefono",
        "type": "text",
        "required": true,
        "system": false
      },
      {
        "name": "email",
        "type": "text",
        "required": true,
        "system": false
      },
      {
        "name": "estado",
        "type": "bool",
        "required": false,
        "system": false
      }
    ];
    await pb.collections.update('inmobiliarias', inmoCol);
    console.log('¡Colección "inmobiliarias" actualizada!');

    // 2. Corregir zonas_inmobiliarias
    console.log('Actualizando colección "zonas_inmobiliarias"...');
    const zonasCol = await pb.collections.getOne('zonas_inmobiliarias');
    
    const zonasFieldsToKeep = zonasCol.fields.filter(f => 
      f.name !== 'codigo_postal' && f.name !== 'inmobiliaria_id'
    );

    zonasCol.fields = [
      ...zonasFieldsToKeep,
      {
        "name": "codigo_postal",
        "type": "text",
        "required": true,
        "system": false
      },
      {
        "name": "inmobiliaria_id",
        "type": "relation",
        "required": true,
        "system": false,
        "collectionId": inmoCol.id, // o "pbc_1555908101"
        "cascadeDelete": true,
        "maxSelect": 1
      }
    ];
    await pb.collections.update('zonas_inmobiliarias', zonasCol);
    console.log('¡Colección "zonas_inmobiliarias" actualizada!');

    console.log('¡Esquema de base de datos corregido con éxito!');
  } catch (error) {
    console.error('Error durante la corrección:', error);
  }
}

fix();
