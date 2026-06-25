import { NextResponse } from "next/server";

export interface POI {
  nombre: string;
  distancia_m: number;
  tipo: string;
}

export interface EntornoData {
  colegios: POI[];
  supermercados: POI[];
  farmacias: POI[];
  transporte: POI[];
  parques: POI[];
  restaurantes: POI[];
  gasolineras: POI[];
  salud: POI[];
}

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";

// Haversine distance in metres between two lat/lon points
function haversineMetros(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

interface OverpassElement {
  type: string;
  id: number;
  lat: number;
  lon: number;
  tags?: Record<string, string>;
}

function buildOverpassQuery(lat: number, lon: number): string {
  const around = `around:1000,${lat},${lon}`;
  return `[out:json][timeout:10];
(
  node[amenity=school](${around});
  node[amenity=kindergarten](${around});
  node[shop=supermarket](${around});
  node[shop=convenience](${around});
  node[amenity=pharmacy](${around});
  node[railway=station](${around});
  node[highway=bus_stop](${around});
  node[leisure=park](${around});
  node[amenity=restaurant](${around});
  node[amenity=cafe](${around});
  node[amenity=fuel](${around});
  node[amenity=hospital](${around});
  node[amenity=clinic](${around});
);
out body;`;
}

function elementToPOI(
  el: OverpassElement,
  lat: number,
  lon: number
): POI {
  const tags = el.tags ?? {};
  const nombre =
    tags.name ||
    tags.brand ||
    tags.amenity ||
    tags.shop ||
    tags.railway ||
    tags.highway ||
    tags.leisure ||
    "Sin nombre";

  const tipo =
    tags.amenity ||
    tags.shop ||
    tags.railway ||
    tags.highway ||
    tags.leisure ||
    "unknown";

  const distancia_m = Math.round(haversineMetros(lat, lon, el.lat, el.lon));

  return { nombre, distancia_m, tipo };
}

function topN(arr: POI[], n: number): POI[] {
  return arr.sort((a, b) => a.distancia_m - b.distancia_m).slice(0, n);
}

export async function fetchEntorno(
  lat: number,
  lon: number
): Promise<EntornoData> {
  const empty: EntornoData = {
    colegios: [],
    supermercados: [],
    farmacias: [],
    transporte: [],
    parques: [],
    restaurantes: [],
    gasolineras: [],
    salud: [],
  };

  try {
    const query = buildOverpassQuery(lat, lon);
    const res = await fetch(OVERPASS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `data=${encodeURIComponent(query)}`,
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return empty;

    const json = await res.json();
    const elements: OverpassElement[] = json.elements ?? [];

    const colegios: POI[] = [];
    const supermercados: POI[] = [];
    const farmacias: POI[] = [];
    const transporte: POI[] = [];
    const parques: POI[] = [];
    const restaurantes: POI[] = [];
    const gasolineras: POI[] = [];
    const salud: POI[] = [];

    for (const el of elements) {
      if (typeof el.lat !== "number" || typeof el.lon !== "number") continue;
      const tags = el.tags ?? {};
      const poi = elementToPOI(el, lat, lon);

      if (tags.amenity === "school" || tags.amenity === "kindergarten") {
        colegios.push(poi);
      } else if (tags.shop === "supermarket" || tags.shop === "convenience") {
        supermercados.push(poi);
      } else if (tags.amenity === "pharmacy") {
        farmacias.push(poi);
      } else if (tags.railway === "station" || tags.highway === "bus_stop") {
        transporte.push(poi);
      } else if (tags.leisure === "park") {
        parques.push(poi);
      } else if (tags.amenity === "restaurant" || tags.amenity === "cafe") {
        restaurantes.push(poi);
      } else if (tags.amenity === "fuel") {
        gasolineras.push(poi);
      } else if (tags.amenity === "hospital" || tags.amenity === "clinic") {
        salud.push(poi);
      }
    }

    return {
      colegios: topN(colegios, 4),
      supermercados: topN(supermercados, 4),
      farmacias: topN(farmacias, 3),
      transporte: topN(transporte, 5),
      parques: topN(parques, 3),
      restaurantes: topN(restaurantes, 4),
      gasolineras: topN(gasolineras, 3),
      salud: topN(salud, 3),
    };
  } catch (err) {
    console.error("[api/entorno] Overpass error:", err);
    return empty;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { lat, lon } = body as { lat: number; lon: number };

    if (typeof lat !== "number" || typeof lon !== "number") {
      return NextResponse.json(
        { error: "Se requieren lat y lon como números" },
        { status: 400 }
      );
    }

    const data = await fetchEntorno(lat, lon);
    return NextResponse.json(data);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error interno";
    console.error("[api/entorno]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
