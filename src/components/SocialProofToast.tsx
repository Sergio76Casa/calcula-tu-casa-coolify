"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { U } from "@/lib/uiStrings";
import type { Lang } from "@/lib/translations";
import {
  FALLBACK_NAMES,
  METROPOLITAN_LOCATIONS,
  REGIONAL_LOCATIONS,
  NATIONAL_LOCATIONS,
  normalizeStr,
  pickRandom,
  getRandomPrice,
  getMatchedRegionKey,
} from "@/lib/locations";

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
  const [toastText, setToastText] = useState("");
  const localPoolRef  = useRef<string[]>([]);
  const userLocRef    = useRef<{ city: string | null; region: string | null }>({ city: null, region: null });
  const t         = U(lang).toast;

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
      
      userLocRef.current = { city: locData.city, region: locData.region };
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

    const chosenName   = pickRandom(names);
    const { city, region } = userLocRef.current;
    const price        = getRandomPrice(city, region);
    const phraseFunc   = pickRandom(U(lang).toast.phrases);
    const text         = phraseFunc(chosenName, chosenLocation, price);

    setLocation(chosenLocation);
    setName(chosenName);
    setToastText(text);
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
      className={`fixed bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-auto z-40 transition-all duration-500 mx-auto sm:mx-0 max-w-[calc(100%-2rem)] sm:max-w-[320px] ${
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-3 pointer-events-none"
      }`}
    >
      <div className="flex items-center justify-between gap-3 bg-slate-800/95 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 shadow-2xl w-full">
        <span className="text-xl flex-shrink-0" aria-hidden="true">🏠</span>
        <p className="text-slate-300 text-sm leading-snug">
          {toastText || `${name} de ${location} ${t.suffix}`}
        </p>
        <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
      </div>
    </div>
  );
}
