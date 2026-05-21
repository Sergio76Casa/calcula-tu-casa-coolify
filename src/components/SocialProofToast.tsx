"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { U } from "@/lib/uiStrings";
import type { Lang } from "@/lib/translations";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Banner {
  location_name: string;
  postal_codes: string[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const NAMES = [
  "Antonio", "María", "Carlos", "Laura", "Jordi",
  "Marta",   "David", "Elena",  "Sergio", "Ana",
  "Miguel",  "Sara",  "Javier", "Lucía",  "Pablo",
  "Núria",   "Marc",  "Isabel", "Álvaro", "Rosa",
];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Data helpers ─────────────────────────────────────────────────────────────

async function detectPostal(): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    const res = await fetch("https://ipapi.co/json/", { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const j = await res.json();
    return (j.postal as string) || null;
  } catch {
    return null;
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

function resolveLocations(banners: Banner[], postal: string | null): string[] {
  if (postal) {
    const zone = banners.filter(b => b.postal_codes.includes(postal));
    if (zone.length > 0) return zone.map(b => b.location_name);
  }
  return banners.map(b => b.location_name);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SocialProofToast({ lang }: { lang: Lang }) {
  const [visible,  setVisible]  = useState(false);
  const [location, setLocation] = useState<string | null>(null);
  const [name,     setName]     = useState("");
  const locsRef   = useRef<string[]>([]);
  const idxRef    = useRef(0);
  const t         = U(lang).toast;
  const connector = lang === "en" ? "in" : "de";

  useEffect(() => {
    let alive = true;
    (async () => {
      const [postal, banners] = await Promise.all([detectPostal(), fetchActiveBanners()]);
      if (!alive) return;
      const locs = resolveLocations(banners, postal);
      if (locs.length === 0) return;
      locsRef.current = locs.sort(() => Math.random() - 0.5);
    })();
    return () => { alive = false; };
  }, []);

  const fire = useCallback(() => {
    const locs = locsRef.current;
    if (locs.length === 0) return;
    const idx = idxRef.current % locs.length;
    setLocation(locs[idx]);
    setName(pickRandom(NAMES));
    idxRef.current += 1;
    setVisible(true);
    setTimeout(() => setVisible(false), 5000);
  }, []);

  useEffect(() => {
    const first    = setTimeout(fire, 4000);
    const interval = setInterval(fire, 25000);
    return () => { clearTimeout(first); clearInterval(interval); };
  }, [fire]);

  if (!location) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-6 left-6 z-40 transition-all duration-500 ${
        visible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-3 pointer-events-none"
      }`}
    >
      <div className="flex items-center gap-3 bg-slate-800/95 backdrop-blur-sm border border-white/10 rounded-2xl px-4 py-3 shadow-2xl max-w-[280px]">
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
