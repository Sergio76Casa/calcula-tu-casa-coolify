// Nombres de respaldo si falla la carga desde la base de datos
export const FALLBACK_NAMES = [
  "Antonio", "María", "Carlos", "Laura", "Jordi",
  "Marta",   "David", "Elena",  "Sergio", "Ana",
  "Miguel",  "Sara",  "Javier", "Lucía",  "Pablo",
  "Núria",   "Marc",  "Isabel", "Álvaro", "Rosa",
  "Josep",   "Montserrat", "Albert", "Sílvia", "Xavier",
  "Mireia",  "Joan",  "Daniela", "Oriol",  "Cristina"
];

// Pool unificado de municipios del Barcelonès, Vallès Occidental y Vallès Oriental
export const METROPOLITAN_LOCATIONS = [
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

export const REGIONAL_LOCATIONS: Record<string, string[]> = {
  valencia: [
    "Valencia", "Gandia", "Torrent", "Paterna", "Sagunto", "Alzira", "Mislata", 
    "Burjassot", "Ontinyent", "Aldaia", "Manises", "Alaquàs", "Xàtiva", "Xirivella", 
    "Sueca", "Algemesí", "Catarroja", "Oliva", "Quart de Poblet", "Paiporta"
  ],
  madrid: [
    "Madrid", "Móstoles", "Alcalá de Henares", "Fuenlabrada", "Leganés", "Getafe", 
    "Alcorcón", "Torrejón de Ardoz", "Parla", "Alcobendas", "Las Rozas", "Pozuelo de Alarcón",
    "San Sebastián de los Reyes", "Rivas-Vaciamadrid", "Majadahonda", "Valdemoro", "Collado Villalba"
  ],
  barcelona: METROPOLITAN_LOCATIONS,
  catalonia: METROPOLITAN_LOCATIONS,
  sevilla: [
    "Sevilla", "Dos Hermanas", "Alcalá de Guadaíra", "Utrera", "Mairena del Aljarafe", 
    "Écija", "La Rinconada", "Los Palacios y Villafranca", "Coria del Río", "Carmona"
  ],
  malaga: [
    "Málaga", "Marbella", "Mijas", "Fuengirola", "Vélez-Málaga", "Torremolinos", 
    "Benalmádena", "Estepona", "Rincón de la Victoria", "Antequera", "Ronda"
  ],
  alicante: [
    "Alicante", "Elche", "Torrevieja", "Orihuela", "Benidorm", "Alcoy", "Elda", 
    "San Vicente del Raspeig", "Dénia", "Villajoyosa", "Petrer", "Jávea"
  ],
  zaragoza: [
    "Zaragoza", "Calatayud", "Utebo", "Ejea de los Caballeros", "Tarazona", "Caspe"
  ]
};

export const NATIONAL_LOCATIONS = [
  "Bilbao", "Santander", "Oviedo", "Gijón", "Vigo", "A Coruña", "Murcia", "Valladolid", 
  "Toledo", "Palma de Mallorca", "Las Palmas de Gran Canaria", "Santa Cruz de Tenerife", 
  "Pamplona", "Logroño", "Badajoz", "Cáceres", "Salamanca", "Burgos", "León", "Granada",
  "Córdoba", "Cádiz", "Almería", "Huelva", "Jaén", "Castellón de la Plana", "Vitoria-Gasteiz", 
  "San Sebastián", "Girona", "Lleida", "Tarragona", "Ourense", "Lugo", "Pontevedra", 
  "Santiago de Compostela", "Avilés", "Torrelavega", "Getafe", "Guadalajara"
];

export function normalizeStr(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Quitar acentos
    .trim();
}

export function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Precio estimado por zona ──────────────────────────────────────────────────

export const PRICE_RANGES: Record<string, [number, number]> = {
  madrid:    [250000, 650000],
  barcelona: [220000, 700000],
  valencia:  [120000, 350000],
  malaga:    [150000, 500000],
  sevilla:   [120000, 400000],
  alicante:  [100000, 350000],
  zaragoza:  [100000, 280000],
  default:   [120000, 400000],
};

export function getRandomPrice(city: string | null, region: string | null): string {
  const key = getMatchedRegionKey(city, region) ?? "default";
  const [min, max] = PRICE_RANGES[key] ?? PRICE_RANGES.default;
  const raw = Math.random() * (max - min) + min;
  const rounded = Math.round(raw / 1000) * 1000;
  return rounded.toLocaleString("es-ES") + " €";
}

export function getMatchedRegionKey(city: string | null, region: string | null): string | null {
  const c = city ? normalizeStr(city) : "";
  const r = region ? normalizeStr(region) : "";
  
  if (r.includes("valencia") || c.includes("valencia")) return "valencia";
  if (r.includes("madrid") || c.includes("madrid")) return "madrid";
  if (r.includes("catal") || r.includes("barcelona") || c.includes("barcelona") || c.includes("sabadell") || c.includes("terrassa")) return "barcelona";
  if (r.includes("sevilla") || c.includes("sevilla")) return "sevilla";
  if (r.includes("malaga") || c.includes("malaga")) return "malaga";
  if (r.includes("alicante") || c.includes("alicante")) return "alicante";
  if (r.includes("zaragoza") || c.includes("zaragoza")) return "zaragoza";
  
  return null;
}
