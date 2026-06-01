async function fix() {
  const url = 'https://pb.calculatucasa.com';
  const email = 'info@thelusacia.com';
  const password = 'sergio123R.L';

  try {
    const PocketBase = (await import('pocketbase')).default;
    const pb = new PocketBase(url);

    console.log('Autenticando...');
    try {
      await pb.admins.authWithPassword(email, password);
      console.log('Autenticado como admin');
    } catch (e) {
      await pb.collection('_superusers').authWithPassword(email, password);
      console.log('Autenticado como superusuario');
    }

    // ─── 1. CORREGIR social_proof_banners ──────────────────────────────────────
    console.log('\nCorrigiendo social_proof_banners...');
    const bannerCol = await pb.collections.getOne('social_proof_banners');
    
    // Filtrar para no duplicar si ya existen
    const bannerFieldsToKeep = bannerCol.fields.filter(f => 
      f.name !== 'location_name' && f.name !== 'postal_codes' && f.name !== 'is_active'
    );

    bannerCol.fields = [
      ...bannerFieldsToKeep,
      {
        "name": "location_name",
        "type": "text",
        "required": true,
        "system": false
      },
      {
        "name": "postal_codes",
        "type": "json",
        "required": false,
        "system": false
      },
      {
        "name": "is_active",
        "type": "bool",
        "required": false,
        "system": false
      }
    ];
    await pb.collections.update('social_proof_banners', bannerCol);
    console.log('¡social_proof_banners corregida!');

    // ─── 2. CORREGIR leads (propiedad_id_ -> propiedad_id) ──────────────────────
    console.log('\nCorrigiendo leads...');
    const leadsCol = await pb.collections.getOne('leads');
    
    // Buscar si existe propiedad_id_ con guion bajo
    const relationField = leadsCol.fields.find(f => f.name === 'propiedad_id_');
    if (relationField) {
      console.log('Encontrado "propiedad_id_". Renombrando a "propiedad_id"...');
      relationField.name = 'propiedad_id';
      relationField.required = true;
      relationField.collectionId = 'abc123propiedad'; // Asegurar que apunta a propiedades
    } else {
      // Si no existe, asegurar de que propiedad_id existe sin guion bajo
      const correctField = leadsCol.fields.find(f => f.name === 'propiedad_id');
      if (!correctField) {
        console.log('No se encontró "propiedad_id". Creándolo...');
        leadsCol.fields.push({
          "name": "propiedad_id",
          "type": "relation",
          "required": true,
          "system": false,
          "collectionId": "abc123propiedad",
          "cascadeDelete": true,
          "maxSelect": 1
        });
      } else {
        console.log('El campo "propiedad_id" ya está correctamente configurado.');
      }
    }

    await pb.collections.update('leads', leadsCol);
    console.log('¡leads corregida!');

    console.log('\n--- ¡PROCESO DE CORRECCIÓN COMPLETADO CON ÉXITO! ---');
  } catch (error) {
    console.error('Error durante la corrección:', error);
  }
}

fix();
