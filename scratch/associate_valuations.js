const PocketBase = require('pocketbase/cjs');

async function run() {
  const url = 'https://pb.calculatucasa.com';
  const email = 'info@thelusacia.com';
  const password = 'sergio123R.L';

  try {
    const pb = new PocketBase(url);
    await pb.admins.authWithPassword(email, password);

    console.log('Asociando valoraciones a propiedades según tiempos de creación...');

    // Pareja 1:
    // Propiedad 38c399gjzy4m5p4 (2026-05-27 19:50:05)
    // Valoración gxoty51lqffmzek (2026-05-27 19:50:17)
    try {
      await pb.collection("valoraciones").update("gxoty51lqffmzek", {
        propiedad_id: "38c399gjzy4m5p4"
      });
      console.log('✓ Asociada valoración gxoty51lqffmzek a propiedad 38c399gjzy4m5p4');
    } catch (e) {
      console.error('Error 1:', e.message);
    }

    // Pareja 2:
    // Propiedad d7lvkfjzxf0g1z4 (2026-05-27 19:47:05)
    // Valoración 6h7g0tgttlhgkm5 (2026-05-27 19:47:18)
    try {
      await pb.collection("valoraciones").update("6h7g0tgttlhgkm5", {
        propiedad_id: "d7lvkfjzxf0g1z4"
      });
      console.log('✓ Asociada valoración 6h7g0tgttlhgkm5 a propiedad d7lvkfjzxf0g1z4');
    } catch (e) {
      console.error('Error 2:', e.message);
    }

    // Pareja 3:
    // Propiedad q9b2zi6hdyvqbyj (nuestra propiedad de prueba)
    // Valoración p5pnujpd7e7ohyc (100.000 €)
    try {
      await pb.collection("valoraciones").update("p5pnujpd7e7ohyc", {
        propiedad_id: "q9b2zi6hdyvqbyj"
      });
      console.log('✓ Asociada valoración p5pnujpd7e7ohyc a propiedad q9b2zi6hdyvqbyj');
    } catch (e) {
      console.error('Error 3:', e.message);
    }

  } catch (error) {
    console.error('Error general:', error);
  }
}

run();
