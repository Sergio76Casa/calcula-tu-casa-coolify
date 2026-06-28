const fs = require('fs');
const path = require('path');

// Función simple para parsear un archivo .env
function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf-8');
  const env = {};
  content.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const match = trimmed.match(/^([^=]+)=(.*)$/);
    if (match) {
      let key = match[1].trim();
      let value = match[2].trim();
      // Remover comillas si las hay
      if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'")) value = value.slice(1, -1);
      env[key] = value;
    }
  });
  return env;
}

async function testGemini() {
  const envPath = path.join(__dirname, '..', '.env.local');
  const env = parseEnv(envPath);
  const apiKey = env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error('❌ Error: No se encontró la variable GEMINI_API_KEY en .env.local');
    process.exit(1);
  }

  console.log(`Verificando clave de API que empieza por: ${apiKey.slice(0, 8)}...`);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: 'Hola, di "funcionando" si recibes este mensaje.' }]
          }
        ]
      })
    });

    if (response.ok) {
      const data = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      console.log('\n✅ ¡La API Key funciona correctamente!');
      console.log(`🤖 Respuesta de Gemini: "${text}"`);
    } else {
      const errorText = await response.text();
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = errorText;
      }
      console.error('\n❌ La API Key falló o no es válida.');
      console.error('Detalles del error:', JSON.stringify(errorData, null, 2));
    }
  } catch (err) {
    console.error('\n❌ Error de red o al realizar la petición:', err.message);
  }
}

testGemini();
