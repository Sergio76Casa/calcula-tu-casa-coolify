"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { U } from "@/lib/uiStrings";
import type { Lang } from "@/lib/translations";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Banner {
  location_name: string;
  postal_codes: string[];
}

interface UserLoc {
  postal: string | null;
  city: string | null;
  region: string | null;
}

// Nombres de respaldo si falla la carga desde la base de datos
const FALLBACK_NAMES = [
  "Antonio", "María", "Carlos", "Laura", "Jordi",
  "Marta",   "David", "Elena",  "Sergio", "Ana",
  "Miguel",  "Sara",  "Javier", "Lucía",  "Pablo",
  "Núria",   "Marc",  "Isabel", "Álvaro", "Rosa",
  "Josep",   "Montserrat", "Albert", "Sílvia", "Xavier",
  "Mireia",  "Joan",  "Daniela", "Oriol",  "Cristina"
];

// Pool unificado de municipios del Barcelonès, Vallès Occidental y Vallès Oriental
const METROPOLITAN_LOCATIONS = [
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

const REGIONAL_LOCATIONS: Record<string, string[]> = {
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

const NATIONAL_LOCATIONS = [
  "Bilbao", "Santander", "Oviedo", "Gijón", "Vigo", "A Coruña", "Murcia", "Valladolid", 
  "Toledo", "Palma de Mallorca", "Las Palmas de Gran Canaria", "Santa Cruz de Tenerife", 
  "Pamplona", "Logroño", "Badajoz", "Cáceres", "Salamanca", "Burgos", "León", "Granada",
  "Córdoba", "Cádiz", "Almería", "Huelva", "Jaén", "Castellón de la Plana", "Vitoria-Gasteiz", 
  "San Sebastián", "Girona", "Lleida", "Tarragona", "Ourense", "Lugo", "Pontevedra", 
  "Santiago de Compostela", "Avilés", "Torrelavega", "Getafe", "Guadalajara"
];

function normalizeStr(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Quitar acentos
    .trim();
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getMatchedRegionKey(city: string | null, region: string | null): string | null {
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

// ─── Data helpers ─────────────────────────────────────────────────────────────

async function detectUserLocation(): Promise<UserLoc> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch("https://ipapi.co/json/", { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return { postal: null, city: null, region: null };
    const j = await res.json();
    return {
      postal: (j.postal as string) || null,
      city: (j.city as string) || null,
      region: (j.region as string) || null
    };
  } catch {
    return { postal: null, city: null, region: null };
  }
}

async function fetchActiveBanners(): Promise<Banner[]> {
  try {
    const res = await fetch("/api/banners");
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error("Error fetching active banners:", err);
    return [];
  }
}

async function fetchNames(): Promise<string[]> {
  try {
    const res = await fetch("/api/names");
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    console.error("Error fetching names:", err);
    return [];
  }
}

function resolveLocalPool(city: string | null, region: string | null, banners: Banner[], postal: string | null): string[] {
  if (postal) {
    const zone = banners.filter(b => b.postal_codes.includes(postal));
    if (zone.length > 0) return zone.map(b => b.location_name);
  }
  const key = getMatchedRegionKey(city, region);
  if (key && REGIONAL_LOCATIONS[key]) {
    return REGIONAL_LOCATIONS[key];
  }
  if (banners.length > 0) {
    return banners.map(b => b.location_name);
  }
  return METROPOLITAN_LOCATIONS;
}

// ─── Component ────────────────────────────────────────────────────────────────

interface SocialProofToastProps {
  lang: Lang;
  currentAddress?: string;
}

export default function SocialProofToast({ lang, currentAddress }: SocialProofToastProps) {
  const [visible,  setVisible]  = useState(false);
  const [location, setLocation] = useState<string | null>(null);
  const [name,     setName]     = useState("");
  const [names,    setNames]    = useState<string[]>(FALLBACK_NAMES);
  const localPoolRef = useRef<string[]>([]);
  const t         = U(lang).toast;
  const connector = lang === "en" ? "in" : "de";

  useEffect(() => {
    let alive = true;
    (async () => {
      const [locData, banners, nameData] = await Promise.all([
        detectUserLocation(),
        fetchActiveBanners(),
        fetchNames()
      ]);
      if (!alive) return;

      if (nameData && nameData.length > 0) {
        setNames(nameData);
      }
      
      const pool = resolveLocalPool(locData.city, locData.region, banners, locData.postal);
      localPoolRef.current = pool;
    })();
    return () => { alive = false; };
  }, []);

  // Escuchar si el usuario escribe/selecciona una dirección en la landing
  useEffect(() => {
    if (!currentAddress) return;
    const normalizedAddr = normalizeStr(currentAddress);
    
    let matchedPool: string[] | null = null;
    for (const [key, locs] of Object.entries(REGIONAL_LOCATIONS)) {
      const match = locs.some(loc => {
        const normLoc = normalizeStr(loc);
        const regex = new RegExp(`\\b${normLoc}\\b`, "i");
        return regex.test(normalizedAddr);
      });
      if (match) {
        matchedPool = locs;
        break;
      }
    }

    if (matchedPool) {
      localPoolRef.current = matchedPool;
    }
  }, [currentAddress]);

  const fire = useCallback(() => {
    if (names.length === 0) return;
    const localPool = localPoolRef.current;
    
    let chosenLocation = "";
    // 75% local de la zona y 25% nacional de España
    if (Math.random() < 0.75 && localPool.length > 0) {
      chosenLocation = pickRandom(localPool);
    } else {
      chosenLocation = pickRandom(NATIONAL_LOCATIONS);
    }

    setLocation(chosenLocation);
    setName(pickRandom(names));
    setVisible(true);
    setTimeout(() => setVisible(false), 5000);
  }, [names]);

  useEffect(() => {
    const first    = setTimeout(fire, 4000);
    const interval = setInterval(fire, 22000);
    return () => { clearTimeout(first); clearInterval(interval); };
  }, [fire]);

  if (!location) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-auto z-40 transition-all duration-500 mx-auto sm:mx-0 max-w-[calc(100%-2rem)] sm:max-w-[280px] ${
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-3 pointer-events-none"
      }`}
    >
      <div className="flex items-center justify-between gap-3 bg-slate-800/95 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 shadow-2xl w-full">
        <span className="text-xl flex-shrink-0" aria-hidden="true">🏠</span>
        <p className="text-slate-300 text-sm leading-snug">
          <span className="text-white font-semibold">
            {name} {connector} {location}
          </span>{" "}
          {t.suffix}
        </p>
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
      </div>
    </div>
  );
}
