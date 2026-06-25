const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

export async function geminiGeocoding(
  direccion: string,
  apiKey: string
): Promise<{ lat: number; lon: number } | null> {
  const prompt = `Eres un geocodificador experto para España.
Dada la dirección "${direccion}", encuentra sus coordenadas geográficas (latitud y longitud) más aproximadas y reales en España.
Responde únicamente con un objeto JSON válido con este formato exacto:
{
  "lat": 40.416775,
  "lon": -3.703790
}
Si la dirección es ambigua, asume la ubicación más probable en España o la capital de la provincia si se menciona.
Responde SOLO con el JSON.`;

  try {
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: "application/json",
          maxOutputTokens: 200,
          responseSchema: {
            type: "OBJECT",
            properties: {
              lat: { type: "NUMBER" },
              lon: { type: "NUMBER" },
            },
            required: ["lat", "lon"],
          },
        },
      }),
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) return null;
    const payload = await res.json();
    const raw = payload?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed.lat === "number" && typeof parsed.lon === "number") {
      return { lat: parsed.lat, lon: parsed.lon };
    }
    return null;
  } catch (err) {
    console.error("[Geocoding] Gemini Geocoding fallback error:", err);
    return null;
  }
}

export async function nominatimGeocoding(
  direccion: string
): Promise<{ lat: number; lon: number; display_name?: string } | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(direccion)}&format=json&limit=1&addressdetails=1&countrycodes=es`;
    const geoRes = await fetch(url, {
      headers: {
        "User-Agent":
          "CalculaTuCasa-Tasador/1.2 (tasaciones@calculatucasa.com)",
      },
      signal: AbortSignal.timeout(4000),
    });
    if (geoRes.ok) {
      const data = await geoRes.json();
      if (data && data[0] && data[0].lat && data[0].lon) {
        return {
          lat: parseFloat(data[0].lat),
          lon: parseFloat(data[0].lon),
          display_name: data[0].display_name || undefined,
        };
      }
    }
    return null;
  } catch (err) {
    console.error("[Geocoding] Nominatim geocoding error:", err);
    return null;
  }
}

export async function obtenerCoordenadas(
  direccion: string,
  apiKey: string
): Promise<{ lat: number; lon: number; enrichedAddress: string } | null> {
  let enrichedAddress = direccion;
  let coordLat: number | null = null;
  let coordLon: number | null = null;

  // 1. Nominatim search
  const nominatimResult = await nominatimGeocoding(direccion);
  if (nominatimResult) {
    coordLat = nominatimResult.lat;
    coordLon = nominatimResult.lon;
    if (nominatimResult.display_name) {
      enrichedAddress = nominatimResult.display_name;
    }
  }

  // 2. Gemini fallback
  if (coordLat === null || coordLon === null) {
    console.log(
      "[Geocoding] Nominatim falló. Usando fallback con Gemini para:",
      direccion
    );
    const fallbackCoords = await geminiGeocoding(direccion, apiKey);
    if (fallbackCoords) {
      coordLat = fallbackCoords.lat;
      coordLon = fallbackCoords.lon;
      console.log(
        `[Geocoding] Gemini fallback exitoso: lat=${coordLat}, lon=${coordLon}`
      );
    }
  }

  if (coordLat !== null && coordLon !== null) {
    return { lat: coordLat, lon: coordLon, enrichedAddress };
  }

  return null;
}
