// Direct fetch calls only
const POCKETBASE_URL = "https://pb.calculatucasa.com";

async function measure() {
  const GEMINI_API_KEY = "AIzaSyAI5tmmUCke1n_DVYz-efvRwc7gqJ8rfb8";
  
  // 1. Measure Gemini
  console.log("Measuring Gemini...");
  const startGemini = Date.now();
  const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";
  try {
    const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: "Dame un JSON tasacion simple" }] }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        },
      }),
    });
    await res.json();
    console.log(`Gemini time: ${Date.now() - startGemini}ms`);
  } catch (err) {
    console.error("Gemini error:", err);
  }

  // 2. Measure PocketBase admin auth and create
  console.log("Measuring PocketBase auth & create...");
  const startPB = Date.now();
  try {
    // Authenticate
    const authRes = await fetch(`${POCKETBASE_URL}/api/admins/auth-with-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identity: "info@thelusacia.com",
        password: "sergio123R.L"
      })
    });
    const authData = await authRes.json();
    const token = authData.token;
    console.log(`PB Auth time: ${Date.now() - startPB}ms`);

    // Create property record
    const startPBCreate = Date.now();
    const createRes = await fetch(`${POCKETBASE_URL}/api/collections/propiedades/records`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Authorization": token
      },
      body: JSON.stringify({
        direccion_completa: "Calle de Alcalá 1, Madrid 28014",
        m2_construidos: 90,
        estado_conservacion: "bueno",
        tipo_propiedad: "piso",
        habitaciones: 3
      })
    });
    await createRes.json();
    console.log(`PB Create time: ${Date.now() - startPBCreate}ms`);
  } catch (err) {
    console.error("PB error:", err);
  }
}

measure();
