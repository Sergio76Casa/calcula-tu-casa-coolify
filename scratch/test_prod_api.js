async function testProd() {
  const payload = {
    propiedad: {
      direccion_completa: "{{cuf_14645725}}",
      m2_construidos: "{{cuf_14645731}}",
      estado_conservacion: "{{cuf_14645733}}",
      tipo_propiedad: "{{cuf_14645734}}",
      habitaciones: "{{cuf_14645735}}",
      ascensor: "{{cuf_14645736}}",
      jardin: "{{cuf_14645737}}",
      certificado_energetico: "{{cuf_14645738}}"
    },
    lang: "es"
  };

  console.log("Sending request to https://calculatucasa.com/api/valorar ...");
  try {
    const res = await fetch("https://calculatucasa.com/api/valorar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    console.log(`Status: ${res.status} (${res.statusText})`);
    const text = await res.text();
    console.log("Response body:", text);
  } catch (err) {
    console.error("Error during fetch:", err);
  }
}

testProd();
