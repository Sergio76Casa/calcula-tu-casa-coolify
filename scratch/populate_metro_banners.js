const fs = require("fs");
const path = require("path");

// ─── Constants ───
const METRO_TOWNS = [
  // Barcelonès
  "Barcelona", "Badalona", "L'Hospitalet de Llobregat", "Sant Adrià de Besòs", "Santa Coloma de Gramenet",
  // Vallès Occidental
  "Sabadell", "Terrassa", "Badia del Vallès", "Barberà del Vallès", "Castellar del Vallès", 
  "Castellbisbal", "Cerdanyola del Vallès", "Gallifa", "Matadepera", "Palau-solità i Plegamans", 
  "Polinyà", "Rellinars", "Rubí", "Sant Cugat del Vallès", "Sant Quirze del Vallès", 
  "Sentmenat", "Ullastrell", "Vacarisses", "Viladecavalls",
  // Vallès Oriental
  "Granollers", "Mollet del Vallès", "Cardedeu", "Caldes de Montbui", "Lliçà d'Amunt", 
  "Lliçà de Vall", "Parets del Vallès", "Montornès del Vallès", "Canovelles", "Les Franqueses del Vallès", 
  "Sant Celoni", "La Garriga", "L'Ametlla del Vallès", "Bigues i Riells", "Montmeló", 
  "Llinars del Vallès", "Martorelles", "Santa Eulàlia de Ronçana", "Sant Feliu de Codines", 
  "La Roca del Vallès", "Vilanova del Vallès", "Vallromanes", "Gualba", "Sant Antoni de Vilamajor", 
  "Sant Pere de Vilamajor", "Figaró-Montmany", "Aiguafreda", "Tagamanent", "Campins", 
  "Fogars de Montclús", "Montseny", "Santa Maria de Palautordera", "Sant Esteve de Palautordera", 
  "Vallgorguina", "Vilalba Sasserra"
];

// ─── Load Environment variables ───
function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) {
    throw new Error("No se encontró el archivo .env.local");
  }
  const content = fs.readFileSync(envPath, "utf-8");
  const env = {};
  content.split("\n").forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let val = match[2] ? match[2].trim() : "";
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
      env[match[1]] = val;
    }
  });
  return env;
}

// ─── Query OpenDataSoft for CPs ───
async function fetchCps(cityName) {
  // Normalizar palabras clave significativas
  const words = cityName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .split(/\s+/)
    .filter(w => w.length > 2 && w !== "del" && w !== "los" && w !== "las" && w !== "les" && w !== "els");

  let whereClause = "";
  if (words.length === 0) {
    whereClause = `place_name like "${cityName}" AND country_code="ES"`;
  } else {
    const clauses = words.map(word => {
      if (word === "san" || word === "sant") {
        return `(place_name like "san*" or place_name like "sant*")`;
      }
      return `place_name like "*${word}*"`;
    });
    whereClause = `${clauses.join(" AND ")} AND country_code="ES"`;
  }

  const url = `https://public.opendatasoft.com/api/explore/v2.1/catalog/datasets/geonames-postal-code/records?where=${encodeURIComponent(whereClause)}&select=postal_code&limit=100`;
  const res = await fetch(url);
  if (!res.ok) return [];

  const json = await res.json();
  const results = json.results ?? [];
  const rawCodes = results.map(r => r.postal_code).filter(c => Boolean(c) && /^\d{5}$/.test(c));
  if (rawCodes.length === 0) return [];

  // Filtrado de provincia por densidad
  const prefixes = rawCodes.map(code => code.substring(0, 2));
  const counts = {};
  let maxPrefix = "";
  let maxCount = 0;
  for (const prefix of prefixes) {
    counts[prefix] = (counts[prefix] ?? 0) + 1;
    if (counts[prefix] > maxCount) {
      maxCount = counts[prefix];
      maxPrefix = prefix;
    }
  }

  return Array.from(new Set(rawCodes.filter(code => code.startsWith(maxPrefix)))).sort();
}

// ─── Main Execution ───
async function main() {
  const env = loadEnv();
  const baseUrl = env.POCKETBASE_URL;
  const email = env.POCKETBASE_ADMIN_EMAIL;
  const password = env.POCKETBASE_ADMIN_PASSWORD;

  if (!baseUrl || !email || !password) {
    console.error("Faltan variables de PocketBase en .env.local");
    return;
  }

  console.log(`Conectando a PocketBase: ${baseUrl}...`);
  const authRes = await fetch(`${baseUrl}/api/collections/_superusers/auth-with-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identity: email, password })
  });

  if (!authRes.ok) {
    throw new Error("No se pudo autenticar con PocketBase: " + await authRes.text());
  }
  const authData = await authRes.json();
  const token = authData.token;

  console.log("Obteniendo banners existentes...");
  const listRes = await fetch(`${baseUrl}/api/collections/social_proof_banners/records?limit=200`, {
    headers: { "Authorization": token }
  });
  const listData = await listRes.json();
  const existingNames = new Set((listData.items ?? []).map(b => b.location_name.toLowerCase().trim()));

  for (const town of METRO_TOWNS) {
    const townKey = town.toLowerCase().trim();
    if (existingNames.has(townKey)) {
      console.log(`[SKIP] La zona "${town}" ya existe en la base de datos.`);
      continue;
    }

    console.log(`Buscando CPs para "${town}"...`);
    const cps = await fetchCps(town);
    if (cps.length === 0) {
      console.warn(`[WARN] No se encontraron CPs para "${town}".`);
      continue;
    }

    console.log(`[CREATE] Creando zona "${town}" con CPs: ${cps.join(", ")}`);
    const createRes = await fetch(`${baseUrl}/api/collections/social_proof_banners/records`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": token
      },
      body: JSON.stringify({
        location_name: town,
        postal_codes: cps,
        is_active: true
      })
    });

    if (!createRes.ok) {
      console.error(`[ERROR] Error al crear zona "${town}":`, await createRes.text());
    }

    // Sleep 250ms to avoid OpenDataSoft rate limits
    await new Promise(r => setTimeout(r, 250));
  }

  console.log("¡Población de banners finalizada con éxito!");
}

main().catch(console.error);
