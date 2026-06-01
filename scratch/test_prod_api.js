async function testProd() {
  const payload = {
    propiedad: {
      direccion_completa: "Calle de Alcalá 1, Madrid 28014",
      m2_construidos: "90",
      estado_conservacion: "bueno",
      tipo_propiedad: "piso",
      habitaciones: "3",
      ascensor: "true",
      jardin: "false"
    },
    lang: "es"
  };

  console.log("Sending request to https://calculatucasa.com/api/valorar ...");
  const start = Date.now();
  try {
    const res = await fetch("https://calculatucasa.com/api/valorar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const duration = Date.now() - start;
    console.log(`Status: ${res.status} (${res.statusText})`);
    console.log(`Time taken: ${duration}ms`);
    const text = await res.text();
    console.log("Response body:", text);
  } catch (err) {
    console.error("Error during fetch:", err);
  }
}

testProd();
